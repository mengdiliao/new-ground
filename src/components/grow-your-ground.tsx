import { useEffect, useState } from 'react';
import { Droplet, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const plantStorageKey = 'new-ground:plant-stage';

export function GrowYourGround() {
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState(false);
  const [watering, setWatering] = useState(0);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(plantStorageKey);
      const value = saved === null ? 0 : Number(saved);
      setStage(Number.isInteger(value) && value >= 0 && value <= 4 ? value : 0);
    } catch { setStorageError(true); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(plantStorageKey, String(stage)); }
    catch { setStorageError(true); }
  }, [stage, ready]);

  function water() {
    if (!ready || stage >= 4) return;
    setStage(current => Math.min(4, current + 1));
    setWatering(current => current + 1);
  }

  return <section aria-label="Grow Your Ground" className="ground-widget mb-6 border-t border-border px-3 pt-4" data-stage={stage}>
    <svg className="ground-illustration" viewBox="0 0 180 142" role="img" aria-label={`Plant growth stage ${stage} of 4`}>
      <path className="ground-soil" d="M22 83 Q90 78 158 83 L151 130 Q90 137 29 130 Z" />
      <g className="ground-roots" fill="none" strokeWidth="2">
        <path d="M90 82 C86 97 96 109 89 130 M90 91 Q75 100 62 115 M91 101 Q109 110 122 125" />
        <path className="ground-detail ground-later" d="M78 99 L66 100 L56 107 M71 105 L73 118 M105 110 L117 109 L128 116 M113 118 L111 131 M89 116 L79 127" strokeWidth="1.3" />
      </g>
      <path className="ground-surface" d="M22 83 Q90 78 158 83" fill="none" strokeWidth="1.5" />
      <g className="ground-plant">
        <path className="ground-trunk" d="M90 81 Q93 56 90 28" fill="none" strokeWidth="4" />
        <path className="ground-branch ground-later" d="M91 58 L70 39 M91 47 L111 30" fill="none" strokeWidth="2.5" />
        <path className="ground-leaf" d="M90 52 C71 53 62 41 65 32 C81 32 91 39 90 52 Z" />
        <path className="ground-leaf ground-second" d="M91 42 C92 27 102 22 114 24 C114 36 104 44 91 42 Z" />
        <path className="ground-leaf ground-more" d="M91 67 C103 52 114 52 122 56 C116 69 103 73 91 67 Z M89 29 C77 28 74 17 79 11 C89 14 94 22 89 29 Z" />
        <g className="ground-canopy ground-later">
          <path d="M59 44 C43 36 50 17 65 18 C61 3 79 0 89 10 C103 -1 121 5 118 19 C139 18 143 40 128 46 C114 57 102 47 91 51 C77 55 65 55 59 44 Z" />
          <path className="ground-canopy-light" d="M63 23 C71 9 86 13 91 19 C103 11 120 18 122 31 C110 38 103 34 94 37 C79 40 67 35 63 23 Z" />
        </g>
      </g>
      {watering > 0 && <g key={watering} className="ground-water" aria-hidden="true">
        <path d="M52 16 Q44 27 52 27 Q60 27 52 16 Z" />
        <path d="M128 9 Q120 20 128 20 Q136 20 128 9 Z" />
        <path d="M113 27 Q105 38 113 38 Q121 38 113 27 Z" />
      </g>}
    </svg>
    <div className="flex h-8 items-center justify-center gap-1" aria-live="polite">
      {stage < 4 ? <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" aria-label="Water plant" title="Water plant" disabled={!ready} onClick={water}><Droplet aria-hidden="true" /></Button> : <><span className="font-plant-message text-sm font-semibold text-sage-foreground">Rooting for you! 🌱</span><Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-full text-muted-foreground" aria-label="Reset plant growth" title="Reset plant growth" onClick={() => { setStage(0); setWatering(0); }}><RotateCcw aria-hidden="true" /></Button></>}
    </div>
    {storageError && <p role="status" className="mt-2 text-xs text-muted-foreground">Growth can’t be saved on this device.</p>}
  </section>;
}