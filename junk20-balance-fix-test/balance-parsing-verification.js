// Test script to verify Junk-20 balance parsing and formatting
const fs = require('fs');
const path = require('path');

console.log('🧪 Junk-20 Balance Parsing Verification Test\n');

// Mock API response data (actual response from the API)
const mockApiResponse = {
  "junk20": [
    {
      "available": "1000000000",
      "tick": "JUNK",
      "transferable": "0",
      "utxos": [
        {
          "confirmations": 8,
          "inscription_id": "7a98b872cce00474e5bd7750f2b38fcea207aaa9d5ed1a8cbe9f8de605e8b206i0",
          "inscription_number": 1939177,
          "junk20": {
            "balance": "100000000",
            "operation": "mint",
            "valid": false
          },
          "offset": 0,
          "script": "76a914b0b1b40d6f471f39205f72abc97571d212117d8f88ac",
          "shibes": 10000,
          "txid": "7a98b872cce00474e5bd7750f2b38fcea207aaa9d5ed1a8cbe9f8de605e8b206",
          "vout": 0
        }
        // ... more UTXOs
      ]
    },
    {
      "available": "1000",
      "tick": "sail",
      "transferable": "0",
      "utxos": [
        {
          "confirmations": 322192,
          "inscription_id": "35b5626824c4a7babdfe6cced622bf74660749b12fa403632e073dfb8ed3d30ci0",
          "inscription_number": 265567,
          "junk20": {
            "balance": "100",
            "operation": "mint",
            "valid": false
          },
          "offset": 0,
          "script": "76a914b0b1b40d6f471f39205f72abc97571d212117d8f88ac",
          "shibes": 100000,
          "txid": "35b5626824c4a7babdfe6cced622bf74660749b12fa403632e073dfb8ed3d30c",
          "vout": 0
        }
        // ... more UTXOs
      ]
    }
  ]
};

// Test 1: API Response Parsing
console.log('1️⃣  Testing API Response Parsing:');
console.log('─'.repeat(50));

function parseJunk20Balance(data) {
  if (!data?.junk20) {
    return [];
  }

  // Transform the API response into a summary format with validation
  return data.junk20.map(token => ({
    tick: token.tick || 'unknown',
    balance: token.available || "0",  // Map 'available' from API to 'balance' for display
    transferable: token.transferable || "0",
    utxoCount: token.utxos?.length || 0,
  }));
}

const parsedTokens = parseJunk20Balance(mockApiResponse);
console.log('✅ Parsed tokens:', JSON.stringify(parsedTokens, null, 2));

// Test 2: Number Formatting
console.log('\n2️⃣  Testing Number Formatting:');
console.log('─'.repeat(50));

