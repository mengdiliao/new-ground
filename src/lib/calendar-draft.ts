import { z } from 'zod';
import { Temporal } from '@js-temporal/polyfill';
import type { Source, Task } from './task-data';

export const calendarContentSchema = z.object({ title: z.string().max(300), startDate: z.string().max(10), startTime: z.string().max(5), endDate: z.string().max(10), endTime: z.string().max(5), timeZone: z.string().max(100), location: z.string().max(500), description: z.string().max(18000), sourceUrl: z.string().max(2000), allDay: z.boolean(), eventType: z.enum(['Appointment', 'Personal Plan', 'Reminder']), status: z.enum(['confirmed', 'tentative', 'reminder']), endSuggested: z.boolean(), reminderMinutes: z.number().int().min(0).max(10080).nullable() });
export const calendarDraftSchema = calendarContentSchema.extend({ id: z.string().min(1) });
export type CalendarContent = z.infer<typeof calendarContentSchema>;
export type CalendarDraft = z.infer<typeof calendarDraftSchema>;
export const emptyCalendar: CalendarContent = { title: '', startDate: '', startTime: '', endDate: '', endTime: '', timeZone: '', location: '', description: '', sourceUrl: '', allDay: true, eventType: 'Personal Plan', status: 'tentative', endSuggested: false, reminderMinutes: null };
export function validTimeZone(zone: string) { try { if (!zone || /^[+-]/.test(zone)) return false; new Intl.DateTimeFormat('en', { timeZone: zone }); return true; } catch { return false; } }
function plainDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Choose a valid date.'); return Temporal.PlainDate.from(value); }
function instant(date: string, time: string, zone: string) { plainDate(date); if (!/^\d{2}:\d{2}$/.test(time)) throw new Error('Choose a start and end time.'); return Temporal.PlainDateTime.from(`${date}T${time}`).toZonedDateTime(zone, { disambiguation: 'reject' }).toInstant(); }
export function calendarRange(draft: CalendarContent) {
  const start = plainDate(draft.startDate); const end = plainDate(draft.endDate || draft.startDate);
  if (draft.allDay) { if (Temporal.PlainDate.compare(end, start) < 0) throw new Error('End date must not be before the start date.'); return { start: start.toString().replaceAll('-', ''), end: end.add({ days: 1 }).toString().replaceAll('-', '') }; }
  if (!validTimeZone(draft.timeZone)) throw new Error('Select a valid IANA time zone.');
  let first: Temporal.Instant, last: Temporal.Instant;
  try { first = instant(draft.startDate, draft.startTime, draft.timeZone); last = instant(draft.endDate || draft.startDate, draft.endTime, draft.timeZone); } catch (error) { if (error instanceof RangeError) throw new Error('This time is skipped or occurs twice during daylight saving. Choose an unambiguous time.'); throw error; }
  if (Temporal.Instant.compare(last, first) <= 0) throw new Error('The event end must be later than its start.');
  const format = (value: Temporal.Instant) => value.toString({ smallestUnit: 'second' }).replaceAll('-', '').replaceAll(':', '');
  return { start: format(first), end: format(last) };
}
export function calendarError(draft: CalendarContent) { if (!draft.title.trim()) return 'Add an event title.'; try { calendarRange(draft); return ''; } catch (error) { return error instanceof Error ? error.message : 'Check the event dates and times.'; } }
export function calendarDescription(draft: CalendarContent) { return [draft.description, draft.sourceUrl ? `Source: ${draft.sourceUrl}` : '', `Event: ${draft.status === 'confirmed' ? 'Confirmed appointment' : draft.status === 'reminder' ? 'Reminder' : 'Tentative plan'}`, draft.timeZone ? `Time zone: ${draft.timeZone}` : '', draft.endSuggested ? 'End time is an editable suggestion, not a confirmed detail.' : '', draft.reminderMinutes !== null ? `Reminder preference: ${draft.reminderMinutes} minutes before (review in your calendar).` : ''].filter(Boolean).join('\n\n'); }
export function googleCalendarUrl(draft: CalendarContent) { if (calendarError(draft)) return null; const range = calendarRange(draft); const url = new URL('https://calendar.google.com/calendar/render'); url.search = new URLSearchParams({ action: 'TEMPLATE', text: draft.title, dates: `${range.start}/${range.end}`, ctz: draft.timeZone || 'UTC', location: draft.location, details: calendarDescription(draft) }).toString(); return url.href.length <= 8000 ? url.href : null; }
const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
function fold(line: string) { const chunks: string[] = []; let chunk = ''; let bytes = 0; for (const char of line) { const size = new TextEncoder().encode(char).length; if (bytes + size > 75) { chunks.push(chunk); chunk = ' '; bytes = 1; } chunk += char; bytes += size; } chunks.push(chunk); return chunks.join('\r\n'); }
export function calendarIcs(draft: CalendarDraft, now = new Date()) {
  const error = calendarError(draft); if (error) throw new Error(error);
  const range = calendarRange(draft);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//New Ground//Calendar Assistant//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${escapeText(draft.id)}@new-ground`, `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`, `DTSTART${draft.allDay ? ';VALUE=DATE' : ''}:${range.start}`, `DTEND${draft.allDay ? ';VALUE=DATE' : ''}:${range.end}`, `SUMMARY:${escapeText(draft.title)}`, `DESCRIPTION:${escapeText(calendarDescription(draft))}`, `STATUS:${draft.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`, `TRANSP:${draft.status === 'confirmed' ? 'OPAQUE' : 'TRANSPARENT'}`];
  if (draft.location) lines.push(`LOCATION:${escapeText(draft.location)}`);
  if (draft.sourceUrl) lines.push(`URL:${draft.sourceUrl}`);
  if (draft.reminderMinutes !== null) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(draft.title)}`, `TRIGGER:-PT${draft.reminderMinutes}M`, 'END:VALARM');
  lines.push('END:VEVENT', 'END:VCALENDAR'); return lines.map(fold).join('\r\n') + '\r\n';
}
export function safeCalendar(content: CalendarContent, userText: string, sources: Source[], existing?: CalendarDraft | null): CalendarContent {
  const confirmed = /\b(?:confirmed|booked|confirmation)\b/i.test(userText) || existing?.status === 'confirmed';
  return { ...content, status: content.eventType === 'Reminder' ? 'reminder' : content.status === 'confirmed' && !confirmed ? 'tentative' : content.status, sourceUrl: sources.some(source => source.url === content.sourceUrl) || existing?.sourceUrl === content.sourceUrl ? content.sourceUrl : '' };
}
export function applyCalendarAction(task: Task, draft: CalendarDraft): Task { const exists = task.messages.some(message => message.calendarDraft?.id === draft.id); return { ...task, messages: exists ? task.messages.map(message => message.calendarDraft?.id === draft.id ? { ...message, calendarDraft: draft } : message) : [...task.messages, { id: draft.id, role: 'assistant', text: '', calendarDraft: draft }] }; }