import type {
  ApiUTXO,
  IAccountStats,
  ITransaction,
} from "@/shared/interfaces/api";
import {
  ContentDetailedInscription,
  ContentInscriptionResopnse,
  FindInscriptionsByOutpointResponseItem,
} from "@/shared/interfaces/inscriptions";
import { IToken } from "@/shared/interfaces/token";
import { Junk20BalanceResponse, Junk20TokenSummary } from "@/shared/interfaces/junk20";
import { customFetch, fetchProps } from "@/shared/utils";
import { storageService } from "../services";
import { DEFAULT_FEES } from "@/shared/constant";
import { isValidTXID } from "@/ui/utils";
import utxoProtectionService, { UTXOProtectionResult } from "../services/utxoProtectionService";

export interface UtxoQueryParams {
  hex?: boolean;
  amount?: number;
}

export interface IApiController {
  getUtxos(
    address: string,
    params?: UtxoQueryParams
  ): Promise<ApiUTXO[] | undefined>;
  pushTx(rawTx: string): Promise<{ txid?: string; error?: string }>;
  getTransactions(address: string): Promise<ITransaction[] | undefined>;
  getPaginatedTransactions(
    address: string,
    txid: string
  ): Promise<ITransaction[] | undefined>;
  getJKCPrice(): Promise<{ usd: number } | undefined>;
  getLastBlockJKC(): Promise<number | undefined>;
  getFees(): Promise<{ fast: number; slow: number } | undefined>;
  getAccountStats(address: string): Promise<IAccountStats | undefined>;
  getTokens(address: string): Promise<IToken[] | undefined>;
  getJunk20Balance(address: string): Promise<Junk20TokenSummary[] | undefined>;
  analyzeUTXOProtection(address: string, utxos: ApiUTXO[]): Promise<UTXOProtectionResult>;
  getSafeUTXOs(address: string, params?: UtxoQueryParams): Promise<ApiUTXO[] | undefined>;
  getTransactionHex(txid: string): Promise<string | undefined>;
  getTransaction(txid: string): Promise<ITransaction | undefined>;
  getUtxoValues(outpoints: string[]): Promise<number[] | undefined>;
  getContentPaginatedInscriptions(
    address: string,
    page: number
  ): Promise<ContentInscriptionResopnse | undefined>;
  searchContentInscriptionByInscriptionId(
    inscriptionId: string
  ): Promise<ContentDetailedInscription | undefined>;
  searchContentInscriptionByInscriptionNumber(
    address: string,
    number: number
  ): Promise<ContentInscriptionResopnse | undefined>;
  getLocationByInscriptionId(
    inscriptionId: string
  ): Promise<{ location: string; owner: string } | undefined>;
  findInscriptionsByOutpoint(data: {
    outpoint: string;
    address: string;
  }): Promise<FindInscriptionsByOutpointResponseItem[] | undefined>;
  getInscribedOutpoints(address: string): Promise<string[] | undefined>;
}

type FetchType = <T>(
  props: Omit<fetchProps, "network">
) => Promise<T | undefined>;

class ApiController implements IApiController {
  private fetch: FetchType = async <T>(p: Omit<fetchProps, "network">): Promise<T | undefined> => {
    try {
      const result = await customFetch<T>({
        ...p,
        network: storageService.appState.network,
      });

      // Log successful API calls for debugging
      console.log(`[API Controller] ${p.service} ${p.path} - Success`);
      return result;
    } catch (error) {
      // Enhanced error logging for debugging
      console.error(`[API Controller] ${p.service} ${p.path} - Error:`, error);
      return undefined;
    }
  };

  async getUtxos(address: string, params?: UtxoQueryParams) {
    const data = await this.fetch<ApiUTXO[]>({
      path: `/address/${address}/utxo`,
      params: params as Record<string, string>,
      service: "electrs",
    });
    if (Array.isArray(data)) {
      return data;
    }
  }

  async getFees() {
    const data = await this.fetch<Record<string, number>>({
      path: "/fee-estimates",
      service: "electrs",
    });
    if (data) {
      return {
        slow: "6" in data ? Number(data["6"].toFixed(0)) : DEFAULT_FEES.slow,
        fast:
          "2" in data ? Number(data["2"].toFixed(0)) + 1 : DEFAULT_FEES.fast,
      };
    }
  }

  async pushTx(rawTx: string) {
    const data = await this.fetch<string>({
      path: "/tx",
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      json: false,
      body: rawTx,
      service: "electrs",
    });
    if (isValidTXID(data) && data) {
      return {
        txid: data,
      };
    } else {
      return {
        error: data,
      };
    }
  }

  async getTransactions(address: string): Promise<ITransaction[] | undefined> {
    return await this.fetch<ITransaction[]>({
      path: `/address/${address}/txs`,
      service: "electrs",
    });
  }

  async getPaginatedTransactions(
    address: string,
    txid: string
  ): Promise<ITransaction[] | undefined> {
    try {
      return await this.fetch<ITransaction[]>({
        path: `/address/${address}/txs/chain/${txid}`,
        service: "electrs",
      });
    } catch (e) {
      return undefined;
    }
  }

  async getLastBlockJKC() {
    const data = await this.fetch<string>({
      path: "/blocks/tip/height",
      service: "electrs",
    });
    if (data) {
      return Number(data);
    }
  }

  async getJKCPrice() {
    const data = await this.fetch<{
      difficulty: number;
      supply: number;
      hashrate: number;
      lastPrice: number;
      lastUSDPrice: number;
      connections: number;
      blockcount: number;
      masternodeCountOnline: number;
      masternodeCountOffline: number;
    }>({
      path: "/ext/getsummary",
      service: "price",
    });
    if (!data) {
      return undefined;
    }
    return {
      usd: data.lastUSDPrice,
    };
  }


  async getAccountStats(address: string): Promise<IAccountStats | undefined> {
    try {
      return await this.fetch({
        path: `/address/${address}/stats`,
        service: "electrs",
      });
    } catch {
      return { amount: 0, count: 0, balance: 0 };
    }
  }

  async getTokens(address: string): Promise<IToken[] | undefined> {
    return await this.fetch<IToken[]>({
      path: `/address/${address}/tokens`,
      service: "electrs",
    });
  }

  async getJunk20Balance(address: string): Promise<Junk20TokenSummary[] | undefined> {
    try {
      const data = await this.fetch<Junk20BalanceResponse>({
        path: `/junk20/balance/${address}`,
        service: "content",
      });

      if (!data?.junk20) {
        return [];
      }

      // Transform the API response into a summary format with validation
      return data.junk20.map(token => ({
        tick: token.tick || 'unknown',
        balance: token.available || "0",  // Map 'available' from API to 'balance' for display
        transferable: token.transferable || "0",
        utxoCount: token.utxos?.length || 0,
      }));
    } catch (error) {
      console.warn('Failed to fetch Junk-20 balance:', error);
      return [];
    }
  }

  async analyzeUTXOProtection(address: string, utxos: ApiUTXO[]): Promise<UTXOProtectionResult> {
    return await utxoProtectionService.analyzeUTXOs(address, utxos);
  }

  async getSafeUTXOs(address: string, params?: UtxoQueryParams): Promise<ApiUTXO[] | undefined> {
    // Get all UTXOs first
    const allUtxos = await this.getUtxos(address, params);
    if (!allUtxos) return undefined;

    // Filter out protected UTXOs
    return await utxoProtectionService.getSafeUTXOsForSpending(address, allUtxos);
  }

  async getTransaction(txid: string) {
    return await this.fetch<ITransaction>({
      path: "/tx/" + txid,
      service: "electrs",
    });
  }

  async getTransactionHex(txid: string) {
    return await this.fetch<string>({
      path: "/tx/" + txid + "/hex",
      json: false,
      service: "electrs",
    });
  }

  async getUtxoValues(outpoints: string[]) {
    const result = await this.fetch<{ values: number[] }>({
      path: "/prev",
      body: JSON.stringify({ locations: outpoints }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      service: "electrs",
    });
    return result?.values;
  }

  async getContentPaginatedInscriptions(address: string, page: number) {
    return await this.fetch<ContentInscriptionResopnse>({
      path: `/inscriptions/balance/${address}/${page}`,
      service: "content",
    });
  }

  async searchContentInscriptionByInscriptionId(inscriptionId: string) {
    const htmlContent = await this.fetch<string>({
      path: `/inscription/${inscriptionId}`,
      service: "content",
      json: false,
    });

    if (!htmlContent) return;

    const preMatch = htmlContent.match(/<pre[^>]*>(.*?)<\/pre>/s);
    if (!preMatch?.[1]) return;

    const genesisHeight = htmlContent.match(/genesis height[^>]*>(\d+)</)?.[1];
    const genesisFee = htmlContent.match(/genesis fee[^>]*>(\d+)</)?.[1];
    const contentType = htmlContent.match(/content type[^>]*>([\w/; -]+)</)?.[1];
    const contentLength = htmlContent.match(/content length[^>]*>(\d+)/)?.[1];
    const timestamp = htmlContent.match(/timestamp[^>]*>([^<]+UTC)/)?.[1];

    try {
      const jsonContent = JSON.parse(preMatch[1]);
      const created = timestamp ? new Date(timestamp).getTime() / 1000 : 0;

      return {
        number: 0,
        id: inscriptionId,
        file_type: contentType?.includes('json') ? 'JSON' : 'TXT',
        mime: contentType || 'text/plain',
        file_size: parseInt(contentLength || '0'),
        created: Math.floor(created),
        creation_block: parseInt(genesisHeight || '0'),
        genesis_fee: parseInt(genesisFee || '0'),
        invalid_token_reason: null,
        protocol: {
          name: jsonContent?.p || '',
          valid: true,
          invalid_reason: null,
          invalid_token_reason: null
        },
        collection: null
      } as ContentDetailedInscription;
    } catch {
      return;
    }
  }

  async searchContentInscriptionByInscriptionNumber(
    address: string,
    number: number
  ) {
    return await this.fetch<ContentInscriptionResopnse>({
      path: `/search?account=${address}&page_size=6&page=1&from=${number}&to=${number}`,
      service: "content",
    });
  }

  async getLocationByInscriptionId(inscriptionId: string) {
    return await this.fetch<{ location: string; owner: string }>({
      path: `/location/${inscriptionId}`,
      service: "electrs",
    });
  }

  async findInscriptionsByOutpoint(data: {
    outpoint: string;
    address: string;
  }) {
    try {
      console.log(`[API Controller] Finding inscriptions for outpoint: ${data.outpoint}, address: ${data.address}`);

      // Get all inscribed outpoints for the address
      const inscribedOutpoints = await this.getInscribedOutpoints(data.address);

      if (inscribedOutpoints && inscribedOutpoints.includes(data.outpoint)) {
        // Return a mock inscription object if the outpoint is inscribed
        const result: FindInscriptionsByOutpointResponseItem[] = [{
          genesis: `${data.outpoint}_inscription`,
          number: 0,
          owner: data.address,
          height: 0,
        }];
        console.log(`[API Controller] Outpoint ${data.outpoint} is inscribed`);
        return result;
      }

      console.log(`[API Controller] Outpoint ${data.outpoint} is not inscribed`);
      return [];
    } catch (error) {
      console.error(`[API Controller] Error finding inscriptions for ${data.outpoint}:`, error);
      return undefined;
    }
  }

  async getInscribedOutpoints(address: string): Promise<string[] | undefined> {
    try {
      console.log(`[API Controller] Fetching inscribed outpoints for address: ${address}`);

      const result = await this.fetch<Array<{ outpoint: string[] }>>({
        path: `/address/${address}`,
        service: "content",
      });

      if (result && result.length > 0 && result[0].outpoint) {
        const outpoints = result[0].outpoint;
        console.log(`[API Controller] Found ${outpoints.length} inscribed outpoints for ${address}`);
        return outpoints;
      }

      console.log(`[API Controller] No inscribed outpoints found for ${address}`);
      return [];
    } catch (error) {
      console.error(`[API Controller] Error fetching inscribed outpoints for ${address}:`, error);
      return undefined;
    }
  }
}

export default new ApiController();