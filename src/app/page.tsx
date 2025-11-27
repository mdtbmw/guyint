
'use client';
import { EventList } from '@/components/event-list';
import { cn } from '@/lib/utils';
import type { Category, EventStatus } from '@/lib/types';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockCategories } from '@/lib/categories';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getActiveStatusFromParams = () => {
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming');
    if (upcoming === 'true') return 'upcoming';
    if (status === 'closed') return 'closed';
    return 'open';
  };
  
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') || 'All');
  const [activeStatus, setActiveStatus] = useState<'open' | 'upcoming' | 'closed'>(getActiveStatusFromParams());
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('q') || '');

  // This effect ensures the component's state is always in sync with the URL's query parameters.
  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'All');
    setSearchTerm(searchParams.get('q') || '');
    setActiveStatus(getActiveStatusFromParams());
  }, [searchParams]);

  const displayCategories = useMemo(() => {
    const all = [{ id: 'all', name: 'All', icon: 'Flame' }];
    const sortedCategories = [...mockCategories].sort((a, b) => a.name.localeCompare(b.name));
    return [...all, ...sortedCategories];
  }, []);

  // Update URL query params when a filter changes, triggering a re-render
  const handleFilterChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (value === null || (key === 'category' && value === 'All')) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    if (key === 'status') {
       params.delete('upcoming'); // Reset upcoming flag when status is explicitly changed
       if (value === 'upcoming') {
         params.set('upcoming', 'true');
         params.set('status', 'open'); // Upcoming events are technically 'open'
       }
    }
    
    router.push(`/?${params.toString()}`);
  };

  const currentStatusForFilter = useMemo((): EventStatus | EventStatus[] => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'closed') return ['finished', 'canceled'];
    return 'open'; // Both 'live' ('open') and 'upcoming' filter for 'open' status
  }, [searchParams]);

  const isUpcoming = searchParams.get('upcoming') === 'true';

  return (
    <div className="flex flex-col space-y-6">
       <div className="flex w-full px-0 py-3">
          <div className="flex h-12 flex-1 items-center justify-center rounded-full bg-component-dark p-1">
            <label className="flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-full px-2 text-sm font-medium leading-normal text-white/60 has-[:checked]:bg-primary has-[:checked]:text-black has-[:checked]:shadow-lg has-[:checked]:shadow-primary/20 sm:text-base">
              <span className="truncate">Live</span>
              <input 
                checked={activeStatus === 'open'}
                className="invisible w-0" 
                name="event-status" 
                type="radio" 
                value="open"
                onChange={() => handleFilterChange('status', 'open')}
              />
            </label>
             <label className="flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-full px-2 text-sm font-medium leading-normal text-white/60 has-[:checked]:bg-primary has-[:checked]:text-black has-[:checked]:shadow-lg has-[:checked]:shadow-primary/20 sm:text-base">
              <span className="truncate">Upcoming</span>
              <input 
                checked={activeStatus === 'upcoming'}
                className="invisible w-0" 
                name="event-status" 
                type="radio" 
                value="upcoming"
                onChange={() => handleFilterChange('status', 'upcoming')}
              />
            </label>
            <label className="flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-full px-2 text-sm font-medium leading-normal text-white/60 has-[:checked]:bg-primary has-[:checked]:text-black has-[:checked]:shadow-lg has-[:checked]:shadow-primary/20 sm:text-base">
              <span className="truncate">Closed</span>
              <input 
                checked={activeStatus === 'closed'}
                className="invisible w-0" 
                name="event-status" 
                type="radio" 
                value="closed"
                onChange={() => handleFilterChange('status', 'closed')}
              />
            </label>
          </div>
       </div>

      <div className="flex gap-3 overflow-x-auto p-1 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {displayCategories.map(category => (
          <button
            key={category.id}
            onClick={() => handleFilterChange('category', category.name)}
            className={cn(
              "flex h-10 shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-full px-5 text-sm transition-colors",
              activeCategory === category.name
                ? "bg-primary text-black font-bold"
                : "bg-component-dark text-white/80 hover:bg-white/10"
            )}
          >
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <EventList 
          status={currentStatusForFilter} 
          category={activeCategory} 
          searchTerm={searchTerm} 
          isUpcoming={isUpcoming}
        />
      </div>
    </div>
  );
}
