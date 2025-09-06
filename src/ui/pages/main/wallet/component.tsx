import s from "./styles.module.scss";
import { TailSpin } from "react-loading-icons";
import TransactionList from "./transactions-list";
import WalletPanel from "./wallet-panel";
import AccountPanel from "./account-panel";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { useBodyClass } from "../../../utils/useBodyClass";
import { useSplashManager } from "../../../utils/splashManager";

const Wallet = () => {
  const currentAccount = useGetCurrentAccount();

  const splashClass = useSplashManager(false); // false = don't change on mount, use timer
  useBodyClass(splashClass);

  if (!currentAccount) return <TailSpin className="animate-spin" />;

  return (
    <div className={s.walletDiv}>
      <WalletPanel />
      <AccountPanel />

      <TransactionList />
    </div>
  );
};

export default Wallet;
