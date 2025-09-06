/**
 * Ord Utilities Adapter
 * 
 * This adapter bridges the ord utilities with JunkieWally's existing interfaces,
 * providing enhanced transaction building capabilities while maintaining
 * backward compatibility with existing wallet functionality.
 */

import { Network, Psbt } from "junkcoinjs-lib";
import { createSendBEL, createSendOrd, createMultisendOrd } from "../utils/ord/src/index.js";
import type { UnspentOutput, AddressType } from "../utils/ord/src/OrdTransaction.js";
import type { CreateSendBel, CreateSendOrd, CreateMultiSendOrd } from "../utils/ord/src/types.js";
import type { ApiUTXO } from "@/shared/interfaces/api";
import type { OrdUTXO } from "@/shared/interfaces/inscriptions";

/**
 * Enhanced transaction building service using ord utilities
 */
export class OrdUtilsAdapter {
  /**
   * Convert wallet UTXO format to ord utilities format
   */
  static convertWalletUTXOToOrdUTXO(
    utxo: ApiUTXO,
    scriptPk: string,
    addressType: AddressType,
    address: string,
    ords: { id: string; offset: number }[] = []
  ): UnspentOutput {
    return {
      txId: utxo.txid,
      outputIndex: utxo.vout,
      satoshis: utxo.value,
      scriptPk,
      addressType,
      address,
      ords,
      rawHex: utxo.hex,
    };
  }

  /**
   * Convert inscription UTXO to ord utilities format
   */
  static convertInscriptionUTXOToOrdUTXO(
    inscription: OrdUTXO,
    scriptPk: string,
    addressType: AddressType,
    address: string
  ): UnspentOutput {
    return {
      txId: inscription.txid,
      outputIndex: inscription.vout,
      satoshis: inscription.value,
      scriptPk,
      addressType,
      address,
      ords: [
        {
          id: inscription.inscription_id,
          offset: inscription.offset,
        },
      ],
      rawHex: inscription.hex,
    };
  }

  /**
   * Enhanced BEL/JKC transaction creation using ord utilities
   */
  static async createEnhancedSendBEL(params: {
    utxos: ApiUTXO[];
    toAddress: string;
    toAmount: number;
    signTransaction: (psbt: Psbt) => Promise<void>;
    network: Network;
    changeAddress: string;
    receiverToPayFee?: boolean;
    feeRate: number;
    pubkey: string;
    scriptPk: string;
    addressType: AddressType;
    calculateFee?: (tx: string, feeRate: number) => Promise<number>;
    enableRBF?: boolean;
  }): Promise<Psbt> {
    // Convert wallet UTXOs to ord utilities format
    const ordUtxos: UnspentOutput[] = params.utxos.map(utxo =>
      this.convertWalletUTXOToOrdUTXO(
        utxo,
        params.scriptPk,
        params.addressType,
        params.changeAddress
      )
    );

    const createSendParams: CreateSendBel = {
      utxos: ordUtxos,
      toAddress: params.toAddress,
      toAmount: params.toAmount,
      signTransaction: params.signTransaction,
      network: params.network,
      changeAddress: params.changeAddress,
      receiverToPayFee: params.receiverToPayFee,
      feeRate: params.feeRate,
      pubkey: params.pubkey,
      calculateFee: params.calculateFee,
      enableRBF: params.enableRBF ?? true,
      tick: "JKC", // Junkcoin ticker
    };

    return await createSendBEL(createSendParams);
  }

  /**
   * Enhanced ordinal/inscription transaction creation using ord utilities
   */
  static async createEnhancedSendOrd(params: {
    utxos: ApiUTXO[];
    inscriptionUtxo: OrdUTXO;
    toAddress: string;
    outputValue: number;
    signTransaction: (psbt: Psbt) => Promise<void>;
    network: Network;
    changeAddress: string;
    feeRate: number;
    pubkey: string;
    scriptPk: string;
    addressType: AddressType;
    calculateFee?: (tx: string, feeRate: number) => Promise<number>;
    enableRBF?: boolean;
  }): Promise<Psbt> {
    // Convert wallet UTXOs to ord utilities format
    const nonOrdUtxos: UnspentOutput[] = params.utxos.map(utxo =>
      this.convertWalletUTXOToOrdUTXO(
        utxo,
        params.scriptPk,
        params.addressType,
        params.changeAddress
      )
    );

    // Convert inscription UTXO
    const inscriptionOrdUtxo = this.convertInscriptionUTXOToOrdUTXO(
      params.inscriptionUtxo,
      params.scriptPk,
      params.addressType,
      params.changeAddress
    );

    const allUtxos = [...nonOrdUtxos, inscriptionOrdUtxo];

    const createSendParams: CreateSendOrd = {
      utxos: allUtxos,
      toAddress: params.toAddress,
      outputValue: params.outputValue,
      signTransaction: params.signTransaction,
      network: params.network,
      changeAddress: params.changeAddress,
      feeRate: params.feeRate,
      pubkey: params.pubkey,
      calculateFee: params.calculateFee,
      enableRBF: params.enableRBF ?? true,
      tick: "JKC",
    };

    return await createSendOrd(createSendParams);
  }

