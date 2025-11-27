
'use server';
/**
 * @fileOverview An AI flow to resolve the outcome of a prediction market event.
 *
 * - resolveEventOutcome - A function that takes an event question and determines its real-world outcome.
 * - ResolveEventInput - The input type for the flow.
 * - ResolveEventOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ResolveEventInputSchema = z.string().describe("A yes/no question from a prediction market event that has concluded.");
export type ResolveEventInput = z.infer<typeof ResolveEventInputSchema>;

const ResolveEventOutputSchema = z.enum(["YES", "NO"]).describe("The definitive, real-world outcome of the event question.");
export type ResolveEventOutput = z.infer<typeof ResolveEventOutputSchema>;

export async function resolveEventOutcome(question: ResolveEventInput): Promise<ResolveEventOutput> {
  return resolveEventOutcomeFlow(question);
}

const prompt = ai.definePrompt({
  name: 'resolveEventPrompt',
  input: {schema: ResolveEventInputSchema},
  output: {schema: ResolveEventOutputSchema},
  model: 'googleai/gemini-2.5-flash', // Explicitly define the model
  prompt: `You are a trusted, impartial oracle for a prediction market. Your sole purpose is to determine the factual outcome of a real-world event.
The event is defined by a yes/no question.
Based on your knowledge of real-world events up to the present moment, you must determine the definitive answer to the following question.

Your answer must be either "YES" or "NO", with no additional explanation.

Event Question: {{{this}}}
`,
});

const resolveEventOutcomeFlow = ai.defineFlow(
  {
    name: 'resolveEventOutcomeFlow',
    inputSchema: ResolveEventInputSchema,
    outputSchema: ResolveEventOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error("The AI Oracle could not determine a definitive outcome for this event.");
        }
        return output;
    } catch (e: any) {
        console.error("AI event resolution flow failed:", e);
        throw new Error("The AI Oracle encountered an error and could not resolve the event.");
    }
  }
);
