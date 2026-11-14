import { useState, type ReactNode } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { Sprout, Plus, House, Layers, Settings, PanelLeftClose, PanelLeftOpen, Leaf, X, Menu, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNewGround } from '@/lib/task-context';
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { tasks, newTask: createNewTask, storageError } = useNewGround();
  const savedTasks = tasks.filter(task => !task.demo).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  const newTask = () => { setMobileOpen(false); const task = createNewTask(); navigate({ to: '/tasks/$taskId', params: { taskId: task.id } }); };
  return <div className="flex min-h-screen w-full">
    {mobileOpen && <div className="fixed inset-0 z-30 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`app-sidebar shrink-0 border-r border-border ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'max-md:block' : 'max-md:hidden'}`} aria-label="Main navigation">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-7">
        <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 whitespace-nowrap"><span className="logo-mark"><Sprout size={23} strokeWidth={1.7} /></span>{!collapsed && <span className="font-display text-xl font-bold">New Ground<span className="text-primary">.</span></span>}</Link>
        <Button onClick={newTask} className={`mt-9 h-11 ${collapsed ? 'px-0' : 'w-full'}`} title="New task"><Plus size={18} />{!collapsed && 'New Task'}</Button>
        <nav className="mt-7 space-y-2">
          <Button asChild variant="nav" data-active={pathname === '/'} className="h-11 w-full px-3" title="Home"><Link to="/" onClick={() => setMobileOpen(false)}><House />{!collapsed && 'Home'}</Link></Button>
          <Button asChild variant="nav" data-active={pathname.startsWith('/tasks')} className="h-11 w-full px-3" title="My tasks"><Link to="/tasks" onClick={() => setMobileOpen(false)}><Layers />{!collapsed && <><span>Task History</span><span className="ml-auto text-xs">{tasks.length}</span></>}</Link></Button>
          <Button asChild variant="nav" data-active={pathname === '/onboarding'} className="h-11 w-full px-3" title="My move"><Link to="/onboarding" onClick={() => setMobileOpen(false)}><MapPin />{!collapsed && 'My Move'}</Link></Button>
        </nav>
        {!collapsed && <div className="mt-10"><p className="px-3 text-[10px] font-semibold uppercase text-muted-foreground">Recent conversations</p><div className="mt-3 space-y-1">{savedTasks.slice(0, 5).map(task => <Button key={task.id} variant="nav" className="h-auto min-h-10 w-full px-3 py-2 text-left text-xs font-normal" data-active={pathname === `/tasks/${task.id}`} onClick={() => { navigate({ to: '/tasks/$taskId', params: { taskId: task.id } }); setMobileOpen(false); }}><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" /><span className="truncate">{task.title}</span></Button>)}{!savedTasks.length && <p className="px-3 text-xs leading-6 text-muted-foreground">Your questions and tasks will appear here.</p>}</div></div>}
        <div className="mt-auto pt-12">{!collapsed && <div className="mb-6 border-t border-border px-3 pt-5"><Leaf size={22} className="mb-3 text-primary/70" /><p className="text-sm font-medium">A little clarity.<br />A little more possibility.</p><p className="mt-2 text-xs text-muted-foreground">One step at a time.</p></div>}
          <Button asChild variant="nav" data-active={pathname === '/settings'} className="h-10 w-full px-3" title="Settings"><Link to="/settings" onClick={() => setMobileOpen(false)}><Settings />{!collapsed && 'Settings'}</Link></Button>
          <div className="mt-5 flex items-center justify-between border-t border-border pt-4">{!collapsed && <span />}<Button variant="ghost" size="icon" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)} className="hidden h-7 w-7 md:inline-flex">{collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</Button><Button variant="ghost" size="icon" aria-label="Close menu" className="md:hidden" onClick={() => setMobileOpen(false)}><X /></Button></div>
        </div>
      </div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="flex h-[76px] items-center justify-between border-b border-border px-7 md:px-12"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></Button><span className="font-display text-lg font-bold md:hidden">New Ground.</span><span className="hidden text-sm font-medium md:inline">{pathname === '/tasks' ? 'Task History' : pathname === '/settings' ? 'Settings' : pathname === '/onboarding' ? 'Your move' : ''}</span></div><div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-primary/60" />Web search enabled</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach text-xs font-semibold text-peach-foreground" title="Guest">G</span></div></header>
      {storageError && <p role="alert" className="border-b border-border bg-peach px-7 py-3 text-sm text-peach-foreground">{storageError}</p>}{children}
    </div>

  </div>;
}