
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { blockchainService } from '@/services/blockchain';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertTriangle, CheckCircle, Wallet, Gift } from 'lucide-react';
import { useNotifications } from '@/lib/state/notifications';
import { formatEther } from 'viem';
import { Bet } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface ClaimableItem {
  eventId: string;
  eventQuestion: string;
  type: 'Winnings' | 'Refund';
  amount: number;
}

export function EarningsDashboard() {
  const { address, connected, walletClient, fetchBalance } = useWallet();
  const [claimable, setClaimable] = useState<ClaimableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  
  const chain = useWallet().chain;

  const fetchClaimableAssets = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const allEvents = await blockchainService.getAllEvents();
      if (allEvents.length === 0) {
        setClaimable([]);
        return;
      }
      
      const eventIdsAsBigInt = allEvents.map(e => BigInt(e.id));
      const betData = await blockchainService.getMultipleUserBets(eventIdsAsBigInt, address);

      const claimableItems: ClaimableItem[] = [];

      betData.forEach((onChainBet, index) => {
        if (onChainBet.claimed) return;

        const event = allEvents[index];
        const totalBetAmount = onChainBet.yesAmount + onChainBet.noAmount;

        if (totalBetAmount === 0n) return;
        
        let claimableAmount = 0;
        let type: 'Winnings' | 'Refund' | null = null;
        
        // Handle refunds for canceled events
        if (event.status === 'canceled') {
          type = 'Refund';
          claimableAmount = Number(formatEther(totalBetAmount));
        }
        // Handle winnings for finished events
        else if (event.status === 'finished' && event.winningOutcome) {
          const stakedOnYes = onChainBet.yesAmount > 0n;
          const userWon = (event.winningOutcome === 'YES' && stakedOnYes) || (event.winningOutcome === 'NO' && !stakedOnYes);

          if (userWon) {
            type = 'Winnings';
            const userStake = Number(formatEther(stakedOnYes ? onChainBet.yesAmount : onChainBet.noAmount));
            const winningPool = event.winningOutcome === 'YES' ? event.outcomes.yes : event.outcomes.no;
            
            if (winningPool > 0) {
              claimableAmount = (userStake * event.totalPool) / winningPool;
            } else {
              claimableAmount = userStake; // Return of stake if winning pool is somehow 0
            }
          }
        }
        
        if (type && claimableAmount > 0) {
          claimableItems.push({
            eventId: event.id,
            eventQuestion: event.question,
            type: type,
            amount: claimableAmount,
          });
        }
      });
      setClaimable(claimableItems);
    } catch (e: any) {
      setError(e.message || "An error occurred while fetching your earnings.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (connected) {
      fetchClaimableAssets();
    }
  }, [connected, fetchClaimableAssets]);

  const totalClaimable = useMemo(() => {
    return claimable.reduce((sum, item) => sum + item.amount, 0);
  }, [claimable]);

  const handleClaimAll = async () => {
    if (!walletClient || !address || claimable.length === 0) return;

    setClaiming(true);
    addNotification({
      title: 'Starting Mass Claim',
      description: `Attempting to claim from ${claimable.length} event(s). Please approve transactions in your wallet.`,
      icon: 'Loader2',
      type: 'general'
    });
    
    let successCount = 0;
    let failCount = 0;

    // Process claims sequentially to avoid nonce issues
    for (const item of claimable) {
      try {
        const txHash = await blockchainService.claim(walletClient, address, BigInt(item.eventId));
        await blockchainService.waitForTransaction(txHash);
        successCount++;
      } catch (e) {
        failCount++;
        console.error(`Failed to claim event ${item.eventId}:`, e);
      }
    }
    
    if (successCount > 0) {
      addNotification({
        title: 'Claims Processed',
        description: `Successfully claimed from ${successCount} event(s). Your funds are in your wallet.`,
        icon: 'CheckCircle',
        variant: 'success',
        type: 'onWinningsClaimed'
      });
      fetchBalance();
      fetchClaimableAssets(); // Refresh the list
    }
    
    if (failCount > 0) {
      addNotification({
        title: 'Some Claims Failed',
        description: `Failed to claim from ${failCount} event(s). Check the console for details.`,
        icon: 'AlertTriangle',
        variant: 'destructive',
        type: 'general'
      });
    }

    setClaiming(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Gift />
            Claimable Earnings
        </CardTitle>
        <CardDescription>
            Withdraw your winnings and refunds from resolved events directly to your wallet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-secondary p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">Total Available to Withdraw</p>
            {loading ? (
                <Skeleton className="h-10 w-48 mx-auto mt-2" />
            ) : (
                <p className="text-4xl font-bold tracking-tight text-foreground mt-1">
                    {totalClaimable.toFixed(4)} <span className="text-primary">{chain?.nativeCurrency.symbol}</span>
                </p>
            )}
        </div>
        
        <Button
            className="w-full h-12 text-base"
            disabled={claiming || loading || totalClaimable === 0}
            onClick={handleClaimAll}
        >
            {claiming ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wallet className="mr-2 h-5 w-5" />}
            {claiming ? 'Processing Claims...' : 'Withdraw All Earnings'}
        </Button>
        
        {claimable.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground px-1">Breakdown</h4>
                <ScrollArea className="h-48">
                    <div className="space-y-2 pr-4">
                    {claimable.map(item => (
                        <div key={item.eventId} className="flex items-center justify-between rounded-md p-3 bg-secondary/50">
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-medium text-foreground truncate">{item.eventQuestion}</p>
                                <p className="text-xs text-muted-foreground">{item.type}</p>
                            </div>
                            <p className="text-sm font-bold text-primary pl-4">{item.amount.toFixed(4)}</p>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </div>
        )}

      </CardContent>
    </Card>
  );
}
