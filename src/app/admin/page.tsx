

'use client';

import { useAdmin } from "@/hooks/use-admin";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import type { Category, Event } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Users, Scale, FileText, PlusCircle, AlertTriangle, RefreshCw, Sparkles, Lightbulb, Bot, CheckCircle, Database, Copy, Download, Upload } from "lucide-react";
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
import { Hex, formatEther } from "viem";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { calculateUserStats, getRank } from "@/lib/ranks";
import { UserStats } from "@/lib/types";
import { AddressRevealDialog } from "@/components/admin/address-reveal-dialog";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface LeaderboardUser extends UserStats {
    id: Hex;
    username: string;
    avatar: string;
    totalWagered: number;
}


export default function AdminPage() {
  const { isLoading } = useAuthGuard({ requireAdmin: true });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { chain } = useWallet();
  const { addNotification } = useNotifications();
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[] | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [scoutedTopics, setScoutedTopics] = useState<string[]>([]);
  const [isScouting, setIsScouting] = useState(false);
  const setScoutedTopic = useSetAtom(scoutedTopicAtom);

  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);
  const [automationInterval, setAutomationInterval] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<Record<string, boolean>>({});
  
  const [uniqueParticipants, setUniqueParticipants] = useState(0);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);

  const activeTab = searchParams.get('tab') || 'events';

  const fetchCategories = useCallback(async () => {
    const data = await readCategories();
    setCategories(data.categories.map(c => ({ id: c.id, name: c.name, icon: c.icon})));
  }, []);

  const fetchLeaderboard = useCallback(async () => {
        try {
            const allEvents = await blockchainService.getAllEvents();
            if (allEvents.length === 0) return;

            const allLogs = await blockchainService.getAllLogs();
            const bettors = new Set<Hex>();
            allLogs.betPlaced.forEach(log => { if (log.user) bettors.add(log.user); });
            const bettorsArray = Array.from(bettors);

            if (bettorsArray.length === 0) return;
            
            const eventIds = allEvents.map(e => BigInt(e.id));
            const userStatsPromises = bettorsArray.map(async (bettor) => {
                const userBetsOnAllEvents = await blockchainService.getMultipleUserBets(eventIds, bettor);

                let totalWagered = 0n;
                userBetsOnAllEvents.forEach(bet => {
                    totalWagered += bet.yesAmount + bet.noAmount;
                });
                
                const userStats = calculateUserStats(allEvents, userBetsOnAllEvents);

                return {
                    id: bettor,
                    username: `${bettor.slice(0, 6)}...${bettor.slice(-4)}`,
                    avatar: `https://api.dicebear.com/9.x/pixel-art/svg?seed=${bettor}`,
                    ...userStats,
                    totalWagered: Number(formatEther(totalWagered))
                };
            });

            const usersWithStats = (await Promise.all(userStatsPromises)).sort((a, b) => b.trustScore - a.trustScore);
            setLeaderboardData(usersWithStats);

        } catch (err: any) {
            setError("Could not load user data for admin panel.");
        }
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
      await fetchLeaderboard();

    } catch (error: any) {
      setError(error.message || "An unexpected error occurred while fetching blockchain data.");
    } finally {
      setEventsLoading(false);
    }
  }, [fetchCategories, fetchLeaderboard]);

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
  
  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Address Copied" });
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + leaderboardData.map(u => u.id).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "user_wallet_ids.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Data Exported", description: "User wallet IDs have been downloaded as a CSV."});
  };

  const handleBackup = () => {
    const jsonContent = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leaderboardData, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", jsonContent);
    link.setAttribute("download", "user_data_backup.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Backup Created", description: "Full user data backup has been downloaded." });
  };


  if (isLoading) {
    return <div className="text-center py-12">Verifying admin permissions...</div>;
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <PageHeader 
            title="Control Matrix"
            description="Manage events, users, and system settings."
         />
         <div className="flex items-center gap-2 flex-shrink-0">
            <Button onClick={fetchAllData} variant="outline" size="icon" className="w-10 h-10" disabled={eventsLoading}>
              <RefreshCw className={cn("w-4 h-4", eventsLoading && "animate-spin")} />
            </Button>
            <Button onClick={() => router.push('/create-event')} className="w-full sm:w-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Manually
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
            <CardTitle className="text-base font-medium text-muted-foreground">Open Signals</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isPageLoading ? <Skeleton className="h-8 w-24"/> : <div className="text-2xl font-bold">{stats.openEvents}</div>}
             <p className="text-sm text-muted-foreground pt-1">Signals currently available for betting.</p>
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
                        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/>AI Signal Scout</CardTitle>
                        <CardDescription>
                           Select a category and the AI will search for timely and relevant topics to create new prediction markets.
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
                                <CardTitle className="flex items-center gap-2"><Bot />Automated Signal Creation</CardTitle>
                                <CardDescription>Configure and run the AI to automatically generate new topics in batches.</CardDescription>
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
           <TabsContent value="data" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Database/>User Data</CardTitle>
                  <CardDescription>View, manage, and export user data from the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Button onClick={handleExport} variant="outline"><Download className="w-4 h-4 mr-2"/>Export Wallets (CSV)</Button>
                    <Button onClick={handleBackup} variant="outline"><Download className="w-4 h-4 mr-2"/>Backup All Data (JSON)</Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline"><Upload className="w-4 h-4 mr-2"/>Restore</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm High-Risk Action</AlertDialogTitle>
                          <AlertDialogDescription>
                            Restoring data from a backup is a sensitive operation that can have unintended consequences if the file is incorrect. This action should be performed via a secure, audited backend script, not through the UI.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Understood</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <div className="rounded-lg border overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rank</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Trust Score</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Accuracy</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {leaderboardData.slice(0, 100).map((user, index) => (
                                <tr key={user.id}>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">{index + 1}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar} alt={user.username}/>
                                                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <span className="font-bold hidden sm:inline">{user.username}</span>
                                                <span className="font-mono text-xs text-muted-foreground sm:hidden">{`${user.id.slice(0,10)}...`}</span>
                                                <div className="font-mono text-xs text-muted-foreground hidden sm:block">{user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground font-semibold hidden md:table-cell">{user.trustScore.toFixed(2)}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-emerald-500 hidden md:table-cell">{user.accuracy.toFixed(2)}%</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <AddressRevealDialog address={user.id} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
           </TabsContent>
        </Tabs>
    </div>
  );
}
