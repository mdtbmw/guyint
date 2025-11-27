'use client';
import { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Crown, Award, Medal, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { blockchainService } from "@/services/blockchain";
import { Hex } from "viem";

interface LeaderboardUser {
    id: Hex;
    username: string;
    avatar: string;
    wins: number;
    losses: number;
    totalBets: number;
    accuracy: number;
    trustScore: number;
}

const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return <span className="font-bold text-lg text-text-dark w-8 text-center">{rank}</span>
}

export function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'accuracy' | 'trustScore'>('accuracy');

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const bettors = await blockchainService.getAllBettors();
            if (bettors.length === 0) {
                setLeaderboardData([]);
                setLoading(false);
                return;
            }
            
            const userStatsPromises = bettors.map(async (bettor) => {
                const history = await blockchainService.getUserHistory(bettor);
                const wins = Number(history.wins);
                const losses = Number(history.losses);
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
                };
            });

            const usersWithStats = await Promise.all(userStatsPromises);
            setLeaderboardData(usersWithStats);

        } catch (err: any) {
            setError(err.message || "Could not load leaderboard data from the blockchain. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const sortedLeaderboard = useMemo(() => {
        return [...leaderboardData].sort((a, b) => {
            if (activeTab === 'accuracy') {
                return b.accuracy - a.accuracy || b.totalBets - a.totalBets;
            }
            return b.trustScore - a.trustScore || b.totalBets - a.totalBets;
        }).slice(0, 10);
    }, [leaderboardData, activeTab]);

    const getRowStyle = (rank: number) => {
        if (rank === 1) return "bg-gradient-to-r from-yellow-500/20 via-transparent to-transparent border border-yellow-500/60";
        if (rank === 2) return "bg-gradient-to-r from-slate-400/20 via-transparent to-transparent border border-slate-400/60";
        if (rank === 3) return "bg-gradient-to-r from-orange-600/20 via-transparent to-transparent border border-orange-600/60";
        return "bg-component-dark/40";
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
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-component-light-dark">
                        <Skeleton className="w-8 h-8"/>
                        <Skeleton className="w-12 h-12 rounded-full"/>
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
                        {error}
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
                <div className="flex items-center gap-2 p-1 rounded-lg bg-component-light-dark">
                    <button onClick={() => setActiveTab('accuracy')} className={cn("flex cursor-pointer items-center justify-center rounded-md h-9 px-4 text-sm leading-normal", activeTab === 'accuracy' ? 'bg-primary text-white font-bold' : 'text-text-dark font-medium')}>Most Accurate</button>
                    <button onClick={() => setActiveTab('trustScore')} className={cn("flex cursor-pointer items-center justify-center rounded-md h-9 px-4 text-sm leading-normal", activeTab === 'trustScore' ? 'bg-primary text-white font-bold' : 'text-text-dark font-medium')}>Trust Score</button>
                </div>
            </div>
             <div className="flex flex-col gap-2 px-4">
                {sortedLeaderboard.length > 0 ? sortedLeaderboard.map((user, index) => (
                    <div key={user.id} className={cn("flex items-center gap-4 p-3 rounded-xl", getRowStyle(index + 1))}>
                        <div className="text-xl font-bold w-8 text-center">
                            {getRankIcon(index + 1)}
                        </div>
                        <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar} alt={`Avatar of ${user.username}`} />
                            <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="font-bold text-white">{user.username}</p>
                            <p className="text-text-dark text-sm">{getFormattedValue(user)}</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 text-text-dark">
                        <p>No user data available yet.</p>
                        <p className="text-sm">Place some bets and win to appear on the leaderboard.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
