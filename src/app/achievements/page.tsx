
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
import { ranks, getRank, calculateUserStats } from "@/lib/ranks";

const AchievementCard = ({ achievement, userStats }: { achievement: Achievement, userStats: UserStats | null }) => {
    const isUnlocked = userStats ? achievement.criteria(userStats) : false;
    
    if (!isUnlocked) {
        return (
            <div className="aspect-square rounded-[2rem] bg-card/50 border border-border relative flex flex-col items-center justify-center p-4 opacity-50 grayscale hover:opacity-70 transition-opacity">
                <div className="w-12 h-12 mb-3 bg-background/50 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-xs font-bold text-muted-foreground text-center">???</p>
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
            "aspect-square rounded-[2rem] bg-gradient-to-br from-card to-secondary relative group cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 transition-colors",
            borderColor
        )}>
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity", bgColor)}></div>
            <div className="w-16 h-16 mb-3 relative animate-float" style={{ animationDelay: `${Math.random()}s`}}>
                <DynamicIcon 
                    name={achievement.icon} 
                    className={cn("w-full h-full drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]", iconColor)}
                />
            </div>
            <p className="text-xs font-bold text-foreground text-center">{achievement.name}</p>
            <p className="text-[9px] text-center uppercase tracking-wider mt-1" style={{ color: iconColor.replace('text-', '')}}>{achievement.description}</p>
        </div>
    );
};

const MAX_SCORE = ranks[ranks.length - 1].score;

const PathToApex = ({ trustScore }: { trustScore: number }) => {
    const progressPercentage = Math.min((trustScore / MAX_SCORE) * 100, 100);
    
    const currentRank = useMemo(() => getRank(trustScore), [trustScore]);

    return (
         <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="p-8 rounded-[2.5rem] bg-card/40 border border-border relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                    <div>
                        <h2 className="font-display text-2xl font-bold text-foreground mb-1">Path to Apex</h2>
                        <p className="text-muted-foreground">Your current standing in the protocol.</p>
                    </div>
                    <div className="px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-bold shadow-sm shadow-primary/10 mt-4 md:mt-0">
                       Current Rank: <span className="text-foreground">{currentRank.name}</span>
                    </div>
                </div>
                
                <div className="relative h-4 bg-secondary rounded-full mb-12">
                    <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-zinc-600 via-primary to-white rounded-full shadow-[0_0_20px_hsla(var(--primary)/0.5)] transition-all duration-1000" 
                        style={{ width: `${progressPercentage}%`}}
                    ></div>
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full ring-4 ring-card shadow-[0_0_15px_white] animate-pulse transition-all duration-1000" 
                        style={{ left: `${progressPercentage}%` }}
                    ></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                    {ranks.map(rank => (
                        <div key={rank.name} className={cn("text-center md:text-left transition-opacity", trustScore >= rank.score ? "opacity-100" : "opacity-30")}>
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <DynamicIcon name={rank.icon} className={cn("w-4 h-4", trustScore >= rank.score ? "text-primary" : "text-muted-foreground")} />
                                <p className={cn("text-xs uppercase font-bold tracking-wider", trustScore >= rank.score ? "text-primary" : "text-muted-foreground")}>
                                    Rank {ranks.indexOf(rank) + 1}
                                </p>
                            </div>
                            <h3 className="text-foreground font-bold">{rank.name}</h3>
                            <p className="text-xs text-muted-foreground font-mono">{rank.score}+ Score</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

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
        let totalVolume = 0n;
        if (eventIds.length > 0) {
            userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, address);
            userBetsOnAllEvents.forEach(bet => {
                totalVolume += bet.yesAmount + bet.noAmount;
            });
        }
        
        const newStats = calculateUserStats(allEvents, userBetsOnAllEvents);
        
        let currentStreak = 0;
        let maxStreak = 0;
        const sortedEvents = allEvents
            .map((event, index) => ({ event, bet: userBetsOnAllEvents[index] }))
            .filter(({ bet }) => (bet.yesAmount > 0n || bet.noAmount > 0n))
            .sort((a, b) => (a.event.resolutionDate?.getTime() || 0) - (b.event.resolutionDate?.getTime() || 0));

        sortedEvents.forEach(({ event, bet }) => {
            if (event.status === 'finished' && event.winningOutcome) {
                const userWon = (bet.yesAmount > 0n && event.winningOutcome === 'YES') || (bet.noAmount > 0n && event.winningOutcome === 'NO');
                if (userWon) {
                    currentStreak++;
                } else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 0;
                }
            }
        });
        maxStreak = Math.max(maxStreak, currentStreak);
        setWinStreak(maxStreak);
        setVolume(Number(formatEther(totalVolume)));
        
        setStats(prevStats => {
            if (prevStats) {
                achievements.forEach(ach => {
                    const wasUnlocked = ach.criteria(prevStats);
                    const isNowUnlocked = ach.criteria(newStats);
                    if (!wasUnlocked && isNowUnlocked) {
                        addNotification({
                            title: `Artifact Unlocked!`,
                            description: `You've earned the "${ach.name}" artifact.`,
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
      console.error("Failed to fetch user stats for artifacts:", e);
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

  if (pageLoading) {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Artifacts"
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
        <PageHeader title="Artifacts" description="Milestones marking your prediction journey." />
        <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-8">
                <h2 className="font-display text-2xl font-bold text-foreground">Artifacts</h2>
                <div className="flex gap-2">
                     <span className="text-xs text-muted-foreground bg-card px-3 py-1.5 rounded-full border border-border">{achievements.filter(a => stats && a.criteria(stats)).length} / {achievements.length} Unlocked</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {achievements.map((ach) => (
                    <AchievementCard key={ach.id} achievement={ach} userStats={stats} />
                ))}
            </div>
        </div>

        <PathToApex trustScore={stats?.trustScore ?? 0} />
        
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

    