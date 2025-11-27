
'use client';

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Wallet } from 'lucide-react';

export function LandingPage() {
    const { connectWallet } = useWallet();

    return (
        <div className="bg-background text-foreground font-sans antialiased">
            <div className="relative flex flex-col items-center justify-center min-h-dvh p-8 text-center bg-grid-pattern overflow-hidden">
                
                <div className="relative z-10 flex flex-col items-center animate-slide-up">
                    <div className="w-24 h-24 mb-8 bg-foreground rounded-3xl flex items-center justify-center p-4 shadow-2xl shadow-black/50">
                        <Logo className="text-background" />
                    </div>

                    <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter leading-tight mb-6">
                        The Signal in the Noise.
                    </h1>
                    
                    <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-12">
                        A premium prediction arena where skill is the only currency. Bet on real-world events and win.
                    </p>
                    
                    <Button onClick={() => connectWallet()} size="lg" className="h-14 px-10 text-base font-bold uppercase tracking-wider rounded-full shadow-lg shadow-primary/30 transition-transform group bg-gradient-to-br from-primary via-primary/90 to-yellow-600 hover:shadow-primary/50">
                        <Wallet className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-1" />
                        Enter the Arena!
                    </Button>
                </div>

            </div>
        </div>
    );
}
