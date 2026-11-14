import { z } from 'zod';
import type { Source, Task } from './task-data';

export const emailContentSchema = z.object({ recipientName: z.string().max(200), to: z.string().max(1000), cc: z.string().max(1000), subject: z.string().max(1000), body: z.string().max(18000), language: z.string().max(100), sourceNumbers: z.array(z.number().int().positive()).max(15) });
export const emailDraftSchema = emailContentSchema.extend({ id: z.string().min(1) });
export type EmailContent = z.infer<typeof emailContentSchema>;
export type EmailDraft = z.infer<typeof emailDraftSchema>;
export const MAIL_URL_LIMIT = 2000;
export function addressList(value: string) { return value.split(/[,;]/).map(address => address.trim()).filter(Boolean); }
export function validAddresses(value: string) { return !/[\r\n]/.test(value) && addressList(value).every(address => z.string().email().safeParse(address).success); }
export function emailText(draft: EmailContent) { return `${draft.to ? `To: ${draft.to}\n` : ''}${draft.cc ? `CC: ${draft.cc}\n` : ''}Subject: ${draft.subject}\n\n${draft.body}`; }
export function emailLinks(draft: EmailContent) {
  if (!validAddresses(draft.to) || !validAddresses(draft.cc)) return null;
  const gmail = new URL('https://mail.google.com/mail/');
  gmail.search = new URLSearchParams({ view: 'cm', fs: '1', to: addressList(draft.to).join(','), cc: addressList(draft.cc).join(','), su: draft.subject, body: draft.body }).toString();
  const mailto = `mailto:${encodeURIComponent(addressList(draft.to).join(','))}?${new URLSearchParams({ cc: addressList(draft.cc).join(','), subject: draft.subject, body: draft.body }).toString().replace(/\+/g, '%20')}`;
  return { gmail: gmail.href.length <= MAIL_URL_LIMIT ? gmail.href : null, mailto: mailto.length <= MAIL_URL_LIMIT ? mailto : null };
}
export function verifyEmail(content: EmailContent, providedText: string, sources: Source[]): EmailContent {
  const evidence = sources.map(source => `${source.preview}\n${source.highlights?.join('\n') ?? ''}`);
  const contains = (text: string, address: string) => (text.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []).some(found => found.toLowerCase() === address.toLowerCase());
  const checked = (value: string) => addressList(value).filter(address => validAddresses(address) && (contains(providedText, address) || content.sourceNumbers.some(number => contains(evidence[number - 1] ?? '', address)))).join(', ');
  return { ...content, to: checked(content.to), cc: checked(content.cc), sourceNumbers: content.sourceNumbers.filter(number => Boolean(sources[number - 1])) };
}
export function applyEmailAction(task: Task, draft: EmailDraft): Task {
  const exists = task.messages.some(message => message.emailDraft?.id === draft.id);
  return { ...task, messages: exists ? task.messages.map(message => message.emailDraft?.id === draft.id ? { ...message, emailDraft: draft } : message) : [...task.messages, { id: draft.id, role: 'assistant', text: '', emailDraft: draft }] };
}