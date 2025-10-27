import { CdpClient } from '@coinbase/cdp-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function exportPrivateKey() {
  try {
    console.log('🔑 Exporting private key for server wallet...');
    
    // Initialize CDP client
    const cdp = new CdpClient();
    
    // Export private key using the wallet address from environment
    const serverWalletAddress = process.env.SERVER_WALLET_ADDRESS;
    
    if (!serverWalletAddress) {
      throw new Error('SERVER_WALLET_ADDRESS environment variable is not set');
    }
    
    // Validate that the address is a valid hex address
    if (!serverWalletAddress.startsWith('0x') || serverWalletAddress.length !== 42) {
      throw new Error('SERVER_WALLET_ADDRESS must be a valid Ethereum address (0x...)');
    }
    
    const privateKey = await cdp.evm.exportAccount({
      address: serverWalletAddress as `0x${string}`
    });
    
    console.log('✅ Private key exported successfully!');
    console.log('Private key:', privateKey);
    console.log('\n📝 Add this to your .env.local file:');
    console.log(`SERVER_WALLET_PRIVATE_KEY=${privateKey}`);
    
  } catch (error: any) {
    console.error('❌ Error exporting private key:', error.message);
    
    if (error.message.includes('export')) {
      console.log('\n💡 Make sure your CDP API key has the "Export" permission enabled.');
      console.log('   Go to CDP Portal > API Keys > Edit your key > API-specific restrictions > Export (export private key)');
    }
  }
}

exportPrivateKey().catch(console.error);

