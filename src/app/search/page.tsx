
'use client';

import { Input } from '@/components/ui/input';
import { Bitcoin, Dribbble, Gamepad2, Landmark, Search, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  { name: 'Sports', icon: <Trophy className="w-8 h-8" />, href: '/search/sports', image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800' },
  { name: 'eSports', icon: <Gamepad2 className="w-8 h-8" />, href: '/search/esports', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800' },
  { name: 'Crypto', icon: <Bitcoin className="w-8 h-8" />, href: '/search/crypto', image: 'https://images.unsplash.com/photo-1621419790297-c8315c545027?q=80&w=800' },
  { name: 'Politics', icon: <Landmark className="w-8 h-8" />, href: '/search/politics', image: 'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?q=80&w=800' },
];

export default function SearchPage() {
  return (
    <div className="p-4 space-y-8">
       <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Search & Explore</h1>
            <p className="text-muted-foreground mt-1">Find markets or browse by category.</p>
        </div>

        <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60" />
            <Input
            className="w-full rounded-2xl bg-white/5 h-14 py-4 pl-12 pr-4 text-base placeholder-white/60 text-white ring-1 ring-white/10 outline-none backdrop-blur transition hover:ring-white/20 focus:bg-white/10 focus:ring-white/25"
            placeholder="Search for any event, team, or player..."
            aria-label="Search"
            />
        </div>

      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => (
          <Link href={category.href} key={category.name}>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform active:scale-[0.98] hover:ring-white/20">
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover z-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
              <div className="absolute bottom-0 left-0 z-20 p-4 text-white">
                <div className="mb-2 p-3 w-fit rounded-full bg-black/30 backdrop-blur-sm ring-1 ring-white/10">
                    {category.icon}
                </div>
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
