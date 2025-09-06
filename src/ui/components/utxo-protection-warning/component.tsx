import { useEffect, useState } from "react";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { useControllersState } from "@/ui/states/controllerState";
import { ss } from "@/ui/utils";
import { UTXOProtectionResult } from "@/background/services/utxoProtectionService";
import { ExclamationTriangleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { nFormatter } from "@/ui/utils/formatter";
import { satoshisToAmount } from "@/shared/utils/transactions";
import s from "./styles.module.scss";

interface Props {
  showDetails?: boolean;
  className?: string;
}

const UTXOProtectionWarning = ({ showDetails = false, className = "" }: Props) => {
  const [protectionData, setProtectionData] = useState<UTXOProtectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const currentAccount = useGetCurrentAccount();
  const { apiController } = useControllersState(ss(["apiController"]));

  useEffect(() => {
    if (!currentAccount?.address || !apiController) return;

    const checkProtection = async () => {
      setLoading(true);
      try {
        // Get all UTXOs for the current account
        const allUtxos = await apiController.getUtxos(currentAccount.address);
        if (allUtxos && allUtxos.length > 0) {
          const result = await apiController.analyzeUTXOProtection(currentAccount.address, allUtxos);
          setProtectionData(result);
        }
      } catch (error) {
        console.error('Failed to check UTXO protection:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProtection();
  }, [currentAccount?.address, apiController]);

  if (loading || !protectionData) {
    return null;
  }

  const hasProtectedUTXOs = protectionData.protectedUtxos.length > 0;

  if (!hasProtectedUTXOs && !showDetails) {
    return null;
  }

  return (
    <div className={`${s.container} ${className}`}>
      {hasProtectedUTXOs ? (
        <div className={s.warningSection}>
          <div className={s.warningHeader}>
            <ExclamationTriangleIcon className={s.warningIcon} />
            <span className={s.warningTitle}>Protected UTXOs Detected</span>
          </div>
          
          <div className={s.warningContent}>
            <p className={s.warningText}>
              {protectionData.protectedUtxos.length} UTXO{protectionData.protectedUtxos.length !== 1 ? 's' : ''} containing 
              junkscriptions are protected from accidental spending.
            </p>
            
            <div className={s.protectionStats}>
              <div className={s.statItem}>
                <span className={s.statLabel}>Protected Value:</span>
                <span className={s.statValue}>
                  {satoshisToAmount(protectionData.totalProtectedValue)} JKC
                </span>
              </div>
              <div className={s.statItem}>
                <span className={s.statLabel}>Available for Spending:</span>
                <span className={s.statValue}>
                  {satoshisToAmount(protectionData.totalSafeValue)} JKC
                </span>
              </div>
            </div>

            {showDetails && (
              <div className={s.protectedList}>
                <h4 className={s.listTitle}>Protected UTXOs:</h4>
                {protectionData.protectedUtxos.slice(0, 5).map((utxo, index) => (
                  <div key={`${utxo.txid}:${utxo.vout}`} className={s.protectedItem}>
                    <div className={s.utxoInfo}>
                      <span className={s.utxoId}>
                        {utxo.txid.substring(0, 8)}...:{utxo.vout}
                      </span>
                      <span className={s.utxoValue}>
                        {satoshisToAmount(utxo.value)} JKC
                      </span>
                    </div>
                    <div className={s.protectionInfo}>
                      <span className={s.protectionType}>
                        {utxo.protectionReason === 'junk20' ? 'JUNK-20 Token' : 'Junkscription'}
                      </span>
                      {utxo.protectionReason === 'junk20' && utxo.protectionDetails.junk20 && (
                        <span className={s.tokenInfo}>
                          {utxo.protectionDetails.junk20.tick.toUpperCase()}: {nFormatter(utxo.protectionDetails.junk20.balance)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {protectionData.protectedUtxos.length > 5 && (
                  <div className={s.moreItems}>
                    +{protectionData.protectedUtxos.length - 5} more protected UTXOs
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        showDetails && (
          <div className={s.safeSection}>
            <div className={s.safeHeader}>
              <ShieldCheckIcon className={s.safeIcon} />
              <span className={s.safeTitle}>All UTXOs Safe</span>
            </div>
            <p className={s.safeText}>
              No junkscriptions detected. All UTXOs are available for spending.
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default UTXOProtectionWarning;
