
'use client';

import { CreateEventForm } from '@/components/create-event-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import type { Category } from '@/lib/types';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAtom } from 'jotai';
import { generatedEventAtom } from '@/lib/state/admin';
import { readCategories } from '../admin/actions';

export default function CreateEventPage() {
    const { isLoading: isAuthLoading } = useAuthGuard({ requireAdmin: true });
    
    const [isSuccess, setIsSuccess] = useState(false);
    const [lastEventId, setLastEventId] = useState<string | null>(null);
    const [generatedEvent, setGeneratedEvent] = useAtom(generatedEventAtom);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const fetchCats = async () => {
            const data = await readCategories();
            setCategories(data.categories);
        }
        fetchCats();
    }, []);
    
    // Clear the generated event atom after we've used it to pre-fill the form
    // or when the user succeeds in creating an event.
    useEffect(() => {
        return () => {
            if (generatedEvent) {
                setGeneratedEvent(null);
            }
        };
    }, [generatedEvent, setGeneratedEvent]);

    const handleSuccess = (eventId: string) => {
        setIsSuccess(true);
        setLastEventId(eventId);
        // Clear any lingering AI event data from storage upon successful manual creation
        if (generatedEvent) {
            setGeneratedEvent(null);
        }
    };

    const handleReset = () => {
        setIsSuccess(false);
        setLastEventId(null);
    };
    
    if (isAuthLoading) {
      return <div className="text-center py-12">Checking permissions...</div>;
    }

  return (
    <>
        <PageHeader 
            title="Create New Event"
            description="Define a new event for users to place their bets on. Ensure all details are accurate before submitting to the blockchain."
        />

      <Card>
        <CardHeader>
          <CardTitle>Manual Event Details</CardTitle>
          <CardDescription>
            This action is irreversible. Double-check all fields before submitting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <CreateEventForm 
            categories={categories}
            onSuccess={handleSuccess}
            isSuccess={isSuccess}
            lastEventId={lastEventId}
            onReset={handleReset}
            prefillData={generatedEvent}
          />
        </CardContent>
      </Card>
    </>
  );
}
