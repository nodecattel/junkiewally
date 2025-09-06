// UTXO Protection System Demonstration
console.log('🛡️  JunkieWally UTXO Protection System Demo\n');

// Mock data to demonstrate the protection system
const mockUTXOs = [
  {
    txid: "e29d4430ad32fb3cef2101aad5e724f0280ca9d64f2aa09f59b400eb929e3af7",
    vout: 0,
    value: 100000000, // 1 JKC
    status: { confirmed: true, block_height: 596277 }
  },
  {
    txid: "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    vout: 1,
    value: 50000000, // 0.5 JKC
    status: { confirmed: true, block_height: 596278 }
  },
  {
    txid: "f9e8d7c6b5a4930281746352819047362817463528190473628174635281904736",
    vout: 0,
    value: 25000000, // 0.25 JKC
    status: { confirmed: true, block_height: 596279 }
  }
];

// Mock Junk-20 data
const mockJunk20Data = {
  junk20: [
    {
      tick: "sail",
      balance: "1000",
      transferable: "500",
      utxos: [
        {
          inscription_id: "d9eacb72fb55f8de699867331c62fcaf00b0710319fce28c700cfdc5f7cacdbai0",
          inscription_number: 12345,
          junk20: {
            balance: "1000",
            operation: "transfer"
          }
        }
      ]
    }
  ]
};

// Mock inscription data
const mockInscriptions = [
  {
    genesis: "d9eacb72fb55f8de699867331c62fcaf00b0710319fce28c700cfdc5f7cacdbai0",
    content_type: "text/plain",
    inscription_number: 12345
  }
];

// Simulate the UTXO protection analysis
class UTXOProtectionDemo {
  constructor() {
    this.junk20UtxoMap = new Map();
    
    // Build Junk-20 UTXO map
    if (mockJunk20Data.junk20) {
      for (const token of mockJunk20Data.junk20) {
        for (const utxo of token.utxos) {
          this.junk20UtxoMap.set(utxo.inscription_id, {
            tick: token.tick,
            balance: utxo.junk20.balance,
            operation: utxo.junk20.operation,
            inscription_id: utxo.inscription_id,
            inscription_number: utxo.inscription_number,
          });
        }
      }
    }
  }

  analyzeUTXOs(utxos) {
    const safeUtxos = [];
    const protectedUtxos = [];

    console.log('🔍 Analyzing UTXOs for protection...\n');

    for (let i = 0; i < utxos.length; i++) {
      const utxo = utxos[i];
      const utxoKey = `${utxo.txid}:${utxo.vout}`;
      
      console.log(`📦 UTXO ${i + 1}: ${utxo.txid.substring(0, 8)}...${utxo.vout}`);
      console.log(`   Value: ${(utxo.value / 100000000).toFixed(8)} JKC`);

      // Simulate inscription check
      const hasInscription = i === 1; // Second UTXO has inscription for demo
      
      if (hasInscription) {
        const inscription = mockInscriptions[0];
        const junk20Info = this.junk20UtxoMap.get(inscription.genesis);
        
        if (junk20Info) {
          console.log(`   🚨 PROTECTED: Contains JUNK-20 token (${junk20Info.tick.toUpperCase()})`);
          console.log(`   💰 Token Balance: ${junk20Info.balance}`);
          
          protectedUtxos.push({
            ...utxo,
            isProtected: true,
            protectionReason: 'junk20',
            protectionDetails: {
              junk20: {
                tick: junk20Info.tick,
                balance: junk20Info.balance,
                operation: junk20Info.operation,
              },
              inscription: {
                inscription_id: inscription.genesis,
                inscription_number: junk20Info.inscription_number,
              },
            },
          });
        } else {
          console.log(`   🚨 PROTECTED: Contains junkscription`);
          console.log(`   🎨 Content Type: ${inscription.content_type}`);
          
          protectedUtxos.push({
            ...utxo,
            isProtected: true,
            protectionReason: 'junkscription',
            protectionDetails: {
              inscription: {
                inscription_id: inscription.genesis,
                content_type: inscription.content_type,
              },
            },
          });
        }
      } else {
        console.log(`   ✅ SAFE: No junkscriptions detected`);
        safeUtxos.push(utxo);
      }
      
      console.log('');
    }

    const totalSafeValue = safeUtxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const totalProtectedValue = protectedUtxos.reduce((sum, utxo) => sum + utxo.value, 0);

    return {
      safeUtxos,
      protectedUtxos,
      totalSafeValue,
      totalProtectedValue,
    };
  }

  demonstrateTransactionScenario(utxos, requestedAmount) {
    console.log('💸 Transaction Scenario Demonstration\n');
    console.log(`🎯 User wants to send: ${(requestedAmount / 100000000).toFixed(8)} JKC`);
    
    const analysis = this.analyzeUTXOs(utxos);
    
    console.log('📊 Protection Analysis Results:');
    console.log(`   Safe UTXOs: ${analysis.safeUtxos.length}`);
    console.log(`   Protected UTXOs: ${analysis.protectedUtxos.length}`);
    console.log(`   Available for spending: ${(analysis.totalSafeValue / 100000000).toFixed(8)} JKC`);
    console.log(`   Protected value: ${(analysis.totalProtectedValue / 100000000).toFixed(8)} JKC`);
    console.log('');

    if (analysis.totalSafeValue >= requestedAmount) {
      console.log('✅ Transaction can proceed safely');
      console.log('🛡️  Protected UTXOs will be automatically excluded');
      console.log(`💰 Using safe UTXOs with total value: ${(analysis.totalSafeValue / 100000000).toFixed(8)} JKC`);
    } else {
      console.log('❌ Insufficient safe balance for transaction');
      console.log(`💡 Need ${(requestedAmount / 100000000).toFixed(8)} JKC but only ${(analysis.totalSafeValue / 100000000).toFixed(8)} JKC available`);
      console.log('🚨 Protected UTXOs cannot be used automatically');
    }
    
    return analysis;
  }

  demonstrateUIWarnings(analysis) {
    console.log('\n🎨 UI Warning System Demonstration\n');
    
    if (analysis.protectedUtxos.length > 0) {
      console.log('⚠️  UTXO Protection Warning Display:');
      console.log('┌─────────────────────────────────────────────┐');
      console.log('│ ⚠️  Protected UTXOs Detected                │');
      console.log('│                                             │');
      console.log(`│ ${analysis.protectedUtxos.length} UTXO${analysis.protectedUtxos.length !== 1 ? 's' : ''} containing junkscriptions are      │`);
      console.log('│ protected from accidental spending.        │');
      console.log('│                                             │');
      console.log(`│ Protected Value: ${(analysis.totalProtectedValue / 100000000).toFixed(8)} JKC              │`);
      console.log(`│ Available: ${(analysis.totalSafeValue / 100000000).toFixed(8)} JKC                    │`);
      console.log('│                                             │');
      
      analysis.protectedUtxos.forEach((utxo, index) => {
        const type = utxo.protectionReason === 'junk20' ? 'JUNK-20' : 'Junkscription';
        const detail = utxo.protectionReason === 'junk20' 
          ? utxo.protectionDetails.junk20.tick.toUpperCase()
          : 'NFT';
        console.log(`│ • ${utxo.txid.substring(0, 8)}...${utxo.vout} - ${type} (${detail})     │`);
      });
      
      console.log('└─────────────────────────────────────────────┘');
    } else {
      console.log('✅ No Protection Warning Needed:');
      console.log('┌─────────────────────────────────────────────┐');
      console.log('│ 🛡️  All UTXOs Safe                          │');
      console.log('│                                             │');
      console.log('│ No junkscriptions detected.                │');
      console.log('│ All UTXOs are available for spending.      │');
      console.log('└─────────────────────────────────────────────┘');
    }
  }
}

// Run the demonstration
console.log('🚀 Starting UTXO Protection System Demo...\n');

const demo = new UTXOProtectionDemo();

// Scenario 1: Normal transaction with protected UTXOs
console.log('📋 Scenario 1: Transaction with Protected UTXOs');
console.log('═'.repeat(50));
const analysis1 = demo.demonstrateTransactionScenario(mockUTXOs, 75000000); // 0.75 JKC
demo.demonstrateUIWarnings(analysis1);

console.log('\n📋 Scenario 2: Transaction Requiring More Than Safe Balance');
console.log('═'.repeat(50));
const analysis2 = demo.demonstrateTransactionScenario(mockUTXOs, 150000000); // 1.5 JKC
demo.demonstrateUIWarnings(analysis2);

console.log('\n🎯 Key Protection Features:');
console.log('• Automatic detection of Junk-20 tokens in UTXOs');
console.log('• Protection of UTXOs containing junkscriptions/NFTs');
console.log('• Safe UTXO filtering for transaction building');
console.log('• User-friendly warnings and balance displays');
console.log('• Prevention of accidental asset loss');
console.log('• Caching for performance optimization');

console.log('\n✅ UTXO Protection System Demo Complete!');
