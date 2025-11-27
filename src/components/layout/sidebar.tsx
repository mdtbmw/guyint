
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import React from 'react';
import { Logo } from '../icons';
import { useAdmin } from '@/hooks/use-admin';
import { navLinks, type NavLink } from '@/lib/nav-links.tsx';
import { 
  Sidebar as SidebarPrimitive, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarFooter,
  useSidebar
} from '../ui/sidebar';

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAdmin();
  const { setOpenMobile } = useSidebar();

  const getVisibleLinks = (group: NavLink['group']) => {
    return navLinks.filter(l => {
      if (l.group !== group) return false;
      if (isAdmin) {
        return l.group === 'admin' || l.href === '/' || l.href === '/search' || l.group === 'support';
      }
      return l.group !== 'admin';
    });
  };

  const mainLinks = getVisibleLinks('main');
  const adminLinks = getVisibleLinks('admin');
  const supportLinks = getVisibleLinks('support');

  const renderLink = (link: NavLink) => {
    const isActive = pathname === link.href;
    return (
      <SidebarMenuItem key={link.href}>
        <Link href={link.href} passHref legacyBehavior>
           <SidebarMenuButton as="a" isActive={isActive} tooltip={link.label} onClick={() => setOpenMobile(false)}>
              {React.cloneElement(link.icon as React.ReactElement, {})}
              <span>{link.label}</span>
            </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    );
  };
  
  return (
    <SidebarPrimitive>
      <SidebarContent>
        <SidebarHeader>
           <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Logo className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">Intuition</span>
            </div>
        </SidebarHeader>

        <SidebarMenu className="flex-1 overflow-y-auto">
          {!isAdmin && mainLinks.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">Menu</h2>
              <div className="space-y-1">
                {mainLinks.map(renderLink)}
              </div>
            </div>
          )}

          {isAdmin && (
            <>
              <div className="mb-4">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">Menu</h2>
                <div className="space-y-1">
                  {renderLink(navLinks.find(l => l.href === '/')!)}
                  {renderLink(navLinks.find(l => l.href === '/search')!)}
                </div>
              </div>
              <div className="mb-4">
                <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">Admin</h2>
                <div className="space-y-1">
                  {adminLinks.map(renderLink)}
                </div>
              </div>
            </>
          )}

          {supportLinks.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-3">Support</h2>
              <div className="space-y-1">
                {supportLinks.filter(l => l.href !== '/settings').map(renderLink)}
              </div>
            </div>
          )}
        </SidebarMenu>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/settings" passHref legacyBehavior>
                    <SidebarMenuButton as="a" isActive={pathname === '/settings'} tooltip="Settings" onClick={() => setOpenMobile(false)}>
                        <Settings />
                        <span>Settings</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </SidebarPrimitive>
  );
}
