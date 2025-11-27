
'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, ChevronDown, Cpu, Sparkles, Database, LayoutGrid } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

interface AdminNavProps {
    activeTab: string;
    onTabChange: (value: string) => void;
}

const TABS = [
  { value: "events", label: "Signal Management", icon: LayoutGrid },
  { value: "ai_oracle", label: "AI Oracle", icon: Cpu },
  { value: "scout", label: "AI Scout", icon: Sparkles },
  { value: "automation", label: "Automation", icon: Bot },
  { value: "categories", label: "Categories", icon: LayoutGrid },
  { value: "data", label: "User Data", icon: Database },
];

export function AdminNav({ activeTab, onTabChange }: AdminNavProps) {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return <div className="h-10 w-full bg-card rounded-lg" />;
  }

  if (isMobile) {
    const activeTabInfo = TABS.find(t => t.value === activeTab);
    const activeLabel = activeTabInfo?.label || "Menu";
    const ActiveIcon = activeTabInfo?.icon || LayoutGrid;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                        <ActiveIcon className="w-4 h-4" />
                        {activeLabel}
                    </span>
                    <ChevronDown className="w-4 h-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                {TABS.map(tab => (
                    <DropdownMenuItem
                        key={tab.value}
                        onSelect={() => onTabChange(tab.value)}
                        className="gap-2"
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }

  return (
    <div className="overflow-x-auto no-scrollbar">
        <TabsList className="bg-card border h-auto p-1.5">
            {TABS.map(tab => (
                <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className={cn(
                        "flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2.5 rounded-lg text-sm",
                        "whitespace-nowrap"
                    )}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </TabsTrigger>
            ))}
        </TabsList>
    </div>
  );
}
