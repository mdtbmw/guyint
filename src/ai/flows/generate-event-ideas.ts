
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateEventIdeasInputSchema = z.string();
export type GenerateEventIdeasInput = z.infer<typeof GenerateEventIdeasInputSchema>;

const GenerateEventIdeasOutputSchema = z.array(z.string());
export type GenerateEventIdeasOutput = z.infer<typeof GenerateEventIdeasOutputSchema>;


export async function generateEventIdeas(topic: GenerateEventIdeasInput): Promise<GenerateEventIdeasOutput> {
  return generateEventIdeasFlow(topic);
}

const prompt = ai.definePrompt({
  name: 'generateEventIdeasPrompt',
  input: {schema: GenerateEventIdeasInputSchema},
  output: {schema: GenerateEventIdeasOutputSchema},
  prompt: `You are an expert in creating engaging and clear yes/no questions for a betting platform.
Given the following topic, generate 5 potential event questions.
The questions should be unambiguous and have a clear, verifiable outcome.
The questions should be phrased as a "Will..." or "Is..." question.

Topic: {{{input}}}
`,
});

const generateEventIdeasFlow = ai.defineFlow(
  {
    name: 'generateEventIdeasFlow',
    inputSchema: GenerateEventIdeasInputSchema,
    outputSchema: GenerateEventIdeasOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || [];
  }
);
