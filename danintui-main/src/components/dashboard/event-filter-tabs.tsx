
'use client';

import { cn } from '@/lib/utils';
import { Flame, Clock, CheckCircle } from 'lucide-react';

const filters = [
  { id: 'live', label: 'Live', icon: Flame },
  { id: 'upcoming', label: 'Upcoming', icon: Clock },
  { id: 'closed', label: 'Closed', icon: CheckCircle },
];

interface EventFilterTabsProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export function EventFilterTabs({ activeFilter, setActiveFilter }: EventFilterTabsProps) {
  return (
    <div className="p-1.5 rounded-2xl bg-card border inline-flex gap-1 overflow-x-auto no-scrollbar max-w-full">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => setActiveFilter(filter.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all whitespace-nowrap",
            activeFilter === filter.id
              ? 'bg-foreground text-background shadow-lg shadow-black/20 dark:shadow-white/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <filter.icon className={cn("w-4 h-4", activeFilter === filter.id ? "text-background" : "text-muted-foreground")} />
          {filter.label}
        </button>
      ))}
    </div>
  );
}
