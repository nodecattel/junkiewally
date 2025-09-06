// Demonstration of improved Junk-20 balance display
console.log('🎨 JunkieWally Improved Junk-20 Balance Display Demo\n');

// Enhanced nFormatter function (now implemented in the wallet)
function nFormatter(num) {
  if (num === null || num === undefined || num === '') {
    return '0';
  }
  
  const numValue = Number(num);
  if (isNaN(numValue)) {
    console.warn(`Invalid number input to nFormatter: "${num}"`);
    return '0';
  }
  
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
  ];
  lookup.reverse();
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
  const item =
    lookup.find((item) => numValue >= item.value) ??
    lookup[lookup.length - 1];
  const v = parseFloat((numValue / item.value).toFixed(8))
    .toString()
    .replace(regexp, "");

  return `${v}${item.symbol ? ' ' + item.symbol : ''}`;
}

// Mock realistic API response
const mockApiResponse = {
  junk20: [
    {
      tick: "sail",
      balance: "1000",      // Total available balance
      transferable: "0",    // Amount ready for transfer (not in junkscriptions)
      utxos: [
        {
          inscription_id: "d9eacb72fb55f8de699867331c62fcaf00b0710319fce28c700cfdc5f7cacdbai0",
          inscription_number: 12345,
          junk20: { balance: "100", operation: "transfer" }
        },
        {
          inscription_id: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890i0", 
          inscription_number: 12346,
          junk20: { balance: "100", operation: "transfer" }
        },
        {
          inscription_id: "f9e8d7c6b5a4930281746352819047362817463528190473628174635281904736i0",
          inscription_number: 12347,
          junk20: { balance: "800", operation: "mint" }
        }
      ]
    },
    {
      tick: "test",
      balance: "50000",
      transferable: "25000",
      utxos: [
        {
          inscription_id: "test123456789012345678901234567890123456789012345678901234567890i0",
          inscription_number: 20001,
          junk20: { balance: "25000", operation: "transfer" }
        },
        {
          inscription_id: "test987654321098765432109876543210987654321098765432109876543210i0",
          inscription_number: 20002,
          junk20: { balance: "25000", operation: "transfer" }
        }
      ]
    }
  ]
};

// Transform API response (as done in the wallet)
function transformApiResponse(data) {
  if (!data?.junk20) {
    return [];
  }

  return data.junk20.map(token => ({
    tick: token.tick || 'unknown',
    balance: token.balance || "0",
    transferable: token.transferable || "0",
    utxoCount: token.utxos?.length || 0,
  }));
}

const tokens = transformApiResponse(mockApiResponse);

console.log('📱 Wallet Interface Display Simulation:');
console.log('═'.repeat(60));

// Simulate the header display
console.log('┌────────────────────────────────────────────────────────┐');
console.log('│ 🪙 Junk-20 Tokens                    2 tokens        ▼ │');
console.log('├────────────────────────────────────────────────────────┤');

// Simulate expanded view
tokens.forEach((token, index) => {
  console.log(`│                                                        │`);
  console.log(`│ ${token.tick.toUpperCase().padEnd(8)} ${' '.repeat(36)} ${token.utxoCount} UTXO${token.utxoCount !== 1 ? 's' : ' '} │`);
  console.log(`│   Available:    ${nFormatter(token.balance || "0").padEnd(20)} │`);
  console.log(`│   Transferable: ${nFormatter(token.transferable || "0").padEnd(20)} │`);
  
  if (index < tokens.length - 1) {
    console.log('│                                                        │');
    console.log('├────────────────────────────────────────────────────────┤');
  }
});

console.log('│                                                        │');
console.log('└────────────────────────────────────────────────────────┘');

console.log('\n📊 Before vs After Comparison:');
console.log('═'.repeat(60));

console.log('\n❌ BEFORE (with NaN issue):');
console.log('┌─────────────────────────────┐');
console.log('│ SAIL                        │');
console.log('│   Balance: NaN              │');  // This was the problem
console.log('│   Transferable: NaN         │');  // This was the problem
console.log('└─────────────────────────────┘');

console.log('\n✅ AFTER (fixed):');
console.log('┌─────────────────────────────┐');
console.log('│ SAIL                        │');
console.log('│   Available: 1000           │');  // Clear and correct
console.log('│   Transferable: 0           │');  // Clear and correct
console.log('└─────────────────────────────┘');

console.log('\n🔍 Key Improvements Made:');
console.log('• Fixed nFormatter to handle null/undefined values → returns "0" instead of "NaN"');
console.log('• Changed "Balance" label to "Available" for clarity');
console.log('• Always show both Available and Transferable amounts');
console.log('• Added fallback values (|| "0") throughout the component');
console.log('• Enhanced API response validation with default values');
console.log('• Improved error handling and logging');

console.log('\n💡 Understanding the Balance Types:');
console.log('┌─────────────────────────────────────────────────────────────┐');
console.log('│ Available:    Total token balance in the wallet             │');
console.log('│ Transferable: Amount not locked in junkscriptions/NFTs      │');
console.log('│                                                             │');
console.log('│ Example: SAIL token                                         │');
console.log('│ • Available: 1000 (total tokens owned)                     │');
console.log('│ • Transferable: 0 (all tokens are in junkscriptions)       │');
console.log('│                                                             │');
console.log('│ This means the user owns 1000 SAIL tokens, but they are    │');
console.log('│ all inscribed as junkscriptions and protected from         │');
console.log('│ accidental spending by the UTXO protection system.         │');
console.log('└─────────────────────────────────────────────────────────────┘');

console.log('\n🛡️  Integration with UTXO Protection:');
console.log('• Tokens in junkscriptions are automatically protected');
console.log('• Only transferable amounts can be spent in transactions');
console.log('• Users see clear warnings when trying to spend protected tokens');
console.log('• Balance display helps users understand their token liquidity');

console.log('\n✅ Junk-20 Balance Display Demo Complete!');
console.log('The wallet now provides clear, accurate token balance information!');
