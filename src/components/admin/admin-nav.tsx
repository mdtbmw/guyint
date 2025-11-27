
'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, ChevronDown, Cpu, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button";

interface AdminNavProps {
    activeTab: string;
    onTabChange: (value: string) => void;
}

const TABS = [
  { value: "events", label: "Event Management" },
  { value: "ai_oracle", label: "AI Oracle", icon: <Cpu className="w-4 h-4" /> },
  { value: "scout", label: "AI Scout", icon: <Sparkles className="w-4 h-4" /> },
  { value: "automation", label: "Automation", icon: <Bot className="w-4 h-4" /> },
  { value: "categories", label: "Categories" },
];

export function AdminNav({ activeTab, onTabChange }: AdminNavProps) {
  const isMobile = useIsMobile();

  if (isMobile === undefined) {
    return <div className="h-10 w-full" />;
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
                    >
                        {tab.icon && <span className="mr-2">{tab.icon}</span>}
                        {tab.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
  }

  return (
    <TabsList className="grid w-full grid-cols-5 bg-card border">
        {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background">
                {tab.icon}
                {tab.label}
            </TabsTrigger>
        ))}
    </TabsList>
  );
}
