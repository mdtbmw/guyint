
'use client';

import { useAccount, useBalance, useDisconnect, useSwitchChain, useWalletClient } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useIsMounted } from './use-is-mounted';
import { activeChain } from '@/lib/chains';

export function useWallet() {
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { open } = useWeb3Modal();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const isMounted = useIsMounted();
  
  const { data: walletClient } = useWalletClient({ chainId: chain?.id });

  const { data: balanceData, isLoading: balanceLoading, refetch: fetchBalance } = useBalance({ 
    address,
  });

  const balance = balanceData ? parseFloat(balanceData.formatted) : 0;
  const connected = isMounted && isConnected;
  const wrongNetwork = isMounted && isConnected && chain?.id !== activeChain.id;

  return {
    address,
    connected,
    isConnecting: isConnecting || !isMounted,
    chain,
    balance,
    balanceLoading,
    fetchBalance,
    connectWallet: open,
    disconnect,
    walletClient,
    wrongNetwork,
    switchChain: () => switchChain({ chainId: activeChain.id }),
  };
}
