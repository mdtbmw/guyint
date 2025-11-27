
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import { navLinks, type NavLink } from "@/lib/nav-links";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import React from "react";
import { useAdmin } from "@/hooks/use-admin";
import { useWallet } from "@/hooks/use-wallet";
import { Logo } from "../icons";

export function SidebarSheet() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAdmin();
  const { balance } = useWallet();

  const renderLink = (link: NavLink) => {
    if (link.admin && !isAdmin) return null;
    const isActive = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "flex items-center gap-4 rounded-lg px-3 py-3 text-white/70 transition-all hover:bg-white/10 hover:text-white text-lg",
          isActive && "bg-white/10 font-bold text-white"
        )}
      >
        {React.cloneElement(link.icon as React.ReactElement, { className: 'h-6 w-6' })}
        {link.label}
      </Link>
    );
  };

  const mainNav = navLinks.filter(l => l.group === 'main');
  const supportNav = navLinks.filter(l => l.group === 'support');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-sm bg-card-dark border-l border-border-custom p-4 flex flex-col">
          <SheetHeader className="text-left border-b border-border-custom pb-4 mb-4">
             <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                <Logo className="w-8 h-8 text-primary" />
                <h1 className="text-white text-2xl font-bold tracking-tighter">Intuition</h1>
            </div>
            <SheetTitle className="sr-only">Main Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Site navigation and user wallet information.
            </SheetDescription>
          </SheetHeader>

          <div className="p-2 mb-4">
              <div className="px-3 text-sm text-muted-foreground">Balance</div>
              <div className="text-2xl font-bold text-primary p-3">{balance.toFixed(2)} $TRUST</div>
              <w3m-account-button />
          </div>
          
          <nav className="grid items-start gap-2 font-medium flex-1">
            {mainNav.map(renderLink)}
            
            <p className="px-3 pt-6 text-sm font-semibold uppercase text-white/50">Support</p>
            {supportNav.map(renderLink)}
          </nav>
      </SheetContent>
    </Sheet>
  );
}
