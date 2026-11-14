import { createFileRoute, Link } from '@tanstack/react-router';
import { useNewGround } from '@/components/new-ground-provider';
import { TaskWorkspace } from '@/components/task-workspace';
import { Button } from '@/components/ui/button';
import neighborhood from '@/assets/neighborhood-refined.png';
export const Route = createFileRoute('/tasks/$taskId')({
  head: ({ params }) => ({ meta: [{ title: `Task ${params.taskId} — New Ground workspace` }, { name: 'description', content: 'Your conversation, progress, example sources, and next steps in one calm task workspace.' }, { property: 'og:title', content: `Task ${params.taskId} — New Ground` }, { property: 'og:description', content: 'A little clarity, one step at a time. Explore your local demo task workspace.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: WorkspacePage,
});
function WorkspacePage() {
  const { taskId } = Route.useParams(); const { tasks } = useNewGround(); const task = tasks.find(item => item.id === taskId);
  if (!task) return <main className="page-content py-16 text-center"><img className="empty-world" src={neighborhood} width={1536} height={1024} alt="A quiet miniature neighborhood" /><h1 className="text-2xl font-semibold">This task isn't here anymore.</h1><p className="my-5 text-sm text-muted-foreground">Tasks last for this preview session. A refresh starts a new session.</p><Button asChild><Link to="/tasks">Back to My Tasks</Link></Button></main>;
  return <TaskWorkspace key={task.id} task={task} />;
}