import { Network, networks } from "junkcoinjs-lib";
import { AddressType } from "bellhdw/src/hd/types";

export const KEYRING_TYPE = {
  HdKeyring: "HD Key Tree",
  SimpleKeyring: "Simple Key Pair",
  Empty: "Empty",
};

export const IS_CHROME = /Chrome\//i.test(navigator.userAgent);

export const IS_LINUX = /linux/i.test(navigator.userAgent);

export const IS_WINDOWS = /windows/i.test(navigator.userAgent);

export const ADDRESS_TYPES: {
  value: AddressType;
  label: string;
  name: string;
  hdPath: string;
}[] = [
  {
    value: AddressType.P2PKH,
    label: "P2PKH",
    name: "Legacy (P2PKH)",
    hdPath: "m/44'/0'/0'/0",
  },
];
export const DEFAULT_HD_PATH = ADDRESS_TYPES[0].hdPath;
export const DEFAULT_TYPE = ADDRESS_TYPES[0].value;

export const EVENTS = {
  broadcastToUI: "broadcastToUI",
  broadcastToBackground: "broadcastToBackground",
  SIGN_FINISHED: "SIGN_FINISHED",
  WALLETCONNECT: {
    STATUS_CHANGED: "WALLETCONNECT_STATUS_CHANGED",
    INIT: "WALLETCONNECT_INIT",
    INITED: "WALLETCONNECT_INITED",
  },
};

export const JUNKCOIN_URL = "https://jukiewally.xyz";
export const API_URL = "https://api.junkiewally.xyz";
export const EXPLORER_URL = "https://junkpool.blockraid.io"
export const SPLITTER_URL = JUNKCOIN_URL + "/belinals/splitter";

const CONTENT_URL =
  process.env.CONTENT_URL ?? "https://content.nintondo.io/api/pub";
export const getContentUrl = () => CONTENT_URL;

const HISTORY_URL =
  process.env.HISTORY_URL ?? "https://history.nintondo.io/pub";
export const getHistoryUrl = () => HISTORY_URL;

export const DEFAULT_FEES = {
  fast: 2,
  slow: 1,
};

export const DEFAULT_SERVICE_FEE = 1_000_000;