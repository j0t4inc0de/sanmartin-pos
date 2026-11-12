import { useEffect, useRef, useState } from 'react';
import { Check, Minus, Moon, Plus, Settings2, Sun, X } from 'lucide-react';

type Theme = 'dark' | 'light';
type Preferences = { theme: Theme; scale: number };
const STORAGE_KEY = 'sanmartin.appearance.v1';
const DEFAULTS: Preferences = { theme: 'dark', scale: 1 };

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      scale: typeof parsed.scale === 'number' && parsed.scale >= 0.9 && parsed.scale <= 1.2
        ? Math.round(parsed.scale * 100) / 100 : 1,
    };
  } catch { return DEFAULTS; }
}

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset.theme = preferences.theme;
  root.dataset.uiScale = String(Math.round(preferences.scale * 100));
  root.style.setProperty('--ui-scale', String(preferences.scale));
}

export function initializeAppearance() {
  applyPreferences(loadPreferences());
}

export function AppearanceControls() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    applyPreferences(preferences);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* The visual preference still applies for this visit. */ }
  }, [preferences]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const adjustScale = (delta: number) => setPreferences(current => ({
    ...current,
    scale: Math.min(1.2, Math.max(0.9, Math.round((current.scale + delta) * 100) / 100)),
  }));

  return <aside ref={containerRef} aria-label="Preferencias de visualización" className="appearance-controls fixed bottom-4 right-4 z-[100] sm:bottom-6 sm:right-6">
    {open && <section id="appearance-popover" role="dialog" className="appearance-popover mb-3 w-[min(21rem,calc(100vw-2rem))] rounded-2xl p-4" aria-label="Ajustes de apariencia">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div><h2 className="text-sm font-bold">Apariencia</h2><p className="mt-0.5 text-xs">Personaliza cómo ves esta página</p></div>
      </div>
      <div className="space-y-4">
        <fieldset><legend className="mb-2 text-xs font-semibold uppercase tracking-wider">Tema</legend><div className="appearance-segment grid grid-cols-2 gap-1 rounded-xl p-1">
          {(['dark', 'light'] as const).map(theme => <button key={theme} type="button" aria-pressed={preferences.theme === theme} onClick={() => setPreferences(current => ({ ...current, theme }))} className={`appearance-option inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${preferences.theme === theme ? 'is-selected' : ''}`}>
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}{theme === 'dark' ? 'Oscuro' : 'Claro'}{preferences.theme === theme && <Check className="ml-auto h-3.5 w-3.5" />}
          </button>)}
        </div></fieldset>
        <div><div className="mb-2 flex items-center justify-between"><label htmlFor="appearance-scale" className="text-xs font-semibold uppercase tracking-wider">Tamaño de la página</label><output htmlFor="appearance-scale" className="appearance-scale-value text-sm font-bold tabular-nums">{Math.round(preferences.scale * 100)}%</output></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => adjustScale(-0.05)} disabled={preferences.scale <= 0.9} aria-label="Reducir tamaño" className="appearance-step grid h-9 w-9 shrink-0 place-items-center rounded-lg disabled:opacity-40"><Minus className="h-4 w-4" /></button>
            <input id="appearance-scale" type="range" min="0.9" max="1.2" step="0.05" value={preferences.scale} aria-valuetext={`${Math.round(preferences.scale * 100)} por ciento`} onChange={event => setPreferences(current => ({ ...current, scale: Number(event.target.value) }))} className="appearance-range min-w-0 flex-1" />
            <button type="button" onClick={() => adjustScale(0.05)} disabled={preferences.scale >= 1.2} aria-label="Aumentar tamaño" className="appearance-step grid h-9 w-9 shrink-0 place-items-center rounded-lg disabled:opacity-40"><Plus className="h-4 w-4" /></button>
          </div><div className="mt-1 flex justify-between px-11 text-[10px] tabular-nums"><span>90%</span><span>120%</span></div>
        </div>
      </div>
    </section>}
    <button ref={triggerRef} type="button" aria-expanded={open} aria-haspopup="dialog" aria-controls="appearance-popover" aria-label={open ? 'Cerrar ajustes de apariencia' : 'Abrir ajustes de apariencia'} title={open ? 'Cerrar ajustes' : 'Ajustes de apariencia'} onClick={() => setOpen(value => !value)} className="appearance-trigger inline-flex h-12 w-12 items-center justify-center rounded-xl p-0 transition-transform duration-200 active:scale-95">
      {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Settings2 aria-hidden="true" className="h-5 w-5" />}
    </button>
  </aside>;
}
