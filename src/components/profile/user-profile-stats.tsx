
'use client';

import { useWallet } from "@/hooks/use-wallet";
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertTriangle, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { blockchainService } from "@/services/blockchain";
import type { UserStats } from "@/lib/types";
import { useNotifications } from '@/lib/state/notifications';
import { achievements } from "@/lib/achievements";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Hex, formatEther } from 'viem';
import { useSettings } from "@/lib/state/settings";

const getTier = (score: number) => {
    if (score < 10) return { tier: "Rookie", color: "text-gray-400" };
    if (score < 50) return { tier: "Analyst", color: "text-blue-400" };
    if (score < 150) return { tier: "Intuitive", color: "text-indigo-400" };
    return { tier: "Oracle", color: "text-yellow-400" };
}


export function UserProfileStats() {
  const { address, connected, balance, balanceLoading, chain } = useWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<{ rank: number; total: number } | null>(null);
  const { addNotification } = useNotifications();
  const router = useRouter();
  const { settings } = useSettings();

  const username = useMemo(() => {
    if (settings.username) return settings.username;
    if (!address) return "Not Connected";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address, settings.username]);

  const fetchUserStatsAndRank = useCallback(async () => {
    if (!address) {
        setLoading(false);
        return;
    };
    setLoading(true);
    setError(null);
    try {
        const allEvents = await blockchainService.getAllEvents();
        const eventIds = allEvents.map(e => BigInt(e.id));
        
        if (eventIds.length === 0) {
          setStats({ wins: 0, losses: 0, totalBets: 0, accuracy: 0, trustScore: 0 });
          setLoading(false);
          return;
        }
        
        // --- Start of combined fetch ---
        const allLogs = await blockchainService.getAllLogs();
        const bettors = new Set<Hex>();
        allLogs.betPlaced.forEach(log => { if (log.user) bettors.add(log.user); });
        const bettorsArray = Array.from(bettors);

        const allUserStats = await Promise.all(bettorsArray.map(async (bettor) => {
            const userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, bettor);
            let wins = 0;
            let losses = 0;

            userBetsOnAllEvents.forEach((bet, index) => {
                const event = allEvents[index];
                const hasBet = bet.yesAmount > 0n || bet.noAmount > 0n;
                if (event && hasBet && event.status === 'finished' && event.winningOutcome) {
                    const stakedOnYes = bet.yesAmount > 0n;
                    if (stakedOnYes) {
                        if (event.winningOutcome === 'YES') wins++; else losses++;
                    } else {
                        if (event.winningOutcome === 'NO') wins++; else losses++;
                    }
                }
            });
            const totalBets = wins + losses;
            return {
                id: bettor,
                trustScore: (wins * 5) - (losses * 2),
                totalBets: totalBets
            };
        }));
        
        const sortedLeaderboard = allUserStats.sort((a, b) => b.trustScore - a.trustScore || b.totalBets - a.totalBets);
        const currentUserIndex = sortedLeaderboard.findIndex(u => u.id.toLowerCase() === address.toLowerCase());
        
        if (currentUserIndex !== -1) {
            setUserRank({ rank: currentUserIndex + 1, total: sortedLeaderboard.length });
        }
        // --- End of rank calculation ---

        // --- Start of current user stats calc (can be optimized but fine for now) ---
        const userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, address);
        let wins = 0;
        let losses = 0;
        userBetsOnAllEvents.forEach((bet, index) => {
            const event = allEvents[index];
            if (event && (bet.yesAmount > 0n || bet.noAmount > 0n) && event.status === 'finished' && event.winningOutcome) {
                const stakedOnYes = bet.yesAmount > 0n;
                if ((stakedOnYes && event.winningOutcome === 'YES') || (!stakedOnYes && event.winningOutcome === 'NO')) {
                    wins++;
                } else {
                    losses++;
                }
            }
        });

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
      console.error("Failed to fetch user stats for profile:", e);
      setError("Could not load your on-chain profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [address, addNotification]);

  useEffect(() => {
    if (connected) {
        fetchUserStatsAndRank();
    }
  }, [connected, fetchUserStatsAndRank]);

  const userTier = useMemo(() => {
      if (!stats) return { tier: "Rookie", color: "text-gray-400" };
      return getTier(stats.trustScore);
  }, [stats]);
  
  if (loading && !stats) {
    return (
        <div className="space-y-6">
             <div className="p-4">
                <div className="flex gap-4 items-center h-32">
                    <Skeleton className="w-32 h-32 rounded-full shrink-0" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-5 w-24" />
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4 p-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
        </div>
    )
  }
  
  const accuracy = stats?.accuracy ?? 0;

  return (
    <div className="space-y-8">
        <div className="p-4 @container">
            <div className="flex w-full flex-col @[520px]:flex-row items-center justify-between gap-6">
                <div className="flex flex-col @[480px]:flex-row items-center gap-6 text-center @[480px]:text-left">
                    <div className="relative w-36 h-36 shrink-0">
                        <svg className="absolute inset-0" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" fill="none" r="56" stroke="hsl(var(--secondary))" strokeWidth="8"></circle>
                            <circle 
                                className="transform -rotate-90 origin-center transition-all duration-1000" 
                                cx="60" cy="60" fill="none" r="56" 
                                stroke="hsl(var(--primary))" 
                                strokeDasharray={352} 
                                strokeDashoffset={352 - (352 * accuracy) / 100} 
                                strokeLinecap="round" strokeWidth="8"
                            ></circle>
                        </svg>
                         <div className="absolute inset-0 flex items-center justify-center">
                            <Avatar className="w-28 h-28 border-4 border-background">
                                <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`} alt="User Avatar" />
                                <AvatarFallback>{address?.slice(2,4) || '??'}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center">
                        <p className="text-foreground text-2xl font-bold leading-tight tracking-tight">{username}</p>
                        <p className={`text-lg font-semibold leading-normal ${userTier.color}`}>{userTier.tier} Predictor</p>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => router.push('/my-bets')} className="w-full @[480px]:w-auto">View My Bets</Button>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
            <div className="flex flex-col gap-1 rounded-lg p-4 bg-card border">
                <p className="text-muted-foreground text-sm font-medium leading-normal">Balance</p>
                {balanceLoading ? <Skeleton className="h-8 w-24"/> : <p className="text-foreground tracking-light text-2xl font-bold leading-tight">{balance.toFixed(4)} {chain?.nativeCurrency.symbol}</p>}
            </div>
            <div className="flex flex-col gap-1 rounded-lg p-4 bg-card border">
                <p className="text-muted-foreground text-sm font-medium leading-normal">Accuracy</p>
                <p className="text-foreground tracking-light text-2xl font-bold leading-tight">{accuracy.toFixed(1)}%</p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg p-4 bg-card border">
                <p className="text-muted-foreground text-sm font-medium leading-normal">Trust Score</p>
                <p className="text-foreground tracking-light text-2xl font-bold leading-tight">{stats?.trustScore ?? '0'}</p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg p-4 bg-card border">
                <p className="text-muted-foreground text-sm font-medium leading-normal flex items-center gap-1.5"><BarChart className="w-3.5 h-3.5"/>Global Rank</p>
                {userRank ? (
                    <p className="text-foreground tracking-light text-2xl font-bold leading-tight">
                        {userRank.rank} <span className="text-base font-medium text-muted-foreground">/ {userRank.total}</span>
                    </p>
                ) : (
                    <p className="text-foreground tracking-light text-2xl font-bold leading-tight">N/A</p>
                )}
            </div>
        </div>

         { error && (
          <div className="px-4">
             <Alert variant="destructive" className="bg-card">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Data Fetch Error</AlertTitle>
                <AlertDescription>
                    <p>{error}</p>
                     <Button onClick={fetchUserStatsAndRank} className="mt-4 w-full">
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
