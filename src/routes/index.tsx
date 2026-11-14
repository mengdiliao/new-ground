import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TaskHistoryPanel } from '@/components/task-history-panel';
import { ChangeBoard } from '@/components/change-board';
import { RequestComposer } from '@/components/request-composer';
import { FeatureCard } from '@/components/feature-card';
import { MoveCard } from '@/components/move-card';
import { features } from '@/lib/features';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'New Ground — A little help goes a long way' }, { name: 'description', content: 'Turn everyday overwhelm into a clear next step. Less searching. More living.' }, { property: 'og:title', content: 'New Ground — A little help goes a long way' }, { property: 'og:description', content: 'A thoughtful place to find clarity for everyday tasks.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Index,
});
const prompts = ["I'm moving to a new city next month", 'What should I sort out before I move?', 'How do I meet people in a new city?'];
function Index() {
  return <main className="page-content home-refresh soft-enter">
    <section className="change-welcome" aria-labelledby="welcome-heading"><p className="mb-5 flex items-center gap-2 text-sm font-semibold text-primary"><Sprout size={17} />New Ground · Less searching. More living.</p><ChangeBoard /><h1 id="welcome-heading">Meet your AI assistant<br className="hidden sm:block" /> for life in a new city.</h1><p className="change-intro">A summer job, an exchange, a new home. One change can lead to another. Tell us your plan — we’ll help you find a grounded next step.</p><RequestComposer prompts={prompts} /></section>
    <MoveCard />
    <section className="features-section" aria-labelledby="features-heading">
      <div className="mb-7 max-w-xl">
        <h2 id="features-heading" className="text-2xl font-semibold">City Essentials</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Useful information for your move and everyday life.</p>
      </div>
      <div className="feature-grid">{features.map(feature => <FeatureCard feature={feature} key={feature.slug} />)}</div>
    </section>
    <section className="mt-9" aria-labelledby="tasks-heading"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2.5"><h2 id="tasks-heading" className="text-base font-semibold">Task History</h2></div><Button asChild variant="link" className="h-auto p-0 text-xs font-normal"><Link to="/tasks">View history<ArrowRight size={13} /></Link></Button></div><TaskHistoryPanel compact /></section>
    <footer className="mt-8 flex items-center justify-center gap-2 pb-1 text-[11px] text-muted-foreground"><Sprout size={13} />You don't have to figure everything out on your own.</footer>
  </main>;
}
