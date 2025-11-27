'use client';

import { useWallet } from "@/hooks/use-wallet";
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, AlertTriangle, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { blockchainService } from "@/services/blockchain";
import type { UserStats } from "@/lib/types";
import { calculateUserStats } from "@/lib/ranks";
import { Hex } from 'viem';

export function UserProfileStats() {
  const { address, connected, balance, balanceLoading, chain } = useWallet();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRank, setUserRank] = useState<{ rank: number; total: number } | null>(null);

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
            const stats = calculateUserStats(allEvents, userBetsOnAllEvents);
            return {
                id: bettor,
                trustScore: stats.trustScore,
                totalBets: stats.totalBets
            };
        }));
        
        const sortedLeaderboard = allUserStats.sort((a, b) => b.trustScore - a.trustScore || b.totalBets - a.totalBets);
        const currentUserIndex = sortedLeaderboard.findIndex(u => u.id.toLowerCase() === address.toLowerCase());
        
        if (currentUserIndex !== -1) {
            setUserRank({ rank: currentUserIndex + 1, total: sortedLeaderboard.length });
        }
        // --- End of rank calculation ---

        // --- Start of current user stats calc ---
        const userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, address);
        const newStats = calculateUserStats(allEvents, userBetsOnAllEvents);
        
        setStats(newStats);

    } catch (e: any) {
      console.error("Failed to fetch user stats for profile:", e);
      setError("Could not load your on-chain profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (connected) {
        fetchUserStatsAndRank();
    }
  }, [connected, fetchUserStatsAndRank]);
  
  if (loading && !stats) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
        </div>
    )
  }
  
  const accuracy = stats?.accuracy ?? 0;

  return (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 rounded-lg p-4 bg-secondary border">
                <p className="text-muted-foreground text-sm font-medium leading-normal">Balance</p>
                {balanceLoading ? <Skeleton className="h-8 w-24"/> : <p className="text-foreground tracking-light text-2xl font-bold leading-tight">{balance.toFixed(4)} {chain?.nativeCurrency.symbol}</p>}
            </div>
            <div className="flex flex-col gap-1 rounded-lg p-4 bg-secondary border">
                <p className="text-muted-foreground text-sm font-medium leading-normal">Accuracy</p>
                <p className="text-foreground tracking-light text-2xl font-bold leading-tight">{accuracy.toFixed(1)}%</p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg p-4 bg-secondary border">
                <p className="text-muted-foreground text-sm font-medium leading-normal">Trust Score</p>
                <p className="text-foreground tracking-light text-2xl font-bold leading-tight">{stats?.trustScore ?? '0'}</p>
            </div>
            <div className="flex flex-col gap-1 rounded-lg p-4 bg-secondary border">
                <p className="text-muted-foreground text-sm font-medium leading-normal flex items-center gap-1.5"><BarChart className="w-3.5 h-3.5"/>Global Rank</p>
                {userRank ? (
                    <p className="text-foreground tracking-light text-2xl font-bold leading-tight">
                        {userRank.rank} <span className="text-base font-medium text-muted-foreground">/ {userRank.total}</span>
                    </p>
                ) : (
                    loading ? <Skeleton className="h-8 w-20"/> : <p className="text-foreground tracking-light text-2xl font-bold leading-tight">N/A</p>
                )}
            </div>
        </div>

         { error && (
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
        )}
    </div>
  );
}
