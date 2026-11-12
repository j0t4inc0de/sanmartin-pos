/**
 * Utilidad de síntesis sonora pura con Web Audio API para microinteracciones del POS.
 * No requiere archivos externos ni dependencias adicionales.
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    try {
      sharedAudioContext = new AudioCtx();
    } catch {
      return null;
    }
  }
  return sharedAudioContext;
}

/**
 * Emite un sonido bajo y satisfactorio estilo "pop / chime" (TikTok) al concretar una venta.
 */
export async function playSaleSuccessSound(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // 1. Tono grave fundamental (pop senoidal con barrido descendente)
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();

    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(520, now);
    popOsc.frequency.exponentialRampToValueAtTime(210, now + 0.12);

    popGain.gain.setValueAtTime(0.001, now);
    popGain.gain.linearRampToValueAtTime(0.3, now + 0.012);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    popOsc.connect(popGain);
    popGain.connect(ctx.destination);

    // 2. Armónico sutil tipo campana/chime (onda triangular para calidez)
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();

    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(880, now);
    chimeOsc.frequency.exponentialRampToValueAtTime(440, now + 0.14);

    chimeGain.gain.setValueAtTime(0.001, now);
    chimeGain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(ctx.destination);

    popOsc.start(now);
    chimeOsc.start(now);

    popOsc.stop(now + 0.18);
    chimeOsc.stop(now + 0.18);

    popOsc.onended = () => {
      popOsc.disconnect();
      popGain.disconnect();
      chimeOsc.disconnect();
      chimeGain.disconnect();
    };
  } catch (error) {
    // La síntesis de audio nunca debe interrumpir el flujo transaccional de caja
    console.warn('No se pudo reproducir el sonido de confirmación de venta:', error);
  }
}
