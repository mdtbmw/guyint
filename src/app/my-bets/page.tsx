
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
import { useEffect, useState, useMemo, useCallback } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { blockchainService } from "@/services/blockchain";
import { formatEther } from "viem";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { address, connected, fetchBalance } = useWallet();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();

  const eventsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'events'));
  }, [firestore]);

  const { data: events, loading: eventsLoading } = useCollection<Event>(eventsQuery);

  const fetchBets = useCallback(async () => {
      if (!address || eventsLoading || !events) {
        return;
      }
      try {
        setLoading(true);
        const userBetsPromises = events.map(async (event) => {
          const onChainBet = await blockchainService.getUserBet(BigInt(event.id), address);
          if (onChainBet && Number(formatEther(onChainBet.amount)) > 0) {
            
            let outcome: Bet['outcome'] = 'Pending';
            let winnings = 0;

            if(event.status === 'canceled') {
              outcome = onChainBet.claimed ? 'Refunded' : 'Refundable';
            } else if (event.status === 'finished' && event.winningOutcome) {
              const userWon = (event.winningOutcome === 'YES' && onChainBet.outcome) || (event.winningOutcome === 'NO' && !onChainBet.outcome);
              if (userWon) {
                 outcome = onChainBet.claimed ? 'Claimed' : 'Won';
                 if (event.totalPool > 0) {
                   const winningPool = event.winningOutcome === 'YES' ? event.outcomes.yes : event.outcomes.no;
                   const totalLosingPool = event.totalPool - winningPool;
                   winnings = (Number(formatEther(onChainBet.amount)) / winningPool) * totalLosingPool + Number(formatEther(onChainBet.amount));
                 }
              } else {
                outcome = 'Lost';
              }
            }

            return {
              id: `${event.id}-${address}`,
              eventId: event.id,
              eventQuestion: event.question,
              userBet: onChainBet.outcome ? 'YES' : 'NO',
              stakedAmount: Number(formatEther(onChainBet.amount)),
              date: new Date(), // Date is not available from this data, using current date
              outcome: outcome,
              winnings: winnings,
            } as Bet;
          }
          return null;
        });

        const userBets = (await Promise.all(userBetsPromises)).filter(bet => bet !== null) as Bet[];
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
    }, [address, events, eventsLoading, toast]);


  useEffect(() => {
    if (!connected) {
      router.push('/');
      return;
    }
    fetchBets();
  }, [connected, router, fetchBets]);

  const handleAction = async (actionType: 'claim' | 'refund', bet: Bet) => {
    if (!address) return;
    setActionLoading(prev => ({...prev, [bet.id]: true}));
    try {
        const actionFunction = actionType === 'claim' ? blockchainService.claimWinnings : blockchainService.claimRefund;
        const txHash = await actionFunction(BigInt(bet.eventId));
        toast({
            title: "Transaction Submitted",
            description: `Waiting for confirmation... Tx: ${txHash.slice(0, 10)}...`
        });
        await blockchainService.waitForTransaction(txHash);
        toast({
            title: "Success!",
            description: `Your ${actionType === 'claim' ? 'winnings have' : 'refund has'} been sent to your wallet.`
        });
        fetchBets(); // Re-fetch bets to update the UI
        fetchBalance(address); // Re-fetch balance
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
  }


  if (!connected) {
    return <div className="text-center py-12">Redirecting...</div>;
  }

  const renderAction = (bet: Bet) => {
    const isLoading = actionLoading[bet.id];
    switch (bet.outcome) {
        case "Won":
            return (
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={() => handleAction('claim', bet)} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Claim Winnings
                </Button>
            );
        case "Refundable":
            return (
                 <Button size="sm" variant="outline" onClick={() => handleAction('refund', bet)} disabled={isLoading}>
                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Claim Refund
                </Button>
            )
        default:
            return <div className="text-right text-white/50">-</div>;
    }
  }

  return (
    <div className="space-y-4">
        <PageHeader 
          title="My Betting History"
          description="A log of all your past and present bets on the mainnet."
        />
        <Table>
        <TableHeader>
            <TableRow className="border-b-white/10">
                <TableHead className="text-white/70">Event</TableHead>
                <TableHead className="text-white/70">Your Bet</TableHead>
                <TableHead className="text-white/70 text-right">Staked</TableHead>
                <TableHead className="text-white/70">Outcome</TableHead>
                <TableHead className="text-white/70 text-right">Action</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b-white/5 hover:bg-white/5">
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                     <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
            ))
            ) : bets.length > 0 ? (
            bets.map((bet) => (
                <TableRow key={bet.id} className="border-b-white/5 hover:bg-white/5">
                    <TableCell className="font-medium max-w-[120px] truncate">{bet.eventQuestion}</TableCell>
                    <TableCell>
                        <span className={cn("font-semibold", bet.userBet === "YES" ? "text-emerald-400" : "text-rose-400")}>
                        {bet.userBet}
                        </span>
                    </TableCell>
                    <TableCell className="text-right text-white/80">{bet.stakedAmount.toFixed(2)}</TableCell>
                    <TableCell>{getOutcomeBadge(bet.outcome)}</TableCell>
                    <TableCell className="text-right">{renderAction(bet)}</TableCell>
                </TableRow>
            ))
            ) : (
                <TableRow className="border-b-white/5 hover:bg-white/5">
                    <TableCell colSpan={5} className="h-24 text-center text-white/60">
                        {"You haven't placed any bets yet."}
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
        </Table>
    </div>
  );
}
