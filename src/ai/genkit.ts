
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'zod';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

// The following is an example flow that is not used in the application.
// It is here to demonstrate the correct structure of a Genkit flow.
// This was likely the source of the "handler is not a function" error.
ai.defineFlow(
  {
    name: 'exampleFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input) => {
    return `This is an example flow. You said: ${input}`;
  }
);
