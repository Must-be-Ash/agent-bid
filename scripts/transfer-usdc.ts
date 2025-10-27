#!/usr/bin/env tsx

import { initializeWallet, sendRefund } from './lib/wallet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: 'agents/.env' }); // Load agent addresses

async function transferUSDC() {
  console.log('💸 USDC Transfer Script\n');

  // Load agent addresses from environment
  const recipient1 = process.env.AGENT_A_PUBLIC_ADDRESS;
  const recipient2 = process.env.AGENT_B_PUBLIC_ADDRESS;
  const amount1 = 150; // USDC to first recipient

  if (!recipient1 || !recipient2) {
    console.error('❌ Agent addresses not found in agents/.env');
    console.error('   Required: AGENT_A_PUBLIC_ADDRESS, AGENT_B_PUBLIC_ADDRESS');
    process.exit(1);
  }

  try {
    // Initialize wallet
    console.log('🔗 Initializing server wallet...');
    const { serverAccount } = await initializeWallet();
    console.log(`✅ Server wallet: ${serverAccount.address}\n`);

    // Get current balance
    const { getWalletBalance } = await import('./lib/wallet');
    const balance = await getWalletBalance();
    const currentUSDC = parseFloat(balance.usdc);
    
    console.log('📊 Current Balance:');
    console.log(`💵 USDC: ${currentUSDC} USDC\n`);

    if (currentUSDC < amount1) {
      console.log('❌ Insufficient USDC balance for transfer');
      console.log(`   Required: ${amount1} USDC`);
      console.log(`   Available: ${currentUSDC} USDC`);
      process.exit(1);
    }

    const remainingAmount = currentUSDC - amount1;
    console.log('📋 Transfer Plan:');
    console.log(`   • ${amount1} USDC → ${recipient1}`);
    console.log(`   • ${remainingAmount.toFixed(6)} USDC → ${recipient2}`);
    console.log(`   • Total: ${currentUSDC} USDC\n`);

    // Confirm before proceeding
    console.log('⚠️  This will transfer ALL USDC from the server wallet!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Transfer to first recipient
    console.log(`🚀 Transferring ${amount1} USDC to ${recipient1}...`);
    let tx1;
    try {
      tx1 = await sendRefund(recipient1, amount1);
      console.log(`✅ Transfer 1 complete! Tx: ${tx1}\n`);
    } catch (error) {
      console.log(`⚠️  Transfer 1 failed, retrying in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      tx1 = await sendRefund(recipient1, amount1);
      console.log(`✅ Transfer 1 complete! Tx: ${tx1}\n`);
    }

    // Wait longer between transfers to avoid nonce issues
    console.log('⏳ Waiting 10 seconds between transfers to avoid nonce conflicts...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Transfer remaining to second recipient
    console.log(`🚀 Transferring ${remainingAmount.toFixed(6)} USDC to ${recipient2}...`);
    let tx2;
    try {
      tx2 = await sendRefund(recipient2, remainingAmount);
      console.log(`✅ Transfer 2 complete! Tx: ${tx2}\n`);
    } catch (error) {
      console.log(`⚠️  Transfer 2 failed, retrying in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      tx2 = await sendRefund(recipient2, remainingAmount);
      console.log(`✅ Transfer 2 complete! Tx: ${tx2}\n`);
    }

    console.log('🎉 All transfers completed successfully!');
    console.log('📊 Final Status:');
    console.log(`   • ${amount1} USDC sent to ${recipient1}`);
    console.log(`   • ${remainingAmount.toFixed(6)} USDC sent to ${recipient2}`);
    console.log(`   • Server wallet USDC balance: ~0 USDC`);

  } catch (error) {
    console.error('❌ Transfer failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the transfer
transferUSDC().catch(console.error);
