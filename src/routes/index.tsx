import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNewGround } from '@/lib/task-context';
import { TaskCard } from '@/components/task-card';
import { ChangeBoard } from '@/components/change-board';
import { RequestComposer } from '@/components/request-composer';
import { TopicCard } from '@/components/topic-card';
import { MoveCard } from '@/components/move-card';
import { topics } from '@/lib/topics';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'New Ground — A little help goes a long way' }, { name: 'description', content: 'Turn everyday overwhelm into a clear next step. Less searching. More living.' }, { property: 'og:title', content: 'New Ground — A little help goes a long way' }, { property: 'og:description', content: 'A thoughtful place to find clarity for everyday tasks.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Index,
});
const prompts = ["I'm going on exchange next term", 'Will my summer job affect my study grant?', 'I just lost my job'];
function Index() {
  const { tasks, showSuggestions } = useNewGround();
  return <main className="page-content home-refresh soft-enter">
    <section className="change-welcome" aria-labelledby="welcome-heading"><p className="mb-5 flex items-center gap-2 text-sm font-semibold text-primary"><Sprout size={17} />New Ground · Less searching. More living.</p><ChangeBoard /><h1 id="welcome-heading">see what your<br className="hidden sm:block" /> next move sets off<span className="text-board-letter">?</span></h1><p className="change-intro">A summer job, an exchange, a new home. One change can lead to another. Tell us your plan — we’ll help you find a grounded next step.</p><RequestComposer prompts={prompts} /></section>
    {showSuggestions && <section className="topics-section" aria-labelledby="suggestions-heading"><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs font-semibold text-primary">A new chapter starts somewhere</p><h2 id="suggestions-heading" className="text-2xl font-semibold">Pick where you’re headed</h2></div><span className="text-sm text-muted-foreground">Big changes. Small steps.</span></div><div className="topic-grid">{topics.map(topic => <TopicCard topic={topic} key={topic.slug} />)}</div></section>}
    <MoveCard />
    <section className="mt-9" aria-labelledby="tasks-heading"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2.5"><h2 id="tasks-heading" className="text-base font-semibold">A little progress, every day</h2><span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">Demo</span></div><Button asChild variant="link" className="h-auto p-0 text-xs font-normal"><Link to="/tasks">View all tasks<ArrowRight size={13} /></Link></Button></div><div className="task-grid">{tasks.slice(0,3).map(task => <TaskCard task={task} key={task.id} />)}</div></section>
    <footer className="mt-8 flex items-center justify-center gap-2 pb-1 text-[11px] text-muted-foreground"><Sprout size={13} />You don't have to figure everything out on your own.</footer>
  </main>;
}
