
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
import type { Bet, Event } from "@/lib/types";
import { CheckCircle, XCircle, Clock, RotateCw, Check, Ticket, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { blockchainService } from "@/services/blockchain";
import { formatEther } from "viem";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";

const getOutcomeBadge = (outcome: Bet['outcome']) => {
  switch (outcome) {
    case "Won":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30">
          <CheckCircle className="mr-1 h-3 w-3" /> Won
        </Badge>
      );
    case "Claimed":
       return (
        <Badge className="bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border-indigo-500/30">
          <Check className="mr-1 h-3 w-3" /> Claimed
        </Badge>
      );
    case "Lost":
      return (
        <Badge className="bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border-rose-500/30">
          <XCircle className="mr-1 h-3 w-3" /> Lost
        </Badge>
      );
    case "Pending":
      return (
        <Badge variant="outline" className="border-white/20 text-white/70">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
    case "Refunded":
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30">
          <RotateCw className="mr-1 h-3 w-3" /> Refunded
        </Badge>
      );
      case "Refundable":
      return (
        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30 animate-pulse">
          <RotateCw className="mr-1 h-3 w-3" /> Refundable
        </Badge>
      );
  }
};


export default function MyBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const { address, connected, fetchBalance, walletClient } = useWallet();
  const router = useRouter();
  const { toast } = useToast();

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

        const betData = await blockchainService.getMultipleUserBets(
          allEvents.map(e => BigInt(e.id)),
          address
        );

        const userBets: Bet[] = [];

        betData.forEach((onChainBet, index) => {
          if (onChainBet && Number(formatEther(onChainBet.amount)) > 0) {
            const event = allEvents[index];
            let outcome: Bet['outcome'] = 'Pending';
            let winnings = 0;

            if (event.status === 'canceled') {
              outcome = onChainBet.claimed ? 'Refunded' : 'Refundable';
              winnings = Number(formatEther(onChainBet.amount));
            } else if (event.status === 'finished' && event.winningOutcome) {
              const userWon = (event.winningOutcome === 'YES' && onChainBet.outcome) || (event.winningOutcome === 'NO' && !onChainBet.outcome);
              if (userWon) {
                 outcome = onChainBet.claimed ? 'Claimed' : 'Won';
                 if (event.totalPool > 0) {
                   const userStake = Number(formatEther(onChainBet.amount));
                   const winningPool = event.winningOutcome === 'YES' ? event.outcomes.yes : event.outcomes.no;
                   const totalLosingPool = event.totalPool - winningPool;
                   
                   // More accurate winnings calculation
                   if (winningPool > 0) {
                    winnings = (userStake / winningPool) * totalLosingPool + userStake;
                   } else {
                    winnings = userStake; // Return stake if no one else bet on the winning side
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
              userBet: onChainBet.outcome ? 'YES' : 'NO',
              stakedAmount: Number(formatEther(onChainBet.amount)),
              date: new Date(),
              outcome: outcome,
              winnings: winnings,
            });
          }
        });

        setBets(userBets.sort((a,b) => b.date.getTime() - a.date.getTime()));

      } catch (error) {
        console.error("Failed to fetch bets:", error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load your on-chain betting history.",
          });
      } finally {
        setLoading(false);
      }
    }, [address, connected, toast]);


  useEffect(() => {
    if (!connected) {
      router.push('/');
      return;
    }
    fetchBets();
  }, [connected, router, fetchBets]);

  const handleAction = async (actionType: 'claim' | 'refund', bet: Bet) => {
    if (!address || !walletClient) return;
    setActionLoading(prev => ({...prev, [bet.id]: true}));
    try {
        const actionFunction = actionType === 'claim' ? blockchainService.claimWinnings : blockchainService.claimRefund;
        const txHash = await actionFunction(walletClient, address, BigInt(bet.eventId));
        toast({
            title: "Transaction Submitted",
            description: `Waiting for confirmation... Tx: ${txHash.slice(0, 10)}...`
        });
        await blockchainService.waitForTransaction(txHash);
        toast({
            title: "Success!",
            description: `Your ${actionType === 'claim' ? 'winnings have' : 'refund has'} been sent to your wallet.`
        });
        fetchBets();
        fetchBalance({ address });
    } catch (e: any) {
        console.error(e);
        toast({
            variant: "destructive",
            title: `Failed to ${actionType === 'claim' ? 'Claim Winnings' : 'Claim Refund'}`,
            description: e.shortMessage || 'An unexpected error occurred.'
        });
    } finally {
      setActionLoading(prev => ({...prev, [bet.id]: false}));
    }
  };
  
    if (loading) {
        return (
            <div className="space-y-4">
                <MobilePageHeader title="My Bets" />
                <div className="hidden md:block">
                  <PageHeader 
                      title="My Betting History"
                      description="Your on-chain record of predictions, outcomes, and winnings."
                  />
                </div>
                <div className="border rounded-lg p-0">
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
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-9 w-28 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

  return (
    <div className="space-y-4">
      <MobilePageHeader title="My Bets" />
      <div className="hidden md:block">
        <PageHeader 
          title="My Betting History"
          description="Your on-chain record of predictions, outcomes, and winnings."
        />
      </div>
      <div className="border rounded-lg p-0">
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
                    <Badge variant={bet.userBet === 'YES' ? 'default' : 'destructive'} className={cn(
                        bet.userBet === 'YES' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    )}>
                        {bet.userBet}
                    </Badge>
                  </TableCell>
                  <TableCell>{bet.stakedAmount.toFixed(2)} $T</TableCell>
                  <TableCell>{getOutcomeBadge(bet.outcome)}</TableCell>
                  <TableCell className="text-right">
                    {(bet.outcome === "Won" || bet.outcome === "Refundable") && (
                      <Button 
                        size="sm"
                        onClick={() => handleAction(bet.outcome === "Won" ? 'claim' : 'refund', bet)}
                        disabled={actionLoading[bet.id]}
                      >
                         {actionLoading[bet.id] && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                         Claim {bet.winnings?.toFixed(2)} $T
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                    <Ticket className="mx-auto w-12 h-12 text-gray-500 mb-4"/>
                    <h3 className="font-semibold text-lg">No Bets Found</h3>
                    <p className="text-sm">You haven't placed any bets yet.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
