import { useEffect, useState } from "react";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { useControllersState } from "@/ui/states/controllerState";
import { ss } from "@/ui/utils";
import { Junk20TokenSummary } from "@/shared/interfaces/junk20";
import { nFormatter } from "@/ui/utils/formatter";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import cn from "classnames";
import s from "./styles.module.scss";

const Junk20Balance = () => {
  const [tokens, setTokens] = useState<Junk20TokenSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentAccount = useGetCurrentAccount();
  const { apiController } = useControllersState(ss(["apiController"]));

  useEffect(() => {
    if (!currentAccount?.address || !apiController) return;

    const fetchJunk20Balance = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const junk20Tokens = await apiController.getJunk20Balance(currentAccount.address);
        setTokens(junk20Tokens || []);
      } catch (err) {
        console.error('Failed to fetch Junk-20 balance:', err);
        setError('Failed to load Junk-20 tokens');
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJunk20Balance();
  }, [currentAccount?.address, apiController]);

  // Don't render if no tokens and not loading
  if (!loading && tokens.length === 0 && !error) {
    return null;
  }

  const totalTokenTypes = tokens.length;
  const hasTokens = totalTokenTypes > 0;

  return (
    <div className={s.container}>
      <div 
        className={cn(s.header, { [s.clickable]: hasTokens })}
        onClick={() => hasTokens && setExpanded(!expanded)}
      >
        <div className={s.titleSection}>
          <span className={s.title}>Junk-20 Tokens</span>
          {loading && (
            <div className={s.loadingSpinner}>
              <div className="animate-pulse w-4 h-4 rounded-full bg-gray-600" />
            </div>
          )}
        </div>
        
        {hasTokens && (
          <div className={s.summary}>
            <span className={s.tokenCount}>
              {totalTokenTypes} token{totalTokenTypes !== 1 ? 's' : ''}
            </span>
            {hasTokens && (
              <div className={s.expandIcon}>
                {expanded ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className={s.error}>
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}

      {expanded && hasTokens && (
        <div className={s.tokenList}>
          {tokens.map((token, index) => (
            <div key={`${token.tick}-${index}`} className={s.tokenItem}>
              <div className={s.tokenInfo}>
                <span className={s.tokenTick}>{token.tick.toUpperCase()}</span>
                <div className={s.tokenBalances}>
                  <div className={s.balanceRow}>
                    <span className={s.balanceLabel}>Available:</span>
                    <span className={s.balanceValue}>
                      {nFormatter(token.balance || "0")}
                    </span>
                  </div>
                  <div className={s.balanceRow}>
                    <span className={s.balanceLabel}>Transferable:</span>
                    <span className={s.balanceValue}>
                      {nFormatter(token.transferable || "0")}
                    </span>
                  </div>
                  <div className={s.balanceRow}>
                    <span className={s.balanceLabel}>Total:</span>
                    <span className={s.balanceValue}>
                      {nFormatter(
                        (parseFloat(token.balance || "0") + parseFloat(token.transferable || "0")).toString()
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className={s.utxoCount}>
                {token.utxoCount} UTXO{token.utxoCount !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      {!expanded && hasTokens && (
        <div className={s.compactView}>
          {tokens.slice(0, 2).map((token, index) => {
            const totalBalance = parseFloat(token.balance || "0") + parseFloat(token.transferable || "0");
            return (
              <div key={`${token.tick}-compact-${index}`} className={s.compactToken}>
                <span className={s.compactTick}>{token.tick.toUpperCase()}</span>
                <span className={s.compactBalance}>{nFormatter(totalBalance.toString())}</span>
              </div>
            );
          })}
          {tokens.length > 2 && (
            <div className={s.moreTokens}>
              +{tokens.length - 2} more
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Junk20Balance;
