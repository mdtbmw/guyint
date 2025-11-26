
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
import { CalendarIcon, Loader2, PartyPopper, RefreshCw, Clock, CalendarDays, Coins, Link as LinkIcon } from 'lucide-react';
import { blockchainService } from '@/services/blockchain';
import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { useRouter } from 'next/navigation';
import type { Category } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, setHours, setMinutes, getHours, getMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/lib/state/notifications';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import type { GeneratedEvent } from '@/ai/flows/generate-event-flow';

const createEventFormSchema = z.object({
  question: z
    .string()
    .min(10, 'Question must be at least 10 characters.')
    .max(200, 'Question must not be longer than 200 characters.'),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(500, "Description must be less than 500 characters."),
  category: z.string({
    required_error: "Please select a category.",
  }),
  imageUrl: z.string().url().optional().or(z.literal('')),
  bettingStopDate: z.date({
    required_error: "A betting stop date is required.",
  }),
  resolutionDate: z.date({
    required_error: "A resolution date is required.",
  }),
  minStake: z.coerce.number().positive('Minimum stake must be a positive number.'),
  maxStake: z.coerce.number().positive('Maximum stake must be a positive number.'),
}).refine(data => data.maxStake > data.minStake, {
    message: "Maximum stake must be greater than minimum stake.",
    path: ["maxStake"],
}).refine(data => data.resolutionDate > data.bettingStopDate, {
    message: "Resolution date must be after the betting stop date.",
    path: ["resolutionDate"],
});


type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

interface CreateEventFormProps {
  categories: Category[];
  onSuccess: (eventId: string) => void;
  isSuccess: boolean;
  lastEventId: string | null;
  onReset: () => void;
  prefillData?: GeneratedEvent | null;
}

export function CreateEventForm({ categories, onSuccess, isSuccess, lastEventId, onReset, prefillData }: CreateEventFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { walletClient, address } = useWallet();
  const router = useRouter();
  const { addNotification } = useNotifications();

  const form = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      question: '',
      description: '',
      category: undefined,
      imageUrl: '',
      bettingStopDate: undefined,
      resolutionDate: undefined,
      minStake: 0.001,
      maxStake: 0.1,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (prefillData) {
      form.reset({
        ...form.getValues(), // keep existing values like dates/stakes if user navigated back
        question: prefillData.question,
        description: prefillData.description,
        category: prefillData.category,
      });
    }
  }, [prefillData, form]);

  async function onSubmit(data: CreateEventFormValues) {
    if (!walletClient || !address) {
      addNotification({
        title: 'Wallet not connected',
        description: 'Please connect your wallet.',
        icon: 'AlertTriangle',
        variant: 'destructive',
        type: 'general'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { eventId } = await blockchainService.createEvent(
          walletClient, 
          address, 
          data.question, 
          data.description,
          data.category,
          data.bettingStopDate, 
          data.resolutionDate,
          data.minStake, 
          data.maxStake,
          data.imageUrl
        );

      onSuccess(eventId); // This sets the state in the parent component
      form.reset();

    } catch (error: any) {
      // The service now handles notifications, but we can log here if needed
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
        <div className="text-center py-8 space-y-4">
            <PartyPopper className="w-16 h-16 text-primary mx-auto" />
            <h3 className="text-2xl font-bold">Signal Created!</h3>
            <p className="text-muted-foreground">Your new prediction market is live on the blockchain.</p>
            <div className="flex gap-2 justify-center pt-4">
                <Button variant="outline" onClick={onReset} className="active-press">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Create Another Signal
                </Button>
                {lastEventId && (
                    <Button onClick={() => router.push(`/event/${lastEventId}`)} className="active-press">
                        View Your New Signal
                    </Button>
                )}
            </div>
        </div>
    )
  }


  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-8">
               <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Signal Question</FormLabel>
                    </div>
                    <FormControl>
                      <Input
                        className="input-glow"
                        placeholder="e.g., Will BTC surpass $100,000 by the end of the year?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                     <div className="flex items-center gap-2">
                        <FormLabel>Signal Description</FormLabel>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Provide context, rules, and the source of truth for resolving this event..."
                        className="min-h-[120px] input-glow"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Category</FormLabel>
                      </div>
                      {categories.length === 0 ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={categories.length === 0}>
                        <FormControl>
                          <SelectTrigger className="input-glow">
                            <SelectValue placeholder={categories.length > 0 ? "Select a signal category" : "No categories available"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                    <FormItem>
                        <div className="flex items-center gap-2">
                            <FormLabel>Custom Image URL</FormLabel>
                        </div>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <FormControl>
                                <Input
                                    placeholder="https://images.unsplash.com/... (optional, a relevant image will be used if blank)"
                                    {...field}
                                    className="pl-9 input-glow"
                                />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

             {/* Right Column */}
             <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-secondary/50">
                      <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4 text-primary"/> Signal Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                          <FormField
                              control={form.control}
                              name="bettingStopDate"
                              render={({ field }) => (
                              <FormItem>
                                  <div className="flex items-center gap-2">
                                    <FormLabel className="text-sm">Betting Locks</FormLabel>
                                  </div>
                                  <Popover>
                                  <PopoverTrigger asChild>
                                      <FormControl>
                                      <Button
                                          variant={"outline"}
                                          className={cn(
                                          "w-full pl-3 text-left font-normal h-10 justify-start input-glow",
                                          !field.value && "text-muted-foreground"
                                          )}
                                      >
                                          <Clock className="mr-2 h-4 w-4 opacity-50" />
                                          {field.value ? (
                                          format(field.value, "PPp")
                                          ) : (
                                          <span>Pick date & time</span>
                                          )}
                                      </Button>
                                      </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                      />
                                      <div className="p-2 border-t flex gap-2">
                                          <Input 
                                              type="number"
                                              placeholder="HH"
                                              className="w-16 bg-input"
                                              value={field.value ? getHours(field.value) : ''}
                                              onChange={(e) => field.onChange(setHours(field.value || new Date(), parseInt(e.target.value) || 0))}
                                          />
                                          <Input
                                              type="number"
                                              placeholder="MM"
                                              className="w-16 bg-input"
                                              value={field.value ? getMinutes(field.value) : ''}
                                              onChange={(e) => field.onChange(setMinutes(field.value || new Date(), parseInt(e.target.value) || 0))}
                                          />
                                      </div>
                                  </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                              </FormItem>
                              )}
                          />
                           <FormField
                              control={form.control}
                              name="resolutionDate"
                              render={({ field }) => (
                              <FormItem>
                                  <div className="flex items-center gap-2">
                                    <FormLabel className="text-sm">Final Resolution</FormLabel>
                                  </div>
                                  <Popover>
                                  <PopoverTrigger asChild>
                                      <FormControl>
                                      <Button
                                          variant={"outline"}
                                          className={cn(
                                          "w-full pl-3 text-left font-normal h-10 justify-start input-glow",
                                          !field.value && "text-muted-foreground"
                                          )}
                                      >
                                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                          {field.value ? (
                                          format(field.value, "PPp")
                                          ) : (
                                          <span>Pick date & time</span>
                                          )}
                                      </Button>
                                      </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                      />
                                      <div className="p-2 border-t flex gap-2">
                                          <Input 
                                              type="number"
                                              placeholder="HH"
                                              className="w-16 bg-input"
                                              value={field.value ? getHours(field.value) : ''}
                                              onChange={(e) => field.onChange(setHours(field.value || new Date(), parseInt(e.target.value) || 0))}
                                          />
                                          <Input
                                              type="number"
                                              placeholder="MM"
                                              className="w-16 bg-input"
                                              value={field.value ? getMinutes(field.value) : ''}
                                              onChange={(e) => field.onChange(setMinutes(field.value || new Date(), parseInt(e.target.value) || 0))}
                                          />
                                      </div>
                                  </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                              </FormItem>
                              )}
                          />
                      </CardContent>
                  </Card>

                   <Card className="bg-secondary/50">
                      <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2"><Coins className="w-4 h-4 text-primary"/> Market Rules</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                           <FormField
                              control={form.control}
                              name="minStake"
                              render={({ field }) => (
                                  <FormItem>
                                    <div className="flex items-center gap-2">
                                        <FormLabel>Min Stake</FormLabel>
                                    </div>
                                    <FormControl>
                                      <Input type="number" step="0.001" {...field} className="input-glow"/>
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
                                    <div className="flex items-center gap-2">
                                        <FormLabel>Max Stake</FormLabel>
                                    </div>
                                    <FormControl>
                                      <Input type="number" step="0.01" {...field} className="input-glow"/>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                              )}
                          />
                      </CardContent>
                   </Card>
             </div>
          </div>
         
          <Button type="submit" size="lg" className="w-full active-press" disabled={isLoading || !walletClient}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Submitting Transaction...' : 'Create Signal on Blockchain'}
          </Button>
        </form>
    </Form>
  );
}
