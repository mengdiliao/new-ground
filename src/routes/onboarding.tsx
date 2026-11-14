import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, ArrowUpDown, CalendarDays, Check, Hourglass, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationPicker } from '@/components/location-picker';
import { useProfile } from '@/lib/profile-context';
import { durationChoices, durationLabels, swapLocations, type ArrivalPlan, type DurationPlan, type Profile } from '@/lib/profile';
import type { LocationValue } from '@/lib/locations';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/onboarding')({
  head: () => ({ meta: [{ title: 'Your move — New Ground' }, { name: 'description', content: 'Tell New Ground about your move so your dashboard can reflect your real plans.' }, { property: 'og:title', content: 'Your move — New Ground' }, { property: 'og:description', content: 'Set your origin, destination, arrival, and duration — or leave them for later.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Onboarding,
});

const steps = ['Where', 'When', 'How long'] as const;

function Onboarding() {
  const { profile, saveProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState<LocationValue | null>(profile.origin);
  const [destination, setDestination] = useState<LocationValue | null>(profile.destination);
  const [arrival, setArrival] = useState<ArrivalPlan | null>(profile.arrival);
  const [arrivalMode, setArrivalMode] = useState<'exact' | 'month' | 'unsure' | null>(profile.arrival?.kind ?? null);
  const [duration, setDuration] = useState<DurationPlan | null>(profile.duration);
  const [customDuration, setCustomDuration] = useState(profile.duration?.choice === 'custom' ? profile.duration.custom ?? '' : '');

  const finish = () => {
    const next: Profile = { origin, destination, arrival, duration };
    saveProfile(next);
    void navigate({ to: '/' });
  };
  const swap = () => {
    const swapped = swapLocations({ origin, destination, arrival, duration });
    setOrigin(swapped.origin);
    setDestination(swapped.destination);
  };
  const pickArrivalMode = (mode: 'exact' | 'month' | 'unsure') => {
    setArrivalMode(mode);
    if (mode === 'unsure') setArrival({ kind: 'unsure' });
    else setArrival(current => current?.kind === mode ? current : null);
  };
  const pickDuration = (choice: DurationPlan['choice']) => {
    if (choice === 'custom') setDuration({ choice, custom: customDuration });
    else setDuration({ choice });
  };

  return <main className="page-content soft-enter">
    <div className="mx-auto max-w-2xl">
      <p className="mb-2 text-xs font-semibold text-primary">Your move</p>
      <h1 className="font-display text-3xl font-semibold">Tell us where life is taking you.</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Everything here is optional. Skip anything you haven’t decided — your dashboard will simply show it as not set.</p>
      <ol className="mt-8 flex items-center gap-2" aria-label="Onboarding progress">
        {steps.map((label, index) => <li key={label} className="flex items-center gap-2">
          <button type="button" onClick={() => setStep(index)} aria-current={step === index ? 'step' : undefined} className={cn('flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors', step === index ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground')}>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[10px]">{index + 1}</span>{label}
          </button>
          {index < steps.length - 1 && <span className="h-px w-5 bg-border" aria-hidden />}
        </li>)}
      </ol>

      {step === 0 && <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm" aria-labelledby="locations-heading">
        <h2 id="locations-heading" className="flex items-center gap-2 text-base font-semibold"><MapPin size={17} className="text-primary" />Where are you moving?</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <LocationPicker id="origin" label="Moving from" value={origin} onSelect={setOrigin} placeholder="Choose your current city" />
          <div className="flex justify-center pb-1">
            <Button type="button" variant="outline" size="icon" onClick={swap} aria-label="Swap origin and destination" title="Swap origin and destination" className="rounded-full"><ArrowUpDown size={15} /></Button>
          </div>
          <LocationPicker id="destination" label="Moving to" value={destination} onSelect={setDestination} placeholder="Choose your new city" />
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">Search any city in English, or browse by country. A city is only saved when you pick it from the list.</p>
      </section>}

      {step === 1 && <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm" aria-labelledby="arrival-heading">
        <h2 id="arrival-heading" className="flex items-center gap-2 text-base font-semibold"><CalendarDays size={17} className="text-primary" />When do you arrive?</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Arrival date type">
          {([['exact', 'Exact date'], ['month', 'Approximate month'], ['unsure', 'Not sure yet']] as const).map(([mode, label]) => <button key={mode} type="button" role="radio" aria-checked={arrivalMode === mode} onClick={() => pickArrivalMode(mode)} className={cn('rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors', arrivalMode === mode ? 'border-primary bg-accent text-accent-foreground' : 'border-border bg-background hover:bg-muted')}>{label}</button>)}
        </div>
        {arrivalMode === 'exact' && <div className="mt-4">
          <label htmlFor="arrival-date" className="text-xs font-semibold text-muted-foreground">Arrival date</label>
          <input id="arrival-date" type="date" value={arrival?.kind === 'exact' ? arrival.date : ''} onChange={event => setArrival(event.target.value ? { kind: 'exact', date: event.target.value } : null)} className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>}
        {arrivalMode === 'month' && <div className="mt-4">
          <label htmlFor="arrival-month" className="text-xs font-semibold text-muted-foreground">Arrival month</label>
          <input id="arrival-month" type="month" value={arrival?.kind === 'month' ? arrival.month : ''} onChange={event => setArrival(event.target.value ? { kind: 'month', month: event.target.value } : null)} className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>}
      </section>}

      {step === 2 && <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm" aria-labelledby="duration-heading">
        <h2 id="duration-heading" className="flex items-center gap-2 text-base font-semibold"><Hourglass size={17} className="text-primary" />How long do you expect to stay?</h2>
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Expected duration">
          {durationChoices.map(choice => <button key={choice} type="button" role="radio" aria-checked={duration?.choice === choice} onClick={() => pickDuration(choice)} className={cn('flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors', duration?.choice === choice ? 'border-primary bg-accent text-accent-foreground' : 'border-border bg-background hover:bg-muted')}>
            {durationLabels[choice]}
            {duration?.choice === choice && <Check size={15} className="text-primary" />}
          </button>)}
        </div>
        {duration?.choice === 'custom' && <div className="mt-4">
          <label htmlFor="custom-duration" className="text-xs font-semibold text-muted-foreground">Describe your duration</label>
          <input id="custom-duration" type="text" maxLength={120} value={customDuration} placeholder="For example: two academic years" onChange={event => { setCustomDuration(event.target.value); setDuration({ choice: 'custom', custom: event.target.value }); }} className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
        </div>}
      </section>}

      <div className="mt-7 flex items-center justify-between">
        {step > 0 ? <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={15} />Back</Button> : <span />}
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={finish}>Skip for now</Button>
          {step < steps.length - 1
            ? <Button onClick={() => setStep(step + 1)}>Continue<ArrowRight size={15} /></Button>
            : <Button onClick={finish}>Save my move<Check size={15} /></Button>}
        </div>
      </div>
    </div>
  </main>;
}
