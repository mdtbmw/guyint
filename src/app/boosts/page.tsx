
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Zap, ShieldCheck, Percent, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/page-header";
import { useState } from "react";

const initialBoosts = [
    {
        id: "odds_boost_10",
        icon: <Zap className="w-6 h-6 text-yellow-400" />,
        title: "10% Odds Boost",
        description: "Get a 10% enhancement on your potential winnings for any bet placed in the next hour.",
        category: "General",
    },
    {
        id: "first_bet_insurance",
        icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
        title: "First Bet Insurance",
        description: "Place your next bet with confidence. If you lose, we'll refund your stake up to 25 $TRUST.",
        category: "Risk-Free",
    },
    {
        id: "esports_rebate_5",
        icon: <Percent className="w-6 h-6 text-indigo-400" />,
        title: "eSports Stake Rebate",
        description: "Receive 5% of your stake back on all bets placed on eSports events today, win or lose.",
        category: "eSports",
    },
     {
        id: "welcome_bonus_10",
        icon: <Gift className="w-6 h-6 text-rose-400" />,
        title: "Welcome Bonus",
        description: "Your first bet is on us! Get a free 10 $TRUST stake to place on any event.",
        category: "New User",
    }
]

export default function BoostsPage() {
    const { toast } = useToast();
    const [activatedBoosts, setActivatedBoosts] = useState<string[]>([]);

    const handleActivate = (boostId: string, title: string) => {
        if(activatedBoosts.includes(boostId)) {
             toast({
                title: "Already Active",
                description: `The "${title}" boost is already active on your account.`,
            });
            return;
        }
        
        setActivatedBoosts(prev => [...prev, boostId]);
        
        toast({
            title: "Boost Activated!",
            description: `The "${title}" boost is now available for your next bet.`,
        });
    }

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Betting Boosts"
                description="Enhance your odds and maximize your winnings with special offers."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {initialBoosts.map((boost, index) => {
                    const isActive = activatedBoosts.includes(boost.id);
                    return (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
                                    {boost.icon}
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-base">{boost.title}</CardTitle>
                                    <CardDescription>{boost.description}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardFooter className="p-4 pt-0">
                                <Button className="w-full" onClick={() => handleActivate(boost.id, boost.title)} disabled={isActive}>
                                    {isActive ? "Activated" : "Activate Boost"}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    )
}
