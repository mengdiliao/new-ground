import { describe, expect, it } from 'vitest';
import { applyEmailAction, emailLinks, emailText, MAIL_URL_LIMIT, validAddresses, verifyEmail, type EmailDraft } from '@/lib/email-draft';
import { createLocalTask } from '@/lib/task-data';
import { loadTasks, saveTasks } from '@/lib/task-storage';
const draft: EmailDraft = { id: 'email-1', recipientName: '', to: '', cc: '', subject: 'Earlier move-in?', body: 'Hello,\nCould I move in earlier?\n[Your name]', language: 'English', sourceNumbers: [] };
describe('account-free email actions', () => {
  it('permits an unknown recipient without inventing an address', () => { expect(validAddresses('')).toBe(true); expect(verifyEmail({ ...draft, to: 'invented@example.org' }, 'Email my landlord', []).to).toBe(''); });
  it('retains only explicitly supplied addresses or addresses in cited evidence', () => {
    expect(verifyEmail({ ...draft, to: 'owner@example.org, fake@example.org', cc: 'office@example.org', sourceNumbers: [1, 7] }, 'Email owner@example.org', [{ title: 'Office', url: 'https://example.org/contact', preview: 'Contact office@example.org' }])).toMatchObject({ to: 'owner@example.org', cc: 'office@example.org', sourceNumbers: [1] });
  });
  it('rejects malformed addresses and header injection', () => { expect(validAddresses('not an address')).toBe(false); expect(validAddresses('a@example.org\r\nBcc: b@example.org')).toBe(false); expect(emailLinks({ ...draft, to: 'invalid' })).toBeNull(); });
  it('encodes Gmail fields without losing Unicode or multiline special characters', () => {
    const content = { ...draft, to: 'a@example.org', cc: 'b@example.org', subject: 'Helsinki — Å & +?', body: 'Hei!\n你好 & 50% + #?' };
    const links = emailLinks(content); expect(links?.gmail).toBeTruthy();
    const url = new URL(links?.gmail ?? ''); expect(url.origin).toBe('https://mail.google.com'); expect(url.searchParams.get('view')).toBe('cm'); expect(url.searchParams.get('to')).toBe(content.to); expect(url.searchParams.get('cc')).toBe(content.cc); expect(url.searchParams.get('su')).toBe(content.subject); expect(url.searchParams.get('body')).toBe(content.body);
  });
  it('encodes default-mail fields and line breaks without truncation', () => {
    const content = { ...draft, to: 'a@example.org', cc: 'b@example.org', subject: 'Å & +?', body: '你好\nSecond line & + %' };
    const links = emailLinks(content); const url = new URL(links?.mailto ?? ''); expect(decodeURIComponent(url.pathname)).toBe(content.to); expect(url.searchParams.get('body')).toBe(content.body); expect(url.searchParams.get('subject')).toBe(content.subject); expect(url.searchParams.get('cc')).toBe(content.cc);
  });
  it('disables unreliable long links and preserves the complete copy text', () => { const content = { ...draft, body: '界'.repeat(MAIL_URL_LIMIT) }; expect(emailLinks(content)).toEqual({ gmail: null, mailto: null }); expect(emailText(content)).toContain(content.body); });
  it('updates the same draft while preserving task progress and unrelated messages', () => {
    const task = createLocalTask('Contact landlord', 'task-1', 'task'); if (!task) throw new Error('Task missing');
    const original = { ...task, status: 'Waiting' as const, notes: 'Private', completedActions: ['Already done'] };
    const added = applyEmailAction(original, draft); const revised = applyEmailAction(added, { ...draft, subject: 'Manually edited', body: 'New body' });
    expect(revised.messages).toHaveLength(2); expect(revised.messages[0]).toEqual(original.messages[0]); expect(revised.messages[1]?.emailDraft).toMatchObject({ subject: 'Manually edited', body: 'New body' }); expect(revised.status).toBe('Waiting'); expect(revised.notes).toBe('Private'); expect(revised.completedActions).toEqual(['Already done']);
  });
  it('does not persist email actions or add history records', () => { const task = createLocalTask('Email question', 'query-1'); if (!task) throw new Error('Query missing'); const store = new Map<string, string>(); const storage = { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => { store.set(key, value); } }; saveTasks(storage, [applyEmailAction(task, draft)]); const saved = loadTasks(storage); expect(saved).toHaveLength(1); expect(saved[0]?.type).toBe('query'); expect(saved[0]?.status).toBeUndefined(); expect(saved[0]?.messages).toEqual(task.messages); });
});