'use client';

import { Input } from '@/components/ui/input';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import placeholderData from '@/lib/placeholder-images.json';
import { PageHeader } from '@/components/layout/page-header';
import { DynamicIcon } from '@/lib/icons';

export default function SearchPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const categories = useMemo(() => placeholderData.categories.sort((a,b) => a.name.localeCompare(b.name)), []);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) {
        params.set('q', searchTerm);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <>
        <PageHeader
            title="Search & Explore"
            description="Find active markets or browse by category."
        />

        <form onSubmit={handleSearch}>
            <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                className="w-full rounded-lg bg-card h-14 py-4 pl-12 pr-4 text-base placeholder-muted-foreground text-foreground ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Search for any event, team, or player..."
                aria-label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </form>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground px-1">Browse Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((category) => (
                <Link href={`/?category=${category.name}`} key={category.id}>
                    <div className="flex items-center justify-between rounded-lg bg-card p-4 border transition-colors hover:bg-secondary hover:border-primary group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-secondary group-hover:bg-primary group-hover:text-primary-foreground text-primary flex items-center justify-center transition-colors">
                                <DynamicIcon name={category.icon} className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-foreground">{category.name}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </Link>
            ))}
        </div>
      </div>
    </>
  );
}
