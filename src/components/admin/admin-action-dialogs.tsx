
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { blockchainService } from "@/services/blockchain";
import { useToast } from "@/hooks/use-toast";
import type { Event, BetOutcome } from "@/lib/types";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

interface DialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    event: Event;
    onActionSuccess: () => void;
}

export function DeclareOutcomeDialog({ isOpen, setIsOpen, event, onActionSuccess }: DialogProps) {
    const { toast } = useToast();
    const { walletClient, address } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [outcome, setOutcome] = useState<BetOutcome | null>(null);

    const handleDeclare = async () => {
        if (!outcome) {
            toast({ variant: 'destructive', title: 'Please select an outcome.'});
            return;
        }
        if (!walletClient || !address) {
            toast({ variant: 'destructive', title: 'Wallet not connected.'});
            return;
        }
        setIsLoading(true);
        try {
            const txHash = await blockchainService.declareResult(walletClient, address, BigInt(event.id), outcome === 'YES');
            toast({ title: 'Transaction Submitted', description: `Waiting for confirmation... Tx: ${txHash.slice(0, 10)}...` });
            await blockchainService.waitForTransaction(txHash);
            toast({ title: 'Success!', description: `The outcome for "${event.question}" has been declared as ${outcome}.` });
            onActionSuccess();
            setIsOpen(false);
        } catch(e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Failed to Declare Outcome', description: e.shortMessage || 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Declare Winning Outcome</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60">
                        Select the final, verified outcome for the event: "{event.question}". This action is irreversible and will allow winners to claim their funds.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                     <Select onValueChange={(value: BetOutcome) => setOutcome(value)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select the winning outcome..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="YES">YES</SelectItem>
                            <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <AlertDialogFooter className="border-t border-white/10 pt-4">
                    <AlertDialogCancel className="bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white" disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-emerald-600 text-white hover:bg-emerald-500" onClick={handleDeclare} disabled={isLoading || !outcome}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Submitting...' : 'Declare Outcome'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export function CancelEventDialog({ isOpen, setIsOpen, event, onActionSuccess }: DialogProps) {
    const { toast } = useToast();
    const { walletClient, address } = useWallet();
    const [isLoading, setIsLoading] = useState(false);

    const handleCancel = async () => {
         if (!walletClient || !address) {
            toast({ variant: 'destructive', title: 'Wallet not connected.'});
            return;
        }
        setIsLoading(true);
        try {
            const txHash = await blockchainService.cancelEvent(walletClient, address, BigInt(event.id));
            toast({ title: 'Transaction Submitted', description: `Waiting for confirmation... Tx: ${txHash.slice(0, 10)}...` });
            await blockchainService.waitForTransaction(txHash);
            toast({ title: 'Success!', description: `The event "${event.question}" has been canceled. Users can now claim refunds.` });
            onActionSuccess();
            setIsOpen(false);
        } catch(e: any) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Failed to Cancel Event', description: e.shortMessage || 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent className="bg-neutral-900 border-neutral-800">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-white/60">
                        You are about to cancel the event: "{event.question}". This will change its status to "Canceled" and allow all participants to claim a full refund of their stake. This action is irreversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="border-t border-white/10 pt-4">
                    <AlertDialogCancel className="bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white" disabled={isLoading}>Back</AlertDialogCancel>
                    <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-500" onClick={handleCancel} disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Canceling...' : 'Yes, Cancel Event'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
