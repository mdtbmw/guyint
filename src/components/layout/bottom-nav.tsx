'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { navLinks } from '@/lib/nav-links';

const mobileLinks = navLinks.filter(link => link.mobile);

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 block md:hidden">
        <div className="mx-auto max-w-[420px] px-4 pb-3 pt-2">
            <div className="flex items-center justify-around rounded-3xl bg-neutral-900/95 px-2 py-2 text-white shadow-2xl ring-1 ring-white/10 backdrop-blur-md">
                {mobileLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        href={link.href}
                        key={link.href}
                        className={cn(
                            'relative flex flex-col items-center justify-center gap-1 rounded-full transition-all duration-300 h-14 w-14',
                            isActive 
                                ? 'text-primary'
                                : 'text-white/70 hover:text-white'
                        )}
                        >
                        {React.cloneElement(link.icon as React.ReactElement, { className: 'h-6 w-6 flex-shrink-0' })}
                        <span className="text-[10px] font-medium">{link.label}</span>
                    </Link>
                );
                })}
            </div>
        </div>
    </nav>
  );
}
