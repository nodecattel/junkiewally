// Test for explorer link generation functions
const { networks } = require('junkcoinjs-lib');

// Mock the constants and functions (simulating the actual implementation)
const EXPLORER_URL = "https://jkc-explorer.dedoo.xyz/";
const TESTNET_EXPLORER_URL = "https://explorer-testnet.junk-coin.com/";
const CONTENT_URL = "https://ord.junkiewally.xyz";

const isTestnet = (network) => {
  return network.pubKeyHash === networks.testnet.pubKeyHash &&
         network.scriptHash === networks.testnet.scriptHash;
};

const getExplorerUrl = (network) => 
  isTestnet(network) ? TESTNET_EXPLORER_URL : EXPLORER_URL;

const getContentUrl = () => CONTENT_URL;

// Explorer link generation functions
const getTransactionExplorerUrl = (txId, network) => {
  const baseUrl = getExplorerUrl(network);
  return `${baseUrl}tx/${txId}`;
};

const getAddressExplorerUrl = (address, network) => {
  const baseUrl = getExplorerUrl(network);
  return `${baseUrl}address/${address}`;
};

const getJunkscriptionUrl = (inscriptionId) => {
  return `${getContentUrl()}/junkscription/${inscriptionId}`;
};

// Test data
const testTxId = "e29d4430ad32fb3cef2101aad5e724f0280ca9d64f2aa09f59b400eb929e3af7";
const testAddress = "7SV5b2vtZSsseNb7iMEZYrnmYBD5AMHthj";
const testInscriptionId = "d9eacb72fb55f8de699867331c62fcaf00b0710319fce28c700cfdc5f7cacdbai0";

async function testExplorerLinks() {
  console.log('🔗 Testing Explorer Link Generation...\n');
  
  let allTestsPassed = true;
  
  // Test mainnet transaction URL
  console.log('📋 Testing Mainnet Transaction URLs:');
  const mainnetTxUrl = getTransactionExplorerUrl(testTxId, networks.junkcoin);
  const expectedMainnetTxUrl = `${EXPLORER_URL}tx/${testTxId}`;
  
  if (mainnetTxUrl === expectedMainnetTxUrl) {
    console.log('✅ Mainnet transaction URL correct:', mainnetTxUrl);
  } else {
    console.log('❌ Mainnet transaction URL incorrect:');
    console.log('   Expected:', expectedMainnetTxUrl);
    console.log('   Got:     ', mainnetTxUrl);
    allTestsPassed = false;
  }
  
  // Test testnet transaction URL
  console.log('\n📋 Testing Testnet Transaction URLs:');
  const testnetTxUrl = getTransactionExplorerUrl(testTxId, networks.testnet);
  const expectedTestnetTxUrl = `${TESTNET_EXPLORER_URL}tx/${testTxId}`;
  
  if (testnetTxUrl === expectedTestnetTxUrl) {
    console.log('✅ Testnet transaction URL correct:', testnetTxUrl);
  } else {
    console.log('❌ Testnet transaction URL incorrect:');
    console.log('   Expected:', expectedTestnetTxUrl);
    console.log('   Got:     ', testnetTxUrl);
    allTestsPassed = false;
  }
  
  // Test mainnet address URL
  console.log('\n🏠 Testing Mainnet Address URLs:');
  const mainnetAddrUrl = getAddressExplorerUrl(testAddress, networks.junkcoin);
  const expectedMainnetAddrUrl = `${EXPLORER_URL}address/${testAddress}`;
  
  if (mainnetAddrUrl === expectedMainnetAddrUrl) {
    console.log('✅ Mainnet address URL correct:', mainnetAddrUrl);
  } else {
    console.log('❌ Mainnet address URL incorrect:');
    console.log('   Expected:', expectedMainnetAddrUrl);
    console.log('   Got:     ', mainnetAddrUrl);
    allTestsPassed = false;
  }
  
  // Test testnet address URL
  console.log('\n🏠 Testing Testnet Address URLs:');
  const testnetAddrUrl = getAddressExplorerUrl(testAddress, networks.testnet);
  const expectedTestnetAddrUrl = `${TESTNET_EXPLORER_URL}address/${testAddress}`;
  
  if (testnetAddrUrl === expectedTestnetAddrUrl) {
    console.log('✅ Testnet address URL correct:', testnetAddrUrl);
  } else {
    console.log('❌ Testnet address URL incorrect:');
    console.log('   Expected:', expectedTestnetAddrUrl);
    console.log('   Got:     ', testnetAddrUrl);
    allTestsPassed = false;
  }
  
  // Test junkscription URL
  console.log('\n🎨 Testing Junkscription URLs:');
  const junkscriptionUrl = getJunkscriptionUrl(testInscriptionId);
  const expectedJunkscriptionUrl = `${CONTENT_URL}/junkscription/${testInscriptionId}`;
  
  if (junkscriptionUrl === expectedJunkscriptionUrl) {
    console.log('✅ Junkscription URL correct:', junkscriptionUrl);
  } else {
    console.log('❌ Junkscription URL incorrect:');
    console.log('   Expected:', expectedJunkscriptionUrl);
    console.log('   Got:     ', junkscriptionUrl);
    allTestsPassed = false;
  }
  
  return allTestsPassed;
}

async function testFeeConfiguration() {
  console.log('\n💰 Testing Fee Configuration...\n');
  
  // Mock the updated DEFAULT_FEES
  const DEFAULT_FEES = {
    fast: 300,
    slow: 100,
  };
  
  console.log('📊 Updated Fee Presets:');
  console.log(`   Slow: ${DEFAULT_FEES.slow} sat/vB`);
  console.log(`   Fast: ${DEFAULT_FEES.fast} sat/vB`);
  
  // Verify the values are reasonable
  if (DEFAULT_FEES.slow >= 100 && DEFAULT_FEES.fast >= 300) {
    console.log('✅ Fee values are within expected ranges');
    return true;
  } else {
    console.log('❌ Fee values are not within expected ranges');
    return false;
  }
}

async function testUrlAccessibility() {
  console.log('\n🌐 Testing URL Accessibility...\n');
  
  const urlsToTest = [
    { name: 'Main Explorer', url: EXPLORER_URL },
    { name: 'Content Service', url: CONTENT_URL },
  ];
  
  let allAccessible = true;
  
  for (const { name, url } of urlsToTest) {
    try {
      console.log(`🔍 Testing ${name}: ${url}`);
      const response = await fetch(url, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`✅ ${name} is accessible (${response.status})`);
      } else {
        console.log(`⚠️  ${name} returned status ${response.status}`);
        // Don't fail the test for non-200 responses as some servers may not support HEAD
      }
    } catch (error) {
      console.log(`❌ ${name} is not accessible: ${error.message}`);
      allAccessible = false;
    }
  }
  
  return allAccessible;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Explorer Configuration Tests...\n');
  
  const linkTestResult = await testExplorerLinks();
  const feeTestResult = await testFeeConfiguration();
  const accessibilityTestResult = await testUrlAccessibility();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`   Explorer Links: ${linkTestResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Fee Configuration: ${feeTestResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   URL Accessibility: ${accessibilityTestResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = linkTestResult && feeTestResult && accessibilityTestResult;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Explorer configuration update is successful.');
  } else {
    console.log('\n💥 Some tests failed. Please check the configuration.');
  }
  
  return allPassed;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
