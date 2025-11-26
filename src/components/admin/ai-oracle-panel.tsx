
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, Cpu, Loader2, Sparkles, Wand2, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { generateEvent, type GeneratedEvent } from '@/ai/flows/generate-event-flow';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import { blockchainService } from '@/services/blockchain';
import { useNotifications } from '@/lib/state/notifications';
import { useSetAtom, useAtom } from 'jotai';
import { generatedEventAtom, scoutedTopicAtom } from '@/lib/state/admin';
import { DynamicIcon } from '@/lib/icons';
import placeholderData from '@/lib/placeholder-images.json';
import { keccak256, parseEther, toBytes, encodePacked } from 'viem';
import { useRouter } from 'next/navigation';
import { resolveEventOutcome } from '@/ai/flows/resolve-event-flow';
import { Event, BetOutcome } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '../ui/separator';

interface AiOraclePanelProps {
  onActionSuccess: () => void;
  events: Event[] | null;
}

export function AiOraclePanel({ onActionSuccess, events }: AiOraclePanelProps) {
  const { toast } = useToast();
  const { walletClient, address } = useWallet();
  const { addNotification } = useNotifications();
  const router = useRouter();
  
  const [topic, setTopic] = useState('');
  const [scoutedTopic, setScoutedTopic] = useAtom(scoutedTopicAtom);
  const [generatedEvent, setGeneratedEvent] = useAtom(generatedEventAtom);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // State for AI Resolution
  const [selectedEventToResolve, setSelectedEventToResolve] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const categories = placeholderData.categories;
  const resolvableEvents = events?.filter(e => e.status === 'open' || e.status === 'closed') || [];


  // If a scouted topic was passed from another tab, use it.
  useEffect(() => {
    if (scoutedTopic) {
        setTopic(scoutedTopic);
        setScoutedTopic(null); // Clear it after use
    }
  }, [scoutedTopic, setScoutedTopic]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
        toast({ variant: 'destructive', title: 'Topic is empty' });
        return;
    }
    setIsGenerating(true);
    setGeneratedEvent(null);
    try {
        const event = await generateEvent(topic);
        setGeneratedEvent(event);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'AI Generation Failed', description: error.message });
    } finally {
        setIsGenerating(false);
    }
  }, [topic, toast, setGeneratedEvent]);

  const handleUseGeneratedEvent = useCallback(() => {
    if (!generatedEvent) {
      toast({ variant: 'destructive', title: 'No event generated' });
      return;
    }
    // The generatedEvent is already in Jotai state (via atomWithStorage).
    // Just need to navigate the user.
    router.push('/create-event');
  }, [generatedEvent, router, toast]);


  const handleResolveWithAI = useCallback(async () => {
    if (!selectedEventToResolve) {
        addNotification({ title: 'No Event Selected', description: 'Please select an event to resolve.', icon: 'Info', variant: 'destructive', type: 'general'});
        return;
    }
    if (!walletClient || !address) {
        addNotification({ title: 'Wallet not connected', description: 'Please connect your wallet.', icon: 'AlertTriangle', variant: 'destructive', type: 'general'});
        return;
    }

    const event = events?.find(e => e.id === selectedEventToResolve);
    if (!event) return;

    setIsResolving(true);
    addNotification({ title: 'AI Oracle is working...', description: 'Determining real-world outcome.', icon: 'Loader2', type: 'general' });

    try {
        const outcome = await resolveEventOutcome(event.question);
        addNotification({ title: 'AI Resolution Complete', description: `The outcome is ${outcome}. Submitting to blockchain...`, icon: 'CheckCircle', type: 'general' });
        
        const txHash = await blockchainService.resolveEvent(walletClient, address, BigInt(event.id), outcome === 'YES');
        addNotification({
            title: "Transaction Submitted",
            description: `Resolving event... Tx: ${txHash.slice(0, 10)}...`,
            icon: 'Loader2',
            type: 'onEventResolved'
        });
        await blockchainService.waitForTransaction(txHash);
        addNotification({
            title: 'Event Resolved!',
            description: `Event "${event.question.slice(0, 20)}..." has been resolved as ${outcome}.`,
            icon: 'CheckCircle',
            variant: 'success',
            type: 'onEventResolved'
        });
        
        onActionSuccess();
        setSelectedEventToResolve(null);

    } catch(e: any) {
        console.error(e);
        addNotification({
            variant: 'destructive',
            title: 'AI Resolution Failed',
            description: e.message || 'An unexpected error occurred.',
            icon: 'AlertTriangle',
            type: 'general'
        });
    } finally {
        setIsResolving(false);
    }
  }, [selectedEventToResolve, walletClient, address, addNotification, events, onActionSuccess]);

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-primary" />
                    AI-Assisted Event Creation
                </CardTitle>
                <CardDescription>
                    Use AI to generate event details, then review and publish on the manual creation form.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    placeholder="Enter a topic for the AI to transform into a verifiable event (e.g., 'Release of new AI model by Google')..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                />
                <Button onClick={handleGenerate} disabled={isGenerating || !topic.trim()} className="w-full">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'Generating Event...' : 'Generate Event with AI'}
                </Button>

                {isGenerating && (
                    <div className="text-center text-muted-foreground py-4 space-y-2">
                        <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                        <p>AI is crafting event details... please wait.</p>
                    </div>
                )}
                
                {generatedEvent && (
                    <Card className="bg-secondary">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">AI Generated Event</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <DynamicIcon name={categories.find(c => c.name === generatedEvent.category)?.icon || 'HelpCircle'} className="w-4 h-4"/>
                                    {generatedEvent.category}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="font-semibold text-foreground">{generatedEvent.question}</p>
                                <p className="text-sm text-muted-foreground mt-1">{generatedEvent.description}</p>
                            </div>
                            <Button onClick={handleUseGeneratedEvent} className="w-full" disabled={!walletClient}>
                                Review & Publish
                                <ArrowRight className="mr-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-primary" />
                    Automated Event Resolution
                </CardTitle>
                <CardDescription>
                    Select an active event and let the AI Oracle determine the real-world outcome and resolve it on-chain.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Select onValueChange={setSelectedEventToResolve} value={selectedEventToResolve || ''} disabled={resolvableEvents.length === 0}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={resolvableEvents.length > 0 ? "Select an event to resolve..." : "No resolvable events found"} />
                    </SelectTrigger>
                    <SelectContent>
                        {resolvableEvents.map(event => (
                            <SelectItem key={event.id} value={event.id}>
                                {event.question}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Button onClick={handleResolveWithAI} className="w-full" disabled={isResolving || !selectedEventToResolve}>
                    {isResolving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    {isResolving ? 'Resolving...' : 'Resolve with AI Oracle'}
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
