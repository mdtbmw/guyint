'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobilePageHeaderProps {
  title: string;
}

export function MobilePageHeader({ title }: MobilePageHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-20 flex h-20 items-center border-b border-border-custom bg-background-dark/80 px-2 backdrop-blur-sm md:hidden">
      <button
        onClick={() => router.back()}
        className="flex h-12 w-12 shrink-0 items-center justify-center"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>
      <h2 className="flex-1 truncate text-center text-lg font-bold tracking-tight text-white -ml-12">
        {title}
      </h2>
    </div>
  );
}
