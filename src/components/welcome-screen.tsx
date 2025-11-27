
'use client';

import { useWallet } from '@/hooks/use-wallet';
import { WalletConnectDialog } from './wallet-connect-dialog';
import { BrainCircuit } from 'lucide-react';

export function WelcomeScreen() {
    const { connectWallet, isConnecting } = useWallet();
  
    return (
        <>
            <div 
              className="relative flex min-h-screen w-full flex-col items-center justify-center p-4"
              style={{
                backgroundImage: 'linear-gradient(rgba(10, 10, 18, 0.6) 0%, #0a0a12 100%), url("https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?q=80&w=2070&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
                <div className="relative z-10 flex flex-col items-center gap-8 text-center">
                    <div className="relative flex items-center justify-center h-48 w-48 rounded-full bg-black/30 shadow-[0_0_15px_rgba(244,192,37,0.5)] backdrop-blur-md">
                        <BrainCircuit className="w-24 h-24 text-primary" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl font-bold leading-tight tracking-tighter text-white md:text-6xl">Predict the Future. Earn $TRUST.</h1>
                        <h2 className="text-base font-normal leading-normal text-primary md:text-lg">Powered by Web3.</h2>
                    </div>
                    <w3m-button />
                </div>
            </div>
            <WalletConnectDialog />
        </>
    );
}
