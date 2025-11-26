
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface DashboardSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export function DashboardSearch({ searchTerm, setSearchTerm }: DashboardSearchProps) {
  const placeholders = [
    "Query: Contract Address...",
    "Query: Event ID #8821...",
    "Query: 'Bitcoin Halving'...",
    "Query: Top Oracles..."
  ];
  const [placeholder, setPlaceholder] = useState('Query: ...');
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let currentPlaceholderIndex = 0;
    let i = 0;
    let localIsDeleting = false;
    let timeoutId: NodeJS.Timeout;

    function typewriter() {
      const fullText = placeholders[currentPlaceholderIndex];
      if (localIsDeleting) {
        setPlaceholder(current => current.slice(0, -1));
        i--;
        if (i <= 0) {
          localIsDeleting = false;
          setIsDeleting(false);
          currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;
          timeoutId = setTimeout(typewriter, 500);
        } else {
          timeoutId = setTimeout(typewriter, 30);
        }
      } else {
        setPlaceholder(fullText.substring(0, i + 1));
        i++;
        if (i >= fullText.length) {
          localIsDeleting = true;
          setIsDeleting(true);
          timeoutId = setTimeout(typewriter, 2000);
        } else {
          timeoutId = setTimeout(typewriter, 50);
        }
      }
    }
    
    const startTimeout = setTimeout(() => {
      // Only start the typewriter if the input is not focused
      if (inputRef.current !== document.activeElement) {
        typewriter();
      }
    }, 1000); // Initial delay before starting

    return () => {
      clearTimeout(startTimeout);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const displayedPlaceholder = searchTerm ? '' : placeholder + (!isDeleting && searchTerm === '' ? '_' : '');


  return (
    <div className="relative group terminal-glow rounded-[1.5rem] transition-all duration-300">
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[1.5rem]"></div>
      
      <div className="relative flex items-center h-16 md:h-20 px-6 border border-border rounded-[1.5rem] overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan pointer-events-none opacity-50"></div>
        
        <span className="text-primary font-mono text-lg mr-3">{'>_'}</span>
        <Input
          id="dashboard-search-input"
          ref={inputRef}
          placeholder={displayedPlaceholder}
          className="w-full h-full bg-transparent border-none outline-none text-base md:text-lg font-mono text-foreground placeholder-muted-foreground focus:ring-0"
          autoComplete="off"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-background/50 border border-border">
            <span className="text-[10px] font-mono text-muted-foreground">CTRL+K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
