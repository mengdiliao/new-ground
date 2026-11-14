import { Link } from '@tanstack/react-router';
import { ArrowRight, ClipboardList, Scale, Shield, Users } from 'lucide-react';
import type { Feature } from '@/lib/features';
import { Button } from '@/components/ui/button';
import { CityEssentialItems } from '@/components/city-essential-items';
import type { EssentialCategory } from '@/lib/city-essentials';

const icons = { scale: Scale, users: Users, shield: Shield, checklist: ClipboardList } as const;

// Feature discovery card: distinctive illustration plus a clear heading and
// description, navigating to the feature's dedicated workspace.
export function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = icons[feature.icon];
  return (
    <article className="feature-card essential-hub" aria-label={feature.title}>
      <div className="essential-hub-heading">
      <div className="feature-illustration" aria-hidden="true">
        <img src={feature.image} alt="" loading="lazy" width={816} height={816} />
      </div>
      <div className="feature-body">
        <span className="feature-icon"><Icon size={16} /></span>
        <h3 className="feature-title">{feature.title}</h3>
        <p className="feature-description">{feature.description}</p>
      </div>
      </div>
      <CityEssentialItems category={feature.slug as EssentialCategory} compact />
      <Button asChild variant="link" className="mt-auto h-auto justify-start px-0 pt-4 text-xs"><Link to="/features/$featureId" params={{ featureId: feature.slug }}>View all<ArrowRight size={14} /></Link></Button>
    </article>
  );
}
