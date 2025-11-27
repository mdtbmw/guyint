
'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { blockchainService } from "@/services/blockchain";
import { Hex, formatEther } from "viem";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { PageHeader } from "@/components/layout/page-header";
import { calculateUserStats, getRank } from "@/lib/ranks";
import { UserStats } from "@/lib/types";
import { useAuthGuard } from "@/hooks/use-auth-guard";

const ITEMS_PER_PAGE = 10;

interface LeaderboardUser extends UserStats {
    id: Hex;
    username: string;
    avatar: string;
    totalWagered: number;
}

const PodiumCard = ({ user, rank }: { user: LeaderboardUser, rank: number }) => {
    if (!user) return null;

    const rankStyles = useMemo(() => {
        switch (rank) {
            case 1:
                return {
                    textColor: "text-gold-400",
                    bgColor: "bg-gold-600",
                    borderColor: "border-gold-400",
                    shadowColor: "shadow-gold-500/40",
                    rankTextColor: "text-black",
                    order: "order-2",
                    zIndex: "z-20",
                    translateY: "-translate-y-8 md:-translate-y-10",
                    textSize: "text-2xl md:text-5xl",
                    avatarSize: "w-20 h-20 md:w-24 md:h-24",
                    podiumHeight: "h-24 md:h-48",
                };
            case 2:
                return {
                    textColor: "text-white",
                    bgColor: "bg-zinc-700",
                    borderColor: "border-zinc-500",
                    shadowColor: "dark:shadow-zinc-600/30",
                    rankTextColor: "text-white",
                    order: "order-1",
                    zIndex: "z-10",
                    translateY: "translate-y-0",
                    textSize: "text-xl md:text-4xl",
                    avatarSize: "w-16 h-16 md:w-20 md:h-20",
                    podiumHeight: "h-20 md:h-32",
                };
            case 3:
                return {
                    textColor: "text-white",
                    bgColor: "bg-yellow-700",
                    borderColor: "border-yellow-600",
                    shadowColor: "shadow-orange-500/20",
                    rankTextColor: "text-black",
                    order: "order-3",
                    zIndex: "z-10",
                    translateY: "translate-y-0",
                    textSize: "text-xl md:text-4xl",
                    avatarSize: "w-16 h-16 md:w-20 md:h-20",
                    podiumHeight: "h-20 md:h-32",
                };
            default:
                return {};
        }
    }, [rank]);

    return (
         <div className={cn(
             "flex flex-col items-center w-1/3 text-center transform transition-all duration-500",
             rankStyles.order, rankStyles.zIndex, rankStyles.translateY,
        )}>
            <div className={cn("rounded-full bg-opacity-20 p-1 border-4 shadow-xl mb-3 animate-float", rankStyles.borderColor, rankStyles.shadowColor, rankStyles.avatarSize)}>
                <Avatar className="w-full h-full">
                    <AvatarImage src={user.avatar} alt={`Avatar of ${user.username}`} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
            <p className={cn("text-lg font-display font-bold", rankStyles.textColor)}>{user.username}</p>
            <p className="text-sm text-zinc-500 font-mono">{user.trustScore.toFixed(1)} Score</p>
            <div className={cn(
                "w-full mt-4 rounded-t-xl flex items-center justify-center font-bold shadow-inner shadow-black/50 border-t-4", 
                rankStyles.bgColor, rankStyles.borderColor, rankStyles.rankTextColor,
                rankStyles.textSize, rankStyles.podiumHeight
            )}>
                #{rank}
            </div>
        </div>
    );
};

