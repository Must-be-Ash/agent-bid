#!/usr/bin/env tsx

import { getWalletBalance } from './lib/wallet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkServerWalletBalance() {
  console.log('💰 Checking Server Wallet Balance...\n');

  try {
    const balance = await getWalletBalance();
    
    console.log('📊 Server Wallet Balance:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔷 ETH:  ${balance.eth} ETH`);
    console.log(`💵 USDC: ${balance.usdc} USDC`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Parse balances for calculations
    const ethBalance = parseFloat(balance.eth);
    const usdcBalance = parseFloat(balance.usdc);
    
    console.log('\n💡 Balance Analysis:');
    
    if (ethBalance < 0.001) {
      console.log('⚠️  ETH balance is very low - may need funding for gas');
    } else {
      console.log('✅ ETH balance looks good for gas fees');
    }
    
    if (usdcBalance < 10) {
      console.log('⚠️  USDC balance is low - may need funding for refunds');
    } else if (usdcBalance < 50) {
      console.log('💡 USDC balance is moderate - consider funding for larger auctions');
    } else {
      console.log('✅ USDC balance looks good for auction operations');
    }
    
    console.log('\n🎯 Recommended Actions:');
    if (ethBalance < 0.001) {
      console.log('   • Fund ETH for gas fees');
    }
    if (usdcBalance < 50) {
      console.log('   • Fund USDC for auction refunds');
    }
    if (ethBalance >= 0.001 && usdcBalance >= 50) {
      console.log('   • Wallet is ready for auction operations! 🚀');
    }

  } catch (error) {
    console.error('❌ Error checking wallet balance:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the balance check
checkServerWalletBalance().catch(console.error);
