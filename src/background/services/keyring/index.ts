import { KeyringServiceError } from "./consts";
import type { Hex, Json, SendBEL, SendOrd, UserToSignInput } from "./types";
import { storageService } from "@/background/services";
import { Network, payments, Psbt } from "junkcoinjs-lib";
import { getScriptForAddress, toXOnly } from "@/shared/utils/transactions";
import {
  createMultisendOrd,
  createSendBEL,
  createSendOrd,
} from "bel-ord-utils";
// Enhanced ord utilities integration
import {
  createSendBEL as createEnhancedSendBEL,
  createSendOrd as createEnhancedSendOrd,
  createMultisendOrd as createEnhancedMultisendOrd,
} from "../../../utils/ord/src/index.js";
import type { UnspentOutput, AddressType as OrdAddressType } from "../../../utils/ord/src/OrdTransaction.js";
import type { CreateSendBel, CreateSendOrd, CreateMultiSendOrd } from "../../../utils/ord/src/types.js";
import { SimpleKey, HDPrivateKey, AddressType } from "junkcoinhdw";
import HDSimpleKey from "junkcoinhdw/src/hd/simple";
import type { Keyring } from "junkcoinhdw/src/hd/types";
import { INewWalletProps } from "@/shared/interfaces";
import { ApiOrdUTXO, OrdUTXO } from "@/shared/interfaces/inscriptions";
import { ApiUTXO } from "@/shared/interfaces/api";

export const KEYRING_SDK_TYPES = {
  SimpleKey,
  HDPrivateKey,
};

class KeyringService {
  keyrings: Keyring<Json>[];

  constructor() {
    this.keyrings = [];
  }

