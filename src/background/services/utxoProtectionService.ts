// UTXO Protection Service - Prevents accidental spending of UTXOs containing Junkscriptions
import { ApiUTXO } from "@/shared/interfaces/api";
import { Junk20BalanceResponse } from "@/shared/interfaces/junk20";
import { FindInscriptionsByOutpointResponseItem } from "@/shared/interfaces/inscriptions";
import apiController from "../controllers/apiController";

export interface ProtectedUTXO extends ApiUTXO {
  isProtected: true;
  protectionReason: 'junk20' | 'inscription' | 'junkscription';
  protectionDetails: {
    junk20?: {
      tick: string;
      balance: string;
      operation: string;
    };
    inscription?: {
      inscription_id: string;
      inscription_number?: number;
      content_type?: string;
    };
  };
}

export interface UTXOProtectionResult {
  safeUtxos: ApiUTXO[];
  protectedUtxos: ProtectedUTXO[];
  totalSafeValue: number;
  totalProtectedValue: number;
}

class UTXOProtectionService {
  private protectedUtxoCache = new Map<string, ProtectedUTXO>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Analyzes UTXOs and separates safe ones from protected ones containing junkscriptions
   */
  async analyzeUTXOs(address: string, utxos: ApiUTXO[]): Promise<UTXOProtectionResult> {
    console.log(`[UTXO Protection] Analyzing ${utxos.length} UTXOs for address: ${address}`);

    const safeUtxos: ApiUTXO[] = [];
    const protectedUtxos: ProtectedUTXO[] = [];

    // Get all inscribed outpoints for this address in one API call (more efficient)
    const inscribedOutpoints = await apiController.getInscribedOutpoints(address);
    const inscribedOutpointSet = new Set(inscribedOutpoints || []);

    console.log(`[UTXO Protection] Found ${inscribedOutpointSet.size} inscribed outpoints for address`);
    console.log(`[UTXO Protection] Inscribed outpoints:`, Array.from(inscribedOutpointSet).slice(0, 5), '...');

    // Get Junk-20 token data for this address
    const junk20Data = await this.getJunk20Data(address);
    console.log(`[UTXO Protection] Junk-20 data:`, junk20Data);

    // Create a map of UTXOs that contain Junk-20 tokens
    const junk20UtxoMap = new Map<string, any>();
    if (junk20Data?.junk20) {
      for (const token of junk20Data.junk20) {
        for (const utxo of token.utxos) {
          const utxoKey = `${utxo.inscription_id}`;
          junk20UtxoMap.set(utxoKey, {
            tick: token.tick,
            balance: utxo.junk20.balance,
            operation: utxo.junk20.operation,
            inscription_id: utxo.inscription_id,
            inscription_number: utxo.inscription_number,
          });
        }
      }
    }

    // Analyze each UTXO based on correct inscription logic
    for (const utxo of utxos) {
      const outpoint = `${utxo.txid}:${utxo.vout}`;

      // CORRECT LOGIC: UTXOs with vout 0 contain inscriptions and should be protected
      // UTXOs with vout 1+ are typically safe to spend (change/payment outputs)
      if (utxo.vout === 0) {
        console.log(`[UTXO Protection] PROTECTED - UTXO ${outpoint} has vout 0 (contains inscription)`);

        const protectedUtxo: ProtectedUTXO = {
          ...utxo,
          isProtected: true,
          protectionReason: 'junkscription',
          protectionDetails: {
            inscription: {
              inscription_id: `${outpoint}_inscription`,
              content_type: 'unknown',
            },
          },
        };
        protectedUtxos.push(protectedUtxo);
      } else {
        console.log(`[UTXO Protection] SAFE - UTXO ${outpoint} has vout ${utxo.vout} (safe to spend)`);
        safeUtxos.push(utxo);
      }
    }

    const totalSafeValue = safeUtxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const totalProtectedValue = protectedUtxos.reduce((sum, utxo) => sum + utxo.value, 0);

    console.log(`[UTXO Protection] Analysis complete:`);
    console.log(`  - Safe UTXOs: ${safeUtxos.length} (${totalSafeValue / 1e8} JKC)`);
    console.log(`  - Protected UTXOs: ${protectedUtxos.length} (${totalProtectedValue / 1e8} JKC)`);
    console.log(`  - Protected reasons:`, protectedUtxos.map(u => u.protectionReason));

    return {
      safeUtxos,
      protectedUtxos,
      totalSafeValue,
      totalProtectedValue,
    };
  }

