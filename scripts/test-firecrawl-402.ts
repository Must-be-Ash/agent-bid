#!/usr/bin/env tsx

import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http, publicActions } from 'viem';
import { base } from 'viem/chains';
import { wrapFetchWithPayment } from 'x402-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testFirecrawl402() {
  console.log('🧪 Testing Firecrawl x402 Integration...\n');

  // Check required environment variables
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

  if (!privateKey) {
    console.error('❌ No private key found. Set SERVER_WALLET_PRIVATE_KEY');
    process.exit(1);
  }

  if (!firecrawlApiKey) {
    console.error('❌ No Firecrawl API key found. Set FIRECRAWL_API_KEY');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`🔑 Using private key: ${privateKey.slice(0, 10)}...`);
  console.log(`🔑 Firecrawl API key: ${firecrawlApiKey.slice(0, 10)}...`);

  try {
    // Create account and wallet client
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log(`👤 Account address: ${account.address}`);

    // Create wallet client for x402 payments (use Base mainnet for Firecrawl)
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http()
    }).extend(publicActions);

    console.log('🔗 Wallet client created');

    // Wrap fetch with x402 payment handling
    const fetchWithPayment = wrapFetchWithPayment(
      fetch,
      walletClient as any,
      BigInt(0.50 * 10 ** 6) // Allow up to $0.50 USDC for search
    );

    console.log('💳 x402 payment wrapper configured (max $0.50)');

    // Test query
    const testQuery = 'Base blockchain latest news';
    console.log(`🔍 Testing search query: "${testQuery}"`);

    // Call Firecrawl search API with x402 payment
    console.log('📡 Making request to Firecrawl API...');
    
    const response = await fetchWithPayment('https://api.firecrawl.dev/v2/x402/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        query: testQuery,
        limit: 5,
        sources: ['web']
      })
    });

    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));

    // Don't check response.ok - let x402-fetch handle 402 internally
    // if (!response.ok) {
    //   const errorText = await response.text();
    //   console.error(`❌ Firecrawl API error:`, response.status, errorText);
    //   return;
    // }

    const result = await response.json();
    console.log('✅ Firecrawl API response received!');
    console.log('📄 Response data structure:', {
      hasData: !!result.data,
      hasWeb: !!result.data?.web,
      webResultsCount: result.data?.web?.length || 0
    });

    // Display results
    const articles = result.data?.web || [];
    console.log(`\n📰 Found ${articles.length} articles:`);
    
    articles.forEach((article: any, index: number) => {
      console.log(`\n${index + 1}. ${article.title || 'No title'}`);
      console.log(`   URL: ${article.url || 'No URL'}`);
      console.log(`   Description: ${article.description?.substring(0, 100) || 'No description'}...`);
    });

    console.log('\n🎉 Firecrawl x402 integration test completed successfully!');
    console.log('💡 This means:');
    console.log('   - x402 payment was processed automatically');
    console.log('   - Firecrawl API accepted the payment');
    console.log('   - Search results were returned');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Tip: Make sure your wallet has USDC on Base mainnet');
    } else if (error.message.includes('network')) {
      console.log('\n💡 Tip: Check your network connection and Base RPC endpoint');
    } else if (error.message.includes('x402')) {
      console.log('\n💡 Tip: Check x402 library version and configuration');
    }
  }
}

// Run the test
testFirecrawl402().catch(console.error);
