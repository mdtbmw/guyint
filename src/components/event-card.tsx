'use client';

import { useToast } from '@/hooks/use-toast';
import type { Event, BetOutcome } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { formatDistanceToNowStrict } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { BetSlip } from './bet-slip';
import { useAdmin } from '@/hooks/use-admin';
import { DynamicIcon } from '@/lib/icons';


export function EventCard({ event }: { event: Event }) {
  const { toast } = useToast();
  const { connected } = useWallet();
  const { isAdmin } = useAdmin();
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<BetOutcome | null>(null);

  const handleBetSelection = (outcome: BetOutcome) => {
    if (!connected) {
      toast({ variant: 'destructive', title: 'Wallet not connected', description: 'Please connect your wallet to place a bet.' });
      return;
    }
    if (isAdmin) {
       toast({ variant: 'default', title: 'Admin Action Not Allowed', description: 'Administrators cannot place bets.' });
      return;
    }
    setSelectedOutcome(outcome);
    setBetSlipOpen(true);
  };

  const yesPercentage =
    event.totalPool > 0 ? (event.outcomes.yes / event.totalPool) * 100 : 50;
  const noPercentage = 100 - yesPercentage;
  
  const timeToStart = formatDistanceToNowStrict(new Date(event.endDate as Date), { addSuffix: true });

  // Real-time odds calculation
  const getOdds = (poolA: number, poolB: number) => {
    if (poolA === 0) return 1; // If no one has bet, odds are 1:1
    return (poolA + poolB) / poolA;
  };

  const yesOdds = getOdds(event.outcomes.yes, event.outcomes.no);
  const noOdds = getOdds(event.outcomes.no, event.outcomes.yes);

  const trendingOutcome = event.outcomes.yes > event.outcomes.no ? 'YES' : (event.outcomes.no > event.outcomes.yes ? 'NO' : null);
  const isBettingDisabled = !connected || isAdmin;

  return (
    <>
    <article className="mb-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
      
      <p className="mb-3 text-base text-white/90 font-medium">{event.question}</p>

      <div className="flex items-center justify-between text-[12px] text-white/60 mb-4">
        <div className="flex items-center gap-4">
           <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {event.participants} Participants
          </span>
          {trendingOutcome && (
             <span className={cn(
                "inline-flex items-center gap-1.5 font-semibold",
                trendingOutcome === 'YES' ? 'text-emerald-400' : 'text-rose-400'
             )}>
              <TrendingUp className="h-3.5 w-3.5" /> Trending {trendingOutcome}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5">
         {event.status === 'open' && (
            <>
                <Clock className="h-3.5 w-3.5" /> Closes {timeToStart}
            </>
         )}
        </span>
      </div>

      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 mb-4">
        <div className="flex flex-col items-center text-center">
            <Avatar className="h-10 w-10 ring-2 ring-emerald-500/50">
              <AvatarImage src="https://picsum.photos/seed/yes-team/40/40" />
              <AvatarFallback>Y</AvatarFallback>
            </Avatar>
            <p className="mt-1.5 text-sm font-semibold text-white/90">{event.outcomes.yes.toFixed(2)} $T</p>
            <p className="text-[11px] text-white/60">YES Pool</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-white/60">Total Pool</p>
          <p className="text-[20px] tracking-tight font-bold text-white">
            ${event.totalPool.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
             <Avatar className="h-10 w-10 ring-2 ring-rose-500/50">
              <AvatarImage src="https://picsum.photos/seed/no-team/40/40" />
              <AvatarFallback>N</AvatarFallback>
            </Avatar>
            <p className="mt-1.5 text-sm font-semibold text-white/90">{event.outcomes.no.toFixed(2)} $T</p>
            <p className="text-[11px] text-white/60">NO Pool</p>
        </div>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-black/20 ring-1 ring-white/10 mb-4">
        <div className="absolute top-0 left-0 h-full rounded-l-full bg-emerald-500/80" style={{ width: `${yesPercentage}%` }}></div>
        <div className="absolute top-0 right-0 h-full rounded-r-full bg-rose-500/80" style={{ width: `${noPercentage}%` }}></div>
      </div>


      <div
        className={cn(
            "rounded-xl bg-black/20 p-1 ring-1 ring-white/5",
            isBettingDisabled && "cursor-not-allowed opacity-60"
        )}
        role="group"
      >
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => handleBetSelection('YES')}
            disabled={isBettingDisabled}
            className={cn(
              'yesno-btn inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-white/85 ring-1 transition',
              'bg-transparent ring-transparent hover:bg-white/5 hover:ring-white/10 disabled:hover:bg-transparent'
            )}
            aria-pressed={selectedOutcome === 'YES'}
          >
            <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              Bet Yes
            </span>
            <span className="font-bold text-emerald-300">{yesOdds.toFixed(2)}x</span>
          </button>
          <button
            onClick={() => handleBetSelection('NO')}
            disabled={isBettingDisabled}
            className={cn(
              'yesno-btn inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-white/85 ring-1 transition',
               'bg-transparent ring-transparent hover:bg-white/5 hover:ring-white/10 disabled:hover:bg-transparent'
            )}
            aria-pressed={selectedOutcome === 'NO'}
          >
            <span className="inline-flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-400" />
              Bet No
            </span>
            <span className="font-bold text-rose-300">{noOdds.toFixed(2)}x</span>
          </button>
        </div>
      </div>

    </article>
    <BetSlip 
        event={event}
        outcome={selectedOutcome}
        open={betSlipOpen}
        onOpenChange={setBetSlipOpen}
    />
    </>
  );
}
