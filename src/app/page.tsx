
'use client';
import { EventList } from '@/components/event-list';
import { cn } from '@/lib/utils';
import type { EventCategory, Category } from '@/lib/types';
import { Search, Banknote, Rocket, Ticket, PlusCircle } from 'lucide-react';
import Image from "next/image";
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/use-wallet';
import { useDragToScroll } from '@/hooks/use-drag-to-scroll';
import { useAdmin } from '@/hooks/use-admin';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { DynamicIcon } from '@/lib/icons';


export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { address } = useWallet();
  const { isAdmin } = useAdmin();
  const scrollRef = useDragToScroll<HTMLDivElement>();
  const firestore = useFirestore();

  const categoriesQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'));
  }, [firestore]);

  const { data: categories, loading: categoriesLoading } = useCollection<Category>(categoriesQuery);

  const handleQuickAction = (path: string) => {
    router.push(path);
  }
  
  const displayName = isAdmin ? 'Admin' : (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'User');
  
  const displayCategories = useMemo(() => {
    const all = [{ id: 'all', name: 'All', icon: 'Flame' }];
    if (!categories) return all;
    // Add sorting to ensure consistent order
    const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    return [...all, ...sortedCategories];
  }, [categories]);


  return (
    <div className="flex flex-col space-y-6">
      <header className="relative bg-white/5 px-4 pt-3 pb-6 md:rounded-2xl ring-1 ring-white/10 md:p-6 -mx-4 md:mx-0">
        <div className="mb-4 mt-2">
          <h1 className="mt-1 text-[22px] tracking-tight">
            <span className="text-white/90">Welcome, </span>
            <span className="font-semibold text-white">{displayName}</span>
          </h1>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
          <input
            className="w-full rounded-xl bg-black/20 py-3 pl-10 pr-4 text-[13px] placeholder-white/60 text-white ring-1 ring-white/10 outline-none backdrop-blur-sm transition hover:ring-white/20 focus:bg-white/10 focus:ring-white/25"
            placeholder="Search teams, leagues, markets..."
            aria-label="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="mt-4">
            {isAdmin ? (
            <div className="p-1">
                <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleQuickAction('/admin')} className="flex h-auto items-center justify-center gap-2 rounded-xl bg-indigo-600/20 px-3 py-3 text-sm font-medium text-indigo-300 ring-1 ring-indigo-400/20 transition hover:bg-indigo-600/30 hover:ring-indigo-400/30 active:scale-[0.98]">
                    <DynamicIcon name="Shield" className="h-4 w-4" /> Manage Platform
                    </Button>
                    <Button onClick={() => handleQuickAction('/create-event')} className="flex h-auto items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-sm font-medium text-white ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 active:scale-[0.98]">
                    <PlusCircle className="h-4 w-4" /> Create Event
                    </Button>
                </div>
            </div>
            ) : (
            <div className="grid grid-cols-3 gap-2">
                <Button onClick={() => handleQuickAction('/wallet')} className="flex h-auto items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-[12px] font-medium text-white ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 active:scale-[0.98]">
                <Banknote className="h-4 w-4" /> Wallet
                </Button>
                <Button onClick={() => handleQuickAction('/boosts')} className="flex h-auto items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-[12px] font-medium text-white ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 active:scale-[0.98]">
                <Rocket className="h-4 w-4" /> Boosts
                </Button>
                <Button onClick={() => handleQuickAction('/my-bets')} className="flex h-auto items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-[12px] font-medium text-white ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-white/20 active:scale-[0.98]">
                <Ticket className="h-4 w-4" /> My Bets
                </Button>
            </div>
            )}
        </div>
      </header>
      
      <div className="w-full pl-4 md:pl-0">
        <div 
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar cursor-grab active:cursor-grabbing -ml-4 md:ml-0"
        >
          {displayCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.name)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center justify-center gap-2 w-20 h-20 rounded-xl transition-all active:scale-95",
                activeCategory === category.name
                  ? "bg-primary text-white font-bold"
                  : "bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              <DynamicIcon name={category.icon} className="w-6 h-6" />
              <span className="text-[10px] font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-0">
        <h2 className="text-[18px] tracking-tight font-medium text-white mb-3">Today’s Yes/No Picks</h2>
        <EventList status="open" category={activeCategory} searchTerm={searchTerm} />
      </div>
    </div>
  );
}
