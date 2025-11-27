
'use client';

import React, { ReactNode } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';

const queryClient = new QueryClient();

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId) {
  throw new Error('FATAL_ERROR: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set in the environment variables.');
}

const metadata = {
  name: 'Intuition BETs',
  description: 'A decentralized betting platform for your intuition.',
  url: 'https://web3modal.com', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create the modal inside the provider to ensure it's client-side only.
createWeb3Modal({
  wagmiConfig,
  projectId,
  metadata,
  themeMode: 'dark', // Explicitly set theme mode
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': 'hsl(45 93% 47%)',
    '--w3m-border-radius-master': '1rem',
    '--w3m-z-index': 1000
  },
  allowUnsupportedChain: false,
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
