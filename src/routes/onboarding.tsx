import { createFileRoute } from '@tanstack/react-router';
import { MoveCard } from '@/components/move-card';
import { MoveDetails } from '@/components/move-details';
export const Route = createFileRoute('/onboarding')({
  head: () => ({ meta: [{ title: 'Your moves — New Ground' }, { name: 'description', content: 'Set up, edit, or switch your saved move and confirmed preferences.' }, { property: 'og:title', content: 'Your moves — New Ground' }, { property: 'og:description', content: 'A little context for your next chapter, saved in this browser.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] }),
  component: () => <main className="page-content soft-enter"><h1 className="text-3xl font-semibold">Your next chapter.</h1><div className="max-w-2xl"><MoveCard /><MoveDetails /></div></main>,
});