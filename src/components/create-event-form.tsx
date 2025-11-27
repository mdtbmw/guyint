
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
import { CalendarIcon, Loader2 } from 'lucide-react';
import { blockchainService } from '@/services/blockchain';
import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const createEventFormSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters.')
    .max(200, 'Question must not be longer than 200 characters.'),
  category: z.string({
    required_error: "Please select a category.",
  }),
  endDate: z.date({
    required_error: "An end date is required.",
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
  const { connected, walletClient, address } = useWallet();
  const router = useRouter();

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
    if (!connected || !walletClient || !address) {
      toast({
        variant: 'destructive',
        title: 'Prerequisites not met',
        description: 'Please connect your wallet.',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const txHash = await blockchainService.createEvent(walletClient, address, data.question, data.endDate, data.category, data.minStake, data.maxStake);
      toast({
        title: 'Transaction Submitted',
        description: `Creating Intuition Atom... (Tx: ${txHash.slice(0,10)}...)`,
      });
      
      await blockchainService.waitForTransaction(txHash);
      
      toast({
        title: 'Event Atom Created Successfully',
        description: `The event "${data.question}" is now live. It will appear in the UI shortly.`,
      });
      form.reset({ question: '', minStake: 0.1, maxStake: 10, category: undefined });
      router.push('/');
    } catch (error: any)
{
      console.error(error);
      const errorMessage = error.shortMessage || "An unexpected error occurred. Check the console for details.";
      toast({
        variant: 'destructive',
        title: 'Failed to Create Event Atom',
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
              <FormLabel>Event Question (Atom)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Will BTC surpass $100,000 by the end of the year?"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This question will be stored as an immutable "atom" on the Intuition network.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                {categoriesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={categories.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={categories.length > 0 ? "Select an event category" : "No categories available"} />
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
                  Categorizing events helps users find topics.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the event outcome will be known.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
          {isLoading ? 'Submitting Transaction...' : 'Create Event Atom'}
        </Button>
      </form>
    </Form>
  );
}
