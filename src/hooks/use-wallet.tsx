'use client';

import { useAccount, useBalance, useDisconnect, useWalletClient } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useCallback } from 'react';
import { getPublicClient } from 'wagmi/actions';
import { intuitionMainnet } from '@/lib/intuition-mainnet';

export function useWallet() {
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { data: balanceData, isLoading: balanceLoading, refetch: fetchBalance } = useBalance({ address });
  const { open } = useWeb3Modal();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();
  const publicClient = getPublicClient({ chainId: intuitionMainnet.id });

  const connectWallet = useCallback(() => {
    open();
  }, [open]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);
  
  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;

  return {
    address,
    connected: isConnected,
    isConnecting,
    chain,
    balance,
    balanceLoading,
    fetchBalance,
    connectWallet,
    disconnectWallet,
    walletClient,
    publicClient,
  };
}
