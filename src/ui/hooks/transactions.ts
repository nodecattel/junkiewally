import { useGetCurrentAccount, useWalletState } from "../states/walletState";
import { useControllersState } from "../states/controllerState";
import { satoshisToAmount } from "@/shared/utils/transactions";
import { Psbt, Transaction } from "junkcoinjs-lib";
import type { Hex } from "@/background/services/keyring/types";
import { t } from "i18next";
import { Inscription, OrdUTXO } from "@/shared/interfaces/inscriptions";
import { ITransfer } from "@/shared/interfaces/token";
import toast from "react-hot-toast";
import { gptFeeCalculate, ss } from "../utils";
import { useAppState } from "../states/appState";
import type { ApiUTXO } from "@/shared/interfaces/api";

export function useCreateJKCTxCallback() {
  const { selectedAccount, selectedWallet } = useWalletState(
    ss(["selectedAccount", "selectedWallet"])
  );
  const currentAccount = useGetCurrentAccount();
  const { apiController, keyringController } = useControllersState(
    ss(["apiController", "keyringController"])
  );
  const { network } = useAppState(ss(["network"]));

  return async (
    toAddress: Hex,
    toAmount: number,
    feeRate: number,
    receiverToPayFee = false,
    useEnhanced = true,
    includeProtectedUtxos = false
  ): Promise<{ rawtx: string; fee: number } | undefined> => {
    if (
      selectedWallet === undefined ||
      selectedAccount === undefined ||
      currentAccount === undefined ||
      currentAccount.address === undefined
    )
      throw new Error("Failed to get current wallet or account");
    const fromAddress = currentAccount.address;

    let fee: number;
    let totalAmount: number;
    let utxos: ApiUTXO[] | undefined;

    if (useEnhanced) {
      try {
        // Use enhanced fee calculation
        const initialUtxos = await apiController.getSafeUTXOs(fromAddress, {
          amount: toAmount + 1000, // Initial estimate
        });

        if (!initialUtxos || !Array.isArray(initialUtxos) || initialUtxos.length === 0) {
          throw new Error("No UTXOs available");
        }

        // Calculate enhanced fee
        fee = await keyringController.calculateEnhancedFee(
          initialUtxos,
          toAddress,
          toAmount,
          feeRate,
          network
        );

        totalAmount = toAmount + (receiverToPayFee ? 0 : fee);

        // Get final UTXOs with accurate amount
        utxos = await apiController.getSafeUTXOs(fromAddress, {
          amount: totalAmount,
        });
      } catch (error) {
        console.warn("Enhanced fee calculation failed, using fallback:", error);
        useEnhanced = false;
      }
    }

    if (!useEnhanced) {
      // Fallback to original fee calculation
      fee = gptFeeCalculate(2, 2, feeRate);
      totalAmount = toAmount + (receiverToPayFee ? 0 : fee);

      // Use appropriate UTXO selection based on protection setting
      if (includeProtectedUtxos) {
        // Include all UTXOs (safe + protected)
        utxos = await apiController.getUtxos(fromAddress, {
          amount: totalAmount,
        });
      } else {
        // Only use safe UTXOs (default behavior)
        utxos = await apiController.getSafeUTXOs(fromAddress, {
          amount: totalAmount,
        });
      }

      if ((utxos?.length ?? 0) > 5 && !receiverToPayFee) {
        fee = gptFeeCalculate(utxos!.length, 2, feeRate);
        totalAmount = toAmount + (receiverToPayFee ? 0 : fee);

        // Re-select UTXOs with updated fee calculation
        if (includeProtectedUtxos) {
          utxos = await apiController.getUtxos(fromAddress, {
            amount: totalAmount,
          });
        } else {
          utxos = await apiController.getSafeUTXOs(fromAddress, {
            amount: totalAmount,
          });
        }
      }
    }

    if (!Array.isArray(utxos)) {
      toast.error(t("send.create_send.not_enough_money_error"));
      return;
    }

    if (utxos.length > 500) {
      throw new Error(t("hooks.transaction.too_many_utxos"));
    }

    const safeBalance = utxos.reduce((pre, cur) => pre + cur.value, 0);

    if (receiverToPayFee && fee > toAmount) {
      toast.error(t("send.create_send.fee_exceeds_amount_error"));
      return;
    }

    if (safeBalance < totalAmount) {
      throw new Error(
        `${t("hooks.transaction.insufficient_balance_0")} (${satoshisToAmount(
          safeBalance
        )} ${t("hooks.transaction.insufficient_balance_1")} ${satoshisToAmount(
          totalAmount
        )} ${t("hooks.transaction.insufficient_balance_2")}`
      );
    }

    const psbtHex = await keyringController.sendBEL({
      to: toAddress,
      amount: toAmount,
      utxos,
      receiverToPayFee,
      feeRate,
      network,
    });
    const psbt = Psbt.fromHex(psbtHex);
    const tx = psbt.extractTransaction(true);
    const rawtx = tx.toHex();
    return {
      rawtx,
      fee: psbt.getFee(),
    };
  };
}

export function useCreateOrdTx() {
  const { selectedAccount, selectedWallet } = useWalletState(
    ss(["selectedAccount", "selectedWallet"])
  );
  const currentAccount = useGetCurrentAccount();
  const { apiController, keyringController } = useControllersState(
    ss(["apiController", "keyringController"])
  );
  const { network } = useAppState(ss(["network"]));

  return async (toAddress: Hex, feeRate: number, inscription: Inscription) => {
    if (
      selectedWallet === undefined ||
      selectedAccount === undefined ||
      currentAccount === undefined ||
      currentAccount.address === undefined
    )
      throw new Error("Failed to get current wallet or account");
    const fromAddress = currentAccount?.address;

    const fee = gptFeeCalculate(3, 2, feeRate);

    const utxos = await apiController.getUtxos(fromAddress, {
      amount: fee,
    });
    if (!utxos) {
      throw new Error(
        `${t("hooks.transaction.insufficient_balance_0")} (${satoshisToAmount(
          currentAccount.balance ?? 0
        )} ${t("hooks.transaction.insufficient_balance_1")} ${satoshisToAmount(
          fee
        )} ${t("hooks.transaction.insufficient_balance_2")}`
      );
    }

    const psbtHex = await keyringController.sendOrd({
      to: toAddress,
      utxos: [...utxos, { ...inscription, isOrd: true }],
      receiverToPayFee: false,
      feeRate,
      network,
    });
    const psbt = Psbt.fromHex(psbtHex);
    const tx = psbt.extractTransaction(true);
    const rawtx = tx.toHex();
    return {
      rawtx,
      fee: psbt.getFee(),
    };
  };
}

export const useSendTransferTokens = () => {
  const { apiController, keyringController } = useControllersState(
    ss(["apiController", "keyringController"])
  );
  const currentAccount = useGetCurrentAccount();
  const { network } = useAppState(ss(["network"]));

  return async (
    toAddress: string,
    txIds: ITransfer[],
    feeRate: number,
    useEnhanced = true
  ) => {
    if (!currentAccount || !currentAccount.address) return;

    let fee: number;
    let utxos: ApiUTXO[] | undefined;

    if (useEnhanced) {
      try {
        // Use enhanced fee calculation for Junk-20 transfers
        const initialUtxos = await apiController.getSafeUTXOs(currentAccount.address, {
          amount: 1000, // Initial estimate for fee
        });

        if (!initialUtxos || !Array.isArray(initialUtxos) || initialUtxos.length === 0) {
          throw new Error("No safe UTXOs available for fee payment");
        }

        // Calculate enhanced fee for multi-send transaction
        fee = await keyringController.calculateEnhancedFee(
          initialUtxos,
          toAddress,
          546 * txIds.length, // Estimate output value (dust limit per output)
          feeRate,
          network
        );

        // Get final UTXOs for fee payment
        utxos = await apiController.getSafeUTXOs(currentAccount.address, {
          amount: fee,
        });
      } catch (error) {
        console.warn("Enhanced Junk-20 transfer fee calculation failed, using fallback:", error);
        useEnhanced = false;
      }
    }

    if (!useEnhanced) {
      // Fallback to original fee calculation
      fee = gptFeeCalculate(txIds.length + 1, txIds.length + 1, feeRate);
      utxos = await apiController.getUtxos(currentAccount.address, {
        amount: fee,
        hex: true,
      });
    }

    if (!utxos || !Array.isArray(utxos)) {
      throw new Error(
        `${t("hooks.transaction.insufficient_balance_0")} (${satoshisToAmount(
          currentAccount.balance ?? 0
        )} ${t("hooks.transaction.insufficient_balance_1")} ${satoshisToAmount(
          fee
        )} ${t("hooks.transaction.insufficient_balance_2")}`
      );
    }

    // Build inscription UTXOs for transfer
    const inscriptions: OrdUTXO[] = [];
    for (const transferToken of txIds) {
      const hex = await apiController.getTransactionHex(
        transferToken.inscription_id.split("i")[0]
      );
      if (!hex) return;
      const tx = Transaction.fromHex(hex);
      const vout = Number(transferToken.inscription_id.split("i")[1]);

      inscriptions.push({
        inscription_id: transferToken.inscription_id,
        offset: 0,
        txid: tx.getId(),
        value: tx.outs[vout].value,
        vout,
        hex,
      });
    }

    // Create enhanced multi-send transaction
    const tx = await keyringController.createSendMultiOrd(
      toAddress,
      feeRate,
      inscriptions,
      utxos as any,
      network
    );

    const result = await apiController.pushTx(tx);
    if (result.txid !== undefined) {
      toast.success(t("inscriptions.success_send_transfer"));
    } else {
      toast.error(
        t("inscriptions.failed_send_transfer") + `\n ${result.error}`
      );
    }
  };
};

/**
 * Enhanced hook for Junk-20 transfer UTXO management
 */
export const useJunk20TransferManager = () => {
  const { apiController } = useControllersState(ss(["apiController"]));
  const currentAccount = useGetCurrentAccount();

  return {
    /**
     * Get available transfer UTXOs for a specific token
     */
    getAvailableTransferUTXOs: async (tick: string): Promise<{
      transferUtxos: OrdUTXO[];
      totalTransferableAmount: number;
    }> => {
      if (!currentAccount?.address) {
        return { transferUtxos: [], totalTransferableAmount: 0 };
      }

      try {
        // Get Junk-20 balance data which includes transfer information
        const junk20Data = await apiController.getJunk20Balance(currentAccount.address);

        if (junk20Data) {
          const tokenData = junk20Data.find(token =>
            token.tick.toLowerCase() === tick.toLowerCase()
          );

          if (tokenData && Number(tokenData.transferable) > 0) {
            // In a real implementation, this would fetch actual transfer inscription UTXOs
            // from an API endpoint that provides UTXO details for transfer inscriptions
            console.log(`Found ${tokenData.transferable} transferable ${tick} tokens`);

            // For now, return empty array - this would be populated with actual transfer UTXOs
            // when the API endpoint for transfer UTXO details is available
            return {
              transferUtxos: [],
              totalTransferableAmount: Number(tokenData.transferable),
            };
          }
        }

        return { transferUtxos: [], totalTransferableAmount: 0 };
      } catch (error) {
        console.error('Failed to fetch transfer UTXOs:', error);
        return { transferUtxos: [], totalTransferableAmount: 0 };
      }
    },

    /**
     * Analyze transaction requirements for Junk-20 transfers
     */
    analyzeTransferRequirements: async (
      transferUtxos: OrdUTXO[],
      feeRate: number
    ): Promise<{
      canProceed: boolean;
      estimatedFee: number;
      availableBalance: number;
      warnings: string[];
    }> => {
      if (!currentAccount?.address) {
        return {
          canProceed: false,
          estimatedFee: 0,
          availableBalance: 0,
          warnings: ["No current account"],
        };
      }

      const warnings: string[] = [];

      // Get safe UTXOs for fee payment
      const safeUtxos = await apiController.getSafeUTXOs(currentAccount.address, {
        amount: 1000, // Initial estimate
      });

      const availableBalance = Array.isArray(safeUtxos)
        ? safeUtxos.reduce((sum, utxo) => sum + utxo.value, 0)
        : 0;

      // Estimate fee for multi-send transaction
      const estimatedFee = gptFeeCalculate(
        (Array.isArray(safeUtxos) ? safeUtxos.length : 0) + transferUtxos.length,
        transferUtxos.length + 1,
        feeRate
      );

      const canProceed = availableBalance >= estimatedFee && transferUtxos.length > 0;

      if (transferUtxos.length === 0) {
        warnings.push("No transfer UTXOs selected");
      }
      if (availableBalance < estimatedFee) {
        warnings.push("Insufficient balance to pay transaction fee");
      }

      return {
        canProceed,
        estimatedFee,
        availableBalance,
        warnings,
      };
    },
  };
};

export function usePushJKCTxCallback() {
  const { apiController } = useControllersState(ss(["apiController"]));

  return async (rawtx: string) => {
    try {
      return await apiController.pushTx(rawtx);
    } catch (e) {
      const error = e as Error;
      if ("message" in error) {
        if (error.message.includes("too-long-mempool-chain")) {
          toast.error(t("hooks.transaction.too_long_mempool_chain"));
        } else {
          toast.error(error.message);
        }
      }
    }
  };
}
