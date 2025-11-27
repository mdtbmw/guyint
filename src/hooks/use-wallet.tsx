
'use client';

import { useAccount, useBalance } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useCallback, useEffect, useState } from 'react';
import type { WalletClient } from 'viem';
import { useIsMounted } from './use-is-mounted';
import { getWalletClient } from 'wagmi/actions';
import { wagmiConfig } from '@/lib/wagmi';

export function useWallet() {
  const { address, isConnected, isConnecting, chain } = useAccount();
  const isMounted = useIsMounted();
  
  const { data: balanceData, isLoading: balanceLoading, refetch: fetchBalance } = useBalance({ 
    address,
  });

  const { open } = useWeb3Modal();
  
  const [walletClient, setWalletClient] = useState<WalletClient | null>();

  useEffect(() => {
    const fetchWalletClient = async () => {
        if (isConnected && chain) {
            try {
                const client = await getWalletClient(wagmiConfig, { chainId: chain.id });
                setWalletClient(client);
            } catch (error) {
                console.error("Error getting wallet client:", error);
                setWalletClient(null);
            }
        } else {
            setWalletClient(null);
        }
    }
    fetchWalletClient();
  }, [isConnected, chain]);


  const connectWallet = useCallback(() => {
    open();
  }, [open]);

  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;

  // Prevent hydration issues by ensuring we're on the client
  const connected = isMounted && isConnected;

  return {
    address: address,
    connected: connected,
    isConnecting: isConnecting || !isMounted,
    chain,
    balance,
    balanceLoading,
    fetchBalance,
    connectWallet,
    open,
    walletClient: walletClient,
  };
}
