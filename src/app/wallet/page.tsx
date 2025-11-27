

'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { Activity, ArrowUpRight, ShieldCheck, Lock, Eye, EyeOff, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Globe, Star, Coins, Crosshair, PackageOpen, PlugZap, ArrowDownLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { EarningsDashboard } from "@/components/profile/earnings-dashboard";
import Link from "next/link";
import { useSettings } from "@/lib/state/settings";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { UserStats, Event } from "@/lib/types";
import { blockchainService } from "@/services/blockchain";
import { calculateUserStats } from "@/lib/ranks";
import { DynamicIcon } from "@/lib/icons";
import { formatEther, Hex } from "viem";
import { PnlChart } from "@/components/profile/pnl-chart";
import { Logo } from "@/components/ui/logo";

type UnifiedLog = {
    type: 'Bet' | 'Claim' | 'Refund';
    eventQuestion: string;
    amount: number;
    timestamp: Date;
    outcome?: 'YES' | 'NO';
};

export default function WalletPage() {
    useAuthGuard();
    const { balance, balanceLoading, address, chain } = useWallet();
    const { settings } = useSettings();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [activeBets, setActiveBets] = useState<{ count: number; totalStaked: number }>({ count: 0, totalStaked: 0 });
    const [activityLogs, setActivityLogs] = useState<UnifiedLog[]>([]);
    const [isClient, setIsClient] = useState(false);

    const [isPrivate, setIsPrivate] = useState(true);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);
  
    const shortAddress = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '';
    const username = settings.username || shortAddress;

    useEffect(() => {
        const card = cardRef.current;
        if (!card || window.matchMedia("(max-width: 1024px)").matches) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 30;
            const rotateY = (centerX - x) / 30;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
        };

        const handleMouseLeave = () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        };

        card.addEventListener('mousemove', handleMouseMove);
        card.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            if (card) {
                card.removeEventListener('mousemove', handleMouseMove);
                card.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, [cardRef]);

    const fetchWalletData = useCallback(async () => {
      if (!address) return;
      try {
        const [allEvents, allLogs] = await Promise.all([
            blockchainService.getAllEvents(),
            blockchainService.getAllLogs(address)
        ]);

        if (allEvents.length === 0) {
            setStats({ wins: 0, losses: 0, totalBets: 0, accuracy: 0, trustScore: 0 });
            setActiveBets({ count: 0, totalStaked: 0 });
            setActivityLogs([]);
            return;
        }

        const eventIds = allEvents.map(e => BigInt(e.id));
        const userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, address);
        
        const userStats = calculateUserStats(allEvents, userBetsOnAllEvents);
        setStats(userStats);

        let totalStaked = 0n;
        let activeBetCount = 0;
        userBetsOnAllEvents.forEach((bet, index) => {
            const event = allEvents[index];
            if(event.status === 'open') {
                const stakedAmount = bet.yesAmount + bet.noAmount;
                if (stakedAmount > 0n) {
                    totalStaked += stakedAmount;
                    activeBetCount++;
                }
            }
        });
        setActiveBets({ count: activeBetCount, totalStaked: Number(formatEther(totalStaked))});

        const eventsMap = new Map(allEvents.map(e => [e.id, e]));
        const combinedLogs: UnifiedLog[] = [];

        allLogs.betPlaced.forEach(log => {
            const event = eventsMap.get(String(log.eventId));
            combinedLogs.push({
                type: 'Bet',
                eventQuestion: event?.question || `Event #${log.eventId}`,
                amount: -Number(formatEther(log.amount || 0n)),
                timestamp: new Date(Number(log.blockNumber) * 1000), // Approximate time
                outcome: log.outcome ? 'YES' : 'NO'
            });
        });

        allLogs.winningsClaimed.forEach(log => {
            const event = eventsMap.get(String(log.eventId));
            combinedLogs.push({
                type: 'Claim',
                eventQuestion: event?.question || `Event #${log.eventId}`,
                amount: Number(formatEther(log.amount || 0n)),
                timestamp: new Date(Number(log.blockNumber) * 1000)
            });
        });
        
        allLogs.eventCanceled.forEach(log => {
             const event = eventsMap.get(String(log.eventId));
             // Find original bet to get refund amount
             const originalBet = userBetsOnAllEvents.find((b, i) => allEvents[i].id === String(log.eventId));
             const refundAmount = originalBet ? originalBet.yesAmount + originalBet.noAmount : 0n;

             if (refundAmount > 0) {
                 combinedLogs.push({
                    type: 'Refund',
                    eventQuestion: event?.question || `Event #${log.eventId}`,
                    amount: Number(formatEther(refundAmount)),
                    timestamp: new Date(Number(log.blockNumber) * 1000)
                });
             }
        });

        combinedLogs.sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

        setActivityLogs(combinedLogs.slice(0, 5));

      } catch (error) {
        console.error("Failed to fetch user wallet data:", error);
      }
    }, [address]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const totalAssets = balance + activeBets.totalStaked;

    const getPercentage = (value: number) => {
        if (totalAssets === 0) return '0%';
        return `${((value / totalAssets) * 100).toFixed(0)}%`;
    }

    const LedgerIcon = ({ type }: { type: UnifiedLog['type'] }) => {
        switch (type) {
            case 'Bet': return <ArrowUpRight className="w-4 h-4" />;
            case 'Claim': return <ArrowDownLeft className="w-4 h-4" />;
            case 'Refund': return <PackageOpen className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const LedgerColor = ({ type }: { type: UnifiedLog['type'] }) => {
        switch (type) {
            case 'Bet': return "bg-rose-900/10 border-rose-500/20";
            case 'Claim': return "bg-emerald-900/10 border-emerald-500/20";
            case 'Refund': return "bg-white/[0.02] border-white/10";
            default: return "bg-secondary";
        }
    };
     const LedgerIconColor = ({ type }: { type: UnifiedLog['type'] }) => {
        switch (type) {
            case 'Bet': return "bg-rose-500/20 text-rose-500";
            case 'Claim': return "bg-emerald-500/20 text-emerald-500";
            case 'Refund': return "bg-blue-500/20 text-blue-500";
            default: return "bg-secondary";
        }
    };

    return (
        <div className="space-y-10 md:space-y-12">
            <div className="animate-slide-up">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <PageHeader 
                        title="Executive Command Center"
                        description="Capital is your tool. Mastery is the outcome."
                    />
                    <EarningsDashboard />
                </div>
            </div>
            
            <div className="grid xl:grid-cols-3 gap-8 items-start">
                <div className="xl:col-span-2 card-container animate-slide-up">
                    <div ref={cardRef} className="vault-card relative w-full aspect-[2.1] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/60 group cursor-default glass-panel">
                        <div className="absolute inset-0 bg-holographic bg-[length:200%_200%] opacity-20 group-hover:opacity-40 mix-blend-overlay pointer-events-none"></div>
                        <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 blur-[60px] animate-pulse-slow"></div>

                        <div className="relative z-10 p-6 md:p-10 flex flex-col justify-between h-full rounded-[2.5rem]">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm">
                                    <Lock className="w-3 h-3 text-emerald-500"/>
                                    <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-widest">Encrypted Vault L2</span>
                                </div>
                                <button onClick={() => setIsPrivate(!isPrivate)} className="text-zinc-500 hover:text-white transition-colors active-press">
                                    {isPrivate ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-end mt-auto">
                                <div className="max-w-md">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Liquid Capital ({chain?.nativeCurrency.symbol})</p>
                                    {balanceLoading ? <Skeleton className="h-16 w-64 mt-1" /> : (
                                        <h1 className={cn("text-4xl md:text-6xl font-display font-bold text-white tracking-tight drop-shadow-lg font-mono", isPrivate && "privacy-blur")}
                                            onClick={() => setIsPrivate(false)}>
                                            {balance.toFixed(4)}
                                        </h1>
                                    )}
                                    <p className="text-sm text-zinc-400 font-mono mt-2">
                                        Address: <span className="text-primary">{shortAddress}</span>
                                    </p>
                                </div>
                                <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-center shrink-0 w-32 backdrop-blur-sm shadow-xl">
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Trust Score</p>
                                    <h3 className="text-2xl font-display font-bold text-primary">{stats?.trustScore?.toFixed(1) ?? '0.0'}</h3>
                                    <p className="text-[10px] font-mono text-emerald-400 mt-0.5">+0.01 Daily</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="xl:col-span-1 space-y-6 animate-slide-up" style={{animationDelay: '100ms'}}>
                    <div className="glass-panel rounded-[2.5rem] p-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Tactical Deployment</h2>
                        <div className="grid grid-cols-2 gap-4">
                             <Button asChild variant="outline" className="active-press flex flex-col items-center justify-center gap-2 p-5 h-auto rounded-2xl bg-white/5 border-white/10 hover:bg-blue-500/10 text-blue-400 hover:border-blue-500/30 transition-all group shadow-md">
                                <Link href="https://app.uniswap.org/swap?outputChain=unichain" target="_blank" rel="noopener noreferrer">
                                    <ArrowLeftRight className="w-6 h-6"/>
                                    <span className="text-xs font-bold uppercase">Swap</span>
                                </Link>
                            </Button>
                             <Button asChild variant="outline" className="active-press flex flex-col items-center justify-center gap-2 p-5 h-auto rounded-2xl bg-white/5 border-white/10 hover:bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/30 transition-all group shadow-md">
                                 <Link href="https://portal.intuition.systems/bridge" target="_blank" rel="noopener noreferrer">
                                    <Globe className="w-6 h-6"/>
                                    <span className="text-xs font-bold uppercase">Bridge</span>
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid xl:grid-cols-5 gap-8">
                 <div className="xl:col-span-3 animate-slide-up" style={{animationDelay: '200ms'}}>
                    {isClient ? <PnlChart /> : <Skeleton className="h-full w-full min-h-[380px] rounded-[2.5rem] glass-panel" />}
                </div>
                 <div className="xl:col-span-2 space-y-8 animate-slide-up" style={{animationDelay: '300ms'}}>
                     <div className="glass-panel rounded-[2.5rem] p-6 md:p-8 h-full flex flex-col">
                        <h2 className="font-display text-xl font-bold text-white flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                            <ShieldCheck className="w-5 h-5 text-primary" /> Trust Protocol Staking
                        </h2>
                        
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between text-sm font-mono">
                                <span className="text-zinc-500">Current APR:</span>
                                <span className="text-primary font-bold">12.5%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-mono pb-4 border-b border-white/5">
                                <span className="text-zinc-500">My Staked $TRUST:</span>
                                <span className="text-white font-bold">10,000.00</span>
                            </div>
                        </div>
                        
                        <div className="bg-black/40 rounded-xl p-4 border border-primary/30 mt-auto">
                            <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1 block">Stake Amount</label>
                            <div className="flex items-center gap-2">
                                <input type="number" defaultValue="500" className="w-full bg-transparent text-xl font-mono font-bold text-white outline-none" min="1" step="10" disabled />
                            </div>
                        </div>
                        
                        <div className="mt-4 flex gap-3">
                            <button className="active-press flex-1 py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors" disabled>Stake</button>
                            <button className="active-press flex-1 py-3 rounded-xl bg-rose-500 text-black font-bold text-sm uppercase shadow-lg shadow-rose-500/20 hover:bg-rose-400 transition-colors" disabled>Unstake</button>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-3 text-center">Staking feature coming soon. Locks for 7 days. Returns auto-compound.</p>
                    </div>
                </div>
            </div>

            <div className="grid xl:grid-cols-5 gap-8">
                 <div className="xl:col-span-2 animate-slide-up" style={{animationDelay: '400ms'}}>
                    <div className="glass-panel rounded-[2.5rem] p-6 md:p-8 h-full flex flex-col">
                        <h2 className="font-display text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">Asset Geometry</h2>
                        
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                        <Coins className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">$TRUST (Liquid)</p>
                                        <p className="text-[10px] text-zinc-500">{getPercentage(balance)} of Total</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono font-bold text-white">{balance.toFixed(2)} T</p>
                                    <p className="text-[10px] text-zinc-500">${balance.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                        <DynamicIcon name="DollarSign" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">USDC (Reserve)</p>
                                        <p className="text-[10px] text-zinc-500">0% of Total</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono font-bold text-white">0.00 USDC</p>
                                    <p className="text-[10px] text-zinc-500">$0.00</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                                        <Crosshair className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Active Stakes (Locked)</p>
                                        <p className="text-[10px] text-zinc-500">{getPercentage(activeBets.totalStaked)} of Total</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-mono font-bold text-white">{activeBets.totalStaked.toFixed(2)} $TRUST</p>
                                    <p className="text-[10px] text-zinc-500">Deployed</p>
                                </div>
                            </div>
                        </div>
                        
                        <button className="mt-6 w-full py-3 rounded-xl border border-white/10 text-xs font-bold uppercase text-zinc-400 hover:text-white hover:bg-white/5 transition-colors active-press">
                            View Full Allocation
                        </button>
                    </div>
                </div>

                <div className="xl:col-span-3 animate-slide-up" style={{animationDelay: '500ms'}}>
                    <div className="glass-panel rounded-[2.5rem] p-6 md:p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-display text-xl font-bold text-white">Activity Ledger (L2)</h2>
                            <button className="text-[10px] font-bold uppercase text-primary hover:text-primary/80">View Explorer</button>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto pr-2 no-scrollbar">
                            {activityLogs.length > 0 ? activityLogs.map((log, index) => (
                                <div key={index} className={cn("flex items-center justify-between p-4 rounded-2xl", LedgerColor({type: log.type}))}>
                                    <div className="flex items-center gap-4">
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", LedgerIconColor({type: log.type}))}>
                                            <LedgerIcon type={log.type} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">{log.type}: {log.eventQuestion}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">
                                                {shortAddress} • {log.timestamp.toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={cn("text-sm font-mono font-bold", log.amount >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                                        {log.amount >= 0 ? '+' : ''}{log.amount.toFixed(2)}
                                    </p>
                                </div>
                            )) : (
                                <div className="text-center text-zinc-500 text-sm py-10">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
