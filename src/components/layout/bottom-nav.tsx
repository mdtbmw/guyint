'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { DynamicIcon } from '@/lib/icons';
import { useAdmin } from '@/hooks/use-admin';
import { Plus, Search } from 'lucide-react';
import { navLinks } from '@/lib/nav-links';

const mobileLinks = navLinks.filter(l => l.mobile);

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    const handleScroll = () => {
      const currentScrollY = mainContent.scrollTop;
      // Hide if scrolling down, show if scrolling up
      setIsHidden(currentScrollY > lastScrollY.current && currentScrollY > 50);
      lastScrollY.current = currentScrollY;
    };

    mainContent.addEventListener('scroll', handleScroll);
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide nav on specific deep-level pages for a more immersive experience
  if (pathname.startsWith('/event/')) {
    return null;
  }
  
  const handleActionClick = () => {
    if (isAdmin) {
      router.push('/create-event');
    } else {
      router.push('/search');
    }
  }

  const actionIcon = isAdmin ? <Plus className="w-7 h-7" strokeWidth="2.5" /> : <Search className="w-6 h-6" strokeWidth="2.5" />;
  
  const navItems = [
    ...mobileLinks.slice(0, 2),
    null, // Placeholder for the central button
    ...mobileLinks.slice(2, 4)
  ];

  return (
    <div className={cn(
        "lg:hidden fixed bottom-4 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none transition-transform duration-300",
        isHidden ? "translate-y-24" : "translate-y-0"
    )}>
        <nav className="dock-glass rounded-full h-16 w-full max-w-[360px] flex items-center justify-around px-2 pointer-events-auto">
            {navItems.map((link, index) => {
                 if (link === null) {
                     return (
                        <div key="action-button" className="relative -top-5">
                            <button onClick={handleActionClick} className="h-14 w-14 rounded-full bg-foreground text-background flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.3)] active:scale-90 transition-transform border-[4px] border-background">
                                {actionIcon}
                            </button>
                        </div>
                     )
                 }
                 
                 // Hide admin links from non-admins
                 if (link.admin && !isAdmin) {
                    return <div key={link.href} className="w-14 h-14" />; // Keep layout consistent
                 }


                 const isActive = pathname === link.href;
                 return (
                    <Link
                      href={link.href}
                      key={link.href}
                      className={cn(
                          'active-press flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all relative',
                           isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      <DynamicIcon name={link.icon as string} className="w-6 h-6" strokeWidth={isActive ? 2 : 1.5} />
                      {isActive && <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_5px_hsl(var(--primary))]"></span>}
                    </Link>
                 )
            })}
        </nav>
    </div>
  );
}
