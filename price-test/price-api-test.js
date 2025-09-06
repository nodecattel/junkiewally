// Test for the new price API endpoint
// Using built-in fetch (Node.js 18+)

const PRICE_API_URL = "https://jkc-explorer.dedoo.xyz";

async function testPriceAPI() {
  console.log('Testing new price API endpoint...');
  
  try {
    const response = await fetch(`${PRICE_API_URL}/ext/getsummary`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Verify expected fields exist
    const expectedFields = [
      'difficulty',
      'supply', 
      'hashrate',
      'lastPrice',
      'lastUSDPrice',
      'connections',
      'blockcount',
      'masternodeCountOnline',
      'masternodeCountOffline'
    ];
    
    const missingFields = expectedFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      console.error('Missing expected fields:', missingFields);
      return false;
    }
    
    // Verify data types
    if (typeof data.lastUSDPrice !== 'number') {
      console.error('lastUSDPrice is not a number:', typeof data.lastUSDPrice);
      return false;
    }
    
    if (typeof data.lastPrice !== 'number') {
      console.error('lastPrice is not a number:', typeof data.lastPrice);
      return false;
    }
    
    console.log('✅ All tests passed!');
    console.log(`Current JKC price: $${data.lastUSDPrice}`);
    console.log(`Last price in BTC: ${data.lastPrice}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testPriceAPI().then(success => {
  process.exit(success ? 0 : 1);
});