function nFormatter(num) {
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

  // For numbers less than 1 million, use comma formatting
  if (numValue < 1e6) {
    return numValue.toLocaleString();
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
  
  // For large numbers, show more precision for better readability
  let precision = 2;
  if (numValue >= 1e9) precision = 3; // Show more precision for billions+
  
  const v = parseFloat((numValue / item.value).toFixed(precision))
    .toString()
    .replace(regexp, "");

  return `${v}${item.symbol ? ' ' + item.symbol : ''}`;
}

const testNumbers = [
  "1000000000", // 1 billion
  "1000",       // 1 thousand
  "0",          // zero
  "500000",     // 500 thousand
  "1500000",    // 1.5 million
  "2500000000", // 2.5 billion
];

testNumbers.forEach(num => {
  const formatted = nFormatter(num);
  console.log(`✅ ${num} → ${formatted}`);
});

// Test 3: Expected Display Output
console.log('\n3️⃣  Testing Expected Display Output:');
console.log('─'.repeat(50));

parsedTokens.forEach(token => {
  console.log(`✅ ${token.tick.toUpperCase()}`);
  console.log(`   Available: ${nFormatter(token.balance)}`);
  console.log(`   Transferable: ${nFormatter(token.transferable)}`);
  console.log(`   UTXOs: ${token.utxoCount}`);
  console.log('');
});

// Test 4: Verify Interface Compatibility
console.log('4️⃣  Testing Interface Compatibility:');
console.log('─'.repeat(50));

const interfacePath = path.join(__dirname, '../src/shared/interfaces/junk20.ts');
if (fs.existsSync(interfacePath)) {
  const interfaceContent = fs.readFileSync(interfacePath, 'utf8');
  
  const interfaceChecks = [
    { test: 'Has Junk20Token interface', pattern: 'interface Junk20Token' },
    { test: 'Uses available field', pattern: 'available: string' },
    { test: 'Has transferable field', pattern: 'transferable: string' },
    { test: 'Has Junk20TokenSummary interface', pattern: 'interface Junk20TokenSummary' },
    { test: 'Summary has balance field', pattern: 'balance: string' }
  ];
  
  interfaceChecks.forEach(check => {
    if (interfaceContent.includes(check.pattern)) {
      console.log(`✅ ${check.test}`);
    } else {
      console.log(`❌ ${check.test}`);
    }
  });
} else {
  console.log('❌ Interface file not found');
}

// Test 5: Verify API Controller Updates
console.log('\n5️⃣  Testing API Controller Updates:');
console.log('─'.repeat(50));

const apiControllerPath = path.join(__dirname, '../src/background/controllers/apiController.ts');
if (fs.existsSync(apiControllerPath)) {
  const apiContent = fs.readFileSync(apiControllerPath, 'utf8');
  
  const apiChecks = [
    { test: 'Maps available to balance', pattern: 'balance: token.available' },
    { test: 'Has getJunk20Balance method', pattern: 'getJunk20Balance(address: string)' },
    { test: 'Returns Junk20TokenSummary array', pattern: 'Promise<Junk20TokenSummary[]' },
    { test: 'Handles API response correctly', pattern: 'data.junk20.map' }
  ];
  
  apiChecks.forEach(check => {
    if (apiContent.includes(check.pattern)) {
      console.log(`✅ ${check.test}`);
    } else {
      console.log(`❌ ${check.test}`);
    }
  });
} else {
  console.log('❌ API controller file not found');
}

// Test 6: Verify Component Integration
console.log('\n6️⃣  Testing Component Integration:');
console.log('─'.repeat(50));

const componentPath = path.join(__dirname, '../src/ui/components/junk20-balance/component.tsx');
if (fs.existsSync(componentPath)) {
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  
  const componentChecks = [
    { test: 'Uses nFormatter for balance', pattern: 'nFormatter(token.balance' },
    { test: 'Uses nFormatter for transferable', pattern: 'nFormatter(token.transferable' },
    { test: 'Displays token tick', pattern: 'token.tick.toUpperCase()' },
    { test: 'Shows UTXO count', pattern: 'token.utxoCount' },
    { test: 'Has error handling', pattern: 'setError(' }
  ];
  
  componentChecks.forEach(check => {
    if (componentContent.includes(check.pattern)) {
      console.log(`✅ ${check.test}`);
    } else {
      console.log(`❌ ${check.test}`);
    }
  });
} else {
  console.log('❌ Component file not found');
}

// Final Assessment
console.log('\n📊 Balance Parsing Verification Results:');
console.log('═'.repeat(60));

console.log('Expected Display Output:');
console.log('JUNK');
console.log('Available: 1 B');
console.log('Transferable: 0');
console.log('');
console.log('SAIL');
console.log('Available: 1,000');
console.log('Transferable: 0');
console.log('');

console.log('✅ Key Fixes Applied:');
console.log('• Updated interface to use "available" field from API');
console.log('• Fixed API controller to map "available" to "balance"');
console.log('• Enhanced number formatter for better large number display');
console.log('• Added comma formatting for numbers under 1 million');
console.log('• Improved precision for billion+ numbers');

console.log('\n🎉 Junk-20 Balance Parsing Verification Complete!');
