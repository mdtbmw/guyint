
'use client';

import { useToast } from '@/hooks/use-toast';
import type { Event, BetOutcome } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { formatDistanceToNowStrict } from 'date-fns';
import { useAdmin } from '@/hooks/use-admin';
import Link from 'next/link';
import { Layers, Timer } from 'lucide-react';

export function EventCard({ event }: { event: Event }) {
  const { toast } = useToast();
  const { connected } = useWallet();
  const { isAdmin } = useAdmin();
  
  const yesPercentage =
    event.totalPool > 0 ? (event.outcomes.yes / event.totalPool) * 100 : 50;
  
  const timeToEnd = formatDistanceToNowStrict(new Date(event.endDate), { addSuffix: true });

  const isBettingDisabled = !connected || isAdmin || event.status !== 'open';

  return (
    <Link href={`/event/${event.id}`} className="flex flex-col rounded-lg bg-card-dark p-4 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10">
        <div className="relative mb-4 w-full">
            <div 
                className="aspect-video w-full rounded-lg bg-cover bg-center" 
                style={{backgroundImage: `url("https://picsum.photos/seed/${event.id}/600/400")`}}
                data-ai-hint={event.category.toLowerCase()}
            ></div>
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <div className="size-2 animate-pulse rounded-full bg-green-400"></div>
                LIVE
            </div>
        </div>
        <p className="mb-3 text-lg font-bold leading-tight tracking-tight">{event.question}</p>
        
        <div className="mb-4 flex flex-col gap-2">
            <div className="flex w-full items-center justify-between text-sm font-medium">
                <span className="text-yes">YES</span>
                <span>{yesPercentage.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-yes" style={{ width: `${yesPercentage}%` }}></div>
            </div>
        </div>
        
        <div className="mb-4 flex flex-col gap-2">
            <div className="flex w-full items-center justify-between text-sm font-medium">
                <span className="text-no">NO</span>
                <span>{(100 - yesPercentage).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-no" style={{ width: `${100 - yesPercentage}%` }}></div>
            </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-border-custom pt-4">
            <div className="flex items-center justify-between text-sm text-white/60">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>Pool: {event.totalPool.toFixed(0)} $TRUST</span>
                </div>
                <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span>{timeToEnd}</span>
                </div>
            </div>
             <button className="flex h-11 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-base font-bold text-black transition-colors hover:bg-primary/90">
                <span className="truncate">Stake: {event.minStake} - {event.maxStake}</span>
             </button>
        </div>
    </Link>
  );
}
