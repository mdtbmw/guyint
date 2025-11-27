
'use client';

import { useMemo, useState, useEffect, useCallback } from "react";
import { Event, EventStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/components/event-card";
import { blockchainService } from "@/services/blockchain";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

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
    
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const allEvents = await blockchainService.getAllEvents();
            setEvents(allEvents);
        } catch (error: any) {
            console.error("Failed to fetch events from blockchain:", error);
            setError(error.message || "An unexpected error occurred while fetching events. The blockchain may be unavailable.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);


    const filteredEvents = useMemo(() => {
        let processedEvents = [...events];
        
        const now = new Date();

        // Primary status filter
        if (status) {
            const statusArray = Array.isArray(status) ? status : [status];
            processedEvents = processedEvents.filter(event => statusArray.includes(event.status));
        }

        // Secondary 'upcoming' filter for open events
        if (status === 'open') {
          if (isUpcoming) {
              // Show only events that haven't started yet (hypothetical future feature, for now endDate is our marker)
              // This logic could be tied to a `startDate` if the contract supported it.
              // For now, we assume "upcoming" might mean just sorting differently or a special tag.
              // Let's filter to show open events whose end date is further in the future.
              // This is a placeholder for a more robust "upcoming" logic.
              processedEvents = processedEvents.filter(event => new Date(event.endDate) > now);
          } else {
              // Live events are open and not considered upcoming
              processedEvents = processedEvents.filter(event => new Date(event.endDate) > now);
          }
        }
        
        if (category && category !== 'All') {
            processedEvents = processedEvents.filter(event => event.category === category);
        }

        if (searchTerm && searchTerm.trim() !== '') {
            const lowercasedTerm = searchTerm.toLowerCase();
            processedEvents = processedEvents.filter(event => 
                event.question.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        return processedEvents.sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    }, [events, category, status, searchTerm, isUpcoming]);


    if (loading) {
        return (
            <>
                <Skeleton className="h-[420px] w-full rounded-lg" />
                <Skeleton className="h-[420px] w-full rounded-lg" />
                <Skeleton className="h-[420px] w-full rounded-lg" />
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
                        {error}
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
            <div className="md:col-span-2 xl:col-span-3 text-center py-12 text-white/60 bg-card rounded-lg">
                <p className="font-semibold">No Events Found</p>
                <p className="text-sm">There are no events matching your criteria.</p>
                 <Button onClick={fetchEvents} className="mt-4">
                    <RefreshCw className="w-4 h-4 mr-2"/>
                    Fetch Again
                </Button>
            </div>
        )
    }

    return (
        <>
            {filteredEvents.map((event) => (
                <EventCard key={event.id} event={{...event, id: event.id as string}} />
            ))}
        </>
    );
}
