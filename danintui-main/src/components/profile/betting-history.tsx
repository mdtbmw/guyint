'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Bet } from "@/lib/types";
import { CheckCircle, XCircle, Clock, RotateCw, Check, Ticket, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { blockchainService } from "@/services/blockchain";
import { formatEther } from "viem";
import { Button } from "@/components/ui/button";
import { useNotifications } from '@/lib/state/notifications';

const getOutcomeBadge = (outcome: Bet['outcome']) => {
  switch (outcome) {
    case "Won":
      return (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30">
          <CheckCircle className="mr-1 h-3 w-3" /> Won
        </Badge>
      );
    case "Claimed":
       return (
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30 opacity-70">
          <Check className="mr-1 h-3 w-3" /> Claimed
        </Badge>
      );
    case "Lost":
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          <XCircle className="mr-1 h-3 w-3" /> Lost
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="outline" className="border-border text-muted-foreground">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
    case "Refunded":
      return (
        <Badge variant="secondary" className="text-muted-foreground opacity-70">
          <RotateCw className="mr-1 h-3 w-3" /> Refunded
        </Badge>
      );
      case "Refundable":
      return (
        <Badge variant="secondary" className="text-muted-foreground animate-pulse">
          <RotateCw className="mr-1 h-3 w-3" /> Refundable
        </Badge>
      );
  }
};


export function BettingHistory() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const { address, connected, fetchBalance, walletClient, chain } = useWallet();
  const router = useRouter();
  const { addNotification } = useNotifications();


  const fetchBets = useCallback(async () => {
      if (!address || !connected) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const allEvents = await blockchainService.getAllEvents();
        
        if (allEvents.length === 0) {
            setBets([]);
            setLoading(false);
            return;
        }

        const eventIdsAsBigInt = allEvents.map(e => BigInt(e.id));

        const betData = await blockchainService.getMultipleUserBets(
          eventIdsAsBigInt,
          address
        );

        const userBets: Bet[] = [];

        betData.forEach((onChainBet, index) => {
          const totalBetAmount = onChainBet.yesAmount + onChainBet.noAmount;

          if (totalBetAmount > 0n) {
            const event = allEvents[index];
            let outcome: Bet['outcome'] = 'Pending';
            let winnings = 0;
            const stakedOnYes = onChainBet.yesAmount > 0n;

            if (event.status === 'canceled') {
              outcome = onChainBet.claimed ? 'Refunded' : 'Refundable';
              winnings = Number(formatEther(totalBetAmount));
            } else if (event.status === 'finished' && event.winningOutcome) {
              const userWon = (event.winningOutcome === 'YES' && stakedOnYes) || (event.winningOutcome === 'NO' && !stakedOnYes);
              if (userWon) {
                 outcome = onChainBet.claimed ? 'Claimed' : 'Won';
                 if (event.totalPool > 0) {
                   const userStake = Number(formatEther(stakedOnYes ? onChainBet.yesAmount : onChainBet.noAmount));
                   const winningPool = event.winningOutcome === 'YES' ? event.outcomes.yes : event.outcomes.no;
                   
                   if (winningPool > 0) {
                    winnings = (userStake * event.totalPool) / winningPool;
                   } else {
                    winnings = userStake; // If winning pool is zero, just return stake
                   }
                 }
              } else {
                outcome = 'Lost';
              }
            }

            userBets.push({
              id: `${event.id}-${address}`,
              eventId: event.id,
              eventQuestion: event.question,
              userBet: stakedOnYes ? 'YES' : 'NO',
              stakedAmount: Number(formatEther(stakedOnYes ? onChainBet.yesAmount : onChainBet.noAmount)),
              date: new Date(), // This is a placeholder; real bet date requires event indexing
              outcome: outcome,
              winnings: winnings,
            });
          }
        });

        setBets(userBets.sort((a,b) => b.date.getTime() - a.date.getTime()));

      } catch (error: any) {
         addNotification({
            variant: "destructive",
            title: "Error Loading Bets",
            description: error.message || "Could not load your on-chain betting history.",
            icon: 'AlertTriangle',
            type: 'general'
          });
      } finally {
        setLoading(false);
      }
    }, [address, connected, addNotification]);


  useEffect(() => {
    if (connected) {
      fetchBets();
    }
  }, [connected, fetchBets]);

  const handleAction = async (bet: Bet) => {
    if (!address || !walletClient) return;
    setActionLoading(prev => ({...prev, [bet.id]: true}));
    try {
        const txHash = await blockchainService.claim(walletClient, address, BigInt(bet.eventId));
        addNotification({
            title: "Transaction Submitted",
            description: `Claiming funds... Tx: ${txHash.slice(0,10)}...`,
            icon: 'Loader2',
            type: 'onWinningsClaimed'
        });
        await blockchainService.waitForTransaction(txHash);
        addNotification({
            title: "Success!",
            description: `Your funds have been sent to your wallet.`,
            icon: 'CheckCircle',
            href: '/wallet',
            type: 'onWinningsClaimed'
        });
        await fetchBets();
        await fetchBalance();
    } catch (e: any) {
        addNotification({
            variant: "destructive",
            title: `Failed to Claim`,
            description: e.message || 'An unexpected error occurred.',
            icon: 'AlertTriangle',
            type: 'general'
        });
    } finally {
      setActionLoading(prev => ({...prev, [bet.id]: false}));
    }
  };
  
    if (loading) {
        return (
            <div className="border bg-card rounded-lg p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/3">Event</TableHead>
                            <TableHead>Your Bet</TableHead>
                            <TableHead>Staked</TableHead>
                            <TableHead>Outcome</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({length: 5}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-9 w-28 ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

  return (
      <div className="border bg-card rounded-lg p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Event</TableHead>
              <TableHead>Your Bet</TableHead>
              <TableHead>Staked</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets.length > 0 ? (
              bets.map((bet) => (
                <TableRow key={bet.id}>
                  <TableCell className="font-medium max-w-sm truncate">{bet.eventQuestion}</TableCell>
                  <TableCell>
                     <Badge variant={bet.userBet === 'YES' ? 'default' : 'secondary'} className={cn(
                        bet.userBet === 'YES' ? 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/30' : 'text-muted-foreground'
                    )}>
                        {bet.userBet}
                    </Badge>
                  </TableCell>
                  <TableCell>{bet.stakedAmount.toFixed(4)} {chain?.nativeCurrency.symbol}</TableCell>
                  <TableCell>{getOutcomeBadge(bet.outcome)}</TableCell>
                  <TableCell className="text-right">
                    {(bet.outcome === "Won" || bet.outcome === "Refundable") && (
                      <Button 
                        size="sm"
                        onClick={() => handleAction(bet)}
                        disabled={actionLoading[bet.id]}
                      >
                         {actionLoading[bet.id] && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                         Claim {bet.winnings?.toFixed(4)} {chain?.nativeCurrency.symbol}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <Ticket className="w-16 h-16 text-primary/20"/>
                        <div className="text-center">
                            <h3 className="font-bold text-lg text-foreground">Your Prediction Arena Awaits</h3>
                            <p className="text-sm">Place your first bet to see your history here.</p>
                        </div>
                        <Button onClick={() => router.push('/')} variant="outline">
                            Browse Events
                        </Button>
                    </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
  );
}
