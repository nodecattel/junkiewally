// Importing the necessary modules
const { networks } = require('junkcoinjs-lib');
const { ECPairFactory } = require('junkcoinpair');
const ecc = require('tiny-secp256k1');

// Create an instance of ECPairAPI
const ECPair = ECPairFactory(ecc);

// Replace this with a valid WIF starting with 'N' for Junkcoin Core
const wif = 'NNMdn7U19SX691d8Cv8Gn9Wu98GU94vUwMNowA9myYHyYnZN99HY';  // Put your valid WIF private key here

try {
  // Decoding the WIF key
  const keyPair = ECPair.fromWIF(wif, networks.junkcoin);
  const privateKey = keyPair.privateKey;
  const publicKey = keyPair.publicKey;

  console.log("Private Key (Hex): ", privateKey.toString('hex'));
  console.log("Public Key (Hex): ", publicKey.toString('hex'));

} catch (error) {
  console.error("Failed to decode WIF:", error);
}
