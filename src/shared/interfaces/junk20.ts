// Junk-20 token interfaces
export interface Junk20UTXO {
  inscription_id: string;
  inscription_number: number;
  junk20: {
    balance: string;
    operation: string;
  };
}

export interface Junk20Token {
  tick: string;
  available: string;  // API uses 'available' not 'balance' - this is the actual field from API response
  transferable: string;
  utxos: Junk20UTXO[];
}

export interface Junk20BalanceResponse {
  junk20?: Junk20Token[];
}

export interface Junk20TokenSummary {
  tick: string;
  balance: string;
  transferable: string;
  utxoCount: number;
}
