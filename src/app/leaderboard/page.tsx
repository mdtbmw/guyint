
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Newspaper } from "lucide-react";
import { Leaderboard } from "@/components/leaderboard";
import { PageHeader } from "@/components/layout/page-header";


export default function LeaderboardPage() {

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Leaderboard"
        description="Users with the highest betting accuracy and earnings."
      />
       <Card>
        <CardHeader>
          <CardTitle>Top Predictors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Leaderboard />
        </CardContent>
      </Card>
    </div>
  );
}
