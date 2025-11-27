'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { Event, EventStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard, SuggestMarketCard } from "@/components/event-card";
import { blockchainService } from "@/services/blockchain";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { expandSearchQuery } from "@/ai/flows/expand-search-query";
import { useSearchParams } from "next/navigation";
import { useAdmin } from "@/hooks/use-admin";

const ITEMS_PER_PAGE = 5; // 5 because SuggestMarketCard takes 1 slot in a 3-col grid

interface EventListProps {
    category?: string | 'All';
    status?: EventStatus | EventStatus[];
    searchTerm?: string;
    isUpcoming?: boolean;
}

export function EventList({ category, status, searchTerm, isUpcoming }: EventListProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSearchTerms, setExpandedSearchTerms] = useState<string[]>([]);
    
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const searchParams = useSearchParams();
    const { isAdmin } = useAdmin();

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const allEvents = await blockchainService.getAllEvents();
            setEvents(allEvents);
        } catch (error: any) {
            console.error("Failed to fetch events:", error);
            setError("Could not load event data from the blockchain. The network may be congested or the service unavailable.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [searchParams.toString()]);
    
    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [category, status, searchTerm, isUpcoming]);

    useEffect(() => {
        const getExpandedTerms = async () => {
            if (searchTerm && searchTerm.trim().length > 2) {
                try {
                    const terms = await expandSearchQuery(searchTerm);
                    setExpandedSearchTerms(terms);
                } catch (e) {
                    console.error("AI search expansion failed, falling back to basic search.", e);
                    setExpandedSearchTerms([searchTerm]);
                }
            } else {
                setExpandedSearchTerms([]);
            }
        };
        getExpandedTerms();
    }, [searchTerm]);


    const filteredEvents = useMemo(() => {
        if (!events) return [];
        let processedEvents = [...events];
        
        const now = new Date();

        if (isUpcoming) {
            processedEvents = processedEvents.filter(event => event.bettingStopDate && new Date(event.bettingStopDate) > now)
                                .sort((a,b) => (a.bettingStopDate?.getTime() || 0) - (b.bettingStopDate?.getTime() || 0));
        } else if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            processedEvents = processedEvents.filter(event => statusArray.includes(event.status));
            
            // For 'open' status, also ensure betting has not ended
            if (status === 'open') {
                 processedEvents = processedEvents.filter(event => (!event.bettingStopDate || new Date(event.bettingStopDate) > now));
            }
        }
        
        if (category && category !== 'All') {
            processedEvents = processedEvents.filter(event => event.category === category);
        }

        if (searchTerm && searchTerm.trim() !== '') {
             if (expandedSearchTerms.length > 0) {
                processedEvents = processedEvents.filter(event => {
                    const question = event.question.toLowerCase();
                    return expandedSearchTerms.some(term => question.includes(term.toLowerCase()));
                });
             } else {
                // Fallback for when AI expansion hasn't completed or failed
                 processedEvents = processedEvents.filter(event => event.question.toLowerCase().includes(searchTerm.toLowerCase()));
             }
        }
        
        if (!isUpcoming) {
            // Default sort by end date, newest first
            return processedEvents.sort((a,b) => (b.bettingStopDate?.getTime() || 0) - (a.bettingStopDate?.getTime() || 0));
        }

        return processedEvents;

    }, [events, category, status, searchTerm, isUpcoming, expandedSearchTerms]);

    const handleLoadMore = () => {
        setVisibleCount(prevCount => prevCount + ITEMS_PER_PAGE);
    };
    
    const visibleEvents = useMemo(() => filteredEvents.slice(0, visibleCount), [filteredEvents, visibleCount]);
    const canLoadMore = visibleCount < filteredEvents.length;


    if (loading) {
        return (
            <>
                <Skeleton className="h-[340px] w-full rounded-[2.5rem]" />
                <Skeleton className="h-[340px] w-full rounded-[2.5rem]" />
                <Skeleton className="h-[340px] w-full rounded-[2.5rem]" />
            </>
        );
    }

    if (error) {
         return (
            <div className="md:col-span-2 xl:col-span-3">
                 <Alert variant="destructive" className="bg-card">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Network Error</AlertTitle>
                    <AlertDescription>
                        <p>{error}</p>
                         <Button onClick={fetchEvents} className="mt-4 w-full">
                            <RefreshCw className="w-4 h-4 mr-2"/>
                            Try Again
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }
    
    if (filteredEvents.length === 0) {
        return (
            <>
            <div className="md:col-span-2 xl:col-span-3 text-center py-12 text-muted-foreground bg-card rounded-lg">
                <p className="font-semibold text-lg">No Events Found</p>
                <p className="text-sm">There are no events matching your current criteria.</p>
                 <Button onClick={fetchEvents} className="mt-4" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2"/>
                    Fetch Again
                </Button>
            </div>
            {isAdmin && <SuggestMarketCard />}
            </>
        )
    }

    return (
        <>
            {visibleEvents.map((event) => (
                <EventCard key={event.id} event={{...event, id: event.id as string}} />
            ))}
            {/* Always show suggest card if there's space and user is admin */}
            {isAdmin && visibleEvents.length < (ITEMS_PER_PAGE + 1) && <SuggestMarketCard />}
            
            {canLoadMore && (
                <div className="md:col-span-2 xl:col-span-3 text-center">
                    <Button onClick={handleLoadMore} variant="outline" className="w-full max-w-sm">
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Load More Signals
                    </Button>
                </div>
            )}
        </>
    );
}
