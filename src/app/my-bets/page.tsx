
'use client';

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { blockchainService } from '@/services/blockchain';
import { useNotifications } from '@/lib/state/notifications';
import { formatEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Ticket, Loader2, ArrowUpRight, Filter, ShieldCheck, Database, Link as LinkIcon, RefreshCw, BarChart, TrendingUp, ArrowRight, ChevronDown } from "lucide-react";
import type { Bet, PnLBet } from "@/lib/types";
import { useRouter } from "next/navigation";
import { BetCard } from "@/components/profile/bet-card";
import { Input } from "@/components/ui/input";

const ITEMS_PER_PAGE = 10;

const getOutcomeBadge = (bet: PnLBet) => {
    switch (bet.outcome) {
      case "Won":
        return <Badge className="bg-emerald-500/10 text-emerald-500 font-bold border-emerald-500/20">WIN</Badge>;
      case "Claimed":
        return <Badge className="bg-emerald-500/20 text-emerald-600 font-bold border-emerald-500/30">WIN</Badge>;
      case "Lost":
        return <Badge className="bg-rose-500/10 text-rose-500 font-bold border-rose-500/20">LOSS</Badge>;
      case "Pending":
        return <Badge className="bg-primary/10 text-primary font-bold border-primary/20">OPEN</Badge>;
      case "Refundable":
      case "Refunded":
        return <Badge variant="secondary" className="text-muted-foreground border-border">REFUND</Badge>;
    }
};

const StatCard = ({ title, value, subtext, icon, colorClass = 'text-foreground' }: { title: string; value: string; subtext: string; icon: React.ReactNode; colorClass?: string }) => (
    <div className="bg-card/60 dark:glass-panel rounded-[2rem] p-6 border-l-4 border-border dark:border-white/10">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{title}</p>
        <h3 className={`text-3xl font-display font-bold ${colorClass}`}>{value}</h3>
        <div className="text-xs font-mono text-muted-foreground mt-2 flex items-center gap-1">{icon}</div>
    </div>
);


