import { Link } from '@tanstack/react-router';
import { ArrowUpRight, Plane, BriefcaseBusiness, GraduationCap, Compass, Flag, HeartPulse, House, Wallet, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categoryStyles } from '@/components/task-card';
import type { Topic } from '@/lib/topics';

const icons = { plane: Plane, briefcase: BriefcaseBusiness, graduation: GraduationCap, compass: Compass, flag: Flag, heart: HeartPulse, home: House, wallet: Wallet, family: Users };
export function TopicCard({ topic }: { topic: Topic }) {
  const Icon = icons[topic.icon];
  return <Button asChild variant="suggestion" className="topic-card"><Link to="/topics/$topicId" params={{ topicId: topic.slug }}><span className="flex w-full items-center justify-between"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${categoryStyles[topic.category]}`}><Icon size={20} /></span><ArrowUpRight className="text-muted-foreground" /></span><span className="text-base font-semibold">{topic.title}</span><span className="text-sm font-normal leading-6 text-muted-foreground">{topic.description}</span></Link></Button>;
}