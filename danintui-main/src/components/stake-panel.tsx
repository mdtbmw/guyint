'use client';

import { useState, useMemo } from 'react';
import type { Event, BetOutcome } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useWallet } from '@/hooks/use-wallet';
import { blockchainService } from '@/services/blockchain';
import { UserRejectedRequestError } from 'viem';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/state/notifications';

interface StakePanelProps {
  event: Event;
  userBalance: number;
  onBetPlaced: () => void;
  yesOdds: number;
  noOdds: number;
}

export function StakePanel({ event, userBalance, onBetPlaced, yesOdds, noOdds }: StakePanelProps) {
  const { address, walletClient, fetchBalance, chain } = useWallet();
  const [stake, setStake] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<BetOutcome>('YES');
  
  const { addNotification } = useNotifications();
  
  const handlePlaceBet = async () => {
    if (!address || !walletClient) {
      addNotification({ title: 'Wallet not connected', description: 'Please connect your wallet to place a bet.', icon: 'AlertTriangle', type: 'general' });
      return;
    }
    const stakeAmount = Number(stake);
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      addNotification({ title: 'Invalid Stake', description: 'Please enter a positive number.', icon: 'AlertTriangle', variant: 'destructive', type: 'general' });
      return;
    }
    if (stakeAmount < event.minStake) {
        addNotification({ title: 'Stake Too Low', description: `Minimum stake is ${event.minStake} ${chain?.nativeCurrency.symbol}.`, icon: 'AlertTriangle', variant: 'destructive', type: 'general' });
        return;
    }
    if (stakeAmount > event.maxStake) {
        addNotification({ title: 'Stake Too High', description: `Maximum stake is ${event.maxStake} ${chain?.nativeCurrency.symbol}.`, icon: 'AlertTriangle', variant: 'destructive', type: 'general' });
        return;
    }
    if (stakeAmount > userBalance) {
      addNotification({ title: 'Insufficient Balance', description: `Your ${chain?.nativeCurrency.symbol} balance is too low.`, icon: 'AlertTriangle', variant: 'destructive', type: 'general' });
      return;
    }

    setIsLoading(true);
    try {
      const txHash = await blockchainService.placeBet(walletClient, address, BigInt(event.id), selectedOutcome === 'YES', stake);
      addNotification({
          title: "Bet Submitted",
          description: `Waiting for confirmation... Tx: ${txHash.slice(0,10)}...`,
          icon: 'Loader2',
          type: 'onBetPlaced'
      });
      
      await blockchainService.waitForTransaction(txHash);
      
      addNotification({
          title: "Bet Placed Successfully!",
          description: `Your bet on ${selectedOutcome} for "${event.question.slice(0, 20)}..." is confirmed.`,
          icon: 'CheckCircle',
          href: '/my-bets',
          variant: 'success',
          type: 'onBetPlaced'
      });
      fetchBalance();
      onBetPlaced();
    } catch (e: any) {
      if (e instanceof UserRejectedRequestError) {
        addNotification({
          title: 'Transaction Canceled',
          description: 'You rejected the transaction in your wallet.',
          icon: 'Info',
          type: 'general'
        });
      } else {
        console.error(e);
        addNotification({ title: 'Bet Failed', description: e.shortMessage || 'An unexpected error occurred.', icon: 'AlertTriangle', variant: 'destructive', type: 'general' });
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

  const handleSliderChange = (value: number[]) => {
    const amount = value[0];
     if (amount > userBalance) {
       handleStakeChange(userBalance.toFixed(4));
    } else {
       handleStakeChange(amount.toFixed(4));
    }
  }

  const setStakePercentage = (percentage: number) => {
      const amount = (userBalance * percentage) / 100;
      handleStakeChange(amount.toFixed(4));
  }

  const isBettingLocked = event.status !== 'open' || (!!event.bettingStopDate && new Date() > new Date(event.bettingStopDate));

  return (
    <div className="w-full bg-card md:bg-secondary rounded-t-lg md:rounded-lg border-t md:border p-4 flex flex-col gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] md:shadow-2xl">
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => setSelectedOutcome('YES')}
          variant={selectedOutcome === 'YES' ? 'default' : 'secondary'}
          className="h-12 rounded-lg font-bold text-base transition-all"
          disabled={isBettingLocked}
        >
          BET YES
        </Button>
        <Button
          onClick={() => setSelectedOutcome('NO')}
          variant={selectedOutcome === 'NO' ? 'destructive' : 'secondary'}
          className={cn("h-12 rounded-lg font-bold text-base transition-all", selectedOutcome === 'NO' && "bg-destructive text-destructive-foreground")}
          disabled={isBettingLocked}
        >
          BET NO
        </Button>
      </div>
      <div className="relative">
        <Input
          className="w-full bg-background md:bg-input rounded-lg p-3 h-14 text-foreground text-2xl font-bold pr-24 focus:ring-primary focus:border-primary"
          type="number"
          value={stake}
          onChange={(e) => handleStakeChange(e.target.value)}
          placeholder="0.00"
          disabled={isBettingLocked}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">{chain?.nativeCurrency.symbol}</span>
      </div>
      
      <div className="px-1 pt-1">
        <Slider 
            value={[Number(stake) || 0]}
            onValueChange={handleSliderChange}
            max={userBalance > 0 ? userBalance : 1}
            step={0.0001}
            disabled={isBettingLocked}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <Button onClick={() => setStakePercentage(25)} variant="secondary" className="p-2 h-8 rounded-full" disabled={isBettingLocked}>25%</Button>
        <Button onClick={() => setStakePercentage(50)} variant="secondary" className="p-2 h-8 rounded-full" disabled={isBettingLocked}>50%</Button>
        <Button onClick={() => setStakePercentage(75)} variant="secondary" className="p-2 h-8 rounded-full" disabled={isBettingLocked}>75%</Button>
        <Button onClick={() => setStakePercentage(100)} variant="secondary" className="p-2 h-8 rounded-full" disabled={isBettingLocked}>100%</Button>
      </div>
      
      <div className="flex justify-between items-center text-muted-foreground text-xs font-mono border-t pt-3 mt-1">
        <span>Min Bet: {event.minStake} {chain?.nativeCurrency.symbol}</span>
        <span>Max Bet: {event.maxStake} {chain?.nativeCurrency.symbol}</span>
      </div>

      <div className="flex justify-between items-center text-muted-foreground text-sm font-medium border-t pt-4">
        <span>Potential Winnings</span>
        <span className="text-primary font-bold text-lg">{potentialWinnings.toFixed(4)} {chain?.nativeCurrency.symbol}</span>
      </div>
      <Button 
        className="w-full font-bold h-14 rounded-lg text-base hover:bg-primary/90 disabled:opacity-50"
        onClick={handlePlaceBet}
        disabled={isLoading || !stake || Number(stake) === 0 || isBettingLocked}
       >
         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
         {isBettingLocked ? "Betting Locked" : isLoading ? 'Submitting...' : 'Place Bet'}
      </Button>
    </div>
  );
}
