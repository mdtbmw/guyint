'use client';

import React from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function LandingPage() {
    const { open } = useWallet();

    return (
        <div className="bg-obsidian text-zinc-300 font-sans antialiased">
            <div className="relative flex flex-col items-center justify-center h-dvh p-6 text-center overflow-hidden">
                {/* Subtle background visual effect */}
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-gold-500/5 rounded-full filter blur-3xl animate-breathe pointer-events-none"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/5 rounded-full filter blur-3xl animate-breathe-delay pointer-events-none"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-8 animate-slide-up">
                        <Logo className="h-24 w-24 text-white" />
                    </div>

                    <h1 className="font-display text-5xl sm:text-6xl font-bold text-white tracking-tighter leading-tight mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        The Signal in the Noise.
                    </h1>

                    <p className="text-lg text-zinc-400 max-w-lg leading-relaxed mb-12 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        A premium prediction arena. High stakes, pure signal, verified outcomes.
                    </p>

                    <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                         <button onClick={() => open()} className="group relative px-10 py-5 bg-gold-500 text-black font-bold text-sm tracking-wide uppercase overflow-hidden rounded-full shadow-xl shadow-gold-500/20 hover:shadow-gold-500/40 transition-all transform hover:-translate-y-1">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative z-10 flex items-center gap-2">Connect Wallet <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add a new animation to tailwind config
// In a real scenario, you'd add this to tailwind.config.ts
const styles = `
    @keyframes breathe-delay {
        0%, 100% { transform: scale(1); opacity: 0.2; }
        50% { transform: scale(1.2); opacity: 0.3; }
    }
    .animate-breathe-delay {
        animation: breathe-delay 10s ease-in-out infinite;
    }
`;
// This is a hacky way to inject styles for this environment.
// In a real project, this would go into a CSS file or tailwind config.
if (typeof window !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
