'use client';

import type { Event } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import placeholderData from '@/lib/placeholder-images.json';
import { DynamicIcon } from '@/lib/icons';
import { useRouter } from 'next/navigation';
import { useCountdown } from '@/hooks/use-countdown';
import { useAdmin } from '@/hooks/use-admin';

export function EventCard({ event }: { event: Event }) {
  const categoryDetails = placeholderData.categories.find(c => c.name === event.category);
  const imageUrl = event.imageUrl || categoryDetails?.image || `https://picsum.photos/seed/${event.id}/600/400`;
  const { timeLeft } = useCountdown(event.bettingStopDate);

  const yesPercentage = event.totalPool > 0 ? (event.outcomes.yes / event.totalPool) * 100 : 50;

  return (
    <Link 
      href={`/event/${event.id}`} 
      className="relative rounded-[2.5rem] overflow-hidden h-[340px] group cursor-pointer active-press shadow-2xl shadow-black/30 ring-1 ring-white/10 hover:ring-gold-500/30 transition-all"
    >
      <Image 
          src={imageUrl} 
          alt={event.question} 
          fill 
          className="object-cover transition-transform duration-1000 group-hover:scale-110"
          sizes="(max-width: 768px) 90vw, (max-width: 1280px) 50vw, 33vw"
      />
      <div className="absolute inset-0 card-gradient"></div>
      
      <div className="relative z-10 p-7 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-lg border border-white/10 shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white">{event.category}</span>
          </div>
          {timeLeft && (
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-mono font-medium text-white tracking-tight">
                {String(timeLeft.hours + (timeLeft.days * 24)).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-white font-display text-2xl font-bold mb-5 leading-tight drop-shadow-lg group-hover:text-gold-400 transition-colors">{event.question}</h3>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="flex justify-between text-xs text-zinc-200 mb-3">
              <span>Probability</span>
              <span className="text-emerald-400 font-bold tracking-wider">{yesPercentage.toFixed(0)}% YES</span>
            </div>
            
            <div className="relative h-2 w-full bg-black/40 rounded-full overflow-hidden mb-3">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)]" 
                style={{width: `${yesPercentage}%`}}
              ></div>
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mb-0.5">Total Pot</p>
                <p className="text-sm font-bold text-gold-400">{event.totalPool.toFixed(0)} T</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function SuggestMarketCard() {
    const router = useRouter();
    const { isAdmin, loading } = useAdmin();

    if (loading || !isAdmin) {
        return null;
    }

    return (
        <button onClick={() => router.push('/admin?tab=scout')} className="rounded-[2.5rem] border-2 border-dashed border-zinc-700 dark:border-white/10 p-6 flex flex-col items-center justify-center text-center hover:bg-zinc-800/50 dark:hover:bg-white/[0.02] hover:border-gold-500/30 transition-all cursor-pointer active-press h-[340px] bg-white/50 dark:bg-black/20 group">
            <div className="w-16 h-16 rounded-full bg-zinc-800 dark:bg-white/5 flex items-center justify-center mb-5 text-zinc-500 group-hover:bg-gold-500 group-hover:text-black transition-all duration-500 shadow-xl ring-1 ring-inset ring-white/10">
                <DynamicIcon name="Lightbulb" className="w-8 h-8" strokeWidth="1.5" />
            </div>
            <h3 className="text-zinc-900 dark:text-white font-display text-2xl font-bold mb-3">Suggest a Market</h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-2 max-w-[200px] leading-relaxed">Use the AI Scout to find new, verifiable event topics for the platform.</p>
        </button>
    )
}
