
'use server';
/**
 * @fileOverview An AI flow to generate a complete, structured event for the prediction market.
 *
 * - generateEvent - A function that takes a topic and returns a structured event object.
 * - GeneratedEvent - The output type for the flow.
 * - GenerateEventInput - The input type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import placeholderData from '@/lib/placeholder-images.json';

const availableCategories = placeholderData.categories.map(c => c.name);

const GenerateEventInputSchema = z.string().describe("A topic for a new prediction market event.");
export type GenerateEventInput = z.infer<typeof GenerateEventInputSchema>;

const GeneratedEventSchema = z.object({
  question: z.string().describe("A clear, verifiable, yes/no question about a future outcome. It must start with 'Will' or 'Is'."),
  description: z.string().describe("A brief, neutral, one-paragraph description of the event, providing context for bettors. It should also mention how the event's outcome will be verified (e.g., 'Outcome will be determined by official press releases.')."),
  category: z.enum(availableCategories as [string, ...string[]]).describe("The most relevant category for the event."),
});
export type GeneratedEvent = z.infer<typeof GeneratedEventSchema>;

export async function generateEvent(topic: GenerateEventInput): Promise<GeneratedEvent> {
  return generateEventFlow(topic);
}

const prompt = ai.definePrompt({
  name: 'generateEventPrompt',
  input: {schema: GenerateEventInputSchema},
  output: {schema: GeneratedEventSchema},
  prompt: `You are an expert in creating engaging and clear yes/no questions for a prediction market platform.
The current year is 2025. All events you create must be about verifiable, future outcomes relative to this date. Do not create events about things that happened in 2024, 2023, or any past year.
Your response MUST be a valid JSON object that strictly adheres to the provided schema.

Given the following topic, generate a complete event object. The event details must be:
1.  **Question**: A simple, unambiguous "Will..." or "Is..." question with a clear, verifiable outcome in the future.
2.  **Description**: A neutral, one-paragraph summary explaining the event's context, importance, and specifying the source of truth for its resolution.
3.  **Category**: The *exact* name of the most fitting category from the provided list.

Topic: {{{this}}}
`,
});

const generateEventFlow = ai.defineFlow(
  {
    name: 'generateEventFlow',
    inputSchema: GenerateEventInputSchema,
    outputSchema: GeneratedEventSchema,
  },
  async (input) => {
    try {
        const {output} = await prompt(input);
        if (!output) {
            throw new Error("AI failed to generate a valid event object.");
        }
        return output;
    } catch (e) {
        console.error("AI event generation failed.", e);
        // Re-throw the error to be handled by the calling UI component
        throw new Error("The AI failed to generate a valid event. Please try a different topic.");
    }
  }
);
