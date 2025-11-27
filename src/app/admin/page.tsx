
'use client';

import { useAdmin } from "@/hooks/use-admin";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import type { Event, Category } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Scale, FileText, PlusCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { AdminAuditLog } from "@/app/admin/admin-audit-log";
import { AdminEventTable } from "@/components/admin/admin-event-table";
import { Button } from "@/components/ui/button";
import { AdminCategoryManager } from "@/components/admin/admin-category-manager";
import { useWallet } from "@/hooks/use-wallet";
import { blockchainService } from "@/services/blockchain";
import { mockCategories } from "@/lib/categories";
import { MobilePageHeader } from "@/components/layout/mobile-page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminPage() {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const { connected } = useWallet();

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!isAdmin) return;
    setEventsLoading(true);
    setError(null);
    try {
      const allEvents = await blockchainService.getAllEvents();
      setEvents(allEvents);
    } catch (error: any) {
      console.error("Failed to fetch events:", error);
      setError(error.message || "An unexpected error occurred while fetching blockchain data.");
    } finally {
      setEventsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push('/');
    } else if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin, adminLoading, router, fetchAllData]);

  const isLoading = adminLoading || !connected || eventsLoading;

  const stats = useMemo(() => {
    if (!events) return { totalEvents: 0, totalValueLocked: 0, openEvents: 0, users: 0 };
    const totalValue = events.reduce((acc, event) => acc + event.totalPool, 0);
    const participants = new Set(events.flatMap(e => e.participants));
    return {
      totalEvents: events.length,
      totalValueLocked: totalValue,
      openEvents: events.filter(e => e.status === 'open').length,
      users: participants.size,
    }
  }, [events]);

  if (adminLoading || !isAdmin) {
    return <div className="text-center py-12">Verifying admin permissions...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
       <MobilePageHeader title="Admin" />
       <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-4">
         <PageHeader 
            title="Admin Dashboard"
            description="Manage events, users, and system settings."
         />
         <Button onClick={() => router.push('/create-event')} className="bg-primary text-black font-bold text-sm tracking-wide">
           <PlusCircle className="w-4 h-4 mr-2" />
           Create Event
         </Button>
       </div>

      {error && (
         <Alert variant="destructive" className="bg-card">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Network Error</AlertTitle>
            <AlertDescription>
                {error}
                  <Button onClick={fetchAllData} className="mt-4 w-full">
                    <RefreshCw className="w-4 h-4 mr-2"/>
                    Try Again
                </Button>
            </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-component-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-text-dark text-base font-medium">Total Volume</CardTitle>
            <Scale className="w-4 h-4 text-text-dark" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">{stats.totalValueLocked.toLocaleString()} $TRUST</div>}
             <p className="text-sm text-muted-foreground pt-1">Total value staked across all events.</p>
          </CardContent>
        </Card>
        <Card className="bg-component-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-text-dark text-base font-medium">Active Users</CardTitle>
            <Users className="w-4 h-4 text-text-dark" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{stats.users.toLocaleString()}</div>}
             <p className="text-sm text-muted-foreground pt-1">Unique addresses that have placed bets.</p>
          </CardContent>
        </Card>
        <Card className="bg-component-dark">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-text-dark text-base font-medium">Open Events</CardTitle>
            <FileText className="w-4 h-4 text-text-dark" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">{stats.openEvents}</div>}
             <p className="text-sm text-muted-foreground pt-1">Events currently available for betting.</p>
          </CardContent>
        </Card>
      </div>

       <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-component-dark p-1.5 h-auto sm:h-12 rounded-lg sm:rounded-full">
            <TabsTrigger value="events" className="rounded-full text-text-dark data-[state=active]:bg-primary data-[state=active]:text-black font-bold text-sm">Event Management</TabsTrigger>
            <TabsTrigger value="categories" className="rounded-full text-text-dark data-[state=active]:bg-primary data-[state=active]:text-black font-bold text-sm">Category Management</TabsTrigger>
            <TabsTrigger value="audit" className="rounded-full text-text-dark data-[state=active]:bg-primary data-[state=active]:text-black font-bold text-sm">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="events" className="mt-4">
              <AdminEventTable events={events} loading={isLoading} onActionSuccess={fetchAllData} />
          </TabsContent>
           <TabsContent value="categories" className="mt-4">
              <AdminCategoryManager categories={mockCategories} loading={false} error={null} />
           </TabsContent>
          <TabsContent value="audit" className="mt-4">
             <AdminAuditLog events={events} loading={isLoading} />
          </TabsContent>
        </Tabs>
    </div>
  );
}
