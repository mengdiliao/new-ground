import { useState } from 'react';
import { ExternalLink, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ResearchImage } from '@/lib/research-images';
function SourceImage({ image, onOpen }: { image: ResearchImage; onOpen: () => void }) {
  const [failed, setFailed] = useState(false);
  if (failed || !image.dataUrl) return null;
  return <figure className="min-w-0"><Button variant="ghost" className="research-image-button" aria-label={`Preview image from ${image.sourceTitle}`} onClick={onOpen}><img src={image.dataUrl} alt={image.alt || `Page image from ${image.sourceTitle}`} loading="lazy" decoding="async" onError={() => setFailed(true)} onLoad={event => { if (event.currentTarget.naturalWidth < 240 || event.currentTarget.naturalHeight < 140) setFailed(true); }} /><Expand size={14} className="absolute bottom-2 right-2 text-foreground" /></Button><figcaption className="mt-1 text-[10px] leading-4 text-muted-foreground"><a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{image.sourceTitle}</a> · Source-page image</figcaption></figure>;
}
export function ResearchImageGallery({ images }: { images: ResearchImage[] }) {
  const [selected, setSelected] = useState<ResearchImage | null>(null);
  if (!images.length) return null;
  return <div className="mt-4"><div className="research-image-grid">{images.slice(0, 3).map(image => <SourceImage key={image.url} image={image} onOpen={() => setSelected(image)} />)}</div><Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>{selected && <DialogContent className="max-h-[85dvh] w-[calc(100%-32px)] max-w-2xl overflow-y-auto rounded-xl"><DialogTitle className="pr-6 leading-6">{selected.sourceTitle}</DialogTitle><DialogDescription>{selected.alt || 'Image provided by this source page.'}</DialogDescription><img src={selected.dataUrl} alt={selected.alt || selected.sourceTitle} className="max-h-[55dvh] w-full object-contain" /><Button asChild variant="link" className="justify-start px-0"><a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Original source and image rights</a></Button></DialogContent>}</Dialog></div>;
}