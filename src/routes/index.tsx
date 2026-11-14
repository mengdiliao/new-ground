import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { ArrowRight, Sparkles, HeartHandshake, Scale, Files, Map, LockKeyhole, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNewGround } from '@/lib/task-context';
import { TaskCard, categoryStyles } from '@/components/task-card';
import neighborhood from '@/assets/neighborhood-refined.png';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'New Ground — A little help goes a long way' }, { name: 'description', content: 'Turn everyday overwhelm into a clear next step. Less searching. More living.' }, { property: 'og:title', content: 'New Ground — A little help goes a long way' }, { property: 'og:description', content: 'A thoughtful place to find clarity for everyday tasks.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Index,
});
const suggestions = [
  { title: 'Find support and resources', subtitle: 'A helping hand, when you need it', category: 'support' as const, icon: HeartHandshake, prompt: 'I need help finding support and resources for ' },
  { title: 'Compare my options', subtitle: 'Find the right fit for you', category: 'compare' as const, icon: Scale, prompt: 'I would like to compare my options for ' },
  { title: 'Understand a complicated process', subtitle: 'Make the confusing feel clear', category: 'process' as const, icon: Files, prompt: 'Help me understand the process of ' },
  { title: 'Plan my next steps', subtitle: 'A small step toward something good', category: 'plan' as const, icon: Map, prompt: 'Help me plan my next steps for ' },
];
function Index() {
  const { tasks, addTask, researchTask, showSuggestions } = useNewGround();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submit = () => { const task = addTask(input); if (!task) { setError('Tell us what you would like help with first.'); return; } setError(''); void researchTask(task.id, input); navigate({ to: '/tasks/$taskId', params: { taskId: task.id } }); };
  return <main className="page-content soft-enter">
    <section className="welcome" aria-labelledby="welcome-heading"><div className="welcome-copy"><div className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-primary"><Sparkles size={14} />A little space to figure things out</div><h1 id="welcome-heading">A little help goes<br className="hidden lg:block" /> a long way.</h1><p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">Tell us what's on your mind.<br />We'll help you figure out the rest.</p></div><img className="world-image" src={neighborhood} width={1536} height={1024} alt="A welcoming miniature neighborhood with pastel homes, leafy trees, a garden, and winding paths" /></section>
    <form className="composer mt-3" onSubmit={event => { event.preventDefault(); submit(); }}><label className="sr-only" htmlFor="task-input">What would you like help with?</label><textarea ref={inputRef} id="task-input" placeholder="What would you like a little help with?" value={input} aria-invalid={Boolean(error)} aria-describedby={error ? 'request-error' : undefined} onChange={event => { setInput(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Sprout size={15} className="text-primary/70" />Big or small, it's a good place to start.</span><Button type="submit" className="h-10 px-5">Let's figure it out<ArrowRight size={16} /></Button></div>{error && <p id="request-error" role="alert" className="mt-3 text-xs text-destructive">{error}</p>}</form>
    <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><LockKeyhole size={11} />Your request is shared securely with OpenAI and Exa to find a grounded answer.</p>
    {showSuggestions && <section className="mt-8" aria-labelledby="suggestions-heading"><h2 id="suggestions-heading" className="mb-4 text-xs font-medium text-muted-foreground">A few things we can work through together</h2><div className="suggestion-grid">{suggestions.map(suggestion => <Button key={suggestion.title} variant="suggestion" className="suggestion-card" onClick={() => { setInput(suggestion.prompt); inputRef.current?.focus(); }}><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${categoryStyles[suggestion.category]}`}><suggestion.icon size={19} strokeWidth={1.6} /></span><span className="text-[13px] font-medium leading-5">{suggestion.title}</span><span className="text-[11px] font-normal leading-4 text-muted-foreground">{suggestion.subtitle}</span></Button>)}</div></section>}
    <section className="mt-9" aria-labelledby="tasks-heading"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2.5"><h2 id="tasks-heading" className="text-base font-semibold">A little progress, every day</h2><span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Demo</span></div><Button asChild variant="link" className="h-auto p-0 text-xs font-normal"><Link to="/tasks">View all tasks<ArrowRight size={13} /></Link></Button></div><div className="task-grid">{tasks.slice(0,3).map(task => <TaskCard task={task} key={task.id} />)}</div></section>
    <footer className="mt-8 flex items-center justify-center gap-2 pb-1 text-[11px] text-muted-foreground"><Sprout size={13} />You don't have to figure everything out on your own.</footer>
  </main>;
}
