import { z } from 'zod';
import type { Message } from './task-data';

export const suggestedActionSchema = z.object({ type: z.enum(['email', 'calendar', 'task']), purpose: z.string().trim().min(1).max(300) });
export type SuggestedAction = z.infer<typeof suggestedActionSchema>;
export const actionLabels = { email: 'Draft Email', calendar: 'Add to Calendar', task: 'Save as Task' };
export function eligibleSuggestion(action: SuggestedAction | null | undefined, messages: Message[], tracked: boolean) {
  if (!action || (tracked && action.type === 'task')) return undefined;
  // One offer of each kind in the recent conversation avoids nagging, even when wording changes.
  if (messages.slice(-8).some(message => message.suggestedAction?.type === action.type || (action.type === 'email' && message.emailDraft) || (action.type === 'calendar' && message.calendarDraft))) return undefined;
  return action;
}