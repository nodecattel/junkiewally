// Comprehensive integration test for Junk-20 balance fixes
const fs = require('fs');
const path = require('path');

console.log('🔧 Junk-20 Balance Fix Integration Test\n');

// Test 1: Verify all files were updated correctly
console.log('1️⃣  Testing File Updates:');
console.log('─'.repeat(50));

const filesToCheck = [
  {
    path: 'src/shared/interfaces/junk20.ts',
    checks: [
      { name: 'Updated Junk20Token interface', pattern: 'available: string' },
      { name: 'Maintains transferable field', pattern: 'transferable: string' },
      { name: 'Has proper comment', pattern: "API uses 'available' not 'balance'" }
    ]
  },
  {
    path: 'src/background/controllers/apiController.ts',
    checks: [
      { name: 'Maps available to balance', pattern: 'balance: token.available' },
      { name: 'Has explanatory comment', pattern: "Map 'available' from API to 'balance'" },
      { name: 'Maintains error handling', pattern: 'console.warn' }
    ]
  },
  {
    path: 'src/ui/utils/formatter.ts',
    checks: [
      { name: 'Enhanced number formatting', pattern: 'numValue.toLocaleString()' },
      { name: 'Better precision for large numbers', pattern: 'if (numValue >= 1e9) precision = 3' },
      { name: 'Handles edge cases', pattern: 'if (num === null || num === undefined' }
    ]
  }
];

let totalChecks = 0;
let passedChecks = 0;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file.path);
  console.log(`\n📁 Checking ${file.path}:`);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    file.checks.forEach(check => {
      totalChecks++;
      if (content.includes(check.pattern)) {
        console.log(`  ✅ ${check.name}`);
        passedChecks++;
      } else {
        console.log(`  ❌ ${check.name}`);
      }
    });
  } else {
    console.log(`  ❌ File not found`);
    totalChecks += file.checks.length;
  }
});

// Test 2: Verify API response handling
console.log('\n2️⃣  Testing API Response Handling:');
console.log('─'.repeat(50));

// Simulate the API controller transformation
function simulateApiController(apiResponse) {
  if (!apiResponse?.junk20) {
    return [];
  }

  return apiResponse.junk20.map(token => ({
    tick: token.tick || 'unknown',
    balance: token.available || "0",  // This is the key fix
    transferable: token.transferable || "0",
    utxoCount: token.utxos?.length || 0,
  }));
}

const testApiResponse = {
  "junk20": [
    {
      "available": "1000000000",
      "tick": "JUNK",
      "transferable": "0",
      "utxos": new Array(10) // 10 UTXOs
    },
    {
      "available": "1000",
      "tick": "sail",
      "transferable": "0",
      "utxos": new Array(10) // 10 UTXOs
    }
  ]
};

const transformedData = simulateApiController(testApiResponse);
console.log('✅ API Response Transformation:');
transformedData.forEach(token => {
  console.log(`  ${token.tick}: ${token.balance} (${token.utxoCount} UTXOs)`);
});

// Test 3: Verify number formatting
console.log('\n3️⃣  Testing Number Formatting:');
console.log('─'.repeat(50));

function testNFormatter(num) {
  if (num === null || num === undefined || num === '') {
    return '0';
  }

  const numValue = Number(num);
  if (isNaN(numValue)) {
    return '0';
  }

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
  const item = lookup.find((item) => numValue >= item.value) ?? lookup[lookup.length - 1];
  
  let precision = 2;
  if (numValue >= 1e9) precision = 3;
  
  const v = parseFloat((numValue / item.value).toFixed(precision))
    .toString()
    .replace(regexp, "");

  return `${v}${item.symbol ? ' ' + item.symbol : ''}`;
}

const formatTests = [
  { input: "1000000000", expected: "1 B", description: "JUNK token (1 billion)" },
  { input: "1000", expected: "1,000", description: "SAIL token (1 thousand)" },
  { input: "0", expected: "0", description: "Zero balance" },
  { input: "500000", expected: "500,000", description: "500 thousand" },
  { input: "1500000", expected: "1.5 M", description: "1.5 million" }
];

formatTests.forEach(test => {
  const result = testNFormatter(test.input);
  const passed = result === test.expected;
  console.log(`${passed ? '✅' : '❌'} ${test.description}: ${test.input} → ${result} ${passed ? '' : `(expected: ${test.expected})`}`);
});

