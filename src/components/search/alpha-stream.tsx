
'use client';

import { MoreHorizontal, Rss, PauseCircle, Trash2 } from "lucide-react";
import { blockchainService } from "@/services/blockchain";
import { useEffect, useState, useRef } from "react";
import { Event } from "@/lib/types";
import { formatEther } from "viem";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button";

interface BetLog {
  id: string;
  user: string;
  action: string;
  color: 'primary' | 'emerald' | 'rose' | 'zinc';
  time: string;
}

const getRelativeTime = (index: number) => {
    if (index === 0) return "Just now";
    if (index < 3) return "A moment ago";
    if (index < 7) return "A few minutes ago";
    return "Recently";
}

export const AlphaStream = () => {
    const [logs, setLogs] = useState<BetLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const [allLogs, allEvents] = await Promise.all([
                blockchainService.getAllLogs(),
                blockchainService.getAllEvents()
            ]);
            
            const eventsMap = new Map<string, Event>(allEvents.map(e => [e.id, e]));

            const betLogs = allLogs.betPlaced
                .map((log, index) => {
                    const event = eventsMap.get(String(log.eventId));
                    if (!log.user || !event) return null;
                    
                    const amount = parseFloat(formatEther(log.amount)).toFixed(2);
                    return {
                        id: `${log.user}-${log.eventId}-${log.amount}-${index}`,
                        user: `${log.user.slice(0, 6)}...${log.user.slice(-4)}`,
                        action: `Staked ${amount} on "${event.question.substring(0, 15)}..."`,
                        color: log.outcome ? 'emerald' : 'rose',
                        time: getRelativeTime(index), // Use index for stable relative time
                    } as BetLog;
                })
                .filter((l): l is BetLog => l !== null)
                .reverse() // Show newest first
                .slice(0, 20); // Limit to recent 20

            setLogs(betLogs);
        } catch (err) {
            console.error("Failed to fetch logs for Alpha Stream", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        const intervalId = setInterval(fetchLogs, 15000); // Refresh every 15 seconds

        return () => clearInterval(intervalId);
    }, []);

    const handleClearLogs = () => {
        setLogs([]);
    }

    const duplicatedLogs = logs.length > 0 ? [...logs, ...logs] : [];

    return (
        <div className="h-full bg-card/60 dark:glass-panel rounded-[2rem] p-5 border flex flex-col max-h-[560px] lg:max-h-[640px]">
            <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                 <h2 className="text-xs font-mono font-bold uppercase text-muted-foreground flex items-center gap-2">
                    <Rss className="w-3 h-3" /> Alpha Stream
                </h2>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card/80 backdrop-blur-xl">
                        <DropdownMenuItem onClick={() => setIsPaused(!isPaused)}>
                           <PauseCircle className="w-4 h-4 mr-2"/>
                           {isPaused ? "Resume Stream" : "Pause Stream"}
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={handleClearLogs}>
                            <Trash2 className="w-4 h-4 mr-2"/>
                            Clear Log
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar relative group">
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-card to-transparent z-10 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none"></div>
                
                {loading && logs.length === 0 ? (
                    <div className="space-y-3 p-1">
                        {Array.from({length: 7}).map((_, i) => <Skeleton key={i} className="h-[58px] w-full rounded-xl"/>)}
                    </div>
                ) : logs.length > 0 ? (
                    <div className={cn(!isPaused && "group-hover:pause animate-scroll-vertical")}>
                        {duplicatedLogs.map((item, index) => (
                            <div key={`${item.id}-${index}`} className="p-3 mb-3 rounded-xl bg-secondary border border-border">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={cn("text-[10px] font-mono", {
                                        "text-primary": item.color === 'primary',
                                        "text-emerald-500": item.color === 'emerald',
                                        "text-rose-500": item.color === 'rose',
                                        "text-muted-foreground": item.color === 'zinc',
                                    })}>{item.user}</span>
                                    <span className="text-[10px] text-muted-foreground">{item.time}</span>
                                </div>
                                <p className="text-xs font-bold text-foreground mb-1 truncate">{item.action}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-center text-xs font-mono text-muted-foreground">
                        No on-chain activity detected.
                    </div>
                )}
            </div>
        </div>
    );
};
