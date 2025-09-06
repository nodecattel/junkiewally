// Integration test for the updated price feed
// This test simulates the ApiController behavior

const PRICE_API_URL = "https://jkc-explorer.dedoo.xyz";

// Mock the customFetch function behavior
async function mockCustomFetch(options) {
  const { path, service } = options;
  
  if (service === "price" && path === "/ext/getsummary") {
    const response = await fetch(`${PRICE_API_URL}${path}`);
    if (!response.ok) {
      return undefined;
    }
    return await response.json();
  }
  
  return undefined;
}

// Mock ApiController getJKCPrice method
async function getJKCPrice() {
  try {
    const data = await mockCustomFetch({
      path: "/ext/getsummary",
      service: "price",
    });

    if (!data) {
      return undefined;
    }

    return {
      usd: data.lastUSDPrice,
    };
  } catch (error) {
    return undefined;
  }
}

// Test the integration
async function testIntegration() {
  console.log('🧪 Testing price feed integration...');
  
  try {
    // Test the getJKCPrice method
    const priceData = await getJKCPrice();
    
    if (!priceData) {
      console.error('❌ getJKCPrice returned undefined');
      return false;
    }
    
    if (!priceData.usd || typeof priceData.usd !== 'number') {
      console.error('❌ Invalid USD price data:', priceData);
      return false;
    }
    
    console.log('✅ getJKCPrice method works correctly');
    console.log(`💰 Current JKC price: $${priceData.usd}`);
    
    // Test UI integration scenarios
    const mockBalance = 100; // 100 JKC
    const usdValue = (mockBalance * priceData.usd).toFixed(3);
    
    console.log(`💼 Mock wallet balance: ${mockBalance} JKC`);
    console.log(`💵 USD equivalent: $${usdValue}`);
    
    // Verify the price is reasonable (between $0.001 and $10)
    if (priceData.usd < 0.001 || priceData.usd > 10) {
      console.warn('⚠️  Price seems unusual:', priceData.usd);
    }
    
    console.log('✅ All integration tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    return false;
  }
}

// Test error handling
async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  // Mock a failed fetch
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('Network error');
  };
  
  try {
    const result = await getJKCPrice();
    
    if (result === undefined) {
      console.log('✅ Error handling works correctly - returns undefined on failure');
      return true;
    } else {
      console.error('❌ Error handling failed - should return undefined');
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error in error handling test:', error.message);
    return false;
  } finally {
    // Restore original fetch
    global.fetch = originalFetch;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting price feed integration tests...\n');
  
  const integrationResult = await testIntegration();
  console.log('');
  
  const errorHandlingResult = await testErrorHandling();
  console.log('');
  
  const allPassed = integrationResult && errorHandlingResult;
  
  if (allPassed) {
    console.log('🎉 All tests passed! Price feed update is working correctly.');
  } else {
    console.log('💥 Some tests failed. Please check the implementation.');
  }
  
  return allPassed;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
