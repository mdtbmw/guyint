
'use client';

import { Logo } from '@/components/icons';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background-dark z-50">
      <div className="flex flex-col items-center gap-4">
        <Logo className="w-16 h-16 text-primary animate-pulse" />
        <p className="text-muted-foreground text-sm">Initializing Session...</p>
      </div>
    </div>
  );
}
