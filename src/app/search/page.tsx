
'use client';

import { Input } from '@/components/ui/input';
import { Bitcoin, Gamepad2, Landmark, Search, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { mockCategories } from '@/lib/categories';
import { EventList } from '@/components/event-list';
import { PageHeader } from '@/components/layout/page-header';
import { MobilePageHeader } from '@/components/layout/mobile-page-header';

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) {
        params.set('q', searchTerm);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="space-y-8">
       <MobilePageHeader title="Search" />
        <div className="hidden md:block">
            <PageHeader
                title="Search & Explore"
                description="Find markets or browse by category."
            />
        </div>

        <form onSubmit={handleSearch}>
            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
                <Input
                className="w-full rounded-2xl bg-white/5 h-14 py-4 pl-12 pr-4 text-base placeholder-white/60 text-white ring-1 ring-white/10 outline-none backdrop-blur transition hover:ring-white/20 focus:bg-white/10 focus:ring-white/25"
                placeholder="Search for any event, team, or player..."
                aria-label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </form>

      <div className="grid grid-cols-2 gap-4">
        {mockCategories.map((category) => (
          <Link href={`/?category=${category.name}`} key={category.name}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform active:scale-[0.98] hover:ring-white/20">
              <Image
                src={`https://picsum.photos/seed/${category.name}/800/600`}
                alt={category.name}
                fill
                className="object-cover z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 z-20 p-4 text-white">
                <h3 className="text-xl font-bold">{category.name}</h3>
                <p className="text-sm text-white/70">Browse markets</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
