
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { useAdmin } from '@/hooks/use-admin';
import { navLinks, type NavLink } from '@/lib/nav-links.tsx';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/use-wallet';
import { Logo } from '../icons';

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const { balance } = useWallet();

  const renderLink = (link: NavLink) => {
    if (link.admin && !isAdmin) return null;
    const isActive = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:bg-white/10 hover:text-white",
          isActive && "bg-white/10 font-bold text-white"
        )}
      >
        {React.cloneElement(link.icon as React.ReactElement, { className: 'h-5 w-5' })}
        {link.label}
      </Link>
    );
  };

  const mainNav = navLinks.filter(l => l.group === 'main');
  const supportNav = navLinks.filter(l => l.group === 'support');

  return (
    <aside className="hidden md:flex h-screen w-full flex-col gap-2 border-r border-border-custom bg-card-dark p-4 sticky top-0">
        <div className="flex h-20 items-center justify-between px-2">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                <Logo className="w-8 h-8 text-primary" />
                <h1 className="text-white text-2xl font-bold tracking-tighter">Intuition</h1>
            </div>
        </div>

        <div className="p-2">
            <div className="px-3 text-sm text-muted-foreground">Balance</div>
            <div className="text-2xl font-bold text-primary p-3">{balance.toFixed(2)} $TRUST</div>
            <w3m-account-button />
        </div>

        <nav className="grid items-start gap-1 font-medium mt-4">
          {mainNav.map(renderLink)}
          
          <p className="px-3 pt-4 text-xs font-semibold uppercase text-white/50">Support</p>
          {supportNav.map(renderLink)}
        </nav>
    </aside>
  );
}
