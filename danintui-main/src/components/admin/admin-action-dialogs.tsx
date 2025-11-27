
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
import { useNotifications } from '@/lib/state/notifications';
import { WalletClient, Address } from "viem";

interface DialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    event: Event;
    onActionSuccess: () => void;
}

interface DeclareDialogProps extends DialogProps {
    walletClient: WalletClient | null | undefined;
    address: Address | undefined;
}


export function DeclareOutcomeDialog({ isOpen, setIsOpen, event, onActionSuccess, walletClient, address }: DeclareDialogProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [outcome, setOutcome] = useState<BetOutcome | null>(null);
    const { addNotification } = useNotifications();

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
            const txHash = await blockchainService.resolveEvent(walletClient, address, BigInt(event.id), outcome === 'YES');
            addNotification({
                title: "Transaction Submitted",
                description: `Declaring outcome... Tx: ${txHash.slice(0, 10)}...`,
                icon: 'Loader2',
                type: 'onEventResolved'
            });
            await blockchainService.waitForTransaction(txHash);
            addNotification({
                title: 'Outcome Declared!',
                description: `Event "${event.question.slice(0, 20)}..." has been resolved.`,
                icon: 'CheckCircle',
                type: 'onEventResolved'
            });
            onActionSuccess();
            setIsOpen(false);
        } catch(e: any) {
            console.error(e);
            addNotification({
                variant: 'destructive',
                title: 'Failed to Declare Outcome',
                description: e.message || 'An unexpected error occurred.',
                icon: 'AlertTriangle',
                type: 'general'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Declare Winning Outcome</AlertDialogTitle>
                    <AlertDialogDescription>
                        Select the final, verified outcome for the event: "{event.question}". This action is irreversible and will allow winners to claim their funds.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4">
                     <Select onValueChange={(value: BetOutcome) => setOutcome(value)} disabled={event.status !== 'open' && event.status !== 'closed'}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select the winning outcome..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="YES">YES</SelectItem>
                            <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeclare} disabled={isLoading || !outcome || (event.status !== 'open' && event.status !== 'closed')}>
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
    const { addNotification } = useNotifications();


    const handleCancel = async () => {
         if (!walletClient || !address) {
            toast({ variant: 'destructive', title: 'Wallet not connected.'});
            return;
        }
        setIsLoading(true);
        try {
            const txHash = await blockchainService.cancelEvent(walletClient, address, BigInt(event.id));
             addNotification({
                title: "Transaction Submitted",
                description: `Canceling event... Tx: ${txHash.slice(0, 10)}...`,
                icon: 'Loader2',
                type: 'general'
            });
            await blockchainService.waitForTransaction(txHash);
            addNotification({
                title: 'Event Canceled',
                description: `Event "${event.question.slice(0, 20)}..." has been canceled. All stakes have been refunded.`,
                icon: 'Ban',
                variant: 'destructive',
                type: 'general'
            });
            onActionSuccess();
            setIsOpen(false);
        } catch(e: any) {
            console.error(e);
             addNotification({
                variant: 'destructive',
                title: 'Failed to Cancel Event',
                description: e.message || 'An unexpected error occurred.',
                icon: 'AlertTriangle',
                type: 'general'
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete and Refund Event?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are about to delete the event: "{event.question}". This will permanently cancel the event and allow all participants to claim a full refund of their stake. This action is irreversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Back</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleCancel} disabled={isLoading}>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Canceling...' : 'Yes, Delete & Refund'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
