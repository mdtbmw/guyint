'use client';

import React, { ReactNode } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { intuitionMainnet } from '@/lib/intuition-mainnet';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set');
}

const metadata = {
  name: 'Intuition BET',
  description: 'A decentralized betting platform for your intuition.',
  url: 'https://web3modal.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const wagmiConfig = createConfig({
  chains: [intuitionMainnet],
  transports: {
    [intuitionMainnet.id]: http(),
  },
  ssr: true, // Required for Next.js App Router
});

createWeb3Modal({
  wagmiConfig,
  projectId,
  metadata,
  enableAnalytics: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#1c1a17',
    '--w3m-accent': '#f4c025',
    '--w3m-border-radius-master': '1rem'
  }
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
