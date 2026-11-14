import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight, ArrowLeftRight, CalendarDays, Hourglass, MapPin, Pencil, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationPicker } from '@/components/location-picker';
import { useProfile } from '@/lib/profile-context';
import { useNewGround } from '@/lib/task-context';
import { arrivalLabel, durationLabel, hasDestination, swapLocations } from '@/lib/profile';
import { locationLabel } from '@/lib/locations';

// Compact travel-inspired journey card: inline From/To pickers with a swap
// control, plus arrival and duration. Every value stays unset until the user
// picks it; arrival and duration are edited in the onboarding flow.
export function MoveCard() {
  const { profile, saveProfile, profileReady } = useProfile();
  const { addTask, researchTask } = useNewGround();
  const navigate = useNavigate();
  if (!profileReady) return null;

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

  return (
    <section className="move-card" aria-labelledby="move-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="move-heading" className="flex items-center gap-2 text-base font-semibold"><MapPin size={17} className="text-primary" />Your move</h2>
        <Button asChild variant="ghost" className="h-auto px-2 py-1 text-xs font-normal"><Link to="/onboarding"><Pencil size={12} />Arrival &amp; duration</Link></Button>
      </div>
      <div className="journey-row">
        <LocationPicker id="move-origin" label="Moving from" value={profile.origin} onSelect={location => saveProfile({ ...profile, origin: location })} placeholder="Where from?" />
        <button
          type="button"
          className="journey-swap"
          aria-label="Swap origin and destination"
          onClick={() => saveProfile(swapLocations(profile))}
        >
          <ArrowLeftRight size={15} />
        </button>
        <LocationPicker id="move-destination" label="Moving to" value={profile.destination} onSelect={location => saveProfile({ ...profile, destination: location })} placeholder="Where to?" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="move-fact"><dt className="move-fact-label flex items-center gap-1"><CalendarDays size={11} />Arrival</dt><dd className="move-fact-value">{arrivalLabel(profile)}</dd></div>
        <div className="move-fact"><dt className="move-fact-label flex items-center gap-1"><Hourglass size={11} />Duration</dt><dd className="move-fact-value">{durationLabel(profile)}</dd></div>
      </div>
      {hasDestination(profile)
        ? <Button onClick={researchMove} className="mt-4 h-10"><Sparkles size={15} />Research my move<ArrowRight size={14} /></Button>
        : <p className="mt-4 text-xs leading-5 text-muted-foreground">Pick a destination to unlock move research tailored to where you’re going. Everything stays optional — explore freely.</p>}
    </section>
  );
}
