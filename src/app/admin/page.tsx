
'use client';

import { useAdmin } from "@/hooks/use-admin";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import type { Category, Event } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Users, Scale, FileText, PlusCircle, AlertTriangle, RefreshCw, Sparkles, Lightbulb, Bot, Cpu, CheckCircle } from "lucide-react";
import { AdminEventTable } from "@/components/admin/admin-event-table";
import { Button } from "@/components/ui/button";
import { AdminCategoryManager } from "@/components/admin/admin-category-manager";
import { useWallet } from "@/hooks/use-wallet";
import { blockchainService } from "@/services/blockchain";
import { readCategories } from "./actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { scoutEventTopics } from "@/ai/flows/scout-event-topics";
import { useSetAtom } from "jotai";
import { scoutedTopicAtom } from "@/lib/state/admin";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AiOraclePanel } from "@/components/admin/ai-oracle-panel";
import { useNotifications } from '@/lib/state/notifications';
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { AdminNav } from "@/components/admin/admin-nav";
import { Hex } from "viem";

export default function AdminPage() {
  const { isLoading } = useAuthGuard({ requireAdmin: true });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { chain } = useWallet();
  const { addNotification } = useNotifications();

  const [events, setEvents] = useState<Event[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [scoutedTopics, setScoutedTopics] = useState<string[]>([]);
  const [isScouting, setIsScouting] = useState(false);
  const setScoutedTopic = useSetAtom(scoutedTopicAtom);

  // State for automation controls
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [automationInterval, setAutomationInterval] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  
  const [uniqueParticipants, setUniqueParticipants] = useState(0);

  const activeTab = searchParams.get('tab') || 'events';

  const fetchCategories = useCallback(async () => {
    const data = await readCategories();
    setCategories(data.categories.map(c => ({ id: c.id, name: c.name, icon: c.icon})));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);


  useEffect(() => {
    // Initialize selected categories state
    const initialSelection: Record<string, boolean> = {};
    categories.forEach(cat => {
        initialSelection[cat.name] = true; // Default to all selected
    });
    setSelectedCategories(initialSelection);
  }, [categories]);


  const fetchAllData = useCallback(async () => {
    setEventsLoading(true);
    setError(null);
    try {
      blockchainService.clearCache();
      const [allEvents, allLogs] = await Promise.all([
        blockchainService.getAllEvents(),
        blockchainService.getAllLogs()
      ]);
      
      setEvents(allEvents);

      const bettors = new Set<Hex>();
      allLogs.betPlaced.forEach(log => {
        if (log.user) {
          bettors.add(log.user);
        }
      });
      setUniqueParticipants(bettors.size);
      
      await fetchCategories();

    } catch (error: any) {
      setError(error.message || "An unexpected error occurred while fetching blockchain data.");
    } finally {
      setEventsLoading(false);
    }
  }, [fetchCategories]);

  useEffect(() => {
    if (!isLoading) {
      fetchAllData();
    }
  }, [isLoading, fetchAllData]);

  const handleScoutTopics = useCallback(async (category: string) => {
    setIsScouting(true);
    setScoutedTopics([]);
    try {
        const topics = await scoutEventTopics(category);
        if (topics.length > 0) {
            setScoutedTopics(topics);
            addNotification({
                title: "Scouting Complete!",
                description: `Found ${topics.length} new potential topics in ${category}.`,
                icon: 'Lightbulb',
                type: 'general'
            });
        } else {
            addNotification({
                title: "Scouting Report",
                description: `The AI scout didn't find any fresh topics for ${category} right now. Try another category or check back later.`,
                icon: 'Info',
                type: 'general'
            });
        }
    } catch (e: any) {
        addNotification({
            title: "AI Scout Failed",
            description: e.message || "Could not generate event topics.",
            icon: 'AlertTriangle',
            variant: 'destructive',
            type: 'general'
        });
    } finally {
        setIsScouting(false);
    }
  }, [addNotification]);

  const handleBatchScout = async () => {
     if (!isAutomationEnabled) {
        addNotification({ title: 'Automation Disabled', description: 'Please enable the automation switch to generate topics.', icon: 'Info', type: 'general' });
        return;
    }

    const categoriesToScout = Object.entries(selectedCategories)
      .filter(([, isSelected]) => isSelected)
      .map(([name]) => name);

    if (categoriesToScout.length === 0) {
      addNotification({ title: 'No Categories Selected', description: 'Please select at least one category to scout.', icon: 'Info', type: 'general' });
      return;
    }

    setIsScouting(true);
    setScoutedTopics([]);
    let allTopics: string[] = [];

    try {
      addNotification({ title: 'Starting Batch Generation...', description: `Scouting topics for ${categoriesToScout.length} categories.`, icon: 'Loader2', type: 'general' });

      for (const category of categoriesToScout) {
        const topics = await scoutEventTopics(category);
        allTopics = [...allTopics, ...topics];
      }
      
      if (allTopics.length > 0) {
        setScoutedTopics(allTopics);
        addNotification({
            title: "Batch Scouting Complete!",
            description: `Found ${allTopics.length} new topics across ${categoriesToScout.length} categories.`,
            icon: 'CheckCircle',
            type: 'general'
        });
      } else {
        addNotification({
            title: "Batch Scouting Report",
            description: `The AI scout couldn't find any fresh topics for the selected categories right now.`,
            icon: 'Info',
            type: 'general'
        });
      }

    } catch (e: any) {
      addNotification({
        title: "AI Batch Scout Failed",
        description: e.message || "Could not generate event topics.",
        icon: 'AlertTriangle',
        variant: 'destructive',
        type: 'general'
      });
    } finally {
      setIsScouting(false);
    }
  };
  
  const handleUseTopic = (topic: string) => {
    setScoutedTopic(topic);
    router.push('/admin?tab=ai_oracle');
  };

  const handleTabChange = (value: string) => {
    router.push(`/admin?tab=${value}`);
  }

  const isPageLoading = isLoading || eventsLoading;


  const stats = useMemo(() => {
    if (!events) return { totalEvents: 0, totalValueLocked: 0, openEvents: 0, users: 0 };
    const totalValue = events.reduce((acc, event) => acc + event.totalPool, 0);

    return {
      totalEvents: events.length,
      totalValueLocked: totalValue,
      openEvents: events.filter(e => e.status === 'open').length,
      users: uniqueParticipants,
    }
  }, [events, uniqueParticipants]);
  

  if (isLoading) {
    return <div className="text-center py-12">Verifying admin permissions...</div>;
  }

  return (
    <>
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <PageHeader 
            title="Admin Dashboard"
            description="Manage events, users, and system settings."
         />
         <div className="flex items-center gap-2 flex-shrink-0">
            <Button onClick={fetchAllData} variant="outline" size="icon" className="w-10 h-10" disabled={eventsLoading}>
              <RefreshCw className={cn("w-4 h-4", eventsLoading && "animate-spin")} />
            </Button>
            <Button onClick={() => router.push('/create-event')} className="w-full sm:w-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Event Manually
            </Button>
         </div>
       </div>

      {error && (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Network Error</AlertTitle>
            <AlertDescription>
                {error}
                  <Button onClick={fetchAllData} variant="destructive" className="mt-4 w-full">
                    <RefreshCw className="w-4 h-4 mr-2"/>
                    Try Again
                </Button>
            </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Total Volume</CardTitle>
            <Scale className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPageLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">{stats.totalValueLocked.toFixed(4)} {chain?.nativeCurrency.symbol}</div>}
             <p className="text-sm text-muted-foreground pt-1">Total value staked across all events.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Active Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isPageLoading ? <Skeleton className="h-8 w-16"/> : <div className="text-2xl font-bold">{stats.users.toLocaleString()}</div>}
             <p className="text-sm text-muted-foreground pt-1">Unique addresses that have placed bets.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium text-muted-foreground">Open Events</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPageLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">{stats.openEvents}</div>}
             <p className="text-sm text-muted-foreground pt-1">Events currently available for betting.</p>
          </CardContent>
        </Card>
      </div>

       <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
          <AdminNav activeTab={activeTab} onTabChange={handleTabChange} />
          
          <TabsContent value="events" className="mt-6">
              <AdminEventTable events={events} loading={isPageLoading} onActionSuccess={fetchAllData} />
          </TabsContent>
           <TabsContent value="ai_oracle" className="mt-6">
             <AiOraclePanel onActionSuccess={fetchAllData} events={events} />
          </TabsContent>
          <TabsContent value="scout" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/>AI Event Scout</CardTitle>
                        <CardDescription>
                           Select a category and the AI will search for timely and relevant event topics to create new prediction markets.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {categories.map(cat => (
                                <Button
                                    key={cat.id}
                                    variant="outline"
                                    onClick={() => handleScoutTopics(cat.name)}
                                    disabled={isScouting}
                                    className="justify-start text-left"
                                >
                                    {isScouting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin"/> : <Lightbulb className="w-4 h-4 mr-2"/>}
                                    Scout {cat.name}
                                </Button>
                            ))}
                        </div>
                        
                        {isScouting && (
                            <div className="text-center text-muted-foreground py-8 space-y-3">
                                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-primary" />
                                <p className="font-semibold">AI is scouting for new topics...</p>
                                <p className="text-sm">Please wait, this may take a moment.</p>
                            </div>
                        )}
                        
                        {scoutedTopics.length > 0 && !isScouting && (
                            <div className="space-y-3 pt-4 border-t">
                                <h4 className="font-semibold flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary"/>Scouted Topics</h4>
                                 <div className="flex flex-wrap items-start gap-2">
                                    {scoutedTopics.map(topic => (
                                        <Button key={topic} variant="secondary" size="sm" onClick={() => handleUseTopic(topic)} className="h-auto py-1.5">
                                            {topic}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                    </CardContent>
                </Card>
          </TabsContent>
           <TabsContent value="automation" className="mt-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Bot />Automated Event Creation</CardTitle>
                                <CardDescription>Configure and run the AI to automatically generate new event topics in batches.</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2 p-2 rounded-lg bg-secondary flex-shrink-0">
                                <Switch id="automation-mode" checked={isAutomationEnabled} onCheckedChange={setIsAutomationEnabled} />
                                <Label htmlFor="automation-mode" className="font-medium text-foreground">Automation Enabled</Label>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div>
                            <h4 className="font-semibold text-foreground mb-3">Target Categories</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 rounded-lg bg-secondary">
                                {categories.map(cat => (
                                    <div key={cat.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`cat-${cat.id}`}
                                            checked={selectedCategories[cat.name] || false}
                                            onCheckedChange={(checked) => {
                                                setSelectedCategories(prev => ({...prev, [cat.name]: !!checked}));
                                            }}
                                        />
                                        <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer">{cat.name}</Label>
                                    </div>
                                ))}
                            </div>
                         </div>

                        <div>
                            <Label htmlFor="topics-interval">Topics per Category</Label>
                            <Input
                                id="topics-interval"
                                type="number"
                                value={automationInterval}
                                onChange={(e) => setAutomationInterval(Number(e.target.value))}
                                className="max-w-[200px] mt-2"
                                disabled
                            />
                            <p className="text-xs text-muted-foreground mt-2">Note: The AI prompt is designed to generate 3-5 topics per run. This input is for UI demonstration purposes.</p>
                        </div>
                        
                        <Button
                            onClick={handleBatchScout}
                            disabled={isScouting || !isAutomationEnabled}
                            className="w-full"
                            size="lg"
                        >
                            {isScouting ? <RefreshCw className="w-5 h-5 mr-2 animate-spin"/> : <Sparkles className="w-5 h-5 mr-2"/>}
                            {isScouting ? 'Generating Topics...' : 'Run Generation Now'}
                        </Button>
                    </CardContent>
                </Card>
           </TabsContent>
           <TabsContent value="categories" className="mt-6">
              <AdminCategoryManager onCategoriesUpdate={fetchAllData} />
           </TabsContent>
        </Tabs>
    </>
  );
}