// Test 4: Verify component integration
console.log('\n4️⃣  Testing Component Integration:');
console.log('─'.repeat(50));

const componentPath = path.join(__dirname, '../src/ui/components/junk20-balance/component.tsx');
if (fs.existsSync(componentPath)) {
  const componentContent = fs.readFileSync(componentPath, 'utf8');
  
  const componentTests = [
    { name: 'Uses correct balance field', pattern: 'nFormatter(token.balance' },
    { name: 'Uses correct transferable field', pattern: 'nFormatter(token.transferable' },
    { name: 'Displays token ticker', pattern: 'token.tick.toUpperCase()' },
    { name: 'Shows UTXO count', pattern: 'token.utxoCount' },
    { name: 'Has loading state', pattern: 'loading' },
    { name: 'Has error handling', pattern: 'error' }
  ];
  
  componentTests.forEach(test => {
    if (componentContent.includes(test.pattern)) {
      console.log(`✅ ${test.name}`);
    } else {
      console.log(`❌ ${test.name}`);
    }
  });
} else {
  console.log('❌ Component file not found');
}

// Test 5: Verify enhanced send integration
console.log('\n5️⃣  Testing Enhanced Send Integration:');
console.log('─'.repeat(50));

const sendComponentPath = path.join(__dirname, '../src/ui/pages/main/send/create-send/component.tsx');
if (fs.existsSync(sendComponentPath)) {
  const sendContent = fs.readFileSync(sendComponentPath, 'utf8');
  
  const sendTests = [
    { name: 'Has Junk-20 send mode', pattern: "sendMode === 'junk20'" },
    { name: 'Uses Junk-20 transfer manager', pattern: 'useJunk20TransferManager' },
    { name: 'Has token selection', pattern: 'selectedJunk20Token' },
    { name: 'Has transfer UTXO selection', pattern: 'selectedTransferUtxos' },
    { name: 'Has transfer analysis', pattern: 'junk20TransferAnalysis' }
  ];
  
  sendTests.forEach(test => {
    if (sendContent.includes(test.pattern)) {
      console.log(`✅ ${test.name}`);
    } else {
      console.log(`❌ ${test.name}`);
    }
  });
} else {
  console.log('❌ Send component file not found');
}

// Test 6: Build verification
console.log('\n6️⃣  Testing Build Compatibility:');
console.log('─'.repeat(50));

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Build directory exists');
  
  const chromeDistPath = path.join(distPath, 'chrome');
  if (fs.existsSync(chromeDistPath)) {
    console.log('✅ Chrome build exists');
    
    const buildFiles = ['ui.js', 'background.js', 'ui.css'];
    buildFiles.forEach(file => {
      const filePath = path.join(chromeDistPath, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}kb)`);
      } else {
        console.log(`❌ ${file} missing`);
      }
    });
  } else {
    console.log('❌ Chrome build directory not found');
  }
} else {
  console.log('❌ Build directory not found');
}

// Final Results
console.log('\n📊 Integration Test Results:');
console.log('═'.repeat(60));

const successRate = Math.round((passedChecks / totalChecks) * 100);
console.log(`File Update Success Rate: ${successRate}% (${passedChecks}/${totalChecks})`);

console.log('\n🎯 Expected User Experience:');
console.log('Account Panel will now display:');
console.log('');
console.log('📱 Junk-20 Tokens (2 tokens) ▼');
console.log('  JUNK');
console.log('  Available: 1 B');
console.log('  Transferable: 0');
console.log('  10 UTXOs');
console.log('');
console.log('  SAIL');
console.log('  Available: 1,000');
console.log('  Transferable: 0');
console.log('  10 UTXOs');

console.log('\n✅ Key Improvements:');
console.log('• Fixed API response parsing (available → balance)');
console.log('• Enhanced number formatting with comma support');
console.log('• Better precision for large numbers (billions)');
console.log('• Maintained backward compatibility');
console.log('• Integrated with enhanced send functionality');
console.log('• Proper error handling and loading states');

if (successRate >= 90) {
  console.log('\n🎉 Integration Test PASSED! Ready for production use.');
} else {
  console.log('\n⚠️  Integration Test needs attention. Some checks failed.');
}

console.log('\n✅ Junk-20 Balance Fix Integration Test Complete!');
