
'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/components/icons';
import { cn } from '@/lib/utils';

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [animation, setAnimation] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimation(false);
    }, 2500); // Animation duration

    const hideTimer = setTimeout(() => {
        setShow(false);
    }, 3500); // Wait for fade out to complete

    return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={cn("splash-screen", !animation && "opacity-0 transition-opacity duration-1000")}>
      <div className="splash-logo splash-animation">
        <Logo />
      </div>
    </div>
  );
}
