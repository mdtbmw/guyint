import { defineChain } from 'viem';

// This is the definitive configuration for your custom "Intuition Mainnet".
// You MUST replace the placeholder values below with the actual details of your network before deployment.
export const intuitionMainnet = defineChain({
  // ** REQUIRED **
  // Replace with the actual Chain ID of your Intuition Mainnet.
  id: 7777777, 

  // ** REQUIRED **
  // The name of your network.
  name: 'Intuition Mainnet',

  // ** REQUIRED **
  // The native currency of your network.
  nativeCurrency: {
    name: 'Trust',
    symbol: 'TRUST',
    decimals: 18,
  },

  // ** REQUIRED **
  // Replace with the actual RPC URL for your Intuition Mainnet.
  // This is the endpoint your application will use to communicate with the blockchain.
  rpcUrls: {
    default: {
      http: ['https://rpc.intuition-mainnet.io'],
    },
  },

  // ** OPTIONAL **
  // If you have a block explorer, add its details here.
  blockExplorers: {
    default: {
      name: 'IntuitionScan',
      url: 'https://scan.intuition-mainnet.io',
    },
  },
});
