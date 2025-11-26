
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { blockchainService } from '@/services/blockchain';
import { useWallet } from '@/hooks/use-wallet';
import type { Event, Bet, PnLBet } from '@/lib/types';
import { formatEther, parseEther } from 'viem';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useNotifications } from '@/lib/state/notifications';
import { BetCard } from './bet-card';

export function BettingHistory() {
    const { address, walletClient } = useWallet();
    const [events, setEvents] = useState<Event[]>([]);
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [platformFeeBps, setPlatformFeeBps] = useState(0);

    const { addNotification } = useNotifications();

    const fetchData = useCallback(async () => {
        if (!address) return;
        setLoading(true);
        setError(null);
        try {
            const [allEvents, fee] = await Promise.all([
                blockchainService.getAllEvents(),
                blockchainService.getPlatformFee()
            ]);
            setEvents(allEvents);
            setPlatformFeeBps(fee);

            const eventIdsAsBigInt = allEvents.map(e => BigInt(e.id));
            if (eventIdsAsBigInt.length > 0) {
                const betData = await blockchainService.getMultipleUserBets(eventIdsAsBigInt, address);
                
                const userBets: Bet[] = betData.map((onChainBet, index) => {
                    const event = allEvents[index];
                    const hasBet = onChainBet.yesAmount > 0n || onChainBet.noAmount > 0n;

                    if (!hasBet || !event) return null;

                    let outcome: Bet['outcome'] = "Pending";
                    
                    if (event.status === "finished") {
                        const userWon = (onChainBet.yesAmount > 0n && event.winningOutcome === 'YES') || (onChainBet.noAmount > 0n && event.winningOutcome === 'NO');
                        if (userWon) {
                            outcome = onChainBet.claimed ? "Claimed" : "Won";
                        } else {
                            outcome = "Lost";
                        }
                    } else if (event.status === "canceled") {
                        outcome = onChainBet.claimed ? "Refunded" : "Refundable";
                    }

                    return {
                        id: `${event.id}-${address}`,
                        eventId: event.id,
                        eventQuestion: event.question,
                        userBet: onChainBet.yesAmount > 0n ? 'YES' : 'NO',
                        stakedAmount: Number(formatEther(onChainBet.yesAmount + onChainBet.noAmount)),
                        date: event.bettingStopDate || new Date(),
                        outcome,
                    }
                }).filter((b): b is Bet => b !== null);

                setBets(userBets);
            }

        } catch (err: any) {
            setError(err.message || "Failed to fetch betting history.");
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (bet: Bet) => {
        if (!walletClient || !address) return;
        setActionLoading(true);
        try {
            const txHash = await blockchainService.claim(walletClient, address, BigInt(bet.eventId));
            addNotification({
                title: 'Claim Submitted',
                description: 'Processing your claim...',
                icon: 'Loader2',
                type: 'onWinningsClaimed'
            });
            await blockchainService.waitForTransaction(txHash);
            addNotification({
                title: 'Success!',
                description: `Your funds for "${bet.eventQuestion.slice(0,20)}..." have been claimed.`,
                icon: 'CheckCircle',
                variant: 'success',
                type: 'onWinningsClaimed'
            });
            await fetchData(); // Refresh data
        } catch (e: any) {
             addNotification({
                title: 'Claim Failed',
                description: e.shortMessage || 'An unexpected error occurred.',
                icon: 'AlertTriangle',
                variant: 'destructive',
                type: 'onWinningsClaimed'
            });
        } finally {
            setActionLoading(false);
        }
    }

    const betsWithPnl = useMemo((): PnLBet[] => {
        return bets.map(bet => {
            const event = events.find(e => e.id === bet.eventId);
            if (!event) return { ...bet, pnl: 0 };
            
            let pnl = -bet.stakedAmount;

            if (bet.outcome === "Won" || bet.outcome === "Claimed") {
                 const userStake = parseEther(String(bet.stakedAmount));
                 const winningPool = event.winningOutcome === 'YES' ? parseEther(String(event.outcomes.yes)) : parseEther(String(event.outcomes.no));
                 
                 if (winningPool > 0n) {
                    const totalPool = parseEther(String(event.totalPool));
                    const fee = (totalPool * BigInt(platformFeeBps)) / 10000n;
                    const distributablePool = totalPool - fee;
                    const payout = (userStake * distributablePool) / winningPool;
                    pnl = Number(formatEther(payout)) - bet.stakedAmount;
                 } else {
                     pnl = bet.stakedAmount; // Got their stake back
                 }
            } else if (bet.outcome === 'Refunded' || bet.outcome === 'Refundable') {
                pnl = bet.stakedAmount;
            }

            return { ...bet, pnl };
        })
    }, [bets, events, platformFeeBps]);
    
    const activeBets = useMemo(() => betsWithPnl.filter(b => b.outcome === 'Pending').sort((a,b) => b.date.getTime() - a.date.getTime()), [betsWithPnl]);
    const historicalBets = useMemo(() => betsWithPnl.filter(b => b.outcome !== 'Pending').sort((a,b) => b.date.getTime() - a.date.getTime()), [betsWithPnl]);


    const BetList = ({ betList }: { betList: PnLBet[] }) => {
        if (loading) {
            return (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
            )
        }
        if (betList.length === 0) {
            return <div className="text-center py-12 text-muted-foreground bg-card/60 glass-panel rounded-2xl">No signals in this category.</div>
        }
        return (
            <div className="space-y-4">
                {betList.map(bet => (
                    <BetCard key={bet.id} bet={bet} onAction={() => handleAction(bet)} actionLoading={actionLoading} />
                ))}
            </div>
        )
    };
    
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4"/>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <Tabs defaultValue="active">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active Signals ({activeBets.length})</TabsTrigger>
                <TabsTrigger value="historical">Historical Signals ({historicalBets.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
                <BetList betList={activeBets} />
            </TabsContent>
            <TabsContent value="historical" className="mt-6">
                <BetList betList={historicalBets} />
            </TabsContent>
        </Tabs>
    );
}
