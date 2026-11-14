import { useState, type ReactNode } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { Sprout, Plus, House, Layers, Settings, PanelLeftClose, PanelLeftOpen, ArrowUpRight, Leaf, X, Menu, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useNewGround } from '@/components/new-ground-provider';
import { Status } from '@/components/task-card';
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { tasks, selectedTask, selectTask, completeTask } = useNewGround();
  const newTask = () => { setMobileOpen(false); navigate({ to: '/' }).then(() => { document.getElementById('task-input')?.focus(); }); };
  return <div className="flex min-h-screen w-full">
    {mobileOpen && <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`app-sidebar shrink-0 border-r border-border ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'max-md:block' : 'max-md:hidden'}`} aria-label="Main navigation">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-7">
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 whitespace-nowrap"><span className="logo-mark"><Sprout size={23} strokeWidth={1.7} /></span>{!collapsed && <span className="font-display text-xl font-bold">New Ground<span className="text-primary">.</span></span>}</Link>
        <Button onClick={newTask} className={`mt-9 h-11 ${collapsed ? 'px-0' : 'w-full'}`} title="New task"><Plus size={18} />{!collapsed && 'New Task'}</Button>
        <nav className="mt-7 space-y-2">
          <Button asChild variant="nav" data-active={pathname === '/'} className="h-11 w-full px-3" title="Home"><Link to="/" onClick={() => setMobileOpen(false)}><House />{!collapsed && 'Home'}</Link></Button>
          <Button asChild variant="nav" data-active={pathname === '/tasks'} className="h-11 w-full px-3" title="My tasks"><Link to="/tasks" onClick={() => setMobileOpen(false)}><Layers />{!collapsed && <><span>My Tasks</span><span className="ml-auto text-xs">{tasks.length}</span></>}</Link></Button>
        </nav>
        {!collapsed && <div className="mt-10"><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent tasks</p><div className="mt-3 space-y-1">{tasks.slice(0, 3).map(task => <Button key={task.id} variant="nav" className="h-auto min-h-10 w-full px-3 py-2 text-left text-xs font-normal" onClick={() => { selectTask(task); setMobileOpen(false); }}><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" /><span className="truncate">{task.title}</span></Button>)}</div></div>}
        <div className="mt-auto pt-12">{!collapsed && <div className="mb-6 border-t border-border px-3 pt-5"><Leaf size={22} className="mb-3 text-primary/70" /><p className="text-sm font-medium">A little clarity.<br />A little more possibility.</p><p className="mt-2 text-xs text-muted-foreground">One step at a time.</p></div>}
          <Button asChild variant="nav" data-active={pathname === '/settings'} className="h-10 w-full px-3" title="Settings"><Link to="/settings" onClick={() => setMobileOpen(false)}><Settings />{!collapsed && 'Settings'}</Link></Button>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">{!collapsed && <span className="text-[11px] text-muted-foreground">Less searching. More living.</span>}<Button variant="ghost" size="icon" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)} className="hidden h-7 w-7 md:inline-flex">{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button><Button variant="ghost" size="icon" aria-label="Close menu" className="md:hidden" onClick={() => setMobileOpen(false)}><X /></Button></div>
        </div>
      </div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex h-[76px] items-center justify-between border-b border-border px-7 md:px-12"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></Button><span className="text-sm font-medium">{pathname === '/tasks' ? 'My Tasks' : pathname === '/settings' ? 'Settings' : 'Your everyday, a little easier'}</span></div><div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-primary/60" />Frontend preview</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach text-xs font-semibold text-peach-foreground" title="Guest">G</span></div></header>
      {children}
    </div>
    <Dialog open={Boolean(selectedTask)} onOpenChange={open => { if (!open) selectTask(undefined); }}><DialogContent className="max-w-[calc(100%-32px)] sm:max-w-lg">{selectedTask && <><DialogHeader><div className="mb-4"><Status task={selectedTask} /></div><DialogTitle className="pr-6 leading-normal">{selectedTask.title}</DialogTitle><DialogDescription className="pt-2">{selectedTask.description}</DialogDescription></DialogHeader><div className="border-y border-border py-5"><p className="mb-4 text-sm font-semibold">A place to start</p><ol className="space-y-4">{['Write down what a good outcome looks like for you.', 'Gather the information and requirements you already have.', 'Choose one small next step you can take today.'].map((step, index) => <li key={step} className="flex gap-3 text-sm leading-relaxed"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-xs text-sage-foreground">{index + 1}</span>{step}</li>)}</ol></div><p className="text-xs leading-relaxed text-muted-foreground">Sample plan · No AI research has been performed. Tasks stay in this preview session only.</p><Button disabled={selectedTask.status === 'Completed'} onClick={() => completeTask(selectedTask.id)}><CircleCheck />{selectedTask.status === 'Completed' ? 'Task completed' : 'Mark as completed'}<ArrowUpRight className="ml-auto" /></Button></>}</DialogContent></Dialog>
  </div>;
}