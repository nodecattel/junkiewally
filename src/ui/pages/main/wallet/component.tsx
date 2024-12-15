import s from "./styles.module.scss";
import { TailSpin } from "react-loading-icons";
import TransactionList from "./transactions-list";
import WalletPanel from "./wallet-panel";
import AccountPanel from "./account-panel";
import { useGetCurrentAccount } from "@/ui/states/walletState";
import { useBodyClass } from "../../../utils/useBodyClass";

const Wallet = () => {
  const currentAccount = useGetCurrentAccount();

  const randomClass = ["splash-1", "splash-2", "splash-3"][
    Math.floor(Math.random() * 3)
  ];
  useBodyClass(randomClass);

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
