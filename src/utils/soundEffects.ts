/**
 * Utilidad de síntesis sonora pura con Web Audio API para microinteracciones del POS.
 * Genera un sonido "DING!" cristalino, brillante y adictivo (campana de bronce / caja registradora)
 * con efecto dopamina al registrar exitosamente una venta.
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
 * Emite un sonido "DING!" cristalino, brillante y satisfactorio (campana de caja / TikTok chime)
 * con alto impacto de dopamina al concretar una venta.
 */
export async function playSaleSuccessSound(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;

    // Master gain para controlar el volumen sin distorsión
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.4, now);
    masterGain.connect(ctx.destination);

    // --- 1. Ataque mecánico inicial (el 'tick/ping' del percutor sobre el bronce) ---
    const strikeOsc = ctx.createOscillator();
    const strikeGain = ctx.createGain();
    strikeOsc.type = 'triangle';
    strikeOsc.frequency.setValueAtTime(1480, now);
    strikeOsc.frequency.exponentialRampToValueAtTime(2093, now + 0.025); // barrido rápido al tono principal
    strikeGain.gain.setValueAtTime(0.25, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    strikeOsc.connect(strikeGain);
    strikeGain.connect(masterGain);
    strikeOsc.start(now);
    strikeOsc.stop(now + 0.04);

    // --- 2. TONO FUNDAMENTAL DING! (Campana pura y brillante en C7 - 2093 Hz) ---
    const bellTime = now + 0.015;
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(2093.0, bellTime);

    bellGain.gain.setValueAtTime(0.0001, now);
    bellGain.gain.setValueAtTime(0.0001, bellTime);
    bellGain.gain.linearRampToValueAtTime(0.7, bellTime + 0.004); // Ataque ultra-rápido y percusivo
    bellGain.gain.exponentialRampToValueAtTime(0.22, bellTime + 0.2); // Resonancia del cuerpo
    bellGain.gain.exponentialRampToValueAtTime(0.0001, bellTime + 1.25); // Desvanecimiento suave y sostenido

    bellOsc.connect(bellGain);
    bellGain.connect(masterGain);
    bellOsc.start(bellTime);
    bellOsc.stop(bellTime + 1.3);

    // --- 3. Armónico de brillo cristalino (C8 - 4186 Hz / brillo plateado) ---
    const sparkleOsc = ctx.createOscillator();
    const sparkleGain = ctx.createGain();
    sparkleOsc.type = 'sine';
    sparkleOsc.frequency.setValueAtTime(4186.0, bellTime);

    sparkleGain.gain.setValueAtTime(0.0001, bellTime);
    sparkleGain.gain.linearRampToValueAtTime(0.35, bellTime + 0.003);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, bellTime + 0.65); // Brillo que acompaña el tañido

    sparkleOsc.connect(sparkleGain);
    sparkleGain.connect(masterGain);
    sparkleOsc.start(bellTime);
    sparkleOsc.stop(bellTime + 0.7);

    // --- 4. Armónico metálico de campana (5776 Hz - vibración de borde de bronce) ---
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(5776.0, bellTime);

    shimmerGain.gain.setValueAtTime(0.0001, bellTime);
    shimmerGain.gain.linearRampToValueAtTime(0.2, bellTime + 0.002);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, bellTime + 0.25);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmerOsc.start(bellTime);
    shimmerOsc.stop(bellTime + 0.3);

    // Desconexión limpia
    bellOsc.onended = () => {
      try {
        strikeOsc.disconnect();
        strikeGain.disconnect();
        bellOsc.disconnect();
        bellGain.disconnect();
        sparkleOsc.disconnect();
        sparkleGain.disconnect();
        shimmerOsc.disconnect();
        shimmerGain.disconnect();
        masterGain.disconnect();
      } catch {}
    };
  } catch (error) {
    console.warn('No se pudo reproducir el sonido de confirmación de venta:', error);
  }
}
