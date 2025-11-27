
'use client';

import { CreateEventForm } from '@/components/create-event-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAdmin } from '@/hooks/use-admin';
import { Bot, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { generateEventIdeas } from '@/ai/flows/generate-event-ideas';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/layout/page-header';
import { Separator } from '@/components/ui/separator';
import type { Category } from '@/lib/types';
import { mockCategories } from '@/lib/categories';
import { MobilePageHeader } from '@/components/layout/mobile-page-header';


export default function CreateEventPage() {
    const { isAdmin, loading } = useAdmin();
    const router = useRouter();
    const { toast } = useToast();

    const [aiTopic, setAiTopic] = useState('');
    const [aiIdeas, setAiIdeas] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedIdea, setSelectedIdea] = useState('');

    const [categories, setCategories] = useState<Category[]>(mockCategories);
    const [categoriesLoading, setCategoriesLoading] = useState(false);


    useEffect(() => {
      if (!loading && !isAdmin) {
        router.push('/');
      }
    }, [isAdmin, loading, router]);

    const handleAskAi = async () => {
        if (!aiTopic.trim()) {
            toast({
                variant: 'destructive',
                title: 'Topic is empty',
                description: 'Please enter a topic for the AI to generate ideas.',
            });
            return;
        }
        setIsGenerating(true);
        setAiIdeas([]);
        try {
            const ideas = await generateEventIdeas(aiTopic);
            setAiIdeas(ideas);
        } catch (error) {
            console.error("Failed to generate AI ideas:", error);
            toast({
                variant: 'destructive',
                title: 'AI Generation Failed',
                description: 'Could not generate ideas. Please try again.',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleIdeaClick = (idea: string) => {
      setSelectedIdea(idea);
    };

    if (loading || !isAdmin) {
      return <div className="text-center py-12">Checking permissions...</div>;
    }


  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <MobilePageHeader title="Create Event" />
      <div className="hidden md:block">
        <PageHeader 
            title="Create a New Betting Event"
            description="Define a new event for users to place their bets on."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Ensure all details are accurate before submitting to the mainnet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateEventForm 
            key={selectedIdea} 
            initialQuestion={selectedIdea} 
            categories={categories ?? []}
            categoriesLoading={categoriesLoading}
          />
        </CardContent>
        
        <Separator />

        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-primary" />
                Need Inspiration?
            </CardTitle>
            <CardDescription>
                Ask our AI to generate some event ideas for you based on a topic.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Textarea 
                placeholder="e.g., Upcoming elections, new hardware releases, Web3 developments..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
            />
            <Button onClick={handleAskAi} disabled={isGenerating} className="w-full">
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? 'Generating...' : 'Ask AI for Ideas'}
            </Button>

            {isGenerating && (
                 <div className="text-center text-muted-foreground">
                    <p>AI is thinking... please wait.</p>
                </div>
            )}
            
            {aiIdeas.length > 0 && (
                <Alert>
                    <AlertTitle>Generated Ideas</AlertTitle>
                    <AlertDescription>
                        Click on an idea to use it in the form above.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                {aiIdeas.map((idea, index) => (
                    <div 
                        key={index}
                        onClick={() => handleIdeaClick(idea)}
                        className="p-3 border rounded-md hover:bg-muted cursor-pointer transition-colors"
                    >
                       <p className="font-medium">{idea}</p>
                    </div>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
