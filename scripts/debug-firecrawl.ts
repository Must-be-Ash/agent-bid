#!/usr/bin/env tsx

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function debugFirecrawl() {
  console.log('🔍 Debugging Firecrawl API...\n');

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  
  if (!firecrawlApiKey) {
    console.error('❌ No Firecrawl API key found');
    return;
  }

  console.log(`🔑 API Key: ${firecrawlApiKey.slice(0, 10)}...`);

  try {
    // Test 1: Direct API call without x402
    console.log('\n📡 Test 1: Direct API call (expecting 402)...');
    
    const response = await fetch('https://api.firecrawl.dev/v2/x402/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        query: 'test query',
        limit: 3,
        sources: ['web']
      })
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.status === 402) {
      const data = await response.json();
      console.log('📄 402 Response:');
      console.log(JSON.stringify(data, null, 2));
      
      // Check the payment requirements
      if (data.accepts && data.accepts[0]) {
        const payment = data.accepts[0];
        console.log('\n💰 Payment Requirements:');
        console.log(`   Network: ${payment.network}`);
        console.log(`   Max Amount: ${payment.maxAmountRequired}`);
        console.log(`   Asset: ${payment.asset}`);
        console.log(`   Pay To: ${payment.payTo}`);
        
        // Convert maxAmountRequired to USDC
        const maxAmount = parseInt(payment.maxAmountRequired);
        const usdcAmount = maxAmount / 1_000_000; // USDC has 6 decimals
        console.log(`   Max Amount in USDC: $${usdcAmount.toFixed(2)}`);
      }
    } else {
      const data = await response.text();
      console.log('📄 Response:', data);
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  }
}

debugFirecrawl().catch(console.error);

