
'use client';

import { useState, useMemo } from 'react';
import type { Event, BetOutcome } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useWallet } from '@/hooks/use-wallet';
import { useToast } from '@/hooks/use-toast';
import { blockchainService } from '@/services/blockchain';
import { parseEther, UserRejectedRequestError } from 'viem';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StakePanelProps {
  event: Event;
  userBalance: number;
  onBetPlaced: () => void;
  yesOdds: number;
  noOdds: number;
}

export function StakePanel({ event, userBalance, onBetPlaced, yesOdds, noOdds }: StakePanelProps) {
  const { toast } = useToast();
  const { address, walletClient, fetchBalance } = useWallet();
  const [stake, setStake] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<BetOutcome>('YES');
  
  const handlePlaceBet = async () => {
    if (!address || !walletClient) {
      toast({ variant: 'destructive', title: 'Wallet not connected' });
      return;
    }
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
    if (stakeAmount > userBalance) {
      toast({ variant: 'destructive', title: 'Insufficient Balance', description: 'Your $TRUST balance is too low.' });
      return;
    }

    setIsLoading(true);
    try {
      const txHash = await blockchainService.placeBet(walletClient, address, BigInt(event.id), selectedOutcome === 'YES', parseEther(stake));
      toast({ title: 'Bet Submitted', description: `Waiting for confirmation... Tx: ${txHash.slice(0, 10)}...` });
      
      await blockchainService.waitForTransaction(txHash);
      
      toast({ title: 'Bet Placed Successfully!', description: `Your bet of ${stakeAmount} $TRUST on ${selectedOutcome} has been confirmed.` });
      fetchBalance({ address });
      onBetPlaced();
    } catch (e: any) {
      if (e instanceof UserRejectedRequestError) {
        toast({
          variant: 'default',
          title: 'Transaction Canceled',
          description: 'You rejected the transaction in your wallet.',
        });
      } else {
        console.error(e);
        toast({ variant: 'destructive', title: 'Bet Failed', description: e.shortMessage || 'An unexpected error occurred.' });
      }
    } finally {
      setIsLoading(false);
      setStake('');
    }
  };

  const potentialWinnings = useMemo(() => {
    if (!stake || Number(stake) <= 0) return 0;
    const odds = selectedOutcome === 'YES' ? yesOdds : noOdds;
    return Number(stake) * odds;
  }, [stake, selectedOutcome, yesOdds, noOdds]);
  
  const handleStakeChange = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
        setStake('');
    } else {
        setStake(value);
    }
  }

  const setStakePercentage = (percentage: number) => {
      const amount = (userBalance * percentage) / 100;
      handleStakeChange(amount.toFixed(2));
  }


  return (
    <div className="sticky bottom-0 z-10 w-full bg-component-dark rounded-t-xl border-t border-border-custom p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => setSelectedOutcome('YES')}
          className={cn("p-3 rounded-lg font-bold text-sm", selectedOutcome === 'YES' ? 'bg-primary text-primary-foreground' : 'bg-surface-dark border border-border-custom text-white hover:bg-surface-dark/80')}
        >
          YES
        </button>
        <button
          onClick={() => setSelectedOutcome('NO')}
          className={cn("p-3 rounded-lg font-bold text-sm", selectedOutcome === 'NO' ? 'bg-primary text-primary-foreground' : 'bg-surface-dark border border-border-custom text-white hover:bg-surface-dark/80')}
        >
          NO
        </button>
      </div>
      <div className="relative">
        <Input
          className="w-full bg-background-dark border border-border-custom rounded-lg p-3 h-auto text-white text-lg font-bold pr-24 focus:ring-primary focus:border-primary"
          type="number"
          value={stake}
          onChange={(e) => handleStakeChange(e.target.value)}
          placeholder="0.00"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$TRUST</span>
      </div>
      <div className="flex items-center gap-2">
         <Slider
            value={[Number(stake) || 0]}
            onValueChange={(value) => handleStakeChange(value[0].toString())}
            max={Math.max(userBalance, event.maxStake)}
            step={0.01}
          />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        <button onClick={() => setStakePercentage(25)} className="bg-surface-dark border border-border-custom/50 text-muted-foreground p-2 rounded-full hover:bg-component-light-dark">25%</button>
        <button onClick={() => setStakePercentage(50)} className="bg-surface-dark border border-border-custom/50 text-muted-foreground p-2 rounded-full hover:bg-component-light-dark">50%</button>
        <button onClick={() => setStakePercentage(75)} className="bg-surface-dark border border-border-custom/50 text-muted-foreground p-2 rounded-full hover:bg-component-light-dark">75%</button>
        <button onClick={() => setStakePercentage(100)} className="bg-surface-dark border border-border-custom/50 text-muted-foreground p-2 rounded-full hover:bg-component-light-dark">MAX</button>
      </div>
      <div className="flex justify-between items-center text-muted-foreground text-sm">
        <span>Stake Amount</span>
        <span className="text-white font-bold">{Number(stake).toFixed(2)} $TRUST</span>
      </div>
      <div className="flex justify-between items-center text-muted-foreground text-sm">
        <span>Odds</span>
        <span className="text-accent-blue font-bold">{(selectedOutcome === 'YES' ? yesOdds : noOdds).toFixed(2)}</span>
      </div>
      <div className="flex justify-between items-center text-muted-foreground text-base">
        <span className="font-bold">Potential Win</span>
        <span className="text-primary font-bold text-lg">{potentialWinnings.toFixed(2)} $TRUST</span>
      </div>
      <Button 
        className="w-full bg-primary text-black font-bold py-4 h-auto rounded-lg text-base hover:bg-primary/90"
        onClick={handlePlaceBet}
        disabled={isLoading || !stake || event.status !== 'open'}
       >
         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
         Place Bet
      </Button>
    </div>
  );
}
