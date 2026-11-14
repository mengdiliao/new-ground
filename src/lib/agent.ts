import { z } from 'zod';
import type { Source } from './task-data';
import { confirmedDetailsSchema } from './profile-storage';

export const moveContextSchema = z.object({ origin: z.object({ city: z.string().max(120), country: z.string().max(120) }).nullable(), destination: z.object({ city: z.string().max(120), country: z.string().max(120) }).nullable(), arrival: z.union([z.object({ kind: z.literal('exact'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }), z.object({ kind: z.literal('month'), month: z.string().regex(/^\d{4}-\d{2}$/) }), z.object({ kind: z.literal('unsure') })]).nullable(), duration: z.object({ choice: z.enum(['lt3', 'm3-6', 'm6-12', 'gt12', 'indefinite', 'custom', 'unsure']), custom: z.string().max(120).optional() }).nullable(), purpose: z.string().max(300).nullable(), confirmedDetails: confirmedDetailsSchema });

export const DEFAULT_OPENAI_MODEL = 'gpt-6-luna';
export const MAX_SEARCH_ROUNDS = 3;
export const MAX_AGENT_STEPS = 12;
export const agentStages = ['Understanding your request', 'Searching for information', 'Reading sources', 'Comparing findings', 'Preparing your answer'] as const;
export type AgentStage = typeof agentStages[number];
export const agentInput = z.object({ state: z.string().max(150000).optional(), message: z.string().trim().min(1).max(4000).optional(), move: moveContextSchema.nullable().optional(), history: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(18000) })).max(20).optional() }).refine(value => value.state || value.message, 'A request is required.');
export type AgentInput = z.infer<typeof agentInput>;
export interface AgentReply { state?: string | undefined; stage?: AgentStage | undefined; sources: Source[]; rounds: number; done: boolean; answer?: string | undefined; plan?: string | undefined; clarification?: boolean | undefined; error?: string | undefined; }
export const answerSchema = z.object({ answer: z.string().min(1).max(18000), plan: z.string().max(1000), needsClarification: z.boolean() });
export function groundedText(text: string, sources: Source[]) {
  // Model-created hyperlinks are not rendered: only verified source URLs survive.
  return text.replace(/https?:\/\/[^\s<>\])]+/g, url => sources.some(source => source.url === url) ? url : '(unverified link omitted)').replace(/\[(\d+)\]/g, (match, number: string) => Number(number) > 0 && Number(number) <= sources.length ? match : '(source unavailable)');
}