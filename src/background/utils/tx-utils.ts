/* eslint-disable indent */
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { AddressType, NetworkType } from '@/shared/types';

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

const JUNKCOIN = {
  messagePrefix: '\x19Junkcoin Signed Message:\n',
  bech32: 'jkc',
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4
  },
  pubKeyHash: 0x10,
  scriptHash: 0x05,
  wif: 0x90
};

const JUNKCOIN_TESTNET = {
  messagePrefix: '\x19Junkcoin Signed Message:\n',
  bech32: 'tjkc',
  bip32: {
    public: 0x02fafd,
    private: 0x02fc98
  },
  pubKeyHash: 0x10,
  scriptHash: 0x05,
  wif: 0x96
};

export const validator = (pubkey: Buffer, msghash: Buffer, signature: Buffer): boolean =>
  ECPair.fromPublicKey(pubkey).verify(msghash, signature);

export function toPsbtNetwork(networkType: NetworkType) {
  if (networkType === NetworkType.MAINNET) {
    return JUNKCOIN;
  } else {
    return JUNKCOIN_TESTNET;
  }
}

export function publicKeyToAddress(publicKey: string, type: AddressType, networkType: NetworkType) {
  const network = toPsbtNetwork(networkType);
  if (!publicKey) return '';
  const pubkey = Buffer.from(publicKey, 'hex');

  if (type === AddressType.P2PKH) {
    const { address } = bitcoin.payments.p2pkh({
      pubkey,
      network
    });
    return address || '';
  } else if (type === AddressType.P2WPKH || type === AddressType.M44_P2WPKH) {
    const { address } = bitcoin.payments.p2wpkh({
      pubkey,
      network
    });
    return address || '';
  } else if (type === AddressType.P2TR || type === AddressType.M44_P2TR) {
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: pubkey.slice(1, 33),
      network
    });
    return address || '';
  } else if (type === AddressType.P2SH_P2WPKH) {
    const data = bitcoin.payments.p2wpkh({
      pubkey,
      network
    });
    const { address } = bitcoin.payments.p2sh({
      pubkey,
      network,
      redeem: data
    });
    return address || '';
  } else {
    return '';
  }
}

export function isValidAddress(address: string, network: bitcoin.Network) {
  let error;
  try {
    bitcoin.address.toOutputScript(address, network);
  } catch (e) {
    error = e;
  }
  if (error) {
    return false;
  } else {
    return true;
  }
}
