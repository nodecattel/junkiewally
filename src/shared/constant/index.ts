/* eslint-disable quotes */

/* constants pool */
import { AddressType, Chain, NetworkType, RestoreWalletType } from '../types';

export enum CHAINS_ENUM {
  BTC = 'BTC'
}

export const CHAINS: Record<string, Chain> = {
  [CHAINS_ENUM.BTC]: {
    name: 'BTC',
    enum: CHAINS_ENUM.BTC,
    logo: '',
    network: 'mainnet'
  }
};

export const KEYRING_TYPE = {
  HdKeyring: 'HD Key Tree',
  SimpleKeyring: 'Simple Key Pair',
  WatchAddressKeyring: 'Watch Address',
  WalletConnectKeyring: 'WalletConnect',
  Empty: 'Empty'
};

export const KEYRING_CLASS = {
  PRIVATE_KEY: 'Simple Key Pair',
  MNEMONIC: 'HD Key Tree'
};

export const KEYRING_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Created by Mnemonic',
  [KEYRING_TYPE.SimpleKeyring]: 'Imported by Private Key',
  [KEYRING_TYPE.WatchAddressKeyring]: 'Watch Mode'
};
export const BRAND_ALIAN_TYPE_TEXT = {
  [KEYRING_TYPE.HdKeyring]: 'Account',
  [KEYRING_TYPE.SimpleKeyring]: 'Private Key',
  [KEYRING_TYPE.WatchAddressKeyring]: 'Watch'
};

export const KEYRING_TYPES: {
  [key: string]: {
    name: string;
    tag: string;
    alianName: string;
  };
} = {
  'HD Key Tree': {
    name: 'HD Key Tree',
    tag: 'HD',
    alianName: 'HD Wallet'
  },
  'Simple Key Pair': {
    name: 'Simple Key Pair',
    tag: 'IMPORT',
    alianName: 'Single Wallet'
  }
};

export const IS_CHROME = /Chrome\//i.test(navigator.userAgent);

export const IS_FIREFOX = /Firefox\//i.test(navigator.userAgent);

export const IS_LINUX = /linux/i.test(navigator.userAgent);

let chromeVersion: number | null = null;

if (IS_CHROME) {
  const matches = navigator.userAgent.match(/Chrome\/(\d+[^.\s])/);
  if (matches && matches.length >= 2) {
    chromeVersion = Number(matches[1]);
  }
}

export const IS_AFTER_CHROME91 = IS_CHROME ? chromeVersion && chromeVersion >= 91 : false;

export const GAS_LEVEL_TEXT = {
  slow: 'Standard',
  normal: 'Fast',
  fast: 'Instant',
  custom: 'Custom'
};

export const IS_WINDOWS = /windows/i.test(navigator.userAgent);

export const LANGS = [
  {
    value: 'en',
    label: 'English'
  },
  {
    value: 'zh_CN',
    label: 'Chinese'
  },
  {
    value: 'ja',
    label: 'Japanese'
  },
  {
    value: 'es',
    label: 'Spanish'
  }
];


// Update address types with coinType 3 for Junkcoin
export const ADDRESS_TYPES: {
  value: AddressType;
  label: string;
  name: string;
  hdPath: string;
  displayIndex: number;
  isUnisatLegacy?: boolean;
}[] = [
  {
    value: AddressType.P2PKH,
    label: 'P2PKH',
    name: 'Legacy (P2PKH)',
    hdPath: "m/44'/3'/0'/0",  // Changed to coinType 3
    displayIndex: 3,
    isUnisatLegacy: false
  }
 // {
 //   value: AddressType.P2WPKH,
 //   label: 'P2WPKH',
 //   name: 'Native Segwit (P2WPKH)',
 //   hdPath: "m/84'/3'/0'/0",  // Changed to coinType 3
 //   displayIndex: 0,
 //   isUnisatLegacy: false
 // },
 // {
 //   value: AddressType.P2TR,
 //   label: 'P2TR',
 //   name: 'Taproot (P2TR)',
 //   hdPath: "m/86'/3'/0'/0",  // Changed to coinType 3
 //   displayIndex: 2,
 //   isUnisatLegacy: false
 // },
 // {
 //   value: AddressType.P2SH_P2WPKH,
 //   label: 'P2SH-P2WPKH',
 //   name: 'Nested Segwit (P2SH-P2WPKH)',
 //   hdPath: "m/49'/3'/0'/0",  // Changed to coinType 3
 //   displayIndex: 1,
 //   isUnisatLegacy: false
 // },
 //{
 //   value: AddressType.M44_P2WPKH,
 //   label: 'P2WPKH',
 //   name: 'Native SegWit (P2WPKH)', 
 //   hdPath: "m/44'/3'/0'/0",  // Changed to coinType 3
 //   displayIndex: 4,
 //   isUnisatLegacy: true
 // },
 // {
 //   value: AddressType.M44_P2TR,
 //   label: 'P2TR',
 //   name: 'Taproot (P2TR)',
 //   hdPath: "m/44'/3'/0'/0",  // Changed to coinType 3
 //   displayIndex: 5,
 //   isUnisatLegacy: true
 // }
];

