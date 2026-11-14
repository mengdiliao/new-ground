import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, CalendarDays, Hourglass, MapPin, Pencil, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/lib/profile-context';
import { useNewGround } from '@/lib/task-context';
import { arrivalLabel, durationLabel, hasDestination } from '@/lib/profile';
import { flagEmoji, locationLabel } from '@/lib/locations';

// Profile-driven dashboard card: everything renders from the stored profile,
// with explicit empty states for anything the user hasn't set.
export function MoveCard() {
  const { profile, profileReady } = useProfile();
  const { addTask, researchTask } = useNewGround();
  const navigate = useNavigate();
  if (!profileReady) return null;
  const empty = !profile.origin && !profile.destination && !profile.arrival && !profile.duration;

  const researchMove = () => {
    if (!profile.destination) return;
    const parts = [`I'm moving to ${locationLabel(profile.destination)}`];
    if (profile.origin) parts.push(`from ${locationLabel(profile.origin)}`);
    const arrival = arrivalLabel(profile);
    if (arrival !== 'Arrival date not set' && arrival !== 'Not sure yet') parts.push(`around ${arrival}`);
    const duration = durationLabel(profile);
    if (duration !== 'Duration not set' && duration !== 'Not sure yet') parts.push(`for ${duration.toLowerCase()}`);
    const prompt = `${parts.join(' ')}. What should I sort out first?`;
    const task = addTask(prompt);
    if (!task) return;
    void researchTask(task.id, prompt);
    void navigate({ to: '/tasks/$taskId', params: { taskId: task.id } });
  };

  return <section className="move-card" aria-labelledby="move-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="move-heading" className="flex items-center gap-2 text-base font-semibold"><MapPin size={17} className="text-primary" />Your move</h2>
      <Button asChild variant="ghost" className="h-auto px-2 py-1 text-xs font-normal"><Link to="/onboarding"><Pencil size={12} />{empty ? 'Set up your move' : 'Edit'}</Link></Button>
    </div>
    {empty
      ? <p className="mt-3 text-sm leading-6 text-muted-foreground">Tell us where you’re headed and your dashboard will reflect your real plans — no guessing, no example data.</p>
      : <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="move-fact"><dt className="move-fact-label">From</dt><dd className="move-fact-value">{profile.origin ? <>{flagEmoji(profile.origin.countryCode)} {locationLabel(profile.origin)}</> : <span className="text-muted-foreground">Origin not set</span>}</dd></div>
        <div className="move-fact"><dt className="move-fact-label">To</dt><dd className="move-fact-value">{profile.destination ? <>{flagEmoji(profile.destination.countryCode)} {locationLabel(profile.destination)}</> : <span className="text-muted-foreground">Destination not set</span>}</dd></div>
        <div className="move-fact"><dt className="move-fact-label flex items-center gap-1"><CalendarDays size={11} />Arrival</dt><dd className="move-fact-value">{arrivalLabel(profile)}</dd></div>
        <div className="move-fact"><dt className="move-fact-label flex items-center gap-1"><Hourglass size={11} />Duration</dt><dd className="move-fact-value">{durationLabel(profile)}</dd></div>
      </dl>}
    {hasDestination(profile)
      ? <Button onClick={researchMove} className="mt-5 h-10"><Sparkles size={15} />Research my move<ArrowRight size={14} /></Button>
      : !empty && <p className="mt-4 text-xs leading-5 text-muted-foreground">Add a destination to unlock move research tailored to where you’re going.</p>}
  </section>;
}
