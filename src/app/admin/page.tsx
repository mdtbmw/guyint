
'use client';

import { useAdmin } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { useCollection, useFirestore, useAuth } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { Event, Category } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Scale, FileText, PlusCircle, History } from "lucide-react";
import { AdminAuditLog } from "@/components/admin/admin-audit-log";
import { AdminEventTable } from "@/components/admin/admin-event-table";
import { Button } from "@/components/ui/button";
import { AdminCategoryManager } from "@/components/admin/admin-category-manager";

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  const { currentUser, loading: authLoading } = auth;

  // Combine loading states
  const isLoading = adminLoading || authLoading;

  const eventsQuery = useMemo(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'events'));
  }, [firestore, isAdmin]);

  const categoriesQuery = useMemo(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'categories'));
  }, [firestore, isAdmin]);

  const { data: events, loading: eventsLoading } = useCollection<Event>(eventsQuery);
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useCollection<Category>(categoriesQuery);

  useEffect(() => {
    if (!isLoading && (!isAdmin || !currentUser)) {
      router.push('/');
    }
  }, [isAdmin, isLoading, currentUser, router]);

  const stats = useMemo(() => {
    if (!events) return { totalEvents: 0, totalValueLocked: 0, openEvents: 0 };
    return {
      totalEvents: events.length,
      totalValueLocked: events.reduce((acc, event) => acc + event.totalPool, 0),
      openEvents: events.filter(e => e.status === 'open').length,
    }
  }, [events]);

  if (isLoading || !isAdmin || !currentUser) {
    return <div className="text-center py-12">Verifying admin permissions...</div>;
  }

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between">
         <PageHeader 
            title="Admin Command Center"
            description="Manage events, declare outcomes, and monitor platform activity."
         />
         <Button onClick={() => router.push('/create-event')}>
           <PlusCircle className="w-4 h-4 mr-2" />
           Create New Event
         </Button>
       </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {eventsLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{stats.totalEvents}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {eventsLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">${stats.totalValueLocked.toFixed(2)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bets</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {eventsLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{stats.openEvents}</div>}
          </CardContent>
        </Card>
      </div>

       <Tabs defaultValue="events">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="events">Event Management</TabsTrigger>
            <TabsTrigger value="categories">Category Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="events" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>All Events</CardTitle>
                    <CardDescription>Declare outcomes for finished events or cancel open events.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <AdminEventTable events={events} loading={eventsLoading} />
                </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="categories" className="mt-4">
              <AdminCategoryManager categories={categories} loading={categoriesLoading} error={categoriesError} />
           </TabsContent>
          <TabsContent value="audit" className="mt-4">
             <AdminAuditLog />
          </TabsContent>
        </Tabs>
    </div>
  );
}
