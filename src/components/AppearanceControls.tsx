import { useEffect, useState } from 'react';
import { Minus, Moon, Plus, Sun } from 'lucide-react';

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
  root.style.setProperty('--ui-scale', String(preferences.scale));
}

export function initializeAppearance() {
  applyPreferences(loadPreferences());
}

export function AppearanceControls() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);

  useEffect(() => { applyPreferences(preferences); localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); }, [preferences]);

  const adjustScale = (delta: number) => setPreferences(current => ({
    ...current,
    scale: Math.min(1.2, Math.max(0.9, Math.round((current.scale + delta) * 100) / 100)),
  }));

  return <aside aria-label="Preferencias de visualización" className="appearance-controls fixed bottom-4 right-4 z-[100] flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#171717]/95 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:bottom-6 sm:right-6">
    <button type="button" onClick={() => setPreferences(current => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }))}
      aria-label={`Activar tema ${preferences.theme === 'dark' ? 'claro' : 'oscuro'}`} title={`Tema ${preferences.theme === 'dark' ? 'claro' : 'oscuro'}`}
      className="grid h-10 w-10 place-items-center rounded-xl text-[#FACC15] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FACC15]">
      {preferences.theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
    <span className="mx-0.5 h-6 w-px bg-white/10" aria-hidden="true" />
    <button type="button" onClick={() => adjustScale(-0.05)} disabled={preferences.scale <= 0.9} aria-label="Reducir tamaño de página" title="Reducir tamaño"
      className="grid h-10 w-9 place-items-center rounded-xl text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FACC15] disabled:opacity-40"><Minus className="h-4 w-4" /></button>
    <span className="min-w-[3.2rem] text-center text-xs font-semibold tabular-nums text-gray-300" aria-live="polite">{Math.round(preferences.scale * 100)}%</span>
    <button type="button" onClick={() => adjustScale(0.05)} disabled={preferences.scale >= 1.2} aria-label="Aumentar tamaño de página" title="Aumentar tamaño"
      className="grid h-10 w-9 place-items-center rounded-xl text-gray-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FACC15] disabled:opacity-40"><Plus className="h-4 w-4" /></button>
  </aside>;
}