  /**
   * Enhanced multi-send ordinal transaction creation for Junk-20 transfers
   */
  static async createEnhancedMultiSendOrd(params: {
    utxos: ApiUTXO[];
    inscriptionUtxos: OrdUTXO[];
    toAddress: string;
    signPsbtHex: (psbtHex: string) => Promise<string>;
    network: Network;
    changeAddress: string;
    feeRate: number;
    publicKey: string;
    scriptPk: string;
    addressType: AddressType;
  }): Promise<string> {
    // Convert wallet UTXOs to ord utilities format
    const nonOrdUtxos = params.utxos.map(utxo => ({
      txId: utxo.txid,
      outputIndex: utxo.vout,
      satoshis: utxo.value,
      ords: [],
      rawHex: utxo.hex,
    }));

    // Convert inscription UTXOs
    const ordUtxos = params.inscriptionUtxos.map(inscription => ({
      txId: inscription.txid,
      outputIndex: inscription.vout,
      satoshis: inscription.value,
      ords: [
        {
          id: inscription.inscription_id,
          offset: inscription.offset,
        },
      ],
      rawHex: inscription.hex,
    }));

    const allUtxos = [...nonOrdUtxos, ...ordUtxos];

    const createMultiSendParams: CreateMultiSendOrd = {
      utxos: allUtxos,
      toAddress: params.toAddress,
      signPsbtHex: params.signPsbtHex,
      network: params.network,
      changeAddress: params.changeAddress,
      feeRate: params.feeRate,
      publicKey: params.publicKey,
    };

    return await createMultisendOrd(createMultiSendParams);
  }

  /**
   * Enhanced fee calculation using ord utilities
   */
  static async calculateEnhancedFee(params: {
    utxos: ApiUTXO[];
    toAddress: string;
    toAmount: number;
    feeRate: number;
    network: Network;
    publicKey: string;
    signPsbtHex: (psbtHex: string) => Promise<string>;
  }): Promise<number> {
    // Create a temporary PSBT for fee calculation
    const psbt = new Psbt({ network: params.network });
    
    // Add inputs
    params.utxos.forEach(utxo => {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(utxo.hex || '', 'hex'),
      });
    });

    // Add output
    psbt.addOutput({
      address: params.toAddress,
      value: params.toAmount,
    });

    // Calculate fee using ord utilities method
    const { calculateFee } = await import("../utils/ord/src/utils.js");
    return await calculateFee(
      psbt,
      params.feeRate,
      params.toAddress,
      params.signPsbtHex
    );
  }

  /**
   * Validate and prepare UTXOs for ord utilities
   */
  static validateAndPrepareUTXOs(
    utxos: ApiUTXO[],
    requiredAmount: number
  ): {
    isValid: boolean;
    totalValue: number;
    selectedUtxos: ApiUTXO[];
    error?: string;
  } {
    if (!utxos || utxos.length === 0) {
      return {
        isValid: false,
        totalValue: 0,
        selectedUtxos: [],
        error: "No UTXOs available",
      };
    }

    // Sort UTXOs by value (largest first for efficiency)
    const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
    
    let totalValue = 0;
    const selectedUtxos: ApiUTXO[] = [];

    // Select UTXOs until we have enough value
    for (const utxo of sortedUtxos) {
      selectedUtxos.push(utxo);
      totalValue += utxo.value;

      if (totalValue >= requiredAmount) {
        break;
      }
    }

    return {
      isValid: totalValue >= requiredAmount,
      totalValue,
      selectedUtxos,
      error: totalValue < requiredAmount ? "Insufficient balance" : undefined,
    };
  }

  /**
   * Get ordinal-aware UTXO information
   */
  static analyzeUTXOForOrdinals(utxo: ApiUTXO): {
    hasOrdinals: boolean;
    isSpendable: boolean;
    ordinalCount: number;
    recommendedAction: string;
  } {
    // This would integrate with the existing UTXO protection service
    // For now, return basic analysis
    return {
      hasOrdinals: false, // Would be determined by UTXO protection service
      isSpendable: true,
      ordinalCount: 0,
      recommendedAction: "safe_to_spend",
    };
  }
}

export default OrdUtilsAdapter;