  /**
   * Checks if a specific UTXO contains junkscriptions or inscriptions
   */
  private async checkUTXOProtection(
    address: string,
    utxo: ApiUTXO,
    junk20UtxoMap: Map<string, any>
  ): Promise<{
    isProtected: boolean;
    reason?: 'junk20' | 'inscription' | 'junkscription';
    details?: any;
  }> {
    try {
      // Use the correct outpoint format for the electrs API
      // Based on the Electrs API documentation, the format should be txid:vout
      const outpoint = `${utxo.txid}:${utxo.vout}`;

      console.log(`[UTXO Protection] Checking outpoint: ${outpoint} for address: ${address}`);

      const inscriptions = await apiController.findInscriptionsByOutpoint({
        address,
        outpoint,
      });

      console.log(`[UTXO Protection] API Response for ${outpoint}:`, inscriptions);

      if (inscriptions && inscriptions.length > 0) {
        const inscription = inscriptions[0];
        console.log(`[UTXO Protection] Found inscription:`, inscription);

        // Check if this inscription is a Junk-20 token
        const junk20Info = junk20UtxoMap.get(inscription.genesis);
        if (junk20Info) {
          console.log(`[UTXO Protection] PROTECTED - Junk-20 token found:`, junk20Info);
          return {
            isProtected: true,
            reason: 'junk20',
            details: {
              junk20: {
                tick: junk20Info.tick,
                balance: junk20Info.balance,
                operation: junk20Info.operation,
              },
              inscription: {
                inscription_id: inscription.genesis,
                inscription_number: junk20Info.inscription_number,
              },
            },
          };
        }

        // Regular inscription/junkscription
        console.log(`[UTXO Protection] PROTECTED - Regular inscription found`);
        return {
          isProtected: true,
          reason: 'junkscription',
          details: {
            inscription: {
              inscription_id: inscription.genesis,
              content_type: inscription.content_type,
            },
          },
        };
      }

      console.log(`[UTXO Protection] SAFE - No inscriptions found for UTXO: ${utxo.txid}:${utxo.vout}`);
      return { isProtected: false };
    } catch (error) {
      console.error(`[UTXO Protection] Error checking UTXO ${utxo.txid}:${utxo.vout}:`, error);
      // In case of error, assume it's safe to avoid blocking transactions
      // but log the error for debugging
      return { isProtected: false };
    }
  }

  /**
   * Gets Junk-20 token data for an address
   */
  private async getJunk20Data(address: string): Promise<Junk20BalanceResponse | null> {
    try {
      return await apiController.getJunk20Balance(address) as any;
    } catch (error) {
      console.warn('Error fetching Junk-20 data:', error);
      return null;
    }
  }

  /**
   * Cache management
   */
  private getCachedProtection(utxoKey: string): ProtectedUTXO | ApiUTXO | null {
    const expiry = this.cacheExpiry.get(utxoKey);
    if (expiry && Date.now() < expiry) {
      return this.protectedUtxoCache.get(utxoKey) || null;
    }
    
    // Clean up expired cache
    this.protectedUtxoCache.delete(utxoKey);
    this.cacheExpiry.delete(utxoKey);
    return null;
  }

  private cacheProtection(utxoKey: string, utxo: ProtectedUTXO | ApiUTXO): void {
    this.protectedUtxoCache.set(utxoKey, utxo as ProtectedUTXO);
    this.cacheExpiry.set(utxoKey, Date.now() + this.CACHE_DURATION);
  }

  /**
   * Filters UTXOs to only return safe ones for spending
   */
  async getSafeUTXOsForSpending(address: string, utxos: ApiUTXO[]): Promise<ApiUTXO[]> {
    const result = await this.analyzeUTXOs(address, utxos);
    return result.safeUtxos;
  }

  /**
   * Checks if a specific UTXO is protected
   */
  async isUTXOProtected(address: string, utxo: ApiUTXO): Promise<boolean> {
    const result = await this.analyzeUTXOs(address, [utxo]);
    return result.protectedUtxos.length > 0;
  }

  /**
   * Gets protection details for a specific UTXO
   */
  async getUTXOProtectionDetails(address: string, utxo: ApiUTXO): Promise<ProtectedUTXO | null> {
    const result = await this.analyzeUTXOs(address, [utxo]);
    return result.protectedUtxos[0] || null;
  }

  /**
   * Clears the protection cache
   */
  clearCache(): void {
    this.protectedUtxoCache.clear();
    this.cacheExpiry.clear();
  }
}

export default new UTXOProtectionService();
