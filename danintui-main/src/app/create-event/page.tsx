
'use client';

import { CreateEventForm } from '@/components/create-event-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { readCategories } from '../admin/actions';
import { useEffect, useState, useCallback } from 'react';
import type { Category } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreateEventPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCats = useCallback(async () => {
        setLoading(true);
        const data = await readCategories();
        setCategories(data.categories);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchCats();
    }, [fetchCats]);

  return (
    <>
        <PageHeader 
            title="Create New Signal"
            description="Define a new prediction market for users to place their bets on. Ensure all details are accurate before submitting to the blockchain."
        />

      <Card>
        <CardHeader>
          <CardTitle>Manual Signal Details</CardTitle>
          <CardDescription>
            This action is irreversible. Double-check all fields before submitting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <CreateEventForm 
                    categories={categories}
                />
            )}
        </CardContent>
      </Card>
    </>
  );
}

