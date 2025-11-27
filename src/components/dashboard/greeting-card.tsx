
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/lib/icons';
import { useSettings } from '@/lib/state/settings';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/hooks/use-admin';
import { MobileBalanceDisplay } from './mobile-balance-display';
import { getRank, calculateUserStats } from '@/lib/ranks';
import { blockchainService } from '@/services/blockchain';
import { UserStats } from '@/lib/types';
import Link from 'next/link';

const principles = [
    "The market is a device for transferring money from the impatient to the patient.",
    "The first principle is that you must not fool yourself, and you are the easiest person to fool.",
    "Intuition is seeing with the soul.",
    "Doubt is not a pleasant condition, but certainty is an absurd one.",
    "The best way to predict the future is to create it.",
    "In the short run, the market is a voting machine, but in the long run, it is a weighing machine.",
    "Signal is the truth. Noise is what distracts us from the truth.",
    "You either find a way or find an excuse."
];

export function GreetingCard() {
    const [timeString, setTimeString] = useState('');
    const [dailyPrinciple, setDailyPrinciple] = useState('');
    const { balance, chain, address } = useWallet();
    const { settings } = useSettings();
    const router = useRouter();
    const { isAdmin } = useAdmin();
    const [stats, setStats] = useState<UserStats | null>(null);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
            setTimeString(`${hours}:${formattedMinutes} ${ampm}`);
        };
        const timer = setInterval(updateTime, 1000);
        updateTime();

        setDailyPrinciple(principles[Math.floor(Math.random() * principles.length)]);

        return () => clearInterval(timer);
    }, []);

    const fetchStats = useCallback(async () => {
        if (!address) return;
        try {
            const allEvents = await blockchainService.getAllEvents();
            if (allEvents.length > 0) {
                const eventIds = allEvents.map(e => BigInt(e.id));
                const userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, address);
                const userStats = calculateUserStats(allEvents, userBetsOnAllEvents);
                setStats(userStats);
            } else {
                setStats({ wins: 0, losses: 0, totalBets: 0, accuracy: 0, trustScore: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch user stats for greeting card:", error);
        }
    }, [address]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const userRank = useMemo(() => getRank(stats?.trustScore), [stats]);
    
    // Use the custom username if set, otherwise fallback to the avatar seed name, or a default.
    const username = settings.username || "User";

    const suggestHref = isAdmin ? '/admin?tab=scout' : '/search';


    return (
       <div className="animate-slide-up">
            <div className="bg-card/60 dark:glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden greeting-mesh group">
                <div className="absolute -top-20 -right-20 md:top-[-20%] md:right-[-10%] w-64 h-64 bg-primary/5 dark:bg-primary/20 blur-[80px] rounded-full animate-breathe pointer-events-none"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <span className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest shadow-sm shadow-primary/10">{userRank.name} Tier</span>
                        <span className="text-muted-foreground text-xs font-mono flex items-center gap-1.5 bg-background/30 px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span>{timeString}</span>
                        </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className='flex-1'>
                            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 tracking-tight leading-tight">
                                Hello, {username}.
                            </h1>
                            <p className="text-muted-foreground text-sm md:text-base max-w-md leading-relaxed">
                                Intuition is your capital. Trust is your currency.
                            </p>
                        </div>
                        {/* Desktop Balance */}
                        <div className="hidden md:flex bg-background/50 border border-border rounded-3xl p-4 items-center gap-5 backdrop-blur-sm shrink-0">
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Trustnet Balance</p>
                                <p className="text-2xl md:text-3xl font-display font-bold text-foreground">{balance.toFixed(4)} <span className="text-primary text-lg">{chain?.nativeCurrency.symbol}</span></p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                                <DynamicIcon name="ShieldCheck" className="w-6 h-6" strokeWidth="1.5" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Mobile Balance */}
                    <div className="md:hidden mb-8">
                       <MobileBalanceDisplay balance={balance} currencySymbol={chain?.nativeCurrency.symbol || 'TRUST'} />
                    </div>


                    <div className="pt-6 border-t border-border flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Daily Principle</p>
                            <p className="text-sm text-foreground font-medium italic pl-3 border-l-2 border-primary/50">"{dailyPrinciple}"</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                           <Link href="/" className="active-press flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2">
                                <DynamicIcon name="Compass" className="w-4 h-4"/> Explore
                            </Link>
                            <Link href={suggestHref} className="active-press flex-1 md:flex-none border border-border hover:bg-accent text-foreground px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all flex items-center justify-center gap-2">
                                Suggest
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
