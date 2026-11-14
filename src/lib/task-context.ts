import { createContext, useContext, type Context } from 'react';
import type { Task, TaskStatus, ConversationType, Source } from '@/lib/task-data';

export interface TaskContextValue {
  tasks: Task[];
  allTasks: Task[];
  addTask: (text: string, type?: ConversationType, sources?: Source[]) => Task | undefined;
  newTask: (type?: ConversationType) => Task;
  updateDraft: (id: string, text: string) => void;
  sendMessage: (id: string, text: string) => void;
  advanceTask: (id: string) => void;
  dismissSuggestion: (id: string, messageId: string) => void;
  editCalendar: (id: string, draft: import('./calendar-draft').CalendarDraft) => void;
  cancelCalendar: (id: string, draftId: string) => void;
  editEmail: (id: string, draft: import('./email-draft').EmailDraft) => void;
  cancelEmail: (id: string, draftId: string) => void;
  researchTask: (id: string, query: string, emailRewrite?: boolean) => Promise<void>;
  renameTask: (id: string, title: string) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  convertQuery: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  toggleAction: (id: string, action: string) => void;
  historyReady: boolean;
  storageError: string;
  showSuggestions: boolean;
  setShowSuggestions: (value: boolean) => void;
}

// Separate from the refreshable provider so live component updates do not
// replace the context object used by already-mounted consumers.
// Context modules are not refresh boundaries. Retain their object across Vite
// updates so an already-mounted provider still matches refreshed consumers.
const hot = import.meta.hot;
export const TaskContext: Context<TaskContextValue | undefined> = hot?.data?.taskContext ?? createContext<TaskContextValue | undefined>(undefined);
if (hot?.data) hot.data.taskContext = TaskContext;

export function useNewGround() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('New Ground provider is missing');
  return context;
}