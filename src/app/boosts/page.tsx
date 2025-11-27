
'use client';
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function BoostsPage() {
  useAuthGuard();

  return (
    <div className="animate-slide-up">
      <div className="hidden md:block">
        <PageHeader
          title="Betting Boosts"
          description="Enhance your odds and maximize your winnings with special offers."
        />
      </div>
      <Card className="glass-panel">
        <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>This page is under construction.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
            <Construction className="w-16 h-16 mb-4"/>
            <p>The Betting Boosts system is being developed and will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}