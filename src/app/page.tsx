
'use client';

import { useWallet } from '@/hooks/use-wallet';
import { LandingPage } from '@/components/landing-page';
import { GreetingCard } from '@/components/dashboard/greeting-card';
import { CategoryCarousel } from '@/components/dashboard/category-carousel';
import { EventList } from '@/components/event-list';
import { EventFilterTabs } from '@/components/dashboard/event-filter-tabs';
import { DashboardSearch } from '@/components/dashboard/dashboard-search';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { EventStatus } from '@/lib/types';


function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategory = searchParams.get('category') || 'All';
  const initialSearchTerm = searchParams.get('q') || '';
  const initialFilter = searchParams.get('filter') || 'live';

  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (categoryFilter !== 'All') {
      params.set('category', categoryFilter);
    } else {
      params.delete('category');
    }
    if (searchTerm) {
      params.set('q', searchTerm);
    } else {
      params.delete('q');
    }
     if (activeFilter) {
      params.set('filter', activeFilter);
    } else {
      params.delete('filter');
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [categoryFilter, searchTerm, activeFilter, router]);
  
  const getEventListProps = () => {
    switch (activeFilter) {
      case 'upcoming':
        return { isUpcoming: true };
      case 'closed':
        return { status: ['finished', 'canceled'] as EventStatus[] };
      case 'live':
      default:
        return { status: 'open' as EventStatus };
    }
  };


  return (
    <div className="space-y-8">
      <GreetingCard />
      <CategoryCarousel categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} />
      <DashboardSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <EventFilterTabs activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        <EventList 
          category={categoryFilter}
          searchTerm={searchTerm}
          {...getEventListProps()}
        />
      </div>
    </div>
  );
}

export default function Page() {
  const { connected } = useWallet();

  if (!connected) {
    return <LandingPage />;
  }

  return <Dashboard />;
}
