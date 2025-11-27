
'use server';
/**
 * @fileOverview An AI flow to scout for new, verifiable event topics from the internet.
 *
 * - scoutEventTopics - A function that takes a category and returns a list of potential event topics.
 * - ScoutEventTopicsInput - The input type for the flow.
 * - ScoutEventTopicsOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ScoutEventTopicsInputSchema = z.string().describe("A category for which to find new prediction market topics (e.g., 'Crypto', 'Sports').");
export type ScoutEventTopicsInput = z.infer<typeof ScoutEventTopicsInputSchema>;

const ScoutEventTopicsOutputSchema = z.array(z.string()).describe("A list of 3-5 specific, verifiable, and timely event topics.");
export type ScoutEventTopicsOutput = z.infer<typeof ScoutEventTopicsOutputSchema>;

export async function scoutEventTopics(category: ScoutEventTopicsInput): Promise<ScoutEventTopicsOutput> {
  return scoutEventTopicsFlow(category);
}

const prompt = ai.definePrompt({
  name: 'scoutEventTopicsPrompt',
  input: {schema: ScoutEventTopicsInputSchema},
  output: {schema: ScoutEventTopicsOutputSchema},
  prompt: `You are an expert "Event Scout" for a decentralized prediction market.
Your mission is to brainstorm timely and interesting event topics based on a given category.

Rules:
1.  Generate a list of 3-5 distinct topics.
2.  Each topic must be a concise phrase about a specific future event.
3.  The outcome of the event must be publicly verifiable.
4.  Do not create the full event question, only the topic phrase.

Examples for "Sports":
- "The winner of the next Super Bowl"
- "Whether LeBron James will score over 30 points in his next game"

Category: {{{this}}}
`,
});

const scoutEventTopicsFlow = ai.defineFlow(
  {
    name: 'scoutEventTopicsFlow',
    inputSchema: ScoutEventTopicsInputSchema,
    outputSchema: ScoutEventTopicsOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await prompt(input);
        if (!output || output.length === 0) {
            // This is a soft failure, we'll return an empty array and let the UI handle it.
            console.warn("AI returned no topics for category:", input);
            return [];
        }
        return output;
    } catch (e) {
        console.error("AI topic scouting flow failed:", e);
        // If the flow itself fails, we re-throw to be caught by the calling function.
        throw new Error("The AI Scout encountered a technical error. Please try again.");
    }
  }
);