export const RESTORE_WALLETS = [
  {
    value: RestoreWalletType.UNISAT,
    name: 'JunkieWally',  // Update wallet name
    addressTypes: [
    //  AddressType.P2WPKH,
    //  AddressType.P2SH_P2WPKH,
    //  AddressType.P2TR,
      AddressType.P2PKH
    //  AddressType.M44_P2WPKH,
    //  AddressType.M44_P2TR
    ]
  }
];

export const NETWORK_TYPES = [
  { value: NetworkType.MAINNET, label: 'LIVENET', name: 'livenet', validNames: [0, 'livenet', 'mainnet'] },
  { value: NetworkType.TESTNET, label: 'TESTNET', name: 'testnet', validNames: ['testnet'] }
];

export const MINIMUM_GAS_LIMIT = 21000;

export enum WATCH_ADDRESS_CONNECT_TYPE {
  WalletConnect = 'WalletConnect'
}

export const WALLETCONNECT_STATUS_MAP = {
  PENDING: 1,
  CONNECTED: 2,
  WAITING: 3,
  SIBMITTED: 4,
  REJECTED: 5,
  FAILD: 6
};

export const INTERNAL_REQUEST_ORIGIN = 'https://junkiewally.xyz';

export const INTERNAL_REQUEST_SESSION = {
  name: 'JunkieWally',
  origin: INTERNAL_REQUEST_ORIGIN,
  icon: './images/logo/logo@128x.png'
};

export const OPENAPI_URL_MAINNET = 'https://api.junkiewally.xyz';
export const OPENAPI_URL_TESTNET = 'https://testnet-api.junkiewally.xyz';

export const EVENTS = {
  broadcastToUI: 'broadcastToUI',
  broadcastToBackground: 'broadcastToBackground',
  SIGN_FINISHED: 'SIGN_FINISHED',
  WALLETCONNECT: {
    STATUS_CHANGED: 'WALLETCONNECT_STATUS_CHANGED',
    INIT: 'WALLETCONNECT_INIT',
    INITED: 'WALLETCONNECT_INITED'
  }
};

export const SORT_WEIGHT = {
  [KEYRING_TYPE.HdKeyring]: 1,
  [KEYRING_TYPE.SimpleKeyring]: 2,
  [KEYRING_TYPE.WalletConnectKeyring]: 4,
  [KEYRING_TYPE.WatchAddressKeyring]: 5
};

export const GASPRICE_RANGE = {
  [CHAINS_ENUM.BTC]: [0, 10000]
};

export const COIN_NAME = 'BTC';
export const COIN_SYMBOL = 'BTC';

export const COIN_DUST = 1000;

export const TO_LOCALE_STRING_CONFIG = {
  minimumFractionDigits: 8
};

export const SUPPORTED_DOMAINS = ['sats', 'unisat', 'x', 'btc'];
export const SAFE_DOMAIN_CONFIRMATION = 3;

export const SATS_DOMAIN = '.jkc';
export const UNISAT_DOMAIN = '.junkie';

export const GITHUB_URL = 'https://github.com/nodecattel/junkiewally';
export const DISCORD_URL = '';
export const TWITTER_URL = 'https://twitter.com/junkiewally';

export const CHANNEL = process.env.channel!;
export const VERSION = process.env.release!;
export const MANIFEST_VERSION = process.env.manifest!;

export enum AddressFlagType {
  Is_Enable_Atomicals = 0b1
}

// Network ports (from chainparamsbase.cpp)
export const RPC_PORT_MAINNET = 9771;
export const RPC_PORT_TESTNET = 29919;

// Amount constants (from amount.h)
export const COIN = 100000000; // 1 JKC = 100000000 satoshis
export const CENT = 1000000;   // 0.01 JKC
export const MAX_MONEY = 54000000 * COIN;

// Fee constants
export const MIN_TX_FEE = 0.10000000;
export const MIN_RELAY_TX_FEE = 0.10000000;
