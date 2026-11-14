import { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationChoice } from '@/components/conversation-choice';
import type { ConversationType } from '@/lib/task-data';
import { useNewGround } from '@/lib/task-context';

export function RequestComposer({ prompts, placeholder = 'What’s changing for you?' }: { prompts: readonly string[]; placeholder?: string }) {
  const { addTask, researchTask } = useNewGround();
  const navigate = useNavigate();
  const [type, setType] = useState<ConversationType>('query');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submit = () => {
    const task = addTask(input, type);
    if (!task) { setError('Tell us what you would like help with first.'); return; }
    setError(''); void researchTask(task.id, input);
    void navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
  };
  return <div className="request-area"><ConversationChoice value={type} onChange={setType} /><form className="composer change-composer" onSubmit={event => { event.preventDefault(); submit(); }}><label className="sr-only" htmlFor="task-input">What would you like help with?</label><textarea ref={inputRef} id="task-input" placeholder={placeholder} value={input} aria-invalid={Boolean(error)} aria-describedby={error ? 'request-error' : undefined} onChange={event => { setInput(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} /><Button type="submit" className="h-11 shrink-0 px-5">Let’s figure it out<ArrowRight size={16} /></Button>{error && <p id="request-error" role="alert" className="w-full text-xs text-destructive">{error}</p>}</form><div className="question-prompts">{prompts.map(prompt => <Button key={prompt} variant="outline" className="question-prompt" onClick={() => { setInput(prompt); setError(''); inputRef.current?.focus(); }}>{prompt}<ArrowUpRightSmall /></Button>)}</div><p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole size={12} className="mt-1 shrink-0" />Your request is shared securely with OpenAI and Exa to find a grounded answer.</p></div>;
}
function ArrowUpRightSmall() { return <ArrowRight size={12} className="shrink-0 -rotate-45" />; }