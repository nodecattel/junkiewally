
import Switch from "@/ui/components/switch";
import { useCreateJKCTxCallback, useSendTransferTokens } from "@/ui/hooks/transactions";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { useAppState } from "@/ui/states/appState";
import { getAddressType, normalizeAmount, ss } from "@/ui/utils";
import cn from "classnames";
import { t } from "i18next";

import {
  ChangeEventHandler,
  MouseEventHandler,
  useEffect,
  useId,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import AddressBookModal from "./address-book-modal";
import AddressInput from "./address-input";
import FeeInput from "./fee-input";
import s from "./styles.module.scss";
import { getNetworkCurrency } from "@/ui/utils";

import { useControllersState } from "@/ui/states/controllerState";
import { Junk20TokenSummary } from "@/shared/interfaces/junk20";
import { CheckIcon, ExclamationTriangleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { TailSpin } from "react-loading-icons";

import { UTXOProtectionResult } from "@/background/services/utxoProtectionService";
import { ApiUTXO } from "@/shared/interfaces/api";
import { getContentUrl } from "@/shared/constant";
import ProtectedBadge from "@/ui/components/protected-badge";
interface FormType {
  address: string;
  amount: string;
  feeAmount: number;
  includeFeeInAmount: boolean;
}

type SendMode = 'jkc' | 'junk20';

interface Junk20TransferUTXO {
  inscription_id: string;
  inscription_number: number;
  txid: string;
  vout: number;
  value: number;
  confirmations: number;
  junk20: {
    tick: string;
    balance: string;
    operation: string;
  };
}

interface TransactionSummary {
  amount: string;
  fee: number;
  total: number;
  remaining: number;
  type: 'jkc' | 'inscription' | 'junk20';
}

const CreateSend = () => {
  const formId = useId();
  const { network } = useAppState(ss(["network"]));
  const { apiController } = useControllersState(ss(["apiController"]));
  const [isOpenModal, setOpenModal] = useState<boolean>(false);
  const [isSaveAddress, setIsSaveAddress] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormType>({
    address: "",
    amount: "",
    includeFeeInAmount: false,
    feeAmount: 3,
  });
  const [includeFeeLocked, setIncludeFeeLocked] = useState<boolean>(false);
  const currentAccount = useGetCurrentAccount();
  const createTx = useCreateJKCTxCallback();

  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState<boolean>(false);

  // Send mode state - JKC is default
  const [sendMode, setSendMode] = useState<SendMode>('jkc');



  // Junk-20 mode state
  const [junk20Tokens, setJunk20Tokens] = useState<Junk20TokenSummary[]>([]);
  const [selectedJunk20Token, setSelectedJunk20Token] = useState<string>('');
  const [junk20TokensLoading, setJunk20TokensLoading] = useState<boolean>(false);
  const [transferUtxos, setTransferUtxos] = useState<Junk20TransferUTXO[]>([]);
  const [selectedTransferUtxos, setSelectedTransferUtxos] = useState<Set<string>>(new Set());
  const [transferAmount, setTransferAmount] = useState<string>('');

  // TODO: Gas fee UTXO selection will be implemented in next phase

  // Transaction summary state
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<number>(0);

  // UTXO Protection state
  const [utxoProtectionResult, setUtxoProtectionResult] = useState<UTXOProtectionResult | null>(null);


  // Global UTXO protection setting
  const { utxoProtectionEnabled } = useAppState(ss(["utxoProtectionEnabled"]));

  // Enhanced hooks
  const sendTransferTokens = useSendTransferTokens();

  // Helper function to format numbers without abbreviation
  const formatFullNumber = (num: string | number): string => {
    const numValue = Number(num);
    if (isNaN(numValue)) return '0';
    return numValue.toLocaleString();
  };

  // Helper functions for balance calculation
  const getAvailableBalance = (): number => {
    if (!utxoProtectionResult) {
      // Fallback to current account balance if protection analysis not ready
      return currentAccount?.balance ?? 0;
    }

    if (!utxoProtectionEnabled) {
      // Include all UTXOs when protection is disabled
      return utxoProtectionResult.totalSafeValue + utxoProtectionResult.totalProtectedValue;
    } else {
      // Only safe UTXOs when protection is enabled (default behavior)
      return utxoProtectionResult.totalSafeValue;
    }
  };





  // Form validation function
  const isFormValid = (): boolean => {
    if (!formData.address.trim()) return false;
    if (!formData.feeAmount || formData.feeAmount < 1) return false;

    switch (sendMode) {
      case 'jkc':
        return !!(formData.amount && parseFloat(formData.amount) > 0);
      case 'junk20':
        return !!(selectedJunk20Token && selectedTransferUtxos.size > 0);
      default:
        return false;
    }
  };



  // Fetch Junk-20 tokens when Junk-20 mode is selected
  useEffect(() => {
    if (sendMode === 'junk20' && currentAccount?.address && apiController) {
      const fetchJunk20Tokens = async () => {
        setJunk20TokensLoading(true);
        try {
          const tokens = await apiController.getJunk20Balance(currentAccount.address!);
          setJunk20Tokens(tokens || []);
        } catch (error) {
          console.error('Failed to fetch Junk-20 tokens:', error);
          toast.error('Failed to load Junk-20 tokens');
        } finally {
          setJunk20TokensLoading(false);
        }
      };
      fetchJunk20Tokens();
    }
  }, [sendMode, currentAccount?.address, apiController]);

  // Fetch transfer UTXOs when a Junk-20 token is selected
  useEffect(() => {
    if (sendMode === 'junk20' && selectedJunk20Token && currentAccount?.address && apiController) {
      const fetchTransferUtxos = async () => {
        try {
          // Use the API controller to get Junk-20 balance data with proper error handling
          const junk20Data = await apiController.getJunk20Balance(currentAccount.address!);

          if (junk20Data) {
            const selectedTokenData = junk20Data.find(token =>
              token.tick.toLowerCase() === selectedJunk20Token.toLowerCase()
            );

            if (selectedTokenData) {
              // For transfer UTXOs, we need to get the full token data from the content API
              // This is a temporary solution until we have a proper transfer UTXO endpoint
              try {
                const response = await fetch(`${getContentUrl()}/junk20/balance/${currentAccount.address}`);
                const fullData = await response.json();

                if (fullData?.junk20) {
                  const fullTokenData = fullData.junk20.find((token: any) =>
                    token.tick.toLowerCase() === selectedJunk20Token.toLowerCase()
                  );

                  if (fullTokenData && fullTokenData.utxos) {
                    // Filter for transfer UTXOs (operation === "transfer")
                    const transferUtxos: Junk20TransferUTXO[] = fullTokenData.utxos
                      .filter((utxo: any) => utxo.junk20?.operation === "transfer")
                      .map((utxo: any) => ({
                        inscription_id: utxo.inscription_id,
                        inscription_number: utxo.inscription_number,
                        txid: utxo.txid,
                        vout: utxo.vout,
                        value: utxo.shibes || 100000, // Default UTXO value
                        confirmations: utxo.confirmations || 0,
                        junk20: {
                          tick: fullTokenData.tick,
                          balance: utxo.junk20.balance,
                          operation: utxo.junk20.operation,
                        },
                      }));

                    console.log(`[Transfer UTXOs] Found ${transferUtxos.length} transfer UTXOs for ${selectedJunk20Token}`);
                    setTransferUtxos(transferUtxos);
                  } else {
                    setTransferUtxos([]);
                  }
                } else {
                  setTransferUtxos([]);
                }
              } catch (fetchError) {
                console.warn('Failed to fetch detailed transfer UTXOs, using summary data:', fetchError);
                setTransferUtxos([]);
              }
            } else {
              setTransferUtxos([]);
            }
          } else {
            setTransferUtxos([]);
          }
        } catch (error) {
          console.error('Failed to fetch transfer UTXOs:', error);
          toast.error('Failed to load transfer UTXOs');
          setTransferUtxos([]);
        }
      };
      fetchTransferUtxos();
    }
  }, [sendMode, selectedJunk20Token, currentAccount?.address, apiController]);

  // Analyze UTXO protection when component loads or address changes
  useEffect(() => {
    if (currentAccount?.address && apiController) {
      const analyzeProtection = async () => {

        try {
          // Get all UTXOs for the current address
          const allUtxos = await apiController.getUtxos(currentAccount.address!);
          if (allUtxos && allUtxos.length > 0) {
            // Analyze UTXO protection
            const protectionResult = await apiController.analyzeUTXOProtection(
              currentAccount.address!,
              allUtxos
            );
            setUtxoProtectionResult(protectionResult);
          }
        } catch (error) {
          console.error('Failed to analyze UTXO protection:', error);
          // Set empty result on error to avoid blocking the UI
          setUtxoProtectionResult({
            safeUtxos: [],
            protectedUtxos: [],
            totalSafeValue: 0,
            totalProtectedValue: 0,
          });
        }
      };
      analyzeProtection();
    }
  }, [currentAccount?.address, apiController]);

  // Calculate transaction summary
  useEffect(() => {
    if (sendMode === 'jkc' && formData.amount && formData.feeAmount) {
      const amount = parseFloat(formData.amount);
      const fee = formData.feeAmount * 250; // Rough estimate: 250 bytes * fee rate
      const total = formData.includeFeeInAmount ? amount : amount + (fee / 1e8);
      const availableBalance = getAvailableBalance();
      const remaining = (availableBalance / 1e8) - total;

      setTransactionSummary({
        amount: formData.amount,
        fee: fee,
        total: total,
        remaining: remaining,
        type: 'jkc'
      });
      setEstimatedFee(fee);

    } else if (sendMode === 'junk20' && selectedTransferUtxos.size > 0) {
      const fee = formData.feeAmount * 200 * selectedTransferUtxos.size; // Rough estimate per transfer UTXO
      setTransactionSummary({
        amount: `${selectedTransferUtxos.size} transfer UTXO${selectedTransferUtxos.size > 1 ? 's' : ''}`,
        fee: fee,
        total: fee / 1e8,
        remaining: (currentAccount?.balance || 0) / 1e8 - (fee / 1e8),
        type: 'junk20'
      });
      setEstimatedFee(fee);
    } else {
      setTransactionSummary(null);
      setEstimatedFee(0);
    }
  }, [sendMode, formData.amount, formData.feeAmount, formData.includeFeeInAmount,
      selectedTransferUtxos.size, utxoProtectionResult, utxoProtectionEnabled]);

  // Handler functions
  const handleSendModeChange = (mode: SendMode) => {
    setSendMode(mode);
    // Reset mode-specific state
    setSelectedJunk20Token('');
    setSelectedTransferUtxos(new Set());
    setTransferAmount('');
  };

  // Note: handleTransferUtxoToggle would be used in the Junk-20 UTXO selection UI
  // Currently commented out as the full UTXO selection interface is not implemented

  const handleCreateTransferInscription = async () => {
    if (!selectedJunk20Token || !transferAmount || !currentAccount?.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      toast.success('Transfer inscription creation will be implemented in the next phase');
      // TODO: Implement transfer inscription creation
      // const result = await createTransferInscription(selectedJunk20Token, transferAmount);
      // if (result.success) {
      //   toast.success('Transfer inscription created successfully');
      //   setShowCreateTransfer(false);
      //   // Refresh transfer UTXOs
      // }
    } catch (error) {
      console.error('Failed to create transfer inscription:', error);
      toast.error('Failed to create transfer inscription');
    } finally {
      setLoading(false);
    }
  };

  const send = async ({
    address,
    amount: amountStr,
    feeAmount: feeRate,
    includeFeeInAmount,
  }: FormType) => {
    try {
      setLoading(true);
      const amount = parseFloat(amountStr);

      // Address validation
      if (typeof getAddressType(address, network) === "undefined") {
        return toast.error(t("send.create_send.address_error"));
      }
      if (address.trim().length <= 0) {
        return toast.error(t("send.create_send.address_error"));
      }

      // Fee validation
      if (feeRate % 1 !== 0) {
        return toast.error(t("send.create_send.fee_is_text_error"));
      }
      if (typeof feeRate !== "number" || !feeRate || feeRate < 1) {
        return toast.error(t("send.create_send.not_enough_fee_error"));
      }

      // Mode-specific validation and processing
      let data;

      try {
        if (sendMode === 'jkc') {
          // JKC transaction validation
          if (Number.isNaN(amount) || amount < 1e-5) {
            return toast.error(t("send.create_send.minimum_amount_error"));
          }

          const availableBalance = getAvailableBalance();
          if (amount > availableBalance / 10 ** 8) {
            return toast.error(t("send.create_send.not_enough_money_error"));
          }

          // Create JKC transaction with UTXO protection awareness
          // The createTx function will automatically use safe UTXOs unless includeProtectedUtxos is enabled
          // This is handled by the enhanced transaction building in the keyring service
          data = await createTx(
            address,
            Number((amount * 10 ** 8).toFixed(0)),
            feeRate,
            includeFeeInAmount,
            true, // Use enhanced transaction building
            !utxoProtectionEnabled // Pass the protection setting (inverted because the function expects includeProtectedUtxos)
          );

        } else if (sendMode === 'junk20') {
          // Junk-20 transfer validation
          if (selectedTransferUtxos.size === 0) {
            return toast.error("Please select transfer UTXOs to send");
          }

          // Convert selected UTXOs to transfer format
          const transferIds = Array.from(selectedTransferUtxos).map(utxoKey => {
            const utxo = transferUtxos.find(u => `${u.txid}:${u.vout}` === utxoKey);
            return {
              inscription_id: utxo?.inscription_id || '',
              amount: 0, // Amount is embedded in the transfer inscription
            };
          });

          await sendTransferTokens(address, transferIds, feeRate, true);

          // Navigate to success page
          navigate("/pages/finalle-send/pending", {
            state: {
              txid: "pending", // Would be actual txid from sendTransferTokens
              amount: selectedTransferUtxos.size,
              token: selectedJunk20Token,
              type: "junk20",
            },
          });
          return;
        }
      } catch (e) {
        const error = e as Error;
        if ("message" in error) {
          toast.error(error.message);
        } else {
          console.error(e);
        }
        return;
      }

      if (!data) return;
      const { fee, rawtx } = data;

      navigate("/pages/confirm-send", {
        state: {
          toAddress: address,
          amount: normalizeAmount(amountStr),
          includeFeeInAmount,
          fromAddress: currentAccount?.address ?? "",
          feeAmount: fee,
          inputedFee: feeRate,
          hex: rawtx,
          save: isSaveAddress,
          inscriptionTransaction: false,
          sendMode: sendMode,
        },
      });
    } catch (e) {
      if ((e as Error).message) {
        toast.error((e as Error).message);
      } else {
        toast.error(t("send.create_send.default_error"));
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      !currentAccount ||
      !currentAccount.address ||
      typeof currentAccount.balance === "undefined"
    )
      return;

    if (location.state) {
      setFormData((prev) => {
        if (prev.address === "") {
          if (location.state.toAddress) {
            if (location.state.save) {
              setIsSaveAddress(true);
            }
            if (currentAccount.balance! / 10 ** 8 <= location.state.amount)
              setIncludeFeeLocked(true);

            return {
              address: location.state.toAddress,
              amount: location.state.amount,
              feeAmount: location.state.inputedFee,
              includeFeeInAmount: location.state.includeFeeInAmount,
            };
          }


        }
        return prev;
      });
    }
  }, [location.state, setFormData, currentAccount]);

  const onAmountChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    console.log('Amount change event:', {
      value: e.target.value,
      accountExists: !!currentAccount,
      accountAddress: currentAccount?.address,
      accountBalance: currentAccount?.balance
    });

    if (!currentAccount || !currentAccount.address || !currentAccount.balance)
      return;

    setFormData((prev) => ({
      ...prev,
      amount: normalizeAmount(e.target.value),
    }));
    if (currentAccount.balance! / 10 ** 8 > Number(e.target.value)) {
      setIncludeFeeLocked(false);
    } else {
      setIncludeFeeLocked(true);
      setFormData((prev) => ({
        ...prev,
        includeFeeInAmount: true,
      }));
    }
  };

  const onMaxClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    if (currentAccount?.balance) {
      setFormData((prev) => ({
        ...prev,
        amount: (currentAccount.balance! / 10 ** 8).toFixed(5),
        includeFeeInAmount: true,
      }));
      setIncludeFeeLocked(true);
    }
  };

  return (
    <div className="flex flex-col justify-between w-full h-full">
      <form
        id={formId}
        className={cn("form", s.send)}
        onSubmit={async (e) => {
          e.preventDefault();
          await send(formData);
        }}
      >
        <div className={s.inputs}>
          {/* Clean Balance Display */}
          {currentAccount?.balance !== undefined && (
            <div className="form-field">
              <div className="flex items-center justify-between p-3 bg-gray-800/40 rounded-lg border border-gray-600">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Available Balance</div>
                  <div className="text-xl font-bold text-white">
                    {(getAvailableBalance() / 10 ** 8).toFixed(8)} {getNetworkCurrency(network)}
                  </div>
                </div>
                <ProtectedBadge show={utxoProtectionEnabled ?? false} size="md" />
              </div>
            </div>
          )}

          {/* Send Mode Selection - JKC is prominent */}
          <div className="form-field">
            <span className="input-span">Transaction Type</span>
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                type="button"
                className={cn(
                  "btn text-sm py-3 px-4 font-medium transition-all",
                  sendMode === 'jkc'
                    ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                    : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                )}
                onClick={() => handleSendModeChange('jkc')}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">Ɉ</span>
                  <span>JKC</span>
                </div>
              </button>

              <button
                type="button"
                className={cn(
                  "btn text-sm py-3 px-4 font-medium transition-all",
                  sendMode === 'junk20'
                    ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                    : "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
                )}
                onClick={() => handleSendModeChange('junk20')}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">◉</span>
                  <span>Junk-20</span>
                </div>
              </button>
            </div>
          </div>

          {/* Recipient Address */}
          <div className="form-field">
            <span className="input-span">{t("send.create_send.address")}</span>
            <AddressInput
              address={formData.address}
              onChange={(v) => setFormData((p) => ({ ...p, address: v }))}
              onOpenModal={() => setOpenModal(true)}
            />
          </div>

          {/* JKC Send Mode */}
          {sendMode === 'jkc' && (
            <div className="flex flex-col gap-4">
              <div className="form-field">
                <span className="input-span">{t("send.create_send.amount")}</span>
                <div className="flex gap-2 w-full">
                  <input
                    type="number"
                    step="0.00000001"
                    min="0"
                    max="21000000"
                    placeholder={t("send.create_send.amount_to_send")}
                    className="w-full input"
                    value={formData.amount}
                    onChange={onAmountChange}
                  />
                  <button
                    type="button"
                    className={s.maxAmount}
                    onClick={onMaxClick}
                  >
                    {t("send.create_send.max_amount")}
                  </button>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Supports up to 8 decimal places
                </div>
              </div>
            </div>
          )}



          {/* Junk-20 Send Mode */}
          {sendMode === 'junk20' && (
            <div className="space-y-4">
              {/* Token Selection */}
              <div className="form-field">
                <span className="input-span">Select Token</span>
                {junk20TokensLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <TailSpin className="animate-spin w-5 h-5" />
                    <span className="ml-2 text-gray-400">Loading tokens...</span>
                  </div>
                ) : junk20Tokens.length === 0 ? (
                  <div className="p-6 text-center border border-gray-600 rounded-lg bg-gray-800/30">
                    <div className="text-4xl mb-2">🪙</div>
                    <p className="text-gray-400">No Junk-20 tokens found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      You don't have any Junk-20 tokens to send
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {junk20Tokens.map((token) => (
                      <div
                        key={token.tick}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-all",
                          selectedJunk20Token === token.tick
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-gray-600 bg-gray-800/30 hover:border-gray-500"
                        )}
                        onClick={() => setSelectedJunk20Token(token.tick)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{token.tick.toUpperCase()}</span>
                              {selectedJunk20Token === token.tick && (
                                <CheckIcon className="w-5 h-5 text-orange-500" />
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-gray-400">Available:</span>
                                <div className="font-medium text-green-400">
                                  {formatFullNumber(token.balance)}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Transferable:</span>
                                <div className="font-medium text-blue-400">
                                  {formatFullNumber(token.transferable)}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {token.utxoCount} UTXO{token.utxoCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Token Actions */}
              {selectedJunk20Token && (
                <div className="form-field">
                  <span className="input-span">Token Actions</span>
                  {(() => {
                    const selectedToken = junk20Tokens.find(t => t.tick === selectedJunk20Token);
                    const hasTransferableBalance = selectedToken && Number(selectedToken.transferable) > 0;

                    if (hasTransferableBalance) {
                      return (
                        <div className="space-y-3">
                          <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                              <CheckIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">Transferable UTXOs Available</span>
                            </div>
                            <p className="text-xs text-gray-300">
                              You have {formatFullNumber(selectedToken!.transferable)} {selectedJunk20Token}
                              ready to transfer. Select transfer UTXOs below.
                            </p>
                          </div>

                          {/* Transfer UTXO Selection */}
                          <div className="p-4 border border-gray-600 rounded-lg bg-gray-800/30">
                            <div className="flex justify-between items-center mb-3">
                              <div className="text-sm text-gray-400">
                                Transfer UTXO Selection
                              </div>
                              <div className="text-xs text-gray-500">
                                {selectedTransferUtxos.size} of {transferUtxos.length} selected
                              </div>
                            </div>

                            {transferUtxos.length === 0 ? (
                              <div className="text-center py-4">
                                <div className="text-2xl mb-2">�</div>
                                <div className="text-xs text-gray-400">No transfer UTXOs available</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Create transfer inscriptions first
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {transferUtxos.map((utxo) => {
                                  const utxoKey = `${utxo.txid}:${utxo.vout}`;
                                  const isSelected = selectedTransferUtxos.has(utxoKey);

                                  return (
                                    <div
                                      key={utxoKey}
                                      className={cn(
                                        "p-3 border rounded-lg cursor-pointer transition-all",
                                        isSelected
                                          ? "border-orange-500 bg-orange-500/10"
                                          : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                                      )}
                                      onClick={() => {
                                        const newSelected = new Set(selectedTransferUtxos);
                                        if (isSelected) {
                                          newSelected.delete(utxoKey);
                                        } else {
                                          newSelected.add(utxoKey);
                                        }
                                        setSelectedTransferUtxos(newSelected);
                                      }}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-white">
                                              {formatFullNumber(utxo.junk20.balance)} {selectedJunk20Token.toUpperCase()}
                                            </span>
                                            {isSelected && (
                                              <CheckIcon className="w-4 h-4 text-orange-500" />
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            #{utxo.inscription_number} • {utxo.txid.slice(0, 8)}...:{utxo.vout}
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {(utxo.value / 1e8).toFixed(8)} JKC • {utxo.confirmations} confirmations
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {transferUtxos.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-700">
                                <button
                                  type="button"
                                  className="text-xs text-orange-400 hover:text-orange-300"
                                  onClick={() => {
                                    if (selectedTransferUtxos.size === transferUtxos.length) {
                                      setSelectedTransferUtxos(new Set());
                                    } else {
                                      setSelectedTransferUtxos(new Set(transferUtxos.map(u => `${u.txid}:${u.vout}`)));
                                    }
                                  }}
                                >
                                  {selectedTransferUtxos.size === transferUtxos.length ? 'Deselect All' : 'Select All'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div className="space-y-3">
                          <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-400 mb-2">
                              <ExclamationTriangleIcon className="w-4 h-4" />
                              <span className="text-sm font-medium">No Transferable UTXOs</span>
                            </div>
                            <p className="text-xs text-gray-300">
                              You need to create transfer inscriptions first before you can send {selectedJunk20Token} tokens.
                            </p>
                          </div>

                          {/* Create Transfer Section */}
                          <div className="p-4 border border-gray-600 rounded-lg bg-gray-800/30">
                            <div className="flex items-center gap-2 mb-3">
                              <PlusIcon className="w-4 h-4 text-orange-400" />
                              <span className="text-sm font-medium">Create Transfer Inscription</span>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">
                                  Transfer Amount
                                </label>
                                <input
                                  type="number"
                                  placeholder={`Enter amount (max: ${formatFullNumber(selectedToken?.balance || '0')})`}
                                  className="w-full input text-sm"
                                  value={transferAmount}
                                  onChange={(e) => setTransferAmount(e.target.value)}
                                />
                              </div>

                              <div className="text-xs text-gray-400 p-2 bg-gray-900/50 rounded">
                                <div className="font-medium mb-1">Two-Step Process:</div>
                                <div>1. Create transfer inscription to yourself</div>
                                <div>2. Send transfer inscription to recipient</div>
                              </div>

                              <button
                                type="button"
                                className="w-full btn bg-orange-500 text-white hover:bg-orange-600 text-sm py-2"
                                onClick={handleCreateTransferInscription}
                                disabled={!transferAmount || loading}
                              >
                                {loading ? 'Creating...' : 'Create Transfer Inscription'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction Summary */}
        {transactionSummary && (
          <div className="form-field">
            <span className="input-span">Transaction Summary</span>
            <div className="p-4 bg-gray-800/50 border border-gray-600 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-medium">{transactionSummary.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Estimated Fee:</span>
                <span className="text-white font-medium">{(transactionSummary.fee / 1e8).toFixed(8)} JKC</span>
              </div>
              {transactionSummary.type === 'jkc' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Deducted:</span>
                    <span className="text-white font-medium">{transactionSummary.total.toFixed(8)} JKC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Remaining Balance:</span>
                    <span className={cn("font-medium", transactionSummary.remaining >= 0 ? "text-green-400" : "text-red-400")}>
                      {transactionSummary.remaining.toFixed(8)} JKC
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className={s.feeDiv}>
          <div className="form-field">
            <span className="input-span">
              {t("send.create_send.fee_label")}
            </span>
            <FeeInput
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, feeAmount: v ?? 0 }))
              }
              value={formData.feeAmount}
            />
            {estimatedFee > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                Estimated fee: {(estimatedFee / 1e8).toFixed(8)} JKC ({estimatedFee} sats)
              </div>
            )}
          </div>

          {sendMode === 'jkc' && (
            <Switch
              label={t("send.create_send.include_fee_in_the_amount_label")}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, includeFeeInAmount: v }))
              }
              value={formData.includeFeeInAmount}
              locked={includeFeeLocked}
            />
          )}

          <Switch
            label={t(
              "send.create_send.save_address_for_the_next_payments_label"
            )}
            value={isSaveAddress}
            onChange={setIsSaveAddress}
            locked={false}
          />
        </div>
      </form>

      <div>
        {/* Mode-specific validation messages */}
        {sendMode === 'jkc' && formData.amount && transactionSummary && transactionSummary.remaining < 0 && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <div className="flex items-center gap-2 text-red-400">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Insufficient Balance</span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              You don't have enough JKC to complete this transaction including fees.
            </p>
          </div>
        )}



        {sendMode === 'junk20' && selectedJunk20Token && selectedTransferUtxos.size === 0 && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">No Transfer UTXOs Selected</span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Please select transfer UTXOs or create transfer inscriptions first.
            </p>
          </div>
        )}

        {/* Balance display */}
        {(
          <div className="flex justify-between py-2 px-4 mb-4">
            <div className="text-xs normal-case text-gray-400">
              {sendMode === 'jkc'
                ? (utxoProtectionEnabled ? 'Safe Balance:' : 'Total Balance:')
                : 'JKC Balance:'
              }
            </div>
            <span className="text-sm font-medium">
              {`${(getAvailableBalance() / 10 ** 8).toFixed(8)} ${getNetworkCurrency(network)}`}
            </span>
          </div>
        )}

        {/* Continue button with dynamic text */}
        <button
          disabled={loading || !isFormValid()}
          type="submit"
          className={cn("bottom-btn", {
            "opacity-50 cursor-not-allowed": loading || !isFormValid()
          })}
          form={formId}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <TailSpin className="animate-spin w-4 h-4" />
              <span>Processing...</span>
            </div>
          ) : (
            (() => {
              switch (sendMode) {
                case 'jkc':
                  return `Send ${formData.amount || '0'} JKC`;
                case 'junk20':
                  return selectedJunk20Token
                    ? selectedTransferUtxos.size > 0
                      ? `Send ${selectedJunk20Token} Tokens`
                      : 'Select Transfer UTXOs'
                    : 'Select Token';
                default:
                  return t("send.create_send.continue");
              }
            })()
          )}
        </button>
      </div>

      <AddressBookModal
        isOpen={isOpenModal}
        onClose={() => setOpenModal(false)}
        setAddress={(address) => {
          setFormData((p) => ({ ...p, address: address }));
        }}
      />
    </div>
  );
};

export default CreateSend;