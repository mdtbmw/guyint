
'use client';

import { useWallet } from "@/hooks/use-wallet";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { DynamicIcon } from "@/lib/icons";
import { blockchainService } from "@/services/blockchain";
import type { UserStats, Achievement } from "@/lib/types";
import { achievements } from "@/lib/achievements";
import { useNotifications } from '@/lib/state/notifications';
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useSettings } from "@/lib/state/settings";
import { formatEther } from "viem";
import { UserIDCard } from "@/components/profile/user-id-card";

const AchievementCard = ({ achievement, userStats }: { achievement: Achievement, userStats: UserStats | null }) => {
    const isUnlocked = userStats ? achievement.criteria(userStats) : false;
    
    if (!isUnlocked) {
        return (
            <div className="aspect-square rounded-[2rem] bg-obsidian border border-white/5 relative flex flex-col items-center justify-center p-4 opacity-50 grayscale hover:opacity-70 transition-opacity">
                <div className="w-12 h-12 mb-3 bg-white/5 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-xs font-bold text-zinc-500 text-center">???</p>
                <p className="text-[9px] text-zinc-700 text-center uppercase tracking-wider mt-1">Hidden</p>
            </div>
        )
    }

    const iconColor = useMemo(() => {
        if (achievement.name.includes("Genesis")) return "text-gold-400";
        if (achievement.name.includes("Slayer")) return "text-emerald-400";
        if (achievement.name.includes("Oracle")) return "text-purple-400";
        return "text-blue-400";
    }, [achievement.name]);

    const borderColor = useMemo(() => {
        if (achievement.name.includes("Genesis")) return "border-gold-500/30 hover:border-gold-500";
        if (achievement.name.includes("Slayer")) return "border-emerald-500/30 hover:border-emerald-500";
        if (achievement.name.includes("Oracle")) return "border-purple-500/30 hover:border-purple-500";
        return "border-blue-500/30 hover:border-blue-500";
    }, [achievement.name]);
    
     const bgColor = useMemo(() => {
        if (achievement.name.includes("Genesis")) return "bg-gold-500/5";
        if (achievement.name.includes("Slayer")) return "bg-emerald-500/5";
        if (achievement.name.includes("Oracle")) return "bg-purple-500/5";
        return "bg-blue-500/5";
    }, [achievement.name]);

    return (
        <div className={cn(
            "aspect-square rounded-[2rem] bg-gradient-to-br from-charcoal to-obsidian relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 transition-colors",
            borderColor
        )}>
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity", bgColor)}></div>
            <div className="w-16 h-16 mb-3 relative animate-float" style={{ animationDelay: `${Math.random()}s`}}>
                <DynamicIcon 
                    name={achievement.icon} 
                    className={cn("w-full h-full drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]", iconColor)}
                />
            </div>
            <p className="text-xs font-bold text-white text-center">{achievement.name}</p>
            <p className="text-[9px] text-center uppercase tracking-wider mt-1" style={{ color: iconColor.replace('text-', '')}}>{achievement.description}</p>
        </div>
    );
};


export default function AchievementsPage() {
  const { isLoading: isAuthLoading } = useAuthGuard();
  const { address } = useWallet();
  const { settings } = useSettings();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [volume, setVolume] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();

  const username = useMemo(() => settings.username || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "User"), [address, settings.username]);
  
  const fetchUserStats = useCallback(async () => {
    if (!address) {
        setLoading(false);
        return;
    };
    setLoading(true);
    setError(null);
    try {
        const allEvents = await blockchainService.getAllEvents();
        const eventIds = allEvents.map(e => BigInt(e.id));
        
        let userBetsOnAllEvents: any[] = [];
        if (eventIds.length > 0) {
            userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, address);
        }

        let wins = 0;
        let losses = 0;
        let currentStreak = 0;
        let maxStreak = 0;
        let totalVolume = 0n;

        // Sort events by resolution date to calculate streak accurately
        const sortedEvents = allEvents
            .map((event, index) => ({ event, bet: userBetsOnAllEvents[index] }))
            .filter(({ bet }) => bet.yesAmount > 0n || bet.noAmount > 0n)
            .sort((a, b) => (a.event.resolutionDate?.getTime() || 0) - (b.event.resolutionDate?.getTime() || 0));

        sortedEvents.forEach(({ event, bet }) => {
            const stakedOnYes = bet.yesAmount > 0n;
            totalVolume += bet.yesAmount + bet.noAmount;

            if (event.status === 'finished' && event.winningOutcome) {
                const userWon = (stakedOnYes && event.winningOutcome === 'YES') || (!stakedOnYes && event.winningOutcome === 'NO');
                if (userWon) {
                    wins++;
                    currentStreak++;
                } else {
                    losses++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 0;
                }
            }
        });
        maxStreak = Math.max(maxStreak, currentStreak);
        setWinStreak(maxStreak);
        setVolume(Number(formatEther(totalVolume)));
        
        const totalBets = wins + losses;
        const accuracy = totalBets > 0 ? (wins / totalBets) * 100 : 0;
        const trustScore = (wins * 5) - (losses * 2);

        const newStats = { wins, losses, totalBets, accuracy, trustScore };
        
        setStats(prevStats => {
            if (prevStats) {
                achievements.forEach(ach => {
                    const wasUnlocked = ach.criteria(prevStats);
                    const isNowUnlocked = ach.criteria(newStats);
                    if (!wasUnlocked && isNowUnlocked) {
                        addNotification({
                            title: `Achievement Unlocked!`,
                            description: `You've earned the "${ach.name}" achievement.`,
                            icon: ach.icon,
                            href: '/achievements',
                            type: 'general'
                        });
                    }
                });
            }
            return newStats;
        });

    } catch (e: any) {
      console.error("Failed to fetch user stats for achievements:", e);
      setError("Could not load your on-chain profile data. The network may be busy.");
    } finally {
      setLoading(false);
    }
  }, [address, addNotification]);

  useEffect(() => {
    if (!isAuthLoading && address) {
        fetchUserStats();
    }
    if (!isAuthLoading && !address) {
        setLoading(false);
    }
  }, [isAuthLoading, address, fetchUserStats]);
  
  const pageLoading = isAuthLoading || (loading && !stats);

  const trustScore = stats?.trustScore ?? 0;
  const trustScorePercentage = Math.min((trustScore / 150) * 100, 100); // Assume 150 is a good score for "Apex"

  if (pageLoading) {
    return (
        <div className="space-y-6">
              <PageHeader 
                title="Your Achievements"
                description="Milestones that mark your prediction journey."
              />
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {Array.from({length: 6}).map((_, i) => (
                    <Skeleton key={i} className="aspect-square w-full rounded-[2rem]" />
                ))}
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-12">
        <div className="flex flex-col xl:flex-row gap-8 items-start animate-slide-up">
            <UserIDCard user={{ name: username, address }} stats={stats} />
            <div className="w-full xl:w-3/5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-[2rem] bg-charcoal/60 border border-white/5 backdrop-blur-md flex flex-col justify-between h-full group hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                        <DynamicIcon name="Crosshair" className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-3xl font-display font-bold text-white mb-1">{(stats?.accuracy ?? 0).toFixed(1)}%</p>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Win Rate</p>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${stats?.accuracy ?? 0}%`}}></div>
                    </div>
                </div>
                 <div className="p-6 rounded-[2rem] bg-charcoal/60 border border-white/5 backdrop-blur-md flex flex-col justify-between h-full group hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mb-4 border border-gold-500/20 group-hover:scale-110 transition-transform">
                        <DynamicIcon name="Coins" className="w-5 h-5 text-gold-500" />
                    </div>
                    <div>
                        <p className="text-3xl font-display font-bold text-white mb-1">${volume.toLocaleString()}</p>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Volume</p>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500 w-[75%]"></div>
                    </div>
                </div>
                 <div className="p-6 rounded-[2rem] bg-charcoal/60 border border-white/5 backdrop-blur-md flex flex-col justify-between h-full group hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/20 group-hover:scale-110 transition-transform">
                        <DynamicIcon name="Zap" className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-3xl font-display font-bold text-white mb-1">{winStreak}</p>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Win Streak</p>
                    </div>
                    <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${Math.min(winStreak / 10, 1) * 100}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-bold text-white">Artifacts</h2>
                <div className="flex gap-2">
                     <span className="text-xs text-zinc-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">{achievements.filter(a => stats && a.criteria(stats)).length} / {achievements.length} Unlocked</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {achievements.map((ach) => (
                    <AchievementCard key={ach.id} achievement={ach} userStats={stats} />
                ))}
            </div>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="p-8 rounded-[2.5rem] bg-charcoal/40 border border-white/5 relative overflow-hidden">
                <h2 className="font-display text-2xl font-bold text-white mb-8 relative z-10">The Path to Apex</h2>
                
                <div className="relative h-4 bg-zinc-900 rounded-full mb-12">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-zinc-600 via-gold-500 to-white rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)]" style={{ width: `${trustScorePercentage}%`}}></div>
                    <div className="absolute top-1/2 -translate-y-1/2 left-[10%] w-4 h-4 bg-gold-500 rounded-full ring-4 ring-charcoal"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 left-[40%] w-4 h-4 bg-gold-500 rounded-full ring-4 ring-charcoal"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full ring-4 ring-charcoal shadow-[0_0_15px_white] animate-pulse" style={{ left: `${trustScorePercentage}%` }}></div>
                    <div className="absolute top-1/2 -translate-y-1/2 left-[95%] w-4 h-4 bg-zinc-800 rounded-full ring-4 ring-charcoal"></div>
                </div>

                <div className="grid grid-cols-4 gap-4 relative z-10">
                    <div className={cn(trustScorePercentage >= 0 ? "opacity-100" : "opacity-30")}>
                        <p className="text-xs text-gold-500 uppercase font-bold mb-1">Rank 1</p>
                        <h3 className="text-white font-bold">Initiate</h3>
                    </div>
                    <div className={cn(trustScorePercentage >= 33 ? "opacity-100" : "opacity-30")}>
                        <p className="text-xs text-gold-500 uppercase font-bold mb-1">Rank 2</p>
                        <h3 className="text-white font-bold">Analyst</h3>
                    </div>
                    <div className={cn(trustScorePercentage >= 66 ? "opacity-100" : "opacity-30")}>
                        <p className="text-xs text-white uppercase font-bold mb-1">Current</p>
                        <h3 className="text-2xl text-white font-display font-bold">Sigma</h3>
                    </div>
                     <div className={cn(trustScorePercentage >= 95 ? "opacity-100" : "opacity-30")}>
                        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Rank 4</p>
                        <h3 className="text-white font-bold">Apex</h3>
                    </div>
                </div>
            </div>
        </div>

        { error && (
          <div className="px-4">
             <Alert variant="destructive" className="bg-card">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Data Fetch Error</AlertTitle>
                <AlertDescription>
                    <p>{error}</p>
                     <Button onClick={fetchUserStats} className="mt-4 w-full">
                        <RefreshCw className="w-4 h-4 mr-2"/>
                        Retry
                    </Button>
                </AlertDescription>
            </Alert>
          </div>
        )}
        
    </div>
  );
}
