'use client';
import { useState, useEffect, useCallback } from "react";
import type { LeaderboardUser } from "@/lib/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeaderboardStats } from "@/app/leaderboard/get-leaderboard-stats";
import { AlertTriangle } from "lucide-react";

export function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getLeaderboardStats();
            setLeaderboardData(data);
        } catch (err: any) {
            console.error("Failed to fetch leaderboard stats:", err);
            setError(err.message || "An unexpected error occurred while fetching leaderboard data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    if (loading) {
        return (
             <div className="space-y-1">
                <Skeleton className="h-[73px] w-full" />
                <Skeleton className="h-[73px] w-full" />
                <Skeleton className="h-[73px] w-full" />
                <Skeleton className="h-[73px] w-full" />
                 <Skeleton className="h-[73px] w-full" />
            </div>
        )
    }

    if (error) {
        return (
             <div className="text-center text-destructive py-12 px-4 bg-destructive/10 rounded-lg">
                <AlertTriangle className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">Could not load leaderboard</h3>
                <p className="mt-2 text-sm text-destructive/80">{error}</p>
            </div>
        )
    }

    return (
        <div>
            <Table>
                 <TableHeader>
                    <TableRow className="border-b-white/10">
                        <TableHead className="w-16 text-center font-bold text-white/70">Rank</TableHead>
                        <TableHead className="text-white/70">User</TableHead>
                        <TableHead className="text-right text-white/70">Accuracy</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leaderboardData.length > 0 ? leaderboardData.map((user, index) => (
                        <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="font-bold text-lg w-16 text-center text-white/60">{index + 1}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 ring-1 ring-white/10">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-white/90">{user.username}</p>
                                        <p className="text-xs text-white/50 font-mono max-w-[120px] truncate">{user.walletAddress}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-xl text-indigo-400">{user.value.toFixed(1)}%</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow className="border-transparent">
                            <TableCell colSpan={3} className="text-center h-48 text-white/60">
                                No user data available yet.
                                <br />
                                <span className="text-sm">Place some bets and win to appear on the leaderboard.</span>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
