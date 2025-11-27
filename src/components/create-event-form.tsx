
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { blockchainService } from '@/services/blockchain';
import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const createEventFormSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters.')
    .max(200, 'Question must not be longer than 200 characters.'),
  category: z.string({
    required_error: "Please select a category.",
  }),
  minStake: z.coerce.number().positive('Minimum stake must be a positive number.'),
  maxStake: z.coerce.number().positive('Maximum stake must be a positive number.'),
}).refine(data => data.maxStake > data.minStake, {
    message: "Maximum stake must be greater than minimum stake.",
    path: ["maxStake"],
});


type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

interface CreateEventFormProps {
  initialQuestion?: string;
  categories: Category[];
  categoriesLoading: boolean;
}

export function CreateEventForm({ initialQuestion = '', categories, categoriesLoading }: CreateEventFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { connected } = useWallet();
  const router = useRouter();
  const firestore = useFirestore();

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      question: initialQuestion,
      minStake: 0.1,
      maxStake: 10,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (initialQuestion) {
        form.reset({ ...form.getValues(), question: initialQuestion });
    }
  }, [initialQuestion, form]);


  async function onSubmit(data: CreateEventFormValues) {
    if (!connected || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Prerequisites not met',
        description: 'Please connect your wallet and ensure Firestore is available.',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const txHash = await blockchainService.createEvent(data.question, data.minStake, data.maxStake);
      toast({
        title: 'Transaction Submitted to Mainnet',
        description: `Waiting for confirmation... (Tx: ${txHash.slice(0,10)}...)`,
      });
      
      const receipt = await blockchainService.waitForTransaction(txHash);

      // Extract eventId from logs
      // This part is complex and depends on the exact event signature
      // For now, we assume we can't get the event ID directly and will rely on backend listeners.
      
      // We will optimistically write to Firestore, a backend process would ideally do this
      // by listening to blockchain events to ensure data consistency.
      const eventRef = collection(firestore, 'events');
      // A backend would derive the ID from the event log, but we'll let Firestore auto-generate.
      await addDoc(eventRef, {
        question: data.question,
        category: data.category,
        minStake: data.minStake,
        maxStake: data.maxStake,
        status: 'open',
        outcomes: { yes: 0, no: 0 },
        totalPool: 0,
        participants: 0,
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
        createdAt: serverTimestamp()
      });


      toast({
        title: 'Event Created Successfully',
        description: `The event "${data.question}" is now live.`,
      });
      form.reset({ question: '', minStake: 0.1, maxStake: 10, category: undefined });
      router.refresh();
    } catch (error: any)
{
      console.error(error);
      const errorMessage = error.shortMessage || "An unexpected error occurred. Check the console for details.";
      toast({
        variant: 'destructive',
        title: 'Failed to Create Event',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Question</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Will BTC surpass $100,000 by the end of the year?"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The clear, unambiguous question users will bet on.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              {categoriesLoading ? (
                 <Skeleton className="h-10 w-full" />
              ) : (
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an event category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              )}
              <FormDescription>
                Categorizing events helps users find topics they're interested in.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="minStake"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Min Stake ($TRUST)</FormLabel>
                <FormControl>
                    <Input type="number" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="maxStake"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Max Stake ($TRUST)</FormLabel>
                <FormControl>
                    <Input type="number" step="1" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
       
        <Button type="submit" className="w-full" disabled={isLoading || !connected}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Submitting to Blockchain...' : 'Create Event on Mainnet'}
        </Button>
      </form>
    </Form>
  );
}
