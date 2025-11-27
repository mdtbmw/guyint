
'use server';
/**
 * @fileOverview An AI flow to make event search more intelligent.
 *
 * - expandSearchQuery - A function that takes a user's search query and returns a list of related search terms.
 * - ExpandSearchQueryInput - The input type for the flow.
 * - ExpandSearchQueryOutput - The output type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExpandSearchQueryInputSchema = z.string().describe("A user's search query for finding prediction market events.");
export type ExpandSearchQueryInput = z.infer<typeof ExpandSearchQueryInputSchema>;

const ExpandSearchQueryOutputSchema = z.array(z.string()).describe("A list of expanded and related search terms, including the original query.");
export type ExpandSearchQueryOutput = z.infer<typeof ExpandSearchQueryOutputSchema>;

export async function expandSearchQuery(query: ExpandSearchQueryInput): Promise<ExpandSearchQueryOutput> {
  // Return early if the query is very short to avoid noisy results.
  if (query.trim().length < 3) {
    return [query];
  }
  return expandSearchQueryFlow(query);
}

const prompt = ai.definePrompt({
  name: 'expandSearchQueryPrompt',
  input: {schema: ExpandSearchQueryInputSchema},
  output: {schema: ExpandSearchQueryOutputSchema},
  prompt: `You are a search expert for a prediction market platform. Your goal is to expand a user's search query to find the most relevant events.
Given the user's query, generate a list of 3-5 related keywords, concepts, or synonyms that would help find matching event questions.
The event questions are typically about future outcomes in topics like crypto, sports, politics, and technology.
The output should be a JSON array of strings. The first string in the array MUST be the original, unmodified user query.

User Query: {{{this}}}
`,
});

const expandSearchQueryFlow = ai.defineFlow(
  {
    name: 'expandSearchQueryFlow',
    inputSchema: ExpandSearchQueryInputSchema,
    outputSchema: ExpandSearchQueryOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await prompt(input);
        
        if (!output) {
            return [input];
        }
        
        // Ensure the original query is always first, even if the model forgets.
        if (!output.includes(input)) {
            return [input, ...output];
        }
        return output;
    } catch (e) {
        console.error("AI search expansion failed. Falling back to original query.", e);
        // If the AI fails, we must still return the original query.
        return [input];
    }
  }
);
