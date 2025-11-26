
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
  { value: "events", label: "Signal Management" },
  { value: "ai_oracle", label: "AI Oracle" },
  { value: "scout", label: "AI Scout" },
  { value: "automation", label: "Automation" },
  { value: "categories", label: "Categories" },
  { value: "data", label: "User Data" },
];

export function AdminNav({ activeTab, onTabChange }: AdminNavProps) {
  const isMobile = useIsMobile();

  const getIcon = (value: string) => {
    switch (value) {
      case "events": return <LayoutGrid className="w-4 h-4" />;
      case "ai_oracle": return <Cpu className="w-4 h-4" />;
      case "scout": return <Sparkles className="w-4 h-4" />;
      case "automation": return <Bot className="w-4 h-4" />;
      case "data": return <Database className="w-4 h-4" />;
      default: return null;
    }
  }

  if (isMobile === undefined) {
    return <div className="h-10 w-full bg-card rounded-lg" />;
  }

  if (isMobile) {
    const activeLabel = TABS.find(t => t.value === activeTab)?.label || "Menu";
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                    {activeLabel}
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
                        {getIcon(tab.value)}
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
                    {getIcon(tab.value)}
                    {tab.label}
                </TabsTrigger>
            ))}
        </TabsList>
    </div>
  );
}
