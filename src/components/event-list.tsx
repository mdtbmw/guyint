
'use client';

import { useMemo } from "react";
import { Event, EventStatus } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/components/event-card";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, where, orderBy, Query } from "firebase/firestore";

interface EventListProps {
    category?: string | 'All';
    status?: EventStatus | EventStatus[];
    searchTerm?: string;
}

export function EventList({ category, status, searchTerm }: EventListProps) {
    const firestore = useFirestore();
    
    const eventsQuery = useMemo(() => {
        if (!firestore) return null;
        
        const eventsCollection = collection(firestore, 'events');
        const statusConditions = Array.isArray(status) ? status : (status ? [status] : ['open']);

        let queryConstraints: any[] = [
            where('status', 'in', statusConditions),
            orderBy('endDate', 'desc')
        ];

        // The category filter for Firestore is now handled here
        if (category && category !== 'All') {
            queryConstraints.push(where('category', '==', category));
        }

        return query(eventsCollection, ...queryConstraints);
    }, [firestore, category, status]);


    const { data: events, loading } = useCollection<Event>(eventsQuery);

    const filteredEvents = useMemo(() => {
        if (!events) {
            return [];
        }
        let processedEvents = events;

        if (searchTerm && searchTerm.trim() !== '') {
            const lowercasedTerm = searchTerm.toLowerCase();
            processedEvents = processedEvents.filter(event => 
                event.question.toLowerCase().includes(lowercasedTerm)
            );
        }
        
        return processedEvents;
    }, [events, searchTerm]);


    if (loading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-[240px] w-full rounded-2xl" />
                <Skeleton className="h-[240px] w-full rounded-2xl" />
                <Skeleton className="h-[240px] w-full rounded-2xl" />
            </div>
        );
    }
    
    if (!filteredEvents || filteredEvents.length === 0) {
        return (
            <div className="text-center py-12 text-white/60 bg-white/5 rounded-2xl">
                <p className="font-semibold">No Events Found</p>
                <p className="text-sm">There are no {status} events matching your criteria.</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {filteredEvents.map((event) => (
                <EventCard key={event.id} event={{...event, id: event.id as string}} />
            ))}
        </div>
    );
}
