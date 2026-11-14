import { Link } from '@tanstack/react-router';
import { ArrowRight, ClipboardList, Scale, Shield, Users } from 'lucide-react';
import type { Feature } from '@/lib/features';

const icons = { scale: Scale, users: Users, shield: Shield, checklist: ClipboardList } as const;

// Feature discovery card: distinctive illustration plus a clear heading and
// description, navigating to the feature's dedicated workspace.
export function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = icons[feature.icon];
  return (
    <Link to="/features/$featureId" params={{ featureId: feature.slug }} className="feature-card control control-card group" aria-label={`${feature.title} — ${feature.description}`}>
      <div className="feature-illustration" aria-hidden="true">
        <img src={feature.image} alt="" loading="lazy" width={816} height={816} />
      </div>
      <div className="feature-body">
        <span className="feature-icon"><Icon size={16} /></span>
        <h3 className="feature-title">{feature.title}</h3>
        <p className="feature-description">{feature.description}</p>
        <span className="feature-cta">Explore<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
}