export default function LeaderboardPage() {
    const { isLoading: isAuthLoading } = useAuthGuard();
    const { address } = useWallet();
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            blockchainService.clearCache();
            const allEvents = await blockchainService.getAllEvents();
            if (allEvents.length === 0) {
                setLeaderboardData([]);
                setLoading(false);
                return;
            }

            const allLogs = await blockchainService.getAllLogs();
            const bettors = new Set<Hex>();
            allLogs.betPlaced.forEach(log => {
                if (log.user) bettors.add(log.user);
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

                let totalWagered = 0n;
                userBetsOnAllEvents.forEach(bet => {
                    totalWagered += bet.yesAmount + bet.noAmount;
                });

                const userStats = calculateUserStats(allEvents, userBetsOnAllEvents);
                
                return {
                    id: bettor,
                    username: `${bettor.slice(0, 6)}...${bettor.slice(-4)}`,
                    avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${bettor}`,
                    ...userStats,
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
      if (!isAuthLoading) {
        fetchLeaderboard();
      }
    }, [isAuthLoading, fetchLeaderboard]);

    const sortedLeaderboard = useMemo(() => {
        return [...leaderboardData].sort((a, b) => b.trustScore - a.trustScore || b.totalBets - a.totalBets);
    }, [leaderboardData]);
    
    const currentUserData = useMemo(() => {
        if (!address) return null;
        const user = sortedLeaderboard.find(u => u.id.toLowerCase() === address.toLowerCase());
        const rank = user ? sortedLeaderboard.findIndex(u => u.id === user.id) + 1 : null;
        return user ? { ...user, rank } : null;
    }, [sortedLeaderboard, address]);
    
    const podiumUsers = useMemo(() => {
        return {
            first: sortedLeaderboard[0],
            second: sortedLeaderboard[1],
            third: sortedLeaderboard[2],
        };
    }, [sortedLeaderboard]);

    const tableUsers = useMemo(() => {
        return sortedLeaderboard.slice(3);
    }, [sortedLeaderboard]);

    if (isAuthLoading || loading) {
        return (
             <div className="flex flex-col gap-2 px-4 mt-4">
                <PageHeader title="Rankings Protocol" description="Pure Accuracy. Pure Signal."/>
                {Array.from({length: 8}).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
            </div>
        )
    }

    if (error) {
        return (
             <div className="px-4 mt-4">
                 <PageHeader title="Rankings Protocol" description="Pure Accuracy. Pure Signal."/>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Leaderboard</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-10">
            <div className="animate-slide-up">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <PageHeader title="Rankings Protocol" description="Pure Accuracy. Pure Signal."/>
                </div>
                 {currentUserData && currentUserData.rank && (
                    <div className="glass-panel rounded-[2rem] p-6 border-l-4 border-emerald-500/30 flex justify-between items-center relative overflow-hidden">
                         <div className="absolute inset-0 bg-emerald-500/5 opacity-50 pointer-events-none"></div>
                         <div className="flex items-center gap-5 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center font-display font-bold text-xl shadow-lg shadow-emerald-500/20">
                                #{currentUserData.rank}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Your Current Rank</p>
                                <h3 className="text-xl font-display font-bold text-foreground">{currentUserData.username}</h3>
                            </div>
                        </div>
                        <div className="text-right relative z-10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Trust Score</p>
                            <p className="text-3xl font-display font-bold text-primary">{currentUserData.trustScore.toFixed(1)}</p>
                        </div>
                    </div>
                )}
            </div>
            
             <div className="relative animate-slide-up" style={{ animationDelay: '150ms' }}>
                <div className="relative flex justify-center items-end min-h-[250px] md:min-h-[400px] podium-deco">
                    {podiumUsers.second && <PodiumCard user={podiumUsers.second} rank={2} />}
                    {podiumUsers.first && <PodiumCard user={podiumUsers.first} rank={1} />}
                    {podiumUsers.third && <PodiumCard user={podiumUsers.third} rank={3} />}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>

            <div className="glass-panel rounded-[2.5rem] p-4 md:p-8 animate-slide-up" style={{ animationDelay: "300ms" }}>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="min-w-full divide-y divide-border ranking-table">
                         <thead>
                            <tr>
                                <th className="w-1/12 text-center">Rank</th>
                                <th className="w-4/12">Identity</th>
                                <th className="w-2/12 text-center">Trust Score</th>
                                <th className="w-2/12 text-center">Accuracy</th>
                                <th className="w-2/12 text-center">Volume</th>
                                <th className="w-1/12 text-center">Tier</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {tableUsers.map((user, index) => {
                                const rank = getRank(user.trustScore);
                                return (
                                    <tr key={user.id} className={cn("hover:bg-accent transition-colors", user.id.toLowerCase() === address?.toLowerCase() && "bg-emerald-500/5 dark:bg-emerald-500/10 border-l-4 border-emerald-500/50")}>
                                        <td className="text-center text-muted-foreground">#{index + 4}</td>
                                        <td className="text-foreground flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold">{user.username}</span>
                                        </td>
                                        <td className="text-center font-bold text-foreground">{user.trustScore.toFixed(1)}</td>
                                        <td className="text-center text-emerald-500 dark:text-emerald-400">{user.accuracy.toFixed(1)}%</td>
                                        <td className="text-center text-primary">${user.totalWagered.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="text-center" style={{color: rank.color}}>{rank.name}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                 <div className="mt-6 text-center text-muted-foreground text-xs font-mono pt-4 border-t border-border">
                    End of Global Rankings.
                </div>
            </div>
        </div>
    );
}
