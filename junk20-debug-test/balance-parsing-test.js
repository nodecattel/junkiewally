// Test to debug Junk-20 balance parsing issues
console.log('🔍 Debugging Junk-20 Balance Parsing...\n');

// Mock API response based on the user's description
const mockApiResponse = {
  junk20: [
    {
      tick: "sail",
      balance: "1000",      // Available balance
      transferable: "0",    // Transferable balance
      utxos: [
        {
          inscription_id: "d9eacb72fb55f8de699867331c62fcaf00b0710319fce28c700cfdc5f7cacdbai0",
          inscription_number: 12345,
          junk20: {
            balance: "100",   // Individual UTXO balance
            operation: "transfer"
          }
        },
        {
          inscription_id: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890i0",
          inscription_number: 12346,
          junk20: {
            balance: "100",   // Individual UTXO balance
            operation: "transfer"
          }
        }
        // ... more UTXOs with individual balances of "100" each
      ]
    }
  ]
};

// Test the nFormatter function
function nFormatter(num) {
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
    lookup.find((item) => Number(num) >= item.value) ??
    lookup[lookup.length - 1];
  const v = parseFloat((Number(num) / item.value).toFixed(8))
    .toString()
    .replace(regexp, "");

  return `${v} ${item.symbol}`;
}

// Test different input scenarios
console.log('📊 Testing nFormatter with different inputs:');
console.log(`nFormatter("1000"): "${nFormatter("1000")}"`);
console.log(`nFormatter("0"): "${nFormatter("0")}"`);
console.log(`nFormatter(1000): "${nFormatter(1000)}"`);
console.log(`nFormatter(0): "${nFormatter(0)}"`);
console.log(`nFormatter(""): "${nFormatter("")}"`);
console.log(`nFormatter(null): "${nFormatter(null)}"`);
console.log(`nFormatter(undefined): "${nFormatter(undefined)}"`);

// Test the API response transformation
console.log('\n🔄 Testing API Response Transformation:');

function transformApiResponse(data) {
  if (!data?.junk20) {
    return [];
  }

  return data.junk20.map(token => ({
    tick: token.tick,
    balance: token.balance,
    transferable: token.transferable,
    utxoCount: token.utxos.length,
  }));
}

const transformedTokens = transformApiResponse(mockApiResponse);
console.log('Transformed tokens:', JSON.stringify(transformedTokens, null, 2));

// Test the component rendering logic
console.log('\n🎨 Testing Component Rendering Logic:');

transformedTokens.forEach((token, index) => {
  console.log(`\nToken ${index + 1}: ${token.tick.toUpperCase()}`);
  console.log(`  Raw balance: "${token.balance}"`);
  console.log(`  Raw transferable: "${token.transferable}"`);
  console.log(`  Formatted balance: "${nFormatter(token.balance)}"`);
  console.log(`  Formatted transferable: "${nFormatter(token.transferable)}"`);
  console.log(`  UTXO count: ${token.utxoCount}`);
  
  // Check for NaN issues
  const balanceNum = Number(token.balance);
  const transferableNum = Number(token.transferable);
  
  console.log(`  Balance as number: ${balanceNum} (isNaN: ${isNaN(balanceNum)})`);
  console.log(`  Transferable as number: ${transferableNum} (isNaN: ${isNaN(transferableNum)})`);
});

// Test edge cases that might cause NaN
console.log('\n⚠️  Testing Edge Cases:');

const edgeCases = [
  { balance: "", transferable: "0" },
  { balance: null, transferable: "0" },
  { balance: undefined, transferable: "0" },
  { balance: "invalid", transferable: "0" },
  { balance: "1000", transferable: "" },
  { balance: "1000", transferable: null },
  { balance: "1000", transferable: undefined },
];

edgeCases.forEach((testCase, index) => {
  console.log(`\nEdge case ${index + 1}:`);
  console.log(`  Input: balance="${testCase.balance}", transferable="${testCase.transferable}"`);
  console.log(`  Formatted balance: "${nFormatter(testCase.balance)}"`);
  console.log(`  Formatted transferable: "${nFormatter(testCase.transferable)}"`);
});

// Proposed fix: Enhanced nFormatter with better validation
function enhancedNFormatter(num) {
  // Handle null, undefined, or empty string
  if (num === null || num === undefined || num === '') {
    return '0';
  }
  
  // Convert to number and check if valid
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

console.log('\n✅ Testing Enhanced nFormatter:');
edgeCases.forEach((testCase, index) => {
  console.log(`\nEdge case ${index + 1} with enhanced formatter:`);
  console.log(`  Input: balance="${testCase.balance}", transferable="${testCase.transferable}"`);
  console.log(`  Enhanced balance: "${enhancedNFormatter(testCase.balance)}"`);
  console.log(`  Enhanced transferable: "${enhancedNFormatter(testCase.transferable)}"`);
});

console.log('\n🎯 Recommendations:');
console.log('1. Add validation to handle null/undefined/empty values in nFormatter');
console.log('2. Ensure API response always provides valid string numbers');
console.log('3. Add fallback values in the component for missing data');
console.log('4. Consider displaying "Available" and "Transferable" labels clearly');
console.log('5. Add error boundaries for graceful handling of parsing issues');