  /**
   * Convert wallet UTXO format to ord utilities format
   * Enhanced UTXO conversion for better transaction building
   */
  private convertWalletUTXOToOrdUTXO(
    utxo: ApiUTXO,
    scriptPk: string,
    addressType: OrdAddressType,
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
  private convertInscriptionUTXOToOrdUTXO(
    inscription: OrdUTXO,
    scriptPk: string,
    addressType: OrdAddressType,
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
   * Map wallet address type to ord utilities address type
   */
  private mapAddressType(walletAddressType: AddressType): OrdAddressType {
    switch (walletAddressType) {
      case AddressType.P2WPKH:
        return "p2wpkh";
      case AddressType.P2SH_P2WPKH:
        return "p2sh-p2wpkh";
      case AddressType.P2PKH:
        return "p2pkh";
      case AddressType.P2TR:
        return "p2tr";
      default:
        return "p2wpkh"; // Default fallback
    }
  }

  async init(password: string) {
    const { wallets, network } = await storageService.importWallets(password);
    for (const i of wallets) {
      if (typeof i.data === "undefined") continue;

      const params = {
        addressType:
          i.data.addressType === undefined ? i.data.addressType : i.addressType,
        network,
      };

      let wallet: HDPrivateKey | SimpleKey;
      if (i.data.seed) {
        wallet = HDPrivateKey.deserialize({
          ...i.data,
          hideRoot: i.hideRoot,
          ...params,
        });
      } else {
        wallet = HDSimpleKey.deserialize({
          ...i.data,
          ...params,
        }) as unknown as HDSimpleKey;
      }
      this.keyrings[i.id] = wallet;
    }

    return wallets;
  }

  async newKeyring({
    walletType,
    payload,
    addressType = AddressType.P2PKH,
    hideRoot,
    restoreFrom,
    hdPath,
    passphrase,
    network,
  }: INewWalletProps) {
    let keyring: HDPrivateKey | HDSimpleKey;
    if (walletType === "root") {
      keyring = await HDPrivateKey.fromMnemonic({
        mnemonic: payload,
        hideRoot,
        addressType,
        hdPath,
        passphrase,
      });
    } else {
      keyring = HDSimpleKey.deserialize({
        privateKey: payload,
        addressType,
        isHex: restoreFrom === "hex",
      });
    }
    keyring.addressType =
      typeof addressType === "number" ? addressType : AddressType.P2PKH;
    keyring.setNetwork(network);
    this.keyrings.push(keyring);
    if (!keyring.getAccounts().length)
      return (keyring as HDPrivateKey).addAccounts(1)[0];
    return keyring.getAccounts()[0];
  }

  exportAccount(address: Hex) {
    if (storageService.currentWallet?.id === undefined)
      throw new Error("Internal error: Current wallet is not defined");
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    if (!keyring.exportAccount) {
      throw new Error(KeyringServiceError.UnsupportedExportAccount);
    }

    return keyring.exportAccount(address);
  }

  getAccounts(address: Hex) {
    for (const i of this.keyrings) {
      const accounts = i.getAccounts();
      if (accounts.includes(address)) {
        return accounts;
      }
    }
    throw new Error("Account not found");
  }

  getKeyringByIndex(index: number) {
    if (index + 1 > this.keyrings.length) {
      throw new Error("Invalid keyring index");
    }
    return this.keyrings[index];
  }

  serializeById(index: number): any {
    return this.keyrings[index].serialize();
  }

  signPsbt(psbt: Psbt, disableTweakSigner?: boolean) {
    if (storageService.currentWallet?.id === undefined)
      throw new Error("Internal error: Current wallet is not defined");
    if (storageService.currentAccount?.address === undefined)
      throw new Error("Internal error: Current account is not defined");
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    const publicKey = this.exportPublicKey(
      storageService.currentAccount.address
    );

    psbt.data.inputs.forEach((v) => {
      const isNotSigned = !(v.finalScriptSig || v.finalScriptWitness);
      const isP2TR =
        keyring.addressType === AddressType.P2TR ||
        keyring.addressType === AddressType.M44_P2TR;
      const lostInternalPubkey = !v.tapInternalKey;
      if (isNotSigned && isP2TR && lostInternalPubkey) {
        const tapInternalKey = toXOnly(
          Buffer.from(
            this.exportPublicKey(storageService.currentAccount!.address!),
            "hex"
          )
        );
        const { output } = payments.p2tr({
          internalPubkey: tapInternalKey,
          network: storageService.appState.network,
        });
        if (v.witnessUtxo?.script.toString("hex") == output?.toString("hex")) {
          v.tapInternalKey = tapInternalKey;
        }
      }
    });

    keyring.signPsbt(
      psbt,
      psbt.data.inputs.map((v, index) => ({
        index,
        publicKey,
        sighashTypes: v.sighashType ? [v.sighashType] : undefined,
        disableTweakSigner,
      }))
    );
  }

  signMessage(msgParams: { from: string; data: string }) {
    if (storageService.currentWallet?.id === undefined)
      throw new Error("Internal error: Current wallet is not defined");
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    return keyring.signMessage(msgParams.from, msgParams.data);
  }

  signPersonalMessage(msgParams: { from: string; data: string }) {
    if (storageService.currentWallet?.id === undefined)
      throw new Error("Internal error: Current wallet is not defined");
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    if (!keyring.signPersonalMessage) {
      throw new Error(KeyringServiceError.UnsupportedSignPersonalMessage);
    }

    return keyring.signPersonalMessage(msgParams.from, msgParams.data);
  }

  exportPublicKey(address: Hex) {
    if (storageService.currentWallet?.id === undefined)
      throw new Error("Internal error: Current wallet is not defined");
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);
    return keyring.exportPublicKey(address);
  }

  async SendBEL(data: SendBEL, useEnhanced: boolean = true) {
    const account = storageService.currentAccount;
    const wallet = storageService.currentWallet;
    if (!account?.address || !wallet)
      throw new Error(
        "Error when trying to get the current account or current account address or wallet"
      );

    const publicKey = this.exportPublicKey(account.address);

    const scriptPk = getScriptForAddress(
      Buffer.from(publicKey, "hex") as unknown as Uint8Array,
      wallet.addressType
    );
    if (!scriptPk)
      throw new Error("Internal error: Failed to get script for address");

    let psbt: Psbt;

    if (useEnhanced) {
      try {
        // Use enhanced ord utilities for better transaction building
        const ordUtxos: UnspentOutput[] = data.utxos.map(utxo =>
          this.convertWalletUTXOToOrdUTXO(
            utxo,
            scriptPk.toString("hex"),
            this.mapAddressType(wallet.addressType),
            account.address!
          )
        );

        const createSendParams: CreateSendBel = {
          utxos: ordUtxos,
          toAddress: data.to,
          toAmount: data.amount,
          signTransaction: this.signPsbt.bind(this) as (psbt: Psbt) => Promise<void>,
          network: data.network,
          changeAddress: account.address,
          receiverToPayFee: data.receiverToPayFee,
          feeRate: data.feeRate,
          pubkey: publicKey,
          enableRBF: false,
          tick: "JKC", // Junkcoin ticker
        };

        psbt = await createEnhancedSendBEL(createSendParams);
      } catch (error) {
        console.warn("Enhanced transaction building failed, falling back to original:", error);
        // Fallback to original implementation
        psbt = await this.createOriginalSendBEL(data, account, wallet, scriptPk, publicKey);
      }
    } else {
      // Use original implementation
      psbt = await this.createOriginalSendBEL(data, account, wallet, scriptPk, publicKey);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore We are really dont know what is it but we still copy working code
    psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
    return psbt.toHex();
  }

  /**
   * Original SendBEL implementation for fallback
   */
  private async createOriginalSendBEL(
    data: SendBEL,
    account: any,
    wallet: any,
    scriptPk: Buffer,
    publicKey: string
  ): Promise<Psbt> {
    return await createSendBEL({
      utxos: data.utxos.map((v) => {
        return {
          txId: v.txid,
          outputIndex: v.vout,
          satoshis: v.value,
          scriptPk: scriptPk.toString("hex"),
          addressType: wallet?.addressType,
          address: account.address!,
          ords: [],
        };
      }),
      toAddress: data.to,
      toAmount: data.amount,
      signTransaction: this.signPsbt.bind(this) as (
        psbt: Psbt
      ) => Promise<void>,
      network: data.network,
      changeAddress: account.address,
      receiverToPayFee: data.receiverToPayFee,
      pubkey: publicKey,
      feeRate: data.feeRate,
      enableRBF: false,
    });
  }

  async sendOrd(data: Omit<SendOrd, "amount">, useEnhanced: boolean = true) {
    const account = storageService.currentAccount;
    const wallet = storageService.currentWallet;
    if (!account?.address || !wallet)
      throw new Error(
        "Error when trying to get the current account or current account address or wallet"
      );

    const publicKey = this.exportPublicKey(account.address);

    const scriptPk = getScriptForAddress(
      Buffer.from(publicKey, "hex") as unknown as Uint8Array,
      wallet.addressType
    );
    if (!scriptPk)
      throw new Error("Internal error: Failed to get script for address");

    const inscriptionUtxoValue = data.utxos.find(
      (i) => (i as ApiOrdUTXO & { isOrd: boolean }).isOrd
    )?.value;
    if (inscriptionUtxoValue === undefined)
      throw new Error("Internal error: Inscription utxo was not found");

    let psbt: Psbt;

    if (useEnhanced) {
      try {
        // Use enhanced ord utilities for better inscription transaction building
        const nonOrdUtxos = data.utxos.filter(
          (utxo) => !(utxo as ApiOrdUTXO & { isOrd: boolean }).isOrd
        );
        const inscriptionUtxo = data.utxos.find(
          (utxo) => (utxo as ApiOrdUTXO & { isOrd: boolean }).isOrd
        ) as ApiOrdUTXO;

        const ordUtxos: UnspentOutput[] = nonOrdUtxos.map(utxo =>
          this.convertWalletUTXOToOrdUTXO(
            utxo,
            scriptPk.toString("hex"),
            this.mapAddressType(wallet.addressType),
            account.address!
          )
        );

        // Add inscription UTXO
        const inscriptionOrdUtxo = this.convertInscriptionUTXOToOrdUTXO(
          inscriptionUtxo,
          scriptPk.toString("hex"),
          this.mapAddressType(wallet.addressType),
          account.address!
        );

        const allUtxos = [...ordUtxos, inscriptionOrdUtxo];

        const createSendParams: CreateSendOrd = {
          utxos: allUtxos,
          toAddress: data.to,
          outputValue: inscriptionUtxoValue,
          signTransaction: this.signPsbt.bind(this) as (psbt: Psbt) => Promise<void>,
          network: data.network,
          changeAddress: account.address,
          feeRate: data.feeRate,
          pubkey: publicKey,
          enableRBF: false,
          tick: "JKC",
        };

        psbt = await createEnhancedSendOrd(createSendParams);
      } catch (error) {
        console.warn("Enhanced inscription transaction building failed, falling back to original:", error);
        // Fallback to original implementation
        psbt = await this.createOriginalSendOrd(data, account, wallet, scriptPk, publicKey, inscriptionUtxoValue);
      }
    } else {
      // Use original implementation
      psbt = await this.createOriginalSendOrd(data, account, wallet, scriptPk, publicKey, inscriptionUtxoValue);
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore We are really dont know what is it but we still copy working code
    psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = false;
    return psbt.toHex();
  }

  /**
   * Original sendOrd implementation for fallback
   */
  private async createOriginalSendOrd(
    data: Omit<SendOrd, "amount">,
    account: any,
    wallet: any,
    scriptPk: Buffer,
    publicKey: string,
    inscriptionUtxoValue: number
  ): Promise<Psbt> {
    return await createSendOrd({
      utxos: data.utxos.map((v) => {
        return {
          txId: v.txid,
          outputIndex: v.vout,
          satoshis: v.value,
          scriptPk: scriptPk.toString("hex"),
          addressType: wallet?.addressType,
          address: account.address!,
          ords: (v as ApiOrdUTXO & { isOrd: boolean }).isOrd
            ? [
                {
                  id: `${(v as ApiOrdUTXO).inscription_id}`,
                  offset: (v as ApiOrdUTXO).offset,
                },
              ]
            : [],
        };
      }),
      toAddress: data.to,
      outputValue: inscriptionUtxoValue,
      signTransaction: this.signPsbt.bind(this) as (
        psbt: Psbt
      ) => Promise<void>,
      network: data.network,
      changeAddress: account.address,
      pubkey: publicKey,
      feeRate: data.feeRate,
      enableRBF: false,
    });
  }

  async sendMultiOrd(
    toAddress: string,
    feeRate: number,
    ordUtxos: OrdUTXO[],
    utxos: ApiUTXO[],
    network: Network,
    useEnhanced: boolean = true
  ) {
    if (!storageService.currentAccount?.address)
      throw new Error("Error when trying to get the current account or wallet");

    if (useEnhanced) {
      try {
        // Use enhanced ord utilities for better multi-send transaction building
        const account = storageService.currentAccount;
        const wallet = storageService.currentWallet;

        if (!wallet) {
          throw new Error("Current wallet not found");
        }

        const publicKey = this.exportPublicKey(account.address);
        const scriptPk = getScriptForAddress(
          Buffer.from(publicKey, "hex") as unknown as Uint8Array,
          wallet.addressType
        );

        if (!scriptPk) {
          throw new Error("Failed to get script for address");
        }

        // Convert UTXOs to ord utilities format
        const nonOrdUtxos = utxos.map(utxo => ({
          txId: utxo.txid,
          outputIndex: utxo.vout,
          satoshis: utxo.value,
          ords: [],
          rawHex: utxo.hex,
        }));

        const inscriptionUtxos = ordUtxos.map(utxo => ({
          txId: utxo.txid,
          outputIndex: utxo.vout,
          satoshis: utxo.value,
          ords: [
            {
              id: utxo.inscription_id,
              offset: utxo.offset,
            },
          ],
          rawHex: utxo.hex,
        }));

        const allUtxos = [...nonOrdUtxos, ...inscriptionUtxos];

        const createMultiSendParams: CreateMultiSendOrd = {
          utxos: allUtxos,
          toAddress,
          signPsbtHex: async (psbtHex: string) => {
            const psbt = Psbt.fromHex(psbtHex);
            this.signPsbtWithoutFinalizing(psbt);
            return psbt.toHex();
          },
          network,
          changeAddress: account.address,
          feeRate,
          publicKey,
        };

        return await createEnhancedMultisendOrd(createMultiSendParams);
      } catch (error) {
        console.warn("Enhanced multi-send transaction building failed, falling back to original:", error);
        // Fallback to original implementation
        return await this.createOriginalMultiSend(toAddress, feeRate, ordUtxos, utxos, network);
      }
    } else {
      // Use original implementation
      return await this.createOriginalMultiSend(toAddress, feeRate, ordUtxos, utxos, network);
    }
  }

  /**
   * Original sendMultiOrd implementation for fallback
   */
  private async createOriginalMultiSend(
    toAddress: string,
    feeRate: number,
    ordUtxos: OrdUTXO[],
    utxos: ApiUTXO[],
    network: Network
  ): Promise<string> {
    return await createMultisendOrd({
      changeAddress: storageService.currentAccount!.address!,
      feeRate,
      signPsbtHex: async (psbtHex: string) => {
        const psbt = Psbt.fromHex(psbtHex);
        this.signPsbtWithoutFinalizing(psbt);
        return psbt.toHex();
      },
      toAddress,
      utxos: [
        ...utxos.map((f) => ({
          txId: f.txid,
          satoshis: f.value,
          rawHex: f.hex,
          outputIndex: f.vout,
          ords: [],
        })),
        ...ordUtxos.map((f) => ({
          txId: f.txid,
          satoshis: f.value,
          rawHex: f.hex,
          outputIndex: f.vout,
          ords: [
            {
              id: f.inscription_id,
              offset: f.offset,
            },
          ],
        })),
      ],
      network,
      publicKey: this.exportPublicKey(storageService.currentAccount!.address!),
    });
  }

  /**
   * Enhanced method for creating multi-send transactions with better Junk-20 support
   * This method is used by the controller layer
   */
  async createSendMultiOrd(
    toAddress: string,
    feeRate: number,
    ordUtxos: OrdUTXO[],
    utxos: ApiUTXO[],
    network: Network
  ): Promise<string> {
    return await this.sendMultiOrd(toAddress, feeRate, ordUtxos, utxos, network, true);
  }

  /**
   * Enhanced fee calculation using ord utilities
   */
  async calculateEnhancedFee(
    utxos: ApiUTXO[],
    toAddress: string,
    toAmount: number,
    feeRate: number,
    network: Network
  ): Promise<number> {
    try {
      const account = storageService.currentAccount;
      if (!account?.address) {
        throw new Error("Current account not found");
      }

      // Create a temporary PSBT for fee calculation
      const psbt = new Psbt({ network });

      // Add inputs
      utxos.forEach(utxo => {
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(utxo.hex || '', 'hex'),
        });
      });

      // Add output
      psbt.addOutput({
        address: toAddress,
        value: toAmount,
      });

      // Estimate fee based on transaction size
      const estimatedSize = psbt.data.inputs.length * 148 + psbt.data.outputs.length * 34 + 10;
      return Math.ceil(estimatedSize * feeRate);
    } catch (error) {
      console.warn("Enhanced fee calculation failed, using fallback:", error);
      // Fallback to simple calculation
      return Math.ceil((utxos.length * 148 + 2 * 34 + 10) * feeRate);
    }
  }

  changeAddressType(index: number, addressType: AddressType): string[] {
    this.keyrings[index].addressType = addressType;
    return this.keyrings[index].getAccounts();
  }

  async deleteWallet(id: number) {
    if (storageService.appState.password === undefined)
      throw new Error("Internal error: Password is not defined");
    const newWallets = storageService.walletState.wallets
      .filter((i) => i.id !== id)
      .map((i, idx) => ({ ...i, id: idx }));

    await storageService.updateWalletState({
      wallets: newWallets,
    });

    this.keyrings.splice(id, 1);
    const payload = await storageService.saveWallets({
      password: storageService.appState.password,
      wallets: newWallets,
      seedToDelete: id,
    });
    return {
      wallets: newWallets,
      ...payload,
    };
  }

  async toggleRootAcc() {
    if (storageService.currentWallet?.id === undefined)
      throw new Error("Error when trying to get the current wallet");
    const currentWallet = storageService.currentWallet.id;
    (this.keyrings[currentWallet] as HDPrivateKey).toggleHideRoot();
    return this.keyrings[currentWallet].getAccounts();
  }

  async signPsbtWithoutFinalizing(psbt: Psbt, inputs?: UserToSignInput[]) {
    if (
      !storageService.currentAccount?.address ||
      !storageService.currentWallet
    )
      throw new Error(
        "Error when trying to get the current account or current account address or wallet"
      );
    const keyring = this.getKeyringByIndex(storageService.currentWallet.id);

    if (inputs === undefined)
      inputs = psbt.txInputs.map((_, i) => ({
        publicKey: this.exportPublicKey(
          storageService.currentAccount!.address!
        ),
        index: i,
        sighashTypes: undefined,
      }));

    if (
      keyring.addressType === AddressType.P2TR ||
      keyring.addressType === AddressType.M44_P2TR
    ) {
      inputs.forEach((input) => {
        const psbt_input = psbt.data.inputs[input.index];
        const isNotSigned = !(
          psbt_input.finalScriptSig || psbt_input.finalScriptWitness
        );
        const isP2TR =
          keyring.addressType === AddressType.P2TR ||
          keyring.addressType === AddressType.M44_P2TR;
        const lostInternalPubkey = !psbt_input.tapInternalKey;
        if (isNotSigned && isP2TR && lostInternalPubkey) {
          const tapInternalKey = toXOnly(
            Buffer.from(
              this.exportPublicKey(storageService.currentAccount!.address!),
              "hex"
            )
          );
          const { output } = payments.p2tr({
            internalPubkey: tapInternalKey,
            network: storageService.appState.network,
          });
          if (
            psbt_input.witnessUtxo?.script.toString("hex") ==
            output?.toString("hex")
          ) {
            psbt_input.tapInternalKey = tapInternalKey;
          }
        }
      });
    }

    try {
      keyring.signInputsWithoutFinalizing(
        psbt,
        inputs.map((f) => ({
          index: f.index,
          publicKey:
            (f as any).publicKey !== undefined
              ? (f as any).publicKey
              : this.exportPublicKey((f as any).address),
          sighashTypes: f.sighashTypes,
          disableTweakSigner: f.disableTweakSigner,
        }))
      );
    } catch (e) {
      console.error(e);
    }
  }

  verifyMessage(message: string, signatureHex: string) {
    if (!storageService.currentAccount?.address)
      throw new Error("Error when trying to get the current account");
    const keyring = this.getKeyringByIndex(storageService.currentAccount.id);
    return keyring.verifyMessage(
      storageService.currentAccount.address,
      message,
      signatureHex
    );
  }

  switchNetwork(network: Network) {
    this.keyrings.map((f) => f.setNetwork(network));
  }
}

export default new KeyringService();