export default function MyBetsPage() {
  const { isLoading: authIsLoading } = useAuthGuard();
  const { address, connected, walletClient, chain } = useWallet();
  const { addNotification } = useNotifications();
  const router = useRouter();

  const [bets, setBets] = useState<PnLBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [filterTerm, setFilterTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);


  const fetchUserHistory = useCallback(async () => {
    if (!address || !connected) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const allEvents = await blockchainService.getAllEvents();
      if (allEvents.length === 0) {
        setBets([]);
        setLoading(false);
        return;
      }

      const eventIdsAsBigInt = allEvents.map(e => BigInt(e.id));
      const betData = await blockchainService.getMultipleUserBets(eventIdsAsBigInt, address);
      
      const userBets: PnLBet[] = [];

      betData.forEach((onChainBet, index) => {
        const totalBetAmount = onChainBet.yesAmount + onChainBet.noAmount;
        if (totalBetAmount > 0n) {
          const event = allEvents[index];
          let outcome: Bet['outcome'] = 'Pending';
          let winnings = 0;
          let pnl = 0;
          const stakedOnYes = onChainBet.yesAmount > 0n;
          const stakedAmount = Number(formatEther(stakedOnYes ? onChainBet.yesAmount : onChainBet.noAmount));

          if (event.status === 'canceled') {
            outcome = onChainBet.claimed ? 'Refunded' : 'Refundable';
            winnings = stakedAmount;
            pnl = 0; // No profit or loss on a refund
          } else if (event.status === 'finished' && event.winningOutcome) {
            const userWon = (event.winningOutcome === 'YES' && stakedOnYes) || (event.winningOutcome === 'NO' && !stakedOnYes);
            if (userWon) {
              outcome = onChainBet.claimed ? 'Claimed' : 'Won';
              if (event.totalPool > 0) {
                const winningPool = event.winningOutcome === 'YES' ? event.outcomes.yes : event.outcomes.no;
                if (winningPool > 0) {
                  winnings = (stakedAmount * event.totalPool) / winningPool;
                  pnl = winnings - stakedAmount;
                } else {
                  winnings = stakedAmount; // Return of stake if winning pool is somehow 0
                  pnl = 0;
                }
              }
            } else {
              outcome = 'Lost';
              pnl = -stakedAmount;
            }
          }

          userBets.push({
            id: `${event.id}-${address}`,
            eventId: event.id,
            eventQuestion: event.question,
            userBet: stakedOnYes ? 'YES' : 'NO',
            stakedAmount: stakedAmount,
            date: event.resolutionDate || event.bettingStopDate || new Date(),
            outcome: outcome,
            winnings: winnings,
            pnl: pnl,
          });
        }
      });
      setBets(userBets.sort((a,b) => b.date.getTime() - a.date.getTime()));
    } catch (error: any) {
      addNotification({ variant: "destructive", title: "Error Loading History", description: error.message, icon: 'AlertTriangle', type: 'general' });
    } finally {
      setLoading(false);
    }
  }, [address, connected, addNotification]);

  useEffect(() => {
    if (connected) fetchUserHistory();
  }, [connected, fetchUserHistory]);


  const stats = useMemo(() => {
    if (bets.length === 0) return { netPnl: 0, winRate: 0, totalVolume: 0, longestStreak: 0, totalBets: 0, wins: 0 };
    
    let netPnl = 0;
    let totalVolume = 0;
    let wins = 0;
    let losses = 0;
    let currentStreak = 0;
    let longestStreak = 0;

    const sortedBets = [...bets].sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const bet of sortedBets) {
        totalVolume += bet.stakedAmount;
        netPnl += bet.pnl;

        if(bet.outcome === 'Won' || bet.outcome === 'Claimed') {
            wins++;
            currentStreak++;
        } else if (bet.outcome === 'Lost') {
            losses++;
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 0;
        }
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    const totalBets = wins + losses;
    const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;

    return { netPnl, winRate, totalVolume, longestStreak, totalBets, wins };
  }, [bets]);

  const filteredBets = useMemo(() => {
    if (!filterTerm) return bets;
    const lowercasedFilter = filterTerm.toLowerCase();
    return bets.filter(bet => 
        bet.eventQuestion.toLowerCase().includes(lowercasedFilter) ||
        bet.outcome.toLowerCase().includes(lowercasedFilter) ||
        bet.userBet.toLowerCase().includes(lowercasedFilter)
    );
  }, [bets, filterTerm]);
  
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filterTerm]);
  
  const visibleBets = useMemo(() => filteredBets.slice(0, visibleCount), [filteredBets, visibleCount]);
  const canLoadMore = visibleCount < filteredBets.length;
  
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };


  const handleAction = async (bet: PnLBet) => {
    if (!address || !walletClient) return;
    setActionLoading(prev => ({...prev, [bet.id]: true}));
    try {
        const txHash = await blockchainService.claim(walletClient, address, BigInt(bet.eventId));
        addNotification({ title: "Transaction Submitted", description: `Claiming funds...`, icon: 'Loader2', type: 'onWinningsClaimed' });
        await blockchainService.waitForTransaction(txHash);
        addNotification({ title: "Success!", description: `Your funds are in your wallet.`, icon: 'CheckCircle', href: '/wallet', type: 'onWinningsClaimed' });
        await fetchUserHistory();
    } catch (e: any) {
        addNotification({ variant: "destructive", title: `Claim Failed`, description: e.message, icon: 'AlertTriangle', type: 'general' });
    } finally {
      setActionLoading(prev => ({...prev, [bet.id]: false}));
    }
  };

  if (authIsLoading || (loading && bets.length === 0)) {
    return (
        <div className="space-y-8">
            <Skeleton className="h-12 w-96 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Skeleton className="h-28 w-full rounded-[2rem]" />
                <Skeleton className="h-28 w-full rounded-[2rem]" />
                <Skeleton className="h-28 w-full rounded-[2rem]" />
                <Skeleton className="h-28 w-full rounded-[2rem]" />
            </div>
            <Skeleton className="h-96 w-full rounded-[2.5rem]" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-1">
                        Transaction Ledger
                    </h1>
                    <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary"/>
                        <span className="text-primary">On-Chain Data</span> • All-Time Record
                    </p>
                </div>
                <div className="relative w-full max-w-sm">
                    <Input 
                        type="text" 
                        placeholder="Filter by event, outcome (win/loss), or position (yes/no)..."
                        className="w-full bg-card border-border rounded-xl py-3 pl-12 pr-4 text-sm font-mono text-foreground placeholder-muted-foreground focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                    />
                    <Filter className="w-4 h-4 text-muted-foreground absolute top-3.5 left-4" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Net PnL (Total)"
                    value={`${stats.netPnl >= 0 ? '+' : ''}$${stats.netPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    subtext={`${stats.totalVolume > 0 ? ((stats.netPnl / stats.totalVolume) * 100).toFixed(1) : '0.0'}% ROI`}
                    icon={<><ArrowUpRight className="w-3 h-3" />{`${stats.totalVolume > 0 ? ((stats.netPnl / stats.totalVolume) * 100).toFixed(1) : '0.0'}% ROI`}</>}
                    colorClass={stats.netPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}
                />
                 <StatCard 
                    title="Win Rate (W/L)"
                    value={`${stats.winRate.toFixed(1)}%`}
                    subtext={`${stats.wins}W / ${stats.totalBets - stats.wins}L`}
                    icon={ <div className="w-full h-1 bg-rose-500/30 rounded-full mt-1"><div className="h-full bg-emerald-500" style={{width: `${stats.winRate}%`}}></div></div>}
                />
                 <StatCard 
                    title="Capital Deployed"
                    value={`$${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                    subtext={`${stats.totalBets} Total Bets`}
                    icon={<BarChart className="w-3 h-3" />}
                    colorClass="text-primary"
                />
                 <StatCard 
                    title="Longest Streak"
                    value={`${stats.longestStreak} Wins`}
                    subtext="All Time"
                    icon={<TrendingUp className="w-3 h-3" />}
                    colorClass="text-blue-500"
                />
            </div>
        </div>

        <div className="bg-card/60 dark:glass-panel rounded-[2.5rem] p-4 md:p-8 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                    <Database className="w-5 h-5 text-muted-foreground" /> Accountability Grid
                </h2>
                <Button variant="ghost" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground">Export<ArrowRight className="w-3 h-3 ml-2" /></Button>
            </div>
            
            {/* Mobile Card View */}
            <div className="grid md:hidden grid-cols-1 gap-4">
                 {visibleBets.length > 0 ? visibleBets.map((bet) => (
                    <BetCard key={bet.id} bet={bet} onAction={handleAction} actionLoading={actionLoading[bet.id]} />
                )) : (
                    <div className="h-64 text-center flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <Ticket className="w-16 h-16 text-border"/>
                        <div>
                            <h3 className="font-bold text-lg text-foreground">No Bets Found</h3>
                            <p className="text-sm">{filterTerm ? 'No bets match your filter.' : 'Place your first bet to start your record.'}</p>
                        </div>
                        { !filterTerm && <Button onClick={() => router.push('/')} variant="outline">Browse Markets</Button> }
                    </div>
                )}
                 {canLoadMore && (
                    <Button onClick={handleLoadMore} variant="outline" className="w-full">
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Load More
                    </Button>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto no-scrollbar">
                <table className="w-full ledger-table">
                    <thead>
                        <tr>
                            <th className="w-[40%]">Event</th>
                            <th>Position</th>
                            <th>Stake</th>
                            <th>PnL</th>
                            <th>Settlement</th>
                            <th className="text-right w-48">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleBets.length > 0 ? visibleBets.map((bet) => (
                        <tr key={bet.id} className={cn("transition-colors", 
                            bet.outcome === 'Won' || bet.outcome === 'Claimed' ? "hover:bg-emerald-500/5 dark:hover:bg-emerald-900/10" : 
                            bet.outcome === 'Lost' ? "hover:bg-rose-500/5 dark:hover:bg-rose-900/10" : 
                            "hover:bg-accent"
                        )}>
                            <td className="max-w-xs truncate text-foreground font-bold">{bet.eventQuestion}</td>
                            <td>
                                <span className={cn("font-bold", bet.userBet === 'YES' ? 'text-emerald-500' : 'text-rose-500')}>{bet.userBet}</span>
                            </td>
                            <td>${bet.stakedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className={cn("font-bold", bet.pnl > 0 ? "text-emerald-500" : bet.pnl < 0 ? "text-rose-500" : "text-muted-foreground")}>
                                {bet.pnl > 0 ? '+' : ''}${bet.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td>{getOutcomeBadge(bet)}</td>
                            <td className="text-right">
                                {(bet.outcome === "Won" || bet.outcome === "Refundable") ? (
                                    <Button size="sm" variant="secondary" onClick={() => handleAction(bet)} disabled={actionLoading[bet.id]} className="active-press">
                                        {actionLoading[bet.id] ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Claim'}
                                    </Button>
                                ) : (
                                     <Button size="icon" variant="ghost" onClick={() => router.push(`/event/${bet.eventId}`)} className="group active-press">
                                        <LinkIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </Button>
                                )}
                            </td>
                        </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                        <Ticket className="w-16 h-16 text-border"/>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground">No Bets Found</h3>
                                            <p className="text-sm">{filterTerm ? 'No bets match your filter.' : 'Place your first bet to start your record.'}</p>
                                        </div>
                                         { !filterTerm && <Button onClick={() => router.push('/')} variant="outline">Browse Markets</Button> }
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                 {canLoadMore && (
                    <div className="pt-4 border-t border-border">
                        <Button onClick={handleLoadMore} variant="outline" className="w-full">
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Load More
                        </Button>
                    </div>
                )}
            </div>
             <div className="mt-6 text-center text-muted-foreground text-xs font-mono pt-4 border-t border-border">
                End of Ledger: Last updated just now
            </div>
        </div>
    </div>
  );
}
