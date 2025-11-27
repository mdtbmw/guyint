
'use client';

import { blockchainService } from "@/services/blockchain";
import { useToast } from "@/hooks/use-toast";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { Hex, isAddress, Address } from "viem";
import { getWalletBalance } from "@/app/wallet/get-balance";

interface WalletState {
  address: Hex | null;
  connected: boolean;
  balance: number;
  balanceLoading: boolean;
}

const walletAtom = atom<WalletState>({ address: null, connected: false, balance: 0, balanceLoading: true });
const connectDialogOpenAtom = atom(false);

const SESSION_KEY = 'wallet_address';

export function useWallet() {
  const [wallet, setWallet] = useAtom(walletAtom);
  const [isConnectDialogOpen, setConnectDialogOpen] = useAtom(connectDialogOpenAtom);
  const { toast } = useToast();

  const fetchBalance = useCallback(async (address: Address) => {
    setWallet((prev) => ({ ...prev, balanceLoading: true }));
    try {
      const balance = await getWalletBalance(address);
      setWallet((prev) => ({ ...prev, balance, balanceLoading: false }));
    } catch (e) {
      console.error("Failed to fetch balance via server action:", e);
      setWallet((prev) => ({ ...prev, balanceLoading: false }));
    }
  }, [setWallet]);

  const handleConnect = useCallback(async (address: Address) => {
    setWallet((prev) => ({ ...prev, address, connected: true, balance: 0, balanceLoading: true }));
    sessionStorage.setItem(SESSION_KEY, address);
    await fetchBalance(address);
    setConnectDialogOpen(false);
  }, [setWallet, fetchBalance, setConnectDialogOpen]);

  useEffect(() => {
    const storedAddress = sessionStorage.getItem(SESSION_KEY);
    if (storedAddress && isAddress(storedAddress)) {
      handleConnect(storedAddress as Address);
    } else {
      setWallet((prev) => ({ ...prev, balanceLoading: false, connected: false, address: null, balance: 0 }));
    }
  }, [handleConnect, setWallet]);


  const connectWallet = useCallback(async (manualAddress?: string) => {
    try {
      let address: Address | null = null;

      if (manualAddress) {
        if (!isAddress(manualAddress)) {
          toast({ variant: 'destructive', title: 'Invalid Address', description: 'Please enter a valid wallet address.'});
          return;
        }
        if (manualAddress.toLowerCase() === process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.toLowerCase()) {
          toast({ variant: 'destructive', title: 'Incorrect Address', description: 'You pasted the contract address. Please use the admin\'s wallet address.' });
          return;
        }
        address = manualAddress as Address;
      } else {
         address = await blockchainService.connectWallet();
      }
      
      if (address) {
        await handleConnect(address);
        toast({
            title: "Wallet Connected",
            description: `Connected with address: ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
      } else {
        if (!manualAddress) {
            setConnectDialogOpen(true);
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 4001) {
          toast({
            variant: "destructive",
            title: "Connection Rejected",
            description: "You must connect a wallet to use the application.",
          });
      } else {
         toast({
            variant: "destructive",
            title: "Connection Failed",
            description: error.message || "Could not connect to the wallet.",
         });
      }
    }
  }, [toast, setConnectDialogOpen, handleConnect]);

  const disconnectWallet = useCallback(async () => {
    blockchainService.disconnect();
    setWallet({ address: null, connected: false, balance: 0, balanceLoading: false });
    sessionStorage.removeItem(SESSION_KEY);
    toast({
      title: "Wallet Disconnected",
    });
  }, [setWallet, toast]);

  const memoizedFetchBalance = useCallback(async (addr: Address) => {
    await fetchBalance(addr);
  }, [fetchBalance]);

  return {
    ...wallet,
    isConnectDialogOpen,
    setConnectDialogOpen,
    connectWallet,
    disconnectWallet,
    fetchBalance: memoizedFetchBalance,
  };
}
