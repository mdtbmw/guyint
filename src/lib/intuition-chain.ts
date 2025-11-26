
import { defineChain } from 'viem'

// Default to the public Intuition testnet if no environment variables are set.
// This allows the application to build and run out-of-the-box.
const rpcUrl = process.env.NEXT_PUBLIC_INTUITION_RPC || 'https://rpc.intuition.systems/http';
const chainId = process.env.NEXT_PUBLIC_INTUITION_CHAIN_ID ? parseInt(process.env.NEXT_PUBLIC_INTUITION_CHAIN_ID) : 1155;

// The build system still requires a check, even with defaults.
if (!rpcUrl || !chainId) {
  const errorMessage = "FATAL_ERROR: NEXT_PUBLIC_INTUITION_RPC and/or NEXT_PUBLIC_INTUITION_CHAIN_ID are not set in the environment variables. The application cannot connect to the blockchain.";
  // This will cause a build failure if the variables are not set.
  throw new Error(errorMessage);
}


export const intuitionChain = defineChain({
  id: chainId,
  name: 'Intuition Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TRUST',
    symbol: 'TRUST',
  },
  rpcUrls: {
    default: {
      http: [rpcUrl, 'https://rpc.intuition.systems/http'], // Primary and fallback RPC
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.intuition.systems' },
  },
})
