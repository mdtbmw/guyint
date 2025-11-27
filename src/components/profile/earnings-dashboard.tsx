'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { blockchainService } from '@/services/blockchain';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertTriangle, Star } from 'lucide-react';
import { useNotifications } from '@/lib/state/notifications';
import { formatEther, parseEther } from 'viem';

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
      const [allEvents, platformFeeBps] = await Promise.all([
          blockchainService.getAllEvents(),
          blockchainService.getPlatformFee()
      ]);
      
      if (allEvents.length === 0) {
        setClaimable([]);
        setLoading(false);
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
        
        if (event.status === 'canceled') {
          type = 'Refund';
          claimableAmount = Number(formatEther(totalBetAmount));
        }
        else if (event.status === 'finished' && event.winningOutcome) {
          const stakedOnYes = onChainBet.yesAmount > 0n;
          const userWon = (event.winningOutcome === 'YES' && stakedOnYes) || (event.winningOutcome === 'NO' && !stakedOnYes);

          if (userWon) {
            type = 'Winnings';
            const userStake = stakedOnYes ? onChainBet.yesAmount : onChainBet.noAmount;
            
            // Correctly determine winning and total pools
            const winningPool = event.winningOutcome === 'YES' ? event.outcomes.yes : event.outcomes.no;
            const totalPool = event.totalPool;

            if (winningPool > 0) {
              // Exact calculation must match smart contract:
              // payout = (userStake * (totalPool - platformFee)) / winningPool
              const totalPoolBigInt = parseEther(String(totalPool));
              const winningPoolBigInt = parseEther(String(winningPool));
              
              const platformFee = (totalPoolBigInt * BigInt(platformFeeBps)) / 10000n;
              const distributablePool = totalPoolBigInt - platformFee;

              const payout = (userStake * distributablePool) / winningPoolBigInt;
              claimableAmount = Number(formatEther(payout));
            } else {
              // If winning pool is 0, user gets their stake back. This is an edge case.
              claimableAmount = Number(formatEther(userStake));
            }
          }
        }
        
        if (type && claimableAmount > 0.00001) { // Add a small threshold to avoid dust
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
      description: `Attempting to claim from ${claimable.length} event(s). Please approve transactions.`,
      icon: 'Loader2',
      type: 'general'
    });
    
    let successCount = 0;
    let failCount = 0;

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
        description: `Successfully claimed from ${successCount} event(s).`,
        icon: 'CheckCircle',
        variant: 'success',
        type: 'onWinningsClaimed'
      });
      fetchBalance();
      fetchClaimableAssets();
    }
    
    if (failCount > 0) {
      addNotification({
        title: 'Some Claims Failed',
        description: `Failed to claim from ${failCount} event(s). Check console for details.`,
        icon: 'AlertTriangle',
        variant: 'destructive',
        type: 'general'
      });
    }

    setClaiming(false);
  };
  
  if (totalClaimable === 0 && !loading) return null;

  return (
      <div className="glass-panel p-4 rounded-2xl border-l-4 border-primary/50 flex items-center justify-between gap-4 shadow-xl animate-slide-up">
        <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-primary animate-float" />
            <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Claimable Rewards</p>
                {loading ? <Skeleton className="h-6 w-32 mt-1" /> : (
                    <p className="text-xl font-display font-bold text-foreground font-mono">
                        {totalClaimable.toFixed(4)} {chain?.nativeCurrency.symbol}
                    </p>
                )}
            </div>
        </div>
        <Button onClick={handleClaimAll} disabled={claiming || loading || totalClaimable === 0} className="active-press px-4 py-2 rounded-xl text-black text-xs font-bold uppercase unclaimed-shimmer shadow-lg">
            {claiming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Claim All
        </Button>
    </div>
  );
}
