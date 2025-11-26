'use client';

import Link from 'next/link';
import { Event } from '@/lib/types';
import placeholderData from '@/lib/placeholder-images.json';
import { DynamicIcon } from '@/lib/icons';

export const SignalCard = ({ event }: { event: Event }) => {
    const categoryIcon = placeholderData.categories.find(c => c.name === event.category)?.icon || 'HelpCircle';
    const yesPercentage = event.totalPool > 0 ? (event.outcomes.yes / event.totalPool) * 100 : 50;

    return (
         <Link href={`/event/${event.id}`} className="block mb-3 last:mb-0">
            <div className="relative group active-press cursor-pointer">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-emerald-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-300"></div>
                <div className="relative p-5 rounded-2xl bg-card border border-border flex justify-between items-center">
                    <div className="flex gap-4 items-center overflow-hidden">
                        <div className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                            <DynamicIcon name={categoryIcon} className="w-6 h-6 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-display font-bold text-foreground text-lg truncate">{event.question}</h3>
                                {event.totalPool > 1000 && <span className="text-[10px] font-mono text-background bg-primary px-1.5 rounded font-bold shrink-0">HOT</span>}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">Vol: ${event.totalPool.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                        </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                        <p className="text-2xl font-display font-bold text-foreground">{yesPercentage.toFixed(0)}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-mono">Prob. Yes</p>
                    </div>
                </div>
            </div>
        </Link>
    );
};
