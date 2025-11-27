
import { defineChain } from 'viem';

export const intuition = defineChain({
  id: 13579, // Note: You might need to change this ID for the mainnet
  name: 'Intuition Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TRUST',
    symbol: '$TRUST',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.rpc.intuition.systems'],
      webSocket: ['wss://mainnet.rpc.intuition.systems/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Intuition Explorer',
      url: 'https://mainnet.explorer.intuition.systems',
    },
  },
  testnet: false,
});
