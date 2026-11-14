import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Pencil, Trash2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useNewGround } from '@/lib/task-context';
import { Status } from '@/components/task-card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { taskStages, type Task } from '@/lib/task-data';

export function TaskControls({ task }: { task: Task }) {
  const { renameTask, deleteTask, setTaskStatus, convertQuery } = useNewGround();
  const navigate = useNavigate();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const busy = task.searchState === 'loading';
  return <><div className="flex flex-wrap gap-2"><Button variant="outline" size="icon" title="Rename conversation" aria-label="Rename conversation" onClick={() => { setTitle(task.title); setRenameOpen(true); }}><Pencil /></Button><Button variant="outline" size="icon" disabled={busy} title="Delete conversation" aria-label="Delete conversation" onClick={() => setDeleteOpen(true)}><Trash2 /></Button>{task.type === 'query' ? <Button variant="outline" onClick={() => convertQuery(task.id)}><ListChecks />Turn into a task</Button> : <Select value={task.status ?? 'Not Started'} onValueChange={value => { const status = taskStages.find(stage => stage === value); if (status) setTaskStatus(task.id, status); }}><SelectTrigger aria-label="Task status" className="w-44"><SelectValue><Status task={task} /></SelectValue></SelectTrigger><SelectContent>{taskStages.map(status => <SelectItem key={status} value={status}><Status task={{ ...task, status }} /></SelectItem>)}</SelectContent></Select>}</div><Dialog open={renameOpen} onOpenChange={setRenameOpen}><DialogContent className="max-w-[calc(100%-32px)] sm:max-w-lg"><DialogTitle>Rename conversation</DialogTitle><DialogDescription>Give this task a name you’ll recognize.</DialogDescription><form onSubmit={event => { event.preventDefault(); if (!title.trim()) return; renameTask(task.id, title); setRenameOpen(false); }}><label htmlFor="task-name" className="text-sm">Task name</label><input id="task-name" className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-3 text-sm outline-none focus:border-ring" maxLength={120} value={title} onChange={event => setTitle(event.target.value)} /><div className="mt-5 flex justify-end"><Button type="submit" disabled={!title.trim()}>Save name</Button></div></form></DialogContent></Dialog><AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent className="max-w-[calc(100%-32px)] sm:max-w-lg"><AlertDialogTitle>Delete this conversation?</AlertDialogTitle><AlertDialogDescription>“{task.title}” and its saved conversation, sources, and checklist will be removed from this browser. This cannot be undone.</AlertDialogDescription><AlertDialogFooter><AlertDialogCancel>Keep conversation</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { deleteTask(task.id); void navigate({ to: '/tasks' }); }}>Delete permanently</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></>;
}