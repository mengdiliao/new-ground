import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { agentStep } from '@/lib/agent.functions';
import { MAX_AGENT_STEPS } from '@/lib/agent';
import { createLocalTask, createDraftTask, appendMessage, advanceDemo, type Task, type ConversationType, type Source } from '@/lib/task-data';
import { TaskContext } from '@/lib/task-context';
import { loadTasks, saveTasks } from '@/lib/task-storage';
import { renameTask, toggleAction, answerActions, convertToTask, changeTaskStatus, updateTaskNotes } from '@/lib/task-history';
import { useProfile } from '@/lib/profile-context';
import { moveContext, moveRevision } from '@/lib/profile';
import { applyCalendarAction, calendarDraftSchema } from '@/lib/calendar-draft';
import { applyEmailAction, emailDraftSchema } from '@/lib/email-draft';
import { selectedImages, compactSourceImages } from '@/lib/research-images';
export function NewGroundProvider({ children }: { children: ReactNode }) {
  const { activeMove, moves } = useProfile();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const storageWritable = useRef(true);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  useEffect(() => {
    try { const saved = loadTasks(window.localStorage); setTasks(saved.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))); }
    catch { storageWritable.current = false; setStorageError('Saved history could not be read. Existing browser data has not been overwritten; changes will last only for this visit.'); }
    setHistoryReady(true);
  }, []);
  useEffect(() => {
    if (!historyReady || !storageWritable.current) return;
    try { saveTasks(window.localStorage, tasks); setStorageError(''); }
    catch { setStorageError('Your browser could not save these changes. Keep this page open; history may not survive a refresh.'); }
  }, [tasks, historyReady]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const step = useServerFn(agentStep);
  const states = useRef(new Map<string, string>());
  const activeRequests = useRef(new Set<string>());
  const taskMoves = useRef(new Map<string, Task>());
  const bindMove = (task: Task): Task => ({ ...task, moveId: activeMove?.id ?? null, moveRevision: activeMove ? moveRevision(activeMove) : undefined, moveSnapshot: activeMove ? moveContext(activeMove) : null });
  const addTask = (text: string, type: ConversationType = 'query', sources: Source[] = []) => {
    const created = createLocalTask(text, crypto.randomUUID(), type);
    const task = created ? bindMove({ ...created, sources }) : undefined;
    if (task) { taskMoves.current.set(task.id, task); setTasks(current => [task, ...current]); }
    return task;
  };
  const updateTask = (id: string, update: (task: Task) => Task) => setTasks(current => current.map(task => { if (task.id !== id) return task; const next = update(task); return next === task ? task : { ...next, updatedAt: new Date().toISOString() }; }));
  const researchTask = async (id: string, query: string, emailRewrite = false) => {
    if (activeRequests.current.has(id)) return;
    activeRequests.current.add(id);
    updateTask(id, task => ({ ...task, demo: false, agentStage: 'Understanding your request', searchState: 'loading', searchError: undefined }));
    try {
      let state = states.current.get(id);
      const imageSources = new Map<string, Source>();
      const existing = tasksRef.current.find(task => task.id === id) ?? taskMoves.current.get(id);
      const move = moves.find(move => move.id === existing?.moveId);
      const context = move ? moveContext(move) : existing?.moveSnapshot ?? null;
      const messages = existing?.messages ?? [];
      const calendarDraft = [...messages].reverse().find(message => message.calendarDraft)?.calendarDraft ?? null;
      const emailDraft = [...messages].reverse().find(message => message.emailDraft)?.emailDraft ?? null;
      const prior = messages.at(-1)?.role === 'user' && messages.at(-1)?.text === query ? messages.slice(0, -1) : messages;
      const history = prior.slice(-20).map(message => ({ role: message.role, text: message.text.slice(0, 18000) }));
      for (let index = 0; index <= MAX_AGENT_STEPS + 1; index++) {
        const result = await step({ data: index === 0 ? { state, message: query, move: context, emailDraft, calendarDraft, ...(!state ? { initialSources: (existing?.sources ?? []).map(({ title, url, preview }) => ({ title, url, preview })).slice(0, 15) } : {}), ...(!state ? { history } : {}) } : { state } });
        if (result.state) { state = result.state; states.current.set(id, state); }
        for (const source of await compactSourceImages(result.sources)) if (source.images?.some(image => image.dataUrl)) imageSources.set(source.url, source);
        const enrichedSources = result.sources.map(source => imageSources.get(source.url) ?? source);
        updateTask(id, task => ({ ...task, agentState: state, agentStage: result.stage ?? task.agentStage, researchPlan: result.plan ?? task.researchPlan, sources: enrichedSources.length ? enrichedSources : task.sources, searchRounds: result.rounds,
          searchState: result.done ? result.error ? 'error' : 'success' : 'loading', searchError: result.error,
          ...(result.answer && !result.emailAction && !result.calendarAction && !emailRewrite ? { messages: [...task.messages, { id: crypto.randomUUID(), role: 'assistant' as const, text: result.answer, images: selectedImages(enrichedSources, result.imageSourceNumbers ?? []) }], results: result.clarification ? undefined : { summary: result.answer, options: [], steps: answerActions(result.answer) } } : {}) }));
        if (result.done && result.calendarAction) {
          const content = result.calendarAction;
          updateTask(id, task => applyCalendarAction(task, { ...content, id: calendarDraft?.id ?? crypto.randomUUID() }));
          if (result.clarification && result.answer) updateTask(id, task => ({ ...task, messages: [...task.messages, { id: crypto.randomUUID(), role: 'assistant', text: result.answer ?? '' }] }));
        }
        if (result.done && result.emailAction) {
          const content = emailRewrite && emailDraft ? { ...result.emailAction, recipientName: emailDraft.recipientName, to: emailDraft.to, cc: emailDraft.cc, sourceNumbers: emailDraft.sourceNumbers } : result.emailAction;
          updateTask(id, task => applyEmailAction(task, { ...content, id: emailDraft?.id ?? crypto.randomUUID() }));
        }
        if (result.done) return;
        if (!state) throw new Error('Missing continuation');
      }
      throw new Error('Research limit');
    } catch { updateTask(id, task => ({ ...task, searchState: 'error', searchError: 'The assistant could not connect. Your conversation and sources are preserved. Please retry.' })); }
    finally { activeRequests.current.delete(id); }
  };
  const visibleTasks = tasks.filter(task => !task.demo && (task.moveId ?? null) === (activeMove?.id ?? null));
  return <TaskContext.Provider value={{ tasks: visibleTasks, allTasks: tasks, addTask, researchTask, editCalendar: (id, draft) => { const parsed = calendarDraftSchema.safeParse(draft); if (parsed.success) updateTask(id, task => applyCalendarAction(task, parsed.data)); }, cancelCalendar: (id, draftId) => updateTask(id, task => ({ ...task, messages: task.messages.filter(message => message.calendarDraft?.id !== draftId) })), editEmail: (id, draft) => { const parsed = emailDraftSchema.safeParse(draft); if (parsed.success) updateTask(id, task => task.messages.some(message => message.emailDraft?.id === draft.id) ? applyEmailAction(task, parsed.data) : task); }, cancelEmail: (id, draftId) => updateTask(id, task => ({ ...task, messages: task.messages.filter(message => message.emailDraft?.id !== draftId) })), historyReady, storageError, renameTask: (id, title) => updateTask(id, task => renameTask(task, title)), deleteTask: id => { states.current.delete(id); taskMoves.current.delete(id); setTasks(current => current.filter(task => task.id !== id)); }, setTaskStatus: (id, status) => updateTask(id, task => changeTaskStatus(task, status)), convertQuery: id => updateTask(id, convertToTask), updateNotes: (id, notes) => updateTask(id, task => updateTaskNotes(task, notes)), toggleAction: (id, action) => updateTask(id, task => toggleAction(task, action)), newTask: (type = 'task') => { const task = bindMove(createDraftTask(crypto.randomUUID(), type)); taskMoves.current.set(task.id, task); setTasks(current => [task, ...current]); return task; }, updateDraft: (id, draft) => updateTask(id, task => ({ ...task, draft })), sendMessage: (id, text) => updateTask(id, task => appendMessage(task, text)), advanceTask: id => updateTask(id, advanceDemo), showSuggestions, setShowSuggestions }}>{children}</TaskContext.Provider>;
}