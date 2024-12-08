import { Network } from "junkcoinjs-lib";

export interface IAppStateBase {
  isReady: boolean;
  isUnlocked: boolean;
  password?: string;
  addressBook: string[];
  pendingWallet?: string;
  language: string;
  network: Network;
}
