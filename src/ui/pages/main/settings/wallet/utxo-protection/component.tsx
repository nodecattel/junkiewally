import Switch from "@/ui/components/switch";
import { t } from "i18next";
import s from "./styles.module.scss";
import { useAppState } from "@/ui/states/appState";
import { useState } from "react";
import { ss } from "@/ui/utils";
import toast from "react-hot-toast";
import { TailSpin } from "react-loading-icons";
import { ShieldCheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const UTXOProtectionSettings = () => {
  const { utxoProtectionEnabled, updateAppState } = useAppState(
    ss(["utxoProtectionEnabled", "updateAppState"])
  );
  const [loading, setLoading] = useState(false);

  const toggleUTXOProtection = async () => {
    try {
      setLoading(true);
      await updateAppState({
        utxoProtectionEnabled: !utxoProtectionEnabled,
      });
      
      if (!utxoProtectionEnabled) {
        toast.success("UTXO Protection enabled - Your junkscriptions are now protected");
      } else {
        toast.success("UTXO Protection disabled - Use caution when sending transactions");
      }
    } catch (e) {
      const error = e as Error;
      if ("message" in error) {
        toast.error(error.message);
      } else {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <TailSpin className="animate-spin" />;

  return (
    <div className={s.wrapper}>
      <div className={s.header}>
        <div className={s.titleSection}>
          <div className={s.titleRow}>
            <ShieldCheckIcon className={s.icon} />
            <h2 className={s.title}>UTXO Protection</h2>
          </div>
          <p className={s.subtitle}>
            Protect your valuable junkscriptions and Junk-20 tokens from accidental spending
          </p>
        </div>
      </div>

      <div className={s.settingCard}>
        <Switch
          label="Lock junkscription UTXOs"
          value={utxoProtectionEnabled ?? true}
          onChange={toggleUTXOProtection}
          locked={false}
        />
        
        <div className={s.description}>
          <p className={s.descriptionText}>
            When enabled (recommended), transactions will only use UTXOs that don't contain 
            junkscriptions or Junk-20 tokens, protecting your valuable digital assets from 
            accidental spending.
          </p>
        </div>
      </div>

      {!utxoProtectionEnabled && (
        <div className={s.warningCard}>
          <div className={s.warningHeader}>
            <ExclamationTriangleIcon className={s.warningIcon} />
            <span className={s.warningTitle}>Warning: Protection Disabled</span>
          </div>
          <div className={s.warningContent}>
            <p className={s.warningText}>
              UTXO protection is currently disabled. This means your transactions may 
              accidentally spend UTXOs containing valuable junkscriptions or Junk-20 tokens.
            </p>
            <p className={s.warningText}>
              <strong>Risk:</strong> You could permanently lose access to your digital assets 
              by sending them as transaction fees or to unintended recipients.
            </p>
            <p className={s.warningText}>
              <strong>Recommendation:</strong> Keep this setting enabled unless you are an 
              advanced user who needs to spend specific UTXOs containing assets.
            </p>
          </div>
        </div>
      )}

      <div className={s.infoCard}>
        <h3 className={s.infoTitle}>How UTXO Protection Works</h3>
        <ul className={s.infoList}>
          <li className={s.infoItem}>
            <strong>Safe UTXOs:</strong> Regular JKC UTXOs without any inscriptions or tokens
          </li>
          <li className={s.infoItem}>
            <strong>Protected UTXOs:</strong> UTXOs containing junkscriptions or Junk-20 tokens
          </li>
          <li className={s.infoItem}>
            <strong>Balance Display:</strong> Shows both safe balance and total balance
          </li>
          <li className={s.infoItem}>
            <strong>Transaction Building:</strong> Uses only safe UTXOs when protection is enabled
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UTXOProtectionSettings;
