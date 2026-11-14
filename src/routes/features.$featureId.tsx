import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationPicker } from '@/components/location-picker';
import { RequestComposer } from '@/components/request-composer';
import { findFeature } from '@/lib/features';
import { useProfile } from '@/lib/profile-context';
import { locationLabel } from '@/lib/locations';

export const Route = createFileRoute('/features/$featureId')({
  head: ({ params }) => {
    const feature = findFeature(params.featureId);
    const title = feature ? `${feature.title} — New Ground` : 'Feature — New Ground';
    const description = feature?.description ?? 'A New Ground feature workspace.';
    return { meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }] };
  },
  component: FeaturePage,
});

function FeaturePage() {
  const { featureId } = Route.useParams();
  const { profile, saveProfile, profileReady } = useProfile();
  const feature = findFeature(featureId);

  if (!feature) {
    return (
      <main className="page-content soft-enter">
        <section className="feature-workspace">
          <h1 className="text-2xl font-semibold">This feature isn’t here anymore</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may have been moved or renamed.</p>
          <Button asChild variant="outline" className="mt-5"><Link to="/"><ArrowLeft size={14} />Back home</Link></Button>
        </section>
      </main>
    );
  }

  const city = profile.destination ? locationLabel(profile.destination) : 'your new city';
  const prompts = feature.prompts.map(prompt => prompt.replaceAll('{city}', city));

  return (
    <main className="page-content soft-enter">
      <Button asChild variant="ghost" className="mb-4 h-auto px-2 py-1 text-xs font-normal"><Link to="/"><ArrowLeft size={13} />Back home</Link></Button>
      <section className="feature-workspace" aria-labelledby="feature-heading">
        <div className="feature-hero">
          <div className="feature-hero-copy">
            <h1 id="feature-heading" className="feature-hero-title">{feature.title}</h1>
            <p className="feature-hero-description">{feature.description}</p>
            {profileReady && !profile.destination && (
              <div className="feature-context">
                <p className="flex items-center gap-2 text-xs font-semibold text-primary"><MapPin size={13} />Where are you headed?</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Set your destination and every answer here is tailored to your city. You can also just ask away.</p>
                <div className="mt-3 max-w-xs">
                  <LocationPicker id="feature-destination" label="Destination" value={profile.destination} onSelect={location => saveProfile({ ...profile, destination: location })} placeholder="Search your new city" />
                </div>
              </div>
            )}
            {profileReady && profile.destination && (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={12} className="text-primary" />Answers tailored to {locationLabel(profile.destination)}</p>
            )}
          </div>
          <div className="feature-hero-art" aria-hidden="true">
            <img src={feature.image} alt="" width={816} height={816} />
          </div>
        </div>
        <RequestComposer prompts={prompts} placeholder={`Ask about ${feature.title.toLowerCase()}…`} />
      </section>
    </main>
  );
}
