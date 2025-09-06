/**
 * Enhanced Transaction Builder
 * 
 * This service provides enhanced transaction building capabilities using ord utilities
 * while maintaining compatibility with existing wallet interfaces. It integrates
 * with the UTXO protection system and provides better fee calculation and UTXO selection.
 */

import { Network, Psbt } from "junkcoinjs-lib";
import { OrdUtilsAdapter } from "./ordUtilsAdapter";
import { UTXOProtectionService } from "@/background/services/utxoProtectionService";
import type { ApiUTXO } from "@/shared/interfaces/api";
import type { OrdUTXO } from "@/shared/interfaces/inscriptions";
import type { AddressType } from "../utils/ord/src/OrdTransaction.js";

export interface EnhancedTransactionParams {
  fromAddress: string;
  toAddress: string;
  amount: number;
  feeRate: number;
  network: Network;
  publicKey: string;
  scriptPk: string;
  addressType: AddressType;
  receiverToPayFee?: boolean;
  enableRBF?: boolean;
}

export interface EnhancedInscriptionTransactionParams extends Omit<EnhancedTransactionParams, 'amount'> {
  inscriptionUtxo: OrdUTXO;
  outputValue: number;
}

export interface Junk20TransferParams {
  fromAddress: string;
  toAddress: string;
  transferUtxos: OrdUTXO[];
  feeRate: number;
  network: Network;
  publicKey: string;
  scriptPk: string;
  addressType: AddressType;
}

export interface TransactionResult {
  psbt: Psbt;
  fee: number;
  totalInput: number;
  totalOutput: number;
  changeAmount: number;
  usedUtxos: ApiUTXO[];
}

export interface Junk20TransferResult {
  rawTx: string;
  fee: number;
  transferredInscriptions: string[];
}

/**
 * Enhanced transaction builder using ord utilities
 */
export class EnhancedTransactionBuilder {
  private utxoProtectionService: UTXOProtectionService;

  constructor() {
    this.utxoProtectionService = new UTXOProtectionService();
  }

  /**
   * Create enhanced JKC send transaction with better UTXO selection and fee calculation
   */
  async createEnhancedSendTransaction(
    params: EnhancedTransactionParams,
    availableUtxos: ApiUTXO[]
  ): Promise<TransactionResult> {
    // Get safe UTXOs (excluding protected ones)
    const safeUtxos = await this.utxoProtectionService.getSafeUTXOsForSpending(
      params.fromAddress,
      availableUtxos
    );

    if (safeUtxos.length === 0) {
      throw new Error("No safe UTXOs available for spending");
    }

    // Estimate required amount including fee
    const estimatedFee = this.estimateTransactionFee(safeUtxos.length, 2, params.feeRate);
    const requiredAmount = params.amount + (params.receiverToPayFee ? 0 : estimatedFee);

    // Select optimal UTXOs
    const utxoSelection = OrdUtilsAdapter.validateAndPrepareUTXOs(safeUtxos, requiredAmount);
    
    if (!utxoSelection.isValid) {
      throw new Error(utxoSelection.error || "Insufficient balance for transaction");
    }

    // Create transaction using ord utilities
    const psbt = await OrdUtilsAdapter.createEnhancedSendBEL({
      utxos: utxoSelection.selectedUtxos,
      toAddress: params.toAddress,
      toAmount: params.amount,
      signTransaction: async (psbt: Psbt) => {
        // This will be handled by the keyring service
      },
      network: params.network,
      changeAddress: params.fromAddress,
      receiverToPayFee: params.receiverToPayFee,
      feeRate: params.feeRate,
      pubkey: params.publicKey,
      scriptPk: params.scriptPk,
      addressType: params.addressType,
      enableRBF: params.enableRBF,
    });

    const fee = psbt.getFee();
    const totalInput = utxoSelection.totalValue;
    const totalOutput = params.amount + fee;
    const changeAmount = totalInput - totalOutput;

    return {
      psbt,
      fee,
      totalInput,
      totalOutput,
      changeAmount,
      usedUtxos: utxoSelection.selectedUtxos,
    };
  }

  /**
   * Create enhanced inscription send transaction
   */
  async createEnhancedInscriptionTransaction(
    params: EnhancedInscriptionTransactionParams,
    availableUtxos: ApiUTXO[]
  ): Promise<TransactionResult> {
    // Get safe UTXOs for fee payment (excluding the inscription UTXO)
    const safeUtxos = await this.utxoProtectionService.getSafeUTXOsForSpending(
      params.fromAddress,
      availableUtxos
    );

    // Estimate fee for inscription transaction
    const estimatedFee = this.estimateTransactionFee(safeUtxos.length + 1, 2, params.feeRate);

    // Select UTXOs for fee payment
    const utxoSelection = OrdUtilsAdapter.validateAndPrepareUTXOs(safeUtxos, estimatedFee);
    
    if (!utxoSelection.isValid) {
      throw new Error("Insufficient balance to pay transaction fee");
    }

    // Create inscription transaction using ord utilities
    const psbt = await OrdUtilsAdapter.createEnhancedSendOrd({
      utxos: utxoSelection.selectedUtxos,
      inscriptionUtxo: params.inscriptionUtxo,
      toAddress: params.toAddress,
      outputValue: params.outputValue,
      signTransaction: async (psbt: Psbt) => {
        // This will be handled by the keyring service
      },
      network: params.network,
      changeAddress: params.fromAddress,
      feeRate: params.feeRate,
      pubkey: params.publicKey,
      scriptPk: params.scriptPk,
      addressType: params.addressType,
      enableRBF: params.enableRBF,
    });

    const fee = psbt.getFee();
    const totalInput = utxoSelection.totalValue + params.inscriptionUtxo.value;
    const totalOutput = params.outputValue + fee;
    const changeAmount = totalInput - totalOutput;

    return {
      psbt,
      fee,
      totalInput,
      totalOutput,
      changeAmount,
      usedUtxos: utxoSelection.selectedUtxos,
    };
  }

