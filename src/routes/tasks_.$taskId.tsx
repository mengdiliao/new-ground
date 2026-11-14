import { createFileRoute, Link } from '@tanstack/react-router';
import { useNewGround } from '@/lib/task-context';
import { TaskWorkspace } from '@/components/task-workspace';
import { Button } from '@/components/ui/button';
import neighborhood from '@/assets/neighborhood-refined.png';
export const Route = createFileRoute('/tasks_/$taskId')({
  head: ({ params }) => ({ meta: [{ title: `Task ${params.taskId} — New Ground workspace` }, { name: 'description', content: 'Your conversation, progress, research sources, and next steps in one calm task workspace.' }, { property: 'og:title', content: `Task ${params.taskId} — New Ground` }, { property: 'og:description', content: 'A little clarity, one step at a time. Explore your conversation, research, and next steps.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: WorkspacePage,
});
function WorkspacePage() {
  const { taskId } = Route.useParams(); const { tasks, historyReady } = useNewGround(); const task = tasks.find(item => item.id === taskId);
  if (!historyReady) return <main className="page-content"><p role="status">Opening your saved task…</p></main>;
  if (!task) return <main className="page-content py-16 text-center"><img className="empty-world" src={neighborhood} width={1536} height={1024} alt="A quiet miniature neighborhood" /><h1 className="text-2xl font-semibold">This task isn't here anymore.</h1><p className="my-5 text-sm text-muted-foreground">It may have been deleted or saved in a different browser.</p><Button asChild><Link to="/tasks">Back to My Tasks</Link></Button></main>;
  return <TaskWorkspace key={task.id} task={task} />;
}