import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequestComposer } from '@/components/request-composer';
import { TopicCard } from '@/components/topic-card';
import { findTopic, topics } from '@/lib/topics';

export const Route = createFileRoute('/topics/$topicId')({
  loader: ({ params }) => { const topic = findTopic(params.topicId); if (!topic) throw notFound(); return topic; },
  head: ({ loaderData }) => { const title = `${loaderData?.title ?? 'Topic'} — New Ground`; const description = loaderData?.description ?? 'Find a grounded next step with New Ground.'; return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }; },
  component: TopicPage,
});
function TopicPage() {
  const topic = Route.useLoaderData();
  return <main className="page-content topic-page soft-enter"><Button asChild variant="link" className="mb-9 h-auto p-0 text-sm"><Link to="/"><ArrowLeft />All topics</Link></Button><p className="mb-4 text-sm font-medium text-primary">New Ground / Your next chapter</p><h1 className="topic-heading">{topic.title}<span className="text-brand-coral">.</span></h1><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">{topic.description}</p><div className="mt-8"><RequestComposer prompts={topic.questions} placeholder={`What would you like to know about ${topic.title.toLowerCase()}?`} /></div><section className="mt-14 border-t border-border pt-8"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-semibold">Another direction?</h2><ArrowUpRight size={20} className="text-primary" /></div><div className="topic-grid">{topics.filter(item => item.slug !== topic.slug).slice(0, 3).map(item => <TopicCard key={item.slug} topic={item} />)}</div></section></main>;
}