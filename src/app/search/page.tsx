
'use client';

import { Input } from '@/components/ui/input';
import { Search, ChevronRight, Zap, Box, Users, Rss, MoreHorizontal, Activity, RefreshCw, AlertTriangle, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { DynamicIcon } from '@/lib/icons';
import { Event } from '@/lib/types';
import { blockchainService } from '@/services/blockchain';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SignalCard } from '@/components/search/signal-card';
import { AlphaStream } from '@/components/search/alpha-stream';
import { expandSearchQuery } from '@/ai/flows/expand-search-query';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuthGuard } from '@/hooks/use-auth-guard';

type FilterType = 'hot' | 'new' | 'whales' | null;
const ITEMS_PER_PAGE = 5;

export default function OracleSearchPage() {
  useAuthGuard();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [expandedSearchTerms, setExpandedSearchTerms] = useState<string[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        blockchainService.clearCache();
        const allEvents = await blockchainService.getAllEvents();
        setEvents(allEvents);
    } catch (err: any) {
        setError("Could not load event data from the network. Please try again.");
        console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  useEffect(() => {
    if (debouncedSearchTerm.trim().length > 2) {
      setIsExpanding(true);
      expandSearchQuery(debouncedSearchTerm).then(terms => {
        setExpandedSearchTerms(terms);
        setIsExpanding(false);
      }).catch(() => {
        setExpandedSearchTerms([debouncedSearchTerm]); // Fallback to basic search
        setIsExpanding(false);
      });
    } else {
      setExpandedSearchTerms([]);
    }
  }, [debouncedSearchTerm]);
  
  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [debouncedSearchTerm, activeFilter]);

  const filteredEvents = useMemo(() => {
    let processedEvents = [...events];

    if (debouncedSearchTerm && expandedSearchTerms.length > 0) {
        processedEvents = processedEvents.filter(event => {
            const question = event.question.toLowerCase();
            return expandedSearchTerms.some(term => question.includes(term.toLowerCase()));
        });
    }

    switch (activeFilter) {
      case 'hot':
        processedEvents.sort((a, b) => b.totalPool - a.totalPool);
        break;
      case 'new':
        processedEvents.sort((a, b) => (b.bettingStopDate?.getTime() || 0) - (a.bettingStopDate?.getTime() || 0));
        break;
      case 'whales':
        processedEvents.sort((a, b) => b.totalPool - a.totalPool);
        break;
      default:
        break;
    }

    return processedEvents;
  }, [events, debouncedSearchTerm, expandedSearchTerms, activeFilter]);
  
  const visibleEvents = useMemo(() => filteredEvents.slice(0, visibleCount), [filteredEvents, visibleCount]);
  const canLoadMore = visibleCount < filteredEvents.length;

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + ITEMS_PER_PAGE);
  };


  const placeholders = [
      "Query: Contract Address...",
      "Query: Event ID #8821...",
      "Query: 'Bitcoin Halving'...",
      "Query: Top Oracles..."
  ];
  const [placeholder, setPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      let currentPlaceholderIndex = 0;
      let i = 0;
      let localIsDeleting = false;
      let timeoutId: NodeJS.Timeout;

      function typewriter() {
          if (!inputRef.current) return;
          const fullText = placeholders[currentPlaceholderIndex];
          if (localIsDeleting) {
              setPlaceholder(current => current.slice(0, -1));
              i--;
              if (i <= 0) {
                  localIsDeleting = false;
                  setIsDeleting(false);
                  currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length;
                  timeoutId = setTimeout(() => typewriter(), 500);
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
        if (inputRef.current && inputRef.current !== document.activeElement) {
          typewriter();
        }
      }, 1000);

      return () => {
        clearTimeout(startTimeout);
        if (timeoutId) clearTimeout(timeoutId);
      };
  }, []);

  const handleFilterClick = (filter: FilterType) => {
    setActiveFilter(current => current === filter ? null : filter);
  };

  return (
    <div className="space-y-8 md:space-y-10 animate-slide-up">
        <PageHeader title="Oracle Search" description="Query the on-chain event database." />
        <div>
             <div className="relative group terminal-glow rounded-[1.5rem] transition-all duration-300">
                <div className="absolute inset-0 bg-card/80 backdrop-blur-xl rounded-[1.5rem]"></div>
                
                <div className="relative flex items-center h-16 md:h-20 px-6 border border-border rounded-[1.5rem] overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan pointer-events-none opacity-50"></div>
                    
                    <span className="text-primary font-mono text-lg mr-3">{'>_'}</span>
                    <Input
                        id="oracle-input"
                        ref={inputRef}
                        placeholder={placeholder + (isDeleting ? '' : '_')}
                        className="w-full h-full bg-transparent border-none outline-none text-base md:text-lg font-mono text-foreground placeholder-muted-foreground focus:ring-0"
                        autoFocus
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

            <div className="mt-6 flex flex-wrap gap-3">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant={activeFilter === 'hot' ? "default" : "outline"} onClick={() => handleFilterClick('hot')} className="active-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-3 h-3" /> High Volatility
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Sorts by events with the largest betting pools.</p>
                        </TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={activeFilter === 'new' ? "default" : "outline"} onClick={() => handleFilterClick('new')} className="active-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                                <Box className="w-3 h-3" /> New Blocks
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                             <p>Sorts by the most recently created events.</p>
                        </TooltipContent>
                    </Tooltip>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant={activeFilter === 'whales' ? "default" : "outline"} onClick={() => handleFilterClick('whales')} className="active-press px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-3 h-3" /> Whales
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Shows events with the highest concentration of large bets.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono font-bold uppercase text-muted-foreground flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Incoming Signals
                    </h2>
                     <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">LIVE</span>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-[92px] w-full rounded-2xl" />
                        <Skeleton className="h-[92px] w-full rounded-2xl" />
                        <Skeleton className="h-[92px] w-full rounded-2xl" />
                    </div>
                ) : error ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Network Error</AlertTitle>
                      <AlertDescription>
                        {error}
                         <Button onClick={fetchEvents} variant="secondary" size="sm" className="mt-4">
                            <RefreshCw className="mr-2 h-4 w-4"/>
                            Retry
                        </Button>
                      </AlertDescription>
                    </Alert>
                ) : visibleEvents.length > 0 ? (
                    <div>
                        {visibleEvents.map(event => <SignalCard key={event.id} event={event} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 text-muted-foreground font-mono">No signals match your query.</div>
                )}
                
                {canLoadMore && (
                    <Button onClick={handleLoadMore} variant="outline" className="w-full">
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Load More Signals
                    </Button>
                )}
            </div>

            <div className="lg:col-span-1">
                <AlphaStream />
            </div>
        </div>
        
    </div>
  );
}
