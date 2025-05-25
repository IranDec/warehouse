// src/ai/flows/explain-product-status.ts
'use server';
/**
 * @fileOverview Explains the status of a product in a human-readable way.
 *
 * - explainProductStatus - A function that handles the product status explanation process.
 * - ExplainProductStatusInput - The input type for the explainProductStatus function.
 * - ExplainProductStatusOutput - The return type for the explainProductStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainProductStatusInputSchema = z.object({
  status: z
    .string()
    .describe('The status of the product (e.g., Available, Low Stock, Out of Stock, Damaged).'),
  description: z.string().optional().describe('A description of the product.'),
});
export type ExplainProductStatusInput = z.infer<typeof ExplainProductStatusInputSchema>;

const ExplainProductStatusOutputSchema = z.object({
  explanation: z.string().describe('A human-readable explanation of the product status.'),
});
export type ExplainProductStatusOutput = z.infer<typeof ExplainProductStatusOutputSchema>;

export async function explainProductStatus(input: ExplainProductStatusInput): Promise<ExplainProductStatusOutput> {
  return explainProductStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainProductStatusPrompt',
  input: {schema: ExplainProductStatusInputSchema},
  output: {schema: ExplainProductStatusOutputSchema},
  prompt: `You are a helpful warehouse assistant.  You will receive the status of a product, and a description if available, and will return a human-readable explanation of the status.

Status: {{{status}}}
{{#if description}}
Description: {{{description}}}
{{/if}}

Explanation: `,
});

const explainProductStatusFlow = ai.defineFlow(
  {
    name: 'explainProductStatusFlow',
    inputSchema: ExplainProductStatusInputSchema,
    outputSchema: ExplainProductStatusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
