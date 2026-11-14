import movingImage from '@/assets/feature-moving.png';
import peopleImage from '@/assets/feature-people.png';
import emergencyImage from '@/assets/feature-emergency.png';
import checklistImage from '@/assets/feature-checklist.png';

// Feature discovery catalog. Each feature is an entry point to a dedicated
// workspace that reuses the same composer and research workflow as the home
// page — presentation only, no forked behavior.
export interface Feature {
  slug: string;
  title: string;
  description: string;
  icon: 'scale' | 'users' | 'shield' | 'checklist';
  image: string;
  imageAlt: string;
  // Prompt templates; {city} is replaced with the destination label when set.
  prompts: readonly string[];
}

export const features: readonly Feature[] = [
  {
    slug: 'moving-requirements',
    title: 'Moving Requirements',
    description: 'Understand the rules and requirements between your old and new home.',
    icon: 'scale',
    image: movingImage,
    imageAlt: 'Two miniature cities connected by a bridge',
    prompts: [
      'What paperwork do I need when moving to {city}?',
      'Do I need a residence permit or registration in {city}?',
      'What should I sort out in my current home before moving to {city}?',
    ],
  },
  {
    slug: 'find-your-people',
    title: 'Find Your People',
    description: 'Discover local clubs, communities, and activities that match your interests.',
    icon: 'users',
    image: peopleImage,
    imageAlt: 'People gathering in a miniature park',
    prompts: [
      'How can I meet people and make friends in {city}?',
      'What clubs, hobby groups, or communities exist in {city}?',
      'Are there expat or newcomer communities in {city}?',
    ],
  },
  {
    slug: 'emergency-essentials',
    title: 'Emergency Essentials',
    description: 'Keep important local emergency contacts and services within reach.',
    icon: 'shield',
    image: emergencyImage,
    imageAlt: 'A miniature hospital and public safety building',
    prompts: [
      'What are the emergency numbers and services in {city}?',
      'How do I find a doctor or health clinic in {city}?',
      'What should I do in a medical emergency in {city}?',
    ],
  },
  {
    slug: 'arrival-checklist',
    title: 'Arrival Checklist',
    description: 'Know what to prepare, which offices to visit, and what to do next.',
    icon: 'checklist',
    image: checklistImage,
    imageAlt: 'Documents beside a miniature city hall',
    prompts: [
      'What should I do in my first week after arriving in {city}?',
      'Which offices do I need to visit when settling in {city}?',
      'What should I prepare before moving to {city}?',
    ],
  },
] as const;

export function findFeature(slug: string): Feature | undefined {
  return features.find(feature => feature.slug === slug);
}