  /**
   * Create enhanced Junk-20 transfer transaction (step 2 of transfer process)
   */
  async createJunk20TransferTransaction(
    params: Junk20TransferParams,
    availableUtxos: ApiUTXO[],
    signPsbtHex: (psbtHex: string) => Promise<string>
  ): Promise<Junk20TransferResult> {
    // Get safe UTXOs for fee payment
    const safeUtxos = await this.utxoProtectionService.getSafeUTXOsForSpending(
      params.fromAddress,
      availableUtxos
    );

    // Estimate fee for multi-send transaction
    const estimatedFee = this.estimateTransactionFee(
      safeUtxos.length + params.transferUtxos.length,
      params.transferUtxos.length + 1,
      params.feeRate
    );

    // Select UTXOs for fee payment
    const utxoSelection = OrdUtilsAdapter.validateAndPrepareUTXOs(safeUtxos, estimatedFee);
    
    if (!utxoSelection.isValid) {
      throw new Error("Insufficient balance to pay transaction fee");
    }

    // Create multi-send transaction using ord utilities
    const rawTx = await OrdUtilsAdapter.createEnhancedMultiSendOrd({
      utxos: utxoSelection.selectedUtxos,
      inscriptionUtxos: params.transferUtxos,
      toAddress: params.toAddress,
      signPsbtHex,
      network: params.network,
      changeAddress: params.fromAddress,
      feeRate: params.feeRate,
      publicKey: params.publicKey,
      scriptPk: params.scriptPk,
      addressType: params.addressType,
    });

    return {
      rawTx,
      fee: estimatedFee, // This would be calculated more accurately by ord utilities
      transferredInscriptions: params.transferUtxos.map(utxo => utxo.inscription_id),
    };
  }

  /**
   * Get available Junk-20 transfer UTXOs for a specific token
   */
  async getAvailableTransferUTXOs(
    address: string,
    tick: string
  ): Promise<{
    transferUtxos: OrdUTXO[];
    totalTransferableAmount: number;
  }> {
    // This would integrate with the Junk-20 API to get transfer UTXOs
    // For now, return empty result - this will be implemented in Phase 3
    return {
      transferUtxos: [],
      totalTransferableAmount: 0,
    };
  }

  /**
   * Analyze transaction requirements and provide recommendations
   */
  async analyzeTransactionRequirements(
    fromAddress: string,
    amount: number,
    feeRate: number,
    availableUtxos: ApiUTXO[]
  ): Promise<{
    canProceed: boolean;
    requiredAmount: number;
    availableAmount: number;
    estimatedFee: number;
    recommendedUtxos: ApiUTXO[];
    protectedUtxos: number;
    warnings: string[];
  }> {
    // Get safe UTXOs
    const safeUtxos = await this.utxoProtectionService.getSafeUTXOsForSpending(
      fromAddress,
      availableUtxos
    );

    const protectedUtxos = availableUtxos.length - safeUtxos.length;
    const availableAmount = safeUtxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const estimatedFee = this.estimateTransactionFee(safeUtxos.length, 2, feeRate);
    const requiredAmount = amount + estimatedFee;

    const utxoSelection = OrdUtilsAdapter.validateAndPrepareUTXOs(safeUtxos, requiredAmount);
    
    const warnings: string[] = [];
    if (protectedUtxos > 0) {
      warnings.push(`${protectedUtxos} UTXOs contain junkscriptions and are protected from spending`);
    }
    if (!utxoSelection.isValid) {
      warnings.push("Insufficient balance for transaction");
    }

    return {
      canProceed: utxoSelection.isValid,
      requiredAmount,
      availableAmount,
      estimatedFee,
      recommendedUtxos: utxoSelection.selectedUtxos,
      protectedUtxos,
      warnings,
    };
  }

  /**
   * Estimate transaction fee based on inputs and outputs
   */
  private estimateTransactionFee(inputCount: number, outputCount: number, feeRate: number): number {
    // Enhanced fee calculation using ord utilities approach
    const baseSize = 10; // Base transaction size
    const inputSize = 148; // Average input size
    const outputSize = 34; // Average output size
    
    const estimatedSize = baseSize + (inputCount * inputSize) + (outputCount * outputSize);
    return Math.ceil(estimatedSize * feeRate);
  }

  /**
   * Validate transaction parameters
   */
  validateTransactionParams(params: EnhancedTransactionParams): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!params.fromAddress) {
      errors.push("From address is required");
    }
    if (!params.toAddress) {
      errors.push("To address is required");
    }
    if (params.amount <= 0) {
      errors.push("Amount must be greater than 0");
    }
    if (params.feeRate <= 0) {
      errors.push("Fee rate must be greater than 0");
    }
    if (!params.publicKey) {
      errors.push("Public key is required");
    }
    if (!params.scriptPk) {
      errors.push("Script public key is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default EnhancedTransactionBuilder;
