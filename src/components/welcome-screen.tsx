
'use client';

import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { Input } from '@/components/ui/input';
import { isAddress } from 'viem';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Wallet, Zap } from 'lucide-react';
import { WalletConnectDialog } from './wallet-connect-dialog';
import { blockchainService } from '@/services/blockchain';
import { useAdmin } from '@/hooks/use-admin';

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS as string;

export function WelcomeScreen() {
    const { connectWallet } = useWallet();
    const [manualAddress, setManualAddress] = useState('');
    const { toast } = useToast();

    const handleManualConnect = async () => {
      if (!isAddress(manualAddress)) {
        toast({
          variant: 'destructive',
          title: 'Invalid Address',
          description: 'Please enter a valid wallet address.'
        })
        return;
      }
      
      const lowerCaseAddress = manualAddress.toLowerCase();

      if (ADMIN_ADDRESS && lowerCaseAddress === ADMIN_ADDRESS.toLowerCase()) {
         try {
            await blockchainService.signInAsAdmin(manualAddress as `0x${string}`);
            toast({
              title: "Admin Login Successful",
              description: "Secure admin session has been established.",
            });
            // After successful server-side auth, connect the wallet client-side
            await connectWallet(manualAddress);
         } catch(e: any) {
            console.error("Admin sign-in failed:", e);
            toast({
              variant: 'destructive',
              title: 'Admin Login Failed',
              description: e?.details || e?.message || 'An unknown error occurred. Check the server logs.'
            });
            return;
         }
      } else {
        toast({
            variant: 'destructive',
            title: 'Not an Admin Wallet',
            description: 'Manual connection is for admin access only.'
        });
      }
    }
  
    return (
        <>
            <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <div className="mx-auto my-4 overflow-hidden rounded-[28px] bg-neutral-900/70 shadow-2xl ring-1 ring-white/10 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/50 w-full max-w-[420px]">
                    <div className="flex flex-col items-center justify-center p-8">
                        <div className="mb-8">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center">
                                <Zap className="w-12 h-12 text-white" strokeWidth={1.5} />
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-4">
                        Intuition
                        </h1>
                        <p className="max-w-xl text-base text-zinc-400 mb-12">
                            The decentralized prediction market where your foresight is rewarded. Connect your wallet to begin.
                        </p>
                        
                        <div className="w-full max-w-sm space-y-4">
                            <Button onClick={() => connectWallet()} size="lg" className="w-full h-12 text-base font-semibold bg-indigo-600 text-white hover:bg-indigo-500 ring-1 ring-indigo-400/50">
                                <Wallet className="mr-2 w-5 h-5" /> Connect Wallet
                            </Button>
                            
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-neutral-900 px-2 text-zinc-500">
                                        Or Connect Manually (Admin)
                                    </span>
                                </div>
                            </div>

                            <div className="flex w-full max-w-sm items-center space-x-2">
                                <Input 
                                    type="text" 
                                    placeholder="Paste admin wallet address..."
                                    value={manualAddress}
                                    onChange={(e) => setManualAddress(e.target.value)}
                                    className="h-11 text-center bg-white/5 border-white/10 placeholder:text-white/60 text-white ring-1 ring-white/10 outline-none backdrop-blur transition hover:ring-white/20 focus:bg-white/10 focus:ring-white/25"
                                />
                                <Button type="submit" onClick={handleManualConnect} variant="secondary" size="icon" className="h-11 w-11 bg-white/5 hover:bg-white/10 ring-1 ring-white/10">
                                    <ArrowRight className="w-5 h-5"/>
                                </Button>
                            </div>
                        </div>
                        <p className="mt-12 text-sm text-zinc-500">New to Web3? <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-medium underline">Get a wallet.</a></p>
                    </div>
                </div>
            </div>
            <WalletConnectDialog />
        </>
    );
}

    