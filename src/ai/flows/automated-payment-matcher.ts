'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview A Genkit flow for intelligently associating payment events with tracked customers.
 *
 * - automatedPaymentMatcher - A function that handles the automated payment association process.
 * - AutomatedPaymentMatcherInput - The input type for the automatedPaymentMatcher function.
 * - AutomatedPaymentMatcherOutput - The return type for the automatedPaymentMatcher function.
 */

const AutomatedPaymentMatcherInputSchema = z.object({
  customers: z.array(z.object({
    trackerId: z.string().describe('Unique identifier for the customer.'),
    currentZone: z.string().describe('The name of the zone the customer is currently in (e.g., "Billing Zone", "Shopping Zone", "Entry Zone", "Exit Zone").'),
    lastBillingZoneEntryTimestamp: z.string().datetime().nullable().describe('ISO timestamp when the customer last entered the billing zone. Null if never entered or not currently in billing zone.'),
  })).describe('List of all currently tracked customers and their details.'),
  paymentEvent: z.object({
    paymentId: z.string().describe('Unique identifier for the payment event.'),
    paymentMethod: z.string().describe('The method of payment (e.g., "QR", "POS", "Card", "UPI").'),
    paymentTimestamp: z.string().datetime().describe('ISO timestamp when the payment event occurred.'),
  }).describe('The incoming payment event to be associated.')
});

export type AutomatedPaymentMatcherInput = z.infer<typeof AutomatedPaymentMatcherInputSchema>;

const AutomatedPaymentMatcherOutputSchema = z.object({
  associatedTrackerId: z.string().nullable().describe('The tracker ID of the customer associated with the payment, or null if no match.'),
  paymentId: z.string().describe('The ID of the payment event that was processed.'),
  success: z.boolean().describe('True if a customer was successfully associated with the payment, false otherwise.'),
  reason: z.string().describe('A brief explanation for the association result.'),
});

export type AutomatedPaymentMatcherOutput = z.infer<typeof AutomatedPaymentMatcherOutputSchema>;

const paymentMatcherPrompt = ai.definePrompt({
  name: 'automatedPaymentMatcherPrompt',
  input: { schema: AutomatedPaymentMatcherInputSchema },
  output: { schema: AutomatedPaymentMatcherOutputSchema },
  prompt: `You are an intelligent payment association system for a retail security platform. Your task is to analyze customer tracking data and an incoming payment event to determine the most probable customer associated with the payment.\n\nCarefully evaluate the following rules for association:\n1.  **Primary Rule**: A customer *must* be currently in the 'Billing Zone' to be considered for payment association.\n2.  **Temporal Proximity**: The payment timestamp should be reasonably close to the customer's 'lastBillingZoneEntryTimestamp'. A customer should ideally have entered the billing zone *before* or very close to the payment timestamp. Allow for a processing time window of up to 5 minutes after entering the billing zone. If a customer entered the billing zone significantly earlier (e.g., more than 5 minutes before) than the payment timestamp, they are less likely to be the correct match. If they entered after the payment, they cannot be the match.\n3.  **Uniqueness**: If multiple customers are in the billing zone and fit the temporal proximity rule, prioritize the customer whose 'lastBillingZoneEntryTimestamp' is the *most recent* (closest to the payment timestamp, but not after it). Assume that a payment event should be associated with only one customer.\n4.  **No Match**: If no suitable customer is found based on *all* the above rules, no association should be made.\n\nCustomers currently tracked:\n\`\`\`json\n{{{JSON.stringify customers}}}\n\`\`\`\n\nIncoming Payment Event:\n\`\`\`json\n{{{JSON.stringify paymentEvent}}}\n\`\`\`\n\nBased on this information, determine the best possible association.\nIf an association is made, set 'associatedTrackerId' to the matched customer's tracker ID and 'success' to true, with a concise 'reason' explaining the match (e.g., "Customer in billing zone, entered recently").\nIf no association can be made, set 'associatedTrackerId' to null and 'success' to false, providing a clear 'reason' why no suitable customer was found (e.g., "No customer in billing zone" or "No customer within temporal proximity").`
});

const automatedPaymentMatcherFlow = ai.defineFlow(
  {
    name: 'automatedPaymentMatcherFlow',
    inputSchema: AutomatedPaymentMatcherInputSchema,
    outputSchema: AutomatedPaymentMatcherOutputSchema,
  },
  async (input) => {
    const { output } = await paymentMatcherPrompt(input);
    return output!;
  }
);

export async function automatedPaymentMatcher(input: AutomatedPaymentMatcherInput): Promise<AutomatedPaymentMatcherOutput> {
  return automatedPaymentMatcherFlow(input);
}
