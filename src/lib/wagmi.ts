
import { createConfig, http } from 'wagmi';
import { activeChain, chains } from '@/lib/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
if (!projectId) {
    console.warn("WalletConnect Project ID is not set. Mobile wallet connections will not work.");
}

// This needs to be exported for use in the hook, but isn't part of the public API
export const wagmiConfig = createConfig({
  chains: chains,
  transports: {
    [activeChain.id]: http(),
  },
  connectors: [
    walletConnect({ projectId, metadata: {
        name: 'INTUITION BETs',
        description: 'A premium prediction arena.',
        url: 'https://web3modal.com',
        icons: ['https://avatars.githubusercontent.com/u/37784886']
    }}),
    injected({ shimDisconnect: true }),
  ],
  ssr: true,
});
