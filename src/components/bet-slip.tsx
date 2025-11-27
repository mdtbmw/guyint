
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import type { Event, BetOutcome } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useWallet } from "@/hooks/use-wallet";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { blockchainService } from "@/services/blockchain";
import { parseEther, formatEther } from "viem";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BetSlipProps {
    event: Event | null;
    outcome: BetOutcome | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BetSlip({ event, outcome, open, onOpenChange }: BetSlipProps) {
    const { balance, fetchBalance, address } = useWallet();
    const [stake, setStake] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    if (!event || !outcome) return null;

    const yesOdds = (event.totalPool + Number(stake)) / (event.outcomes.yes + (outcome === 'YES' ? Number(stake) : 0));
    const noOdds = (event.totalPool + Number(stake)) / (event.outcomes.no + (outcome === 'NO' ? Number(stake) : 0));

    const potentialWinnings = outcome === 'YES' 
        ? (Number(stake) * yesOdds)
        : (Number(stake) * noOdds);

    const handlePlaceBet = async () => {
        if (!address) return;
        const stakeAmount = Number(stake);
        if (isNaN(stakeAmount) || stakeAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid Stake', description: 'Please enter a positive number.' });
            return;
        }
        if (stakeAmount < event.minStake) {
            toast({ variant: 'destructive', title: 'Stake Too Low', description: `Minimum stake is ${event.minStake} $TRUST.` });
            return;
        }
        if (stakeAmount > event.maxStake) {
            toast({ variant: 'destructive', title: 'Stake Too High', description: `Maximum stake is ${event.maxStake} $TRUST.` });
            return;
        }
        if (stakeAmount > balance) {
            toast({ variant: 'destructive', title: 'Insufficient Balance', description: 'Your $TRUST balance is too low.' });
            return;
        }

        setIsLoading(true);
        try {
            const txHash = await blockchainService.placeBet(BigInt(event.id), outcome === 'YES', parseEther(stake));
            toast({ title: 'Bet Submitted', description: `Waiting for confirmation... Tx: ${txHash.slice(0, 10)}...` });
            
            onOpenChange(false); // Close sheet immediately
            
            await blockchainService.waitForTransaction(txHash);
            
            toast({ title: 'Bet Placed Successfully!', description: `Your bet of ${stakeAmount} $TRUST on ${outcome} has been confirmed.` });
            fetchBalance(address);
            router.refresh();
        } catch (e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Bet Failed', description: e.shortMessage || 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-neutral-900 border-neutral-800 text-white w-full max-w-md">
                <SheetHeader>
                    <SheetTitle className="text-white text-2xl">Your Bet Slip</SheetTitle>
                    <SheetDescription className="text-white/60">
                        {event.question}
                    </SheetDescription>
                </SheetHeader>
                <div className="py-8 space-y-6">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg">
                        <span className="text-white/70">Your Prediction</span>
                        <span className={cn(
                            "font-bold text-lg",
                            outcome === 'YES' ? 'text-emerald-400' : 'text-rose-400'
                        )}>
                            {outcome}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="stake" className="text-sm font-medium text-white/80">Stake Amount ($TRUST)</label>
                        <Input 
                            id="stake"
                            type="number"
                            placeholder="e.g., 10.0"
                            value={stake}
                            onChange={(e) => setStake(e.target.value)}
                            className="h-12 text-lg"
                        />
                         <div className="text-xs text-white/60 flex justify-between">
                            <span>Balance: {balance.toFixed(2)} $TRUST</span>
                             <span>Min: {event.minStake} / Max: {event.maxStake}</span>
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/70">Potential Payout</span>
                            <span className="font-bold text-emerald-400 text-lg">{potentialWinnings.toFixed(2)} $TRUST</span>
                        </div>
                        <p className="text-xs text-white/50">
                            Payouts are calculated based on the final pool size and odds at event closure.
                        </p>
                    </div>

                </div>
                <SheetFooter className="mt-auto">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <SheetClose asChild>
                            <Button variant="outline" className="bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white" disabled={isLoading}>Cancel</Button>
                        </SheetClose>
                        <Button
                            className="bg-primary hover:bg-primary/90"
                            onClick={handlePlaceBet}
                            disabled={isLoading || !stake}
                        >
                             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             {isLoading ? 'Submitting...' : 'Place Bet'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
