
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
import { DynamicIcon } from "@/lib/icons";

interface AdminNavProps {
    activeTab: string;
    onTabChange: (value: string) => void;
}

const TABS = [
  { value: "events", label: "Signal Management", icon: "LayoutGrid" },
  { value: "ai_oracle", label: "AI Oracle", icon: "Cpu" },
  { value: "scout", label: "AI Scout", icon: "Sparkles" },
  { value: "automation", label: "Automation", icon: "Bot" },
  { value: "categories", label: "Categories", icon: "LayoutGrid" },
  { value: "data", label: "User Data", icon: "Database" },
];

export function AdminNav({ activeTab, onTabChange }: AdminNavProps) {
  const isMobile = useIsMobile();

  const getIcon = (iconName: string) => {
    const IconComponent = (require('lucide-react') as any)[iconName] || require('lucide-react')['HelpCircle'];
    return <IconComponent className="w-4 h-4" />;
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
                        {getIcon(tab.icon)}
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
                    {getIcon(tab.icon)}
                    {tab.label}
                </TabsTrigger>
            ))}
        </TabsList>
    </div>
  );
}
