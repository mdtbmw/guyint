
'use client';
import { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Crown, Award, Medal, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { blockchainService } from "@/services/blockchain";
import { Hex, formatEther } from "viem";

const ITEMS_PER_PAGE = 10;

interface LeaderboardUser {
    id: Hex;
    username: string;
    avatar: string;
    wins: number;
    losses: number;
    totalBets: number;
    accuracy: number;
    trustScore: number;
    totalWagered: number;
}

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-orange-400" />;
    return <span className="font-semibold text-sm text-muted-foreground w-6 text-center">{rank}</span>
}

export function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'accuracy' | 'trustScore'>('accuracy');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const allEvents = await blockchainService.getAllEvents();
            
            if (allEvents.length === 0) {
                setLeaderboardData([]);
                setLoading(false);
                return;
            }

            const allLogs = await blockchainService.getAllLogs();
            const bettors = new Set<Hex>();
            allLogs.betPlaced.forEach(log => {
                if (log.user) {
                    bettors.add(log.user);
                }
            });
            const bettorsArray = Array.from(bettors);

            if (bettorsArray.length === 0) {
                setLeaderboardData([]);
                setLoading(false);
                return;
            }
            
            const eventIds = allEvents.map(e => BigInt(e.id));
            const userStatsPromises = bettorsArray.map(async (bettor) => {
                const userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, bettor);

                let wins = 0;
                let losses = 0;
                let totalWagered = 0n;

                userBetsOnAllEvents.forEach((bet, index) => {
                    const event = allEvents[index];
                    const hasBet = bet.yesAmount > 0n || bet.noAmount > 0n;
                    if (!hasBet) return;
                    
                    if (event && event.status === 'finished' && event.winningOutcome) {
                         const stakedOnYes = bet.yesAmount > 0n;
                         if (stakedOnYes) {
                            if (event.winningOutcome === 'YES') wins++; else losses++;
                         } else { // Staked on NO
                             if (event.winningOutcome === 'NO') wins++; else losses++;
                         }
                    }
                    totalWagered += bet.yesAmount + bet.noAmount;
                });
                
                const totalBets = wins + losses;
                const accuracy = totalBets > 0 ? (wins / totalBets) * 100 : 0;
                const trustScore = (wins * 5) - (losses * 2);

                return {
                    id: bettor,
                    username: `${bettor.slice(0, 6)}...${bettor.slice(-4)}`,
                    avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${bettor}`,
                    wins,
                    losses,
                    totalBets,
                    accuracy,
                    trustScore,
                    totalWagered: Number(formatEther(totalWagered))
                };
            });

            const usersWithStats = await Promise.all(userStatsPromises);
            setLeaderboardData(usersWithStats);

        } catch (err: any) {
            console.error("Failed to fetch leaderboard data:", err);
            setError("Could not load leaderboard data. The network may be busy.");
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [activeTab]);

    const sortedLeaderboard = useMemo(() => {
        return [...leaderboardData].sort((a, b) => {
            if (activeTab === 'accuracy') {
                return b.accuracy - a.accuracy || b.totalBets - a.totalBets;
            }
            return b.trustScore - a.trustScore || b.totalBets - a.totalBets;
        });
    }, [leaderboardData, activeTab]);

    const visibleUsers = useMemo(() => sortedLeaderboard.slice(0, visibleCount), [sortedLeaderboard, visibleCount]);
    const canLoadMore = visibleCount < sortedLeaderboard.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + ITEMS_PER_PAGE);
    };

    const getRowStyle = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-r from-primary/10 via-card to-card border border-primary/30";
        if (rank === 2) return "bg-gradient-to-r from-zinc-500/10 via-card to-card border border-zinc-500/30";
        if (rank === 3) return "bg-gradient-to-r from-orange-600/10 via-card to-card border border-orange-600/30";
        return "bg-card";
    }
    
    const getFormattedValue = (user: LeaderboardUser) => {
        if (activeTab === 'accuracy') {
            return `${user.accuracy.toFixed(1)}% Accuracy`;
        }
        return `${user.trustScore} Trust Score`;
    }

    if (loading) {
        return (
             <div className="flex flex-col gap-2 px-4 mt-4">
                {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-secondary">
                        <Skeleton className="w-6 h-6"/>
                        <Skeleton className="w-10 h-10 rounded-full"/>
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24"/>
                            <Skeleton className="h-3 w-16"/>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
             <div className="px-4 mt-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Leaderboard</AlertTitle>
                    <AlertDescription>
                        <p>{error}</p>
                         <Button onClick={fetchLeaderboard} variant="destructive" className="mt-4 w-full">
                            <RefreshCw className="w-4 h-4 mr-2"/>
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div>
            <div className="flex overflow-x-auto [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 mb-4">
                <div className="flex items-center gap-2 p-1 rounded-lg bg-secondary">
                    <button onClick={() => setActiveTab('accuracy')} className={cn("flex cursor-pointer items-center justify-center rounded-md h-9 px-4 text-sm leading-normal", activeTab === 'accuracy' ? 'bg-background text-foreground font-bold shadow-sm' : 'text-muted-foreground font-medium')}>Most Accurate</button>
                    <button onClick={() => setActiveTab('trustScore')} className={cn("flex cursor-pointer items-center justify-center rounded-md h-9 px-4 text-sm leading-normal", activeTab === 'trustScore' ? 'bg-background text-foreground font-bold shadow-sm' : 'text-muted-foreground font-medium')}>Trust Score</button>
                </div>
            </div>
             <div className="flex flex-col gap-2 px-4">
                {visibleUsers.length > 0 ? visibleUsers.map((user, index) => (
                    <div key={user.id} className={cn("flex items-center gap-4 p-3 rounded-lg border", getRowStyle(index + 1))}>
                        <div className="font-bold w-6 text-center flex items-center justify-center">
                            {getRankIcon(index + 1)}
                        </div>
                        <Avatar className="w-10 h-10">
                            <AvatarImage src={user.avatar} alt={`Avatar of ${user.username}`} />
                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-bold text-sm text-foreground">{user.username}</p>
                            <p className="text-muted-foreground text-xs">{getFormattedValue(user)}</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No user data available yet.</p>
                        <p className="text-sm">Place some bets and win to appear on the leaderboard.</p>
                    </div>
                )}
                 {canLoadMore && (
                    <Button onClick={handleLoadMore} variant="outline" className="mt-2">
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Load More
                    </Button>
                )}
            </div>
        </div>
    );
}
