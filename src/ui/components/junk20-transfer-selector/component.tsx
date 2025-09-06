import { useEffect, useState } from "react";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { useControllersState } from "@/ui/states/controllerState";
import { ss } from "@/ui/utils";
import { nFormatter } from "@/ui/utils/formatter";
import { satoshisToAmount } from "@/shared/utils/transactions";
import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import cn from "classnames";
import s from "./styles.module.scss";

interface Junk20TransferUTXO {
  inscription_id: string;
  inscription_number: number;
  txid: string;
  vout: number;
  value: number;
  junk20: {
    tick: string;
    balance: string;
    operation: string;
  };
}

interface Props {
  tick: string;
  onSelectionChange: (selectedUtxos: Junk20TransferUTXO[]) => void;
  className?: string;
}

const Junk20TransferSelector = ({ tick, onSelectionChange, className = "" }: Props) => {
  const [transferUtxos, setTransferUtxos] = useState<Junk20TransferUTXO[]>([]);
  const [selectedUtxos, setSelectedUtxos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentAccount = useGetCurrentAccount();
  const { apiController } = useControllersState(ss(["apiController"]));

  useEffect(() => {
    if (!currentAccount?.address || !apiController || !tick) return;

    const fetchTransferUtxos = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Get Junk-20 balance data which includes transfer UTXOs
        const junk20Data = await apiController.getJunk20Balance(currentAccount.address);
        
        if (junk20Data) {
          const tokenData = junk20Data.find(token => token.tick.toLowerCase() === tick.toLowerCase());
          
          if (tokenData) {
            // Extract transfer UTXOs from the token data
            // This would need to be enhanced to get actual UTXO details
            const transfers: Junk20TransferUTXO[] = [];
            
            // For now, create mock transfer UTXOs based on the API structure
            // In a real implementation, this would fetch actual transfer inscription UTXOs
            if (Number(tokenData.transferable) > 0) {
              // This is a placeholder - real implementation would fetch transfer UTXOs
              // from the API endpoint that provides UTXO details for transfer inscriptions
              console.log(`Found ${tokenData.transferable} transferable ${tick} tokens`);
            }
            
            setTransferUtxos(transfers);
          } else {
            setTransferUtxos([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch transfer UTXOs:', err);
        setError('Failed to load transfer UTXOs');
        setTransferUtxos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransferUtxos();
  }, [currentAccount?.address, apiController, tick]);

  const handleUtxoToggle = (utxo: Junk20TransferUTXO) => {
    const utxoKey = `${utxo.txid}:${utxo.vout}`;
    const newSelected = new Set(selectedUtxos);
    
    if (newSelected.has(utxoKey)) {
      newSelected.delete(utxoKey);
    } else {
      newSelected.add(utxoKey);
    }
    
    setSelectedUtxos(newSelected);
    
    // Notify parent of selection change
    const selectedUtxoList = transferUtxos.filter(utxo => 
      newSelected.has(`${utxo.txid}:${utxo.vout}`)
    );
    onSelectionChange(selectedUtxoList);
  };

  const handleSelectAll = () => {
    if (selectedUtxos.size === transferUtxos.length) {
      // Deselect all
      setSelectedUtxos(new Set());
      onSelectionChange([]);
    } else {
      // Select all
      const allKeys = new Set(transferUtxos.map(utxo => `${utxo.txid}:${utxo.vout}`));
      setSelectedUtxos(allKeys);
      onSelectionChange(transferUtxos);
    }
  };

  const selectedCount = selectedUtxos.size;
  const totalTransferableAmount = transferUtxos
    .filter(utxo => selectedUtxos.has(`${utxo.txid}:${utxo.vout}`))
    .reduce((sum, utxo) => sum + Number(utxo.junk20.balance), 0);

  if (loading) {
    return (
      <div className={`${s.container} ${className}`}>
        <div className={s.loading}>
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-600 h-4 w-4"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              <div className="h-4 bg-gray-600 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${s.container} ${className}`}>
        <div className={s.error}>
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      </div>
    );
  }

  if (transferUtxos.length === 0) {
    return (
      <div className={`${s.container} ${className}`}>
        <div className={s.empty}>
          <div className={s.emptyIcon}>📦</div>
          <div className={s.emptyText}>
            <h3>No Transfer UTXOs Available</h3>
            <p>
              You need to create transfer inscriptions first before you can send {tick.toUpperCase()} tokens.
            </p>
            <p className={s.hint}>
              Use the "Create Transfer" feature to make your tokens transferable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.container} ${className}`}>
      <div className={s.header}>
        <div className={s.title}>
          <span>Select {tick.toUpperCase()} Transfer UTXOs</span>
          <span className={s.count}>
            {transferUtxos.length} available
          </span>
        </div>
        
        {transferUtxos.length > 0 && (
          <button
            className={s.selectAllBtn}
            onClick={handleSelectAll}
          >
            {selectedUtxos.size === transferUtxos.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {selectedCount > 0 && (
        <div className={s.selectionSummary}>
          <div className={s.summaryItem}>
            <span className={s.summaryLabel}>Selected:</span>
            <span className={s.summaryValue}>
              {selectedCount} UTXO{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={s.summaryItem}>
            <span className={s.summaryLabel}>Total Amount:</span>
            <span className={s.summaryValue}>
              {nFormatter(totalTransferableAmount)} {tick.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      <div className={s.utxoList}>
        {transferUtxos.map((utxo) => {
          const utxoKey = `${utxo.txid}:${utxo.vout}`;
          const isSelected = selectedUtxos.has(utxoKey);
          
          return (
            <div
              key={utxoKey}
              className={cn(s.utxoItem, { [s.selected]: isSelected })}
              onClick={() => handleUtxoToggle(utxo)}
            >
              <div className={s.utxoCheckbox}>
                <div className={cn(s.checkbox, { [s.checked]: isSelected })}>
                  {isSelected && <CheckIcon className="w-3 h-3" />}
                </div>
              </div>
              
              <div className={s.utxoInfo}>
                <div className={s.utxoHeader}>
                  <span className={s.utxoId}>
                    {utxo.txid.substring(0, 8)}...:{utxo.vout}
                  </span>
                  <span className={s.inscriptionNumber}>
                    #{utxo.inscription_number}
                  </span>
                </div>
                
                <div className={s.utxoDetails}>
                  <div className={s.tokenAmount}>
                    <span className={s.amount}>
                      {nFormatter(utxo.junk20.balance)} {tick.toUpperCase()}
                    </span>
                    <span className={s.operation}>
                      {utxo.junk20.operation}
                    </span>
                  </div>
                  
                  <div className={s.utxoValue}>
                    {satoshisToAmount(utxo.value)} JKC
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedCount > 0 && (
        <div className={s.footer}>
          <div className={s.footerInfo}>
            <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
            <span className={s.footerText}>
              Selected transfer UTXOs will be sent to the destination address.
              This action cannot be undone.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Junk20TransferSelector;
