import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { ArrowUpRight, Check, ExternalLink, LoaderCircle, MessageCircle, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useEssentials } from '@/lib/city-essentials-context';
import { essentialKey, isOutdated, itemContext, type EssentialCategory, type EssentialItem } from '@/lib/city-essentials';
import { useProfile } from '@/lib/profile-context';
import { useNewGround } from '@/lib/task-context';

const labels = { 'source-supported': 'Source-supported', conditional: 'Check applicability', 'needs-information': 'Needs more information' };
export function CityEssentialItems({ category, compact = false }: { category: EssentialCategory; compact?: boolean }) {
  const { cache, ready, refresh, storageError } = useEssentials();
  const { activeMove } = useProfile();
  const [selected, setSelected] = useState<EssentialItem | null>(null);
  const [interest, setInterest] = useState('all');
  const module = activeMove ? cache[essentialKey(activeMove, category)] : undefined;
  if (!activeMove?.destination) return <p className="py-3 text-xs text-muted-foreground">Set a destination to see your city essentials.</p>;
  const items = (module?.items ?? []).filter(item => interest === 'all' || item.interest === interest);
  return <div className="min-w-0">
    {storageError && !compact && <p role="alert" className="text-xs text-destructive">{storageError}</p>}
    {(!ready || !module || module.status === 'loading') && <p className="flex items-center gap-2 py-4 text-xs text-muted-foreground" role="status"><LoaderCircle size={14} className="animate-spin" />Preparing information for {activeMove.destination.cityName}…</p>}
    {module?.status === 'error' && <div className="py-3"><p role="alert" className="text-xs leading-5 text-muted-foreground">{module.error}</p><Button variant="link" size="sm" onClick={() => refresh(category)}><RefreshCw size={12} />Retry research</Button></div>}
    {module?.status === 'success' && <>
      {!compact && category === 'find-your-people' && <div className="my-4 flex flex-wrap gap-2" aria-label="Interest filters">{['all', ...Array.from(new Set(module.items.map(item => item.interest)))].map(value => <Button key={value} variant={interest === value ? 'secondary' : 'ghost'} size="sm" aria-pressed={interest === value} onClick={() => setInterest(value)}>{value === 'all' ? 'All interests' : value[0]?.toUpperCase() + value.slice(1)}</Button>)}</div>}
      <div className={compact ? 'essential-preview' : 'essential-list'}>{(compact ? items.slice(0, 2) : items).map(item => <Button key={item.id} variant="ghost" className="essential-row" onClick={() => setSelected(item)}><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.contactNumber ? `${item.contactNumber} · ` : ''}{item.title}</span><span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">{item.shortSummary}</span><span className="mt-2 block text-[10px] font-normal text-primary">{item.sourceReferences[0]?.domain} · {labels[item.applicabilityStatus]}</span></span><ArrowUpRight size={14} className="shrink-0 text-primary" /></Button>)}</div>
      {!compact && items.length < 4 && <p className="mt-3 text-xs text-muted-foreground">Additional information could not be verified for this selection.</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] text-muted-foreground">Researched {module.researchedAt ? new Date(module.researchedAt).toLocaleDateString() : ''}{isOutdated(module) ? ' · May be outdated' : ''}</p>{!compact && <Button variant="ghost" size="sm" onClick={() => refresh(category)}><RefreshCw size={13} />Refresh</Button>}</div>
      {!compact && ['moving-requirements', 'emergency-essentials', 'arrival-checklist'].includes(category) && <p className="mt-2 text-xs leading-5 text-muted-foreground">Requirements and contacts can change. Check the linked authority before acting.</p>}
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>{selected && <EssentialDetail item={selected} />}</Dialog>
  </div>;
}
function EssentialDetail({ item }: { item: EssentialItem }) {
  const { addTask, researchTask } = useNewGround();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [added, setAdded] = useState(false);
  const [answer, setAnswer] = useState('');
  const ask = () => { const query = `${answer ? `My answer to ${item.question}: ${answer}\n` : ''}Tell me more about ${itemContext(item)}`.slice(0, 4000); const task = addTask(query, 'query', item.sourceReferences); if (!task) return; void researchTask(task.id, query); void navigate({ to: '/tasks/$taskId', params: { taskId: task.id } }); };
  const add = () => { const task = addTask(itemContext(item), 'task', item.sourceReferences); if (task) { setAdded(true); setConfirm(false); } };
  return <DialogContent className="max-h-[85dvh] w-[calc(100%-32px)] max-w-xl overflow-y-auto rounded-xl">
    <DialogTitle className="pr-6 leading-6">{item.title}</DialogTitle>
    <DialogDescription>{item.shortSummary}</DialogDescription>
    <p className="text-xs font-semibold text-primary">{labels[item.applicabilityStatus]} · {item.region}</p>
    {item.contactNumber && <p className="text-3xl font-bold">{item.contactNumber}</p>}
    <p className="whitespace-pre-line text-sm leading-7">{item.detailedExplanation}</p>
    {item.qualification && <p className="border-l-2 border-brand-coral pl-3 text-xs leading-6 text-muted-foreground">{item.qualification}</p>}
    {item.question && <div><label htmlFor="essential-answer" className="text-sm font-medium">{item.question}</label><input id="essential-answer" value={answer} maxLength={300} onChange={event => setAnswer(event.target.value)} placeholder="Your answer · optional" className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /><Button asChild variant="link" size="sm"><Link to="/onboarding">Confirm your move details<ArrowUpRight size={12} /></Link></Button></div>}
    <div className="border-t border-border pt-3"><h4 className="text-xs font-semibold">Sources</h4>{item.sourceReferences.map(source => <Button key={source.url} variant="link" asChild className="h-auto w-full justify-start whitespace-normal px-0 py-2 text-left text-xs"><a href={source.url} target="_blank" rel="noopener noreferrer"><ExternalLink size={12} />{source.title}</a></Button>)}<p className="text-[10px] text-muted-foreground">Last researched {new Date(item.researchedAt).toLocaleString()}</p></div>
    <div className="flex flex-wrap gap-2"><Button onClick={ask}><MessageCircle size={14} />Ask AI about this</Button>{item.actionable && <Button variant="outline" disabled={added} onClick={() => setConfirm(true)}>{added ? <Check size={14} /> : <Plus size={14} />}{added ? 'Added to Tasks' : 'Add to Tasks'}</Button>}</div>
    {confirm && <div className="border-t border-border pt-3"><p className="mb-2 text-xs">Create a tracked task with this information and its sources?</p><div className="flex gap-2"><Button size="sm" onClick={add}>Confirm add</Button><Button size="sm" variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button></div></div>}
  </DialogContent>;
}