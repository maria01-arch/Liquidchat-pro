/**
 * Audio Synthesizer & Media Recorder Helpers for Pigion
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a subtle liquid message notification sound
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn('Audio feedback failed', e);
  }
}

/**
 * Play a subtle click/send sound
 */
export function playSendSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.warn('Audio feedback failed', e);
  }
}

/**
 * Format audio seconds into mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Generate synthetic voice wave frequencies array for visual UI representation
 */
export function generateWaveformData(count: number = 24): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    bars.push(Math.floor(Math.random() * 70) + 20);
  }
  return bars;
}

/**
 * Play a synthesized vocal audio playback for voice notes when no mic file exists
 */
export function playVoiceSynthNote(
  durationSeconds: number,
  onEnded: () => void
): { stop: () => void } {
  let isStopped = false;
  let timerId: any = null;

  try {
    const ctx = getAudioContext();
    const duration = Math.max(durationSeconds, 2);
    const now = ctx.currentTime;

    // Create a pleasant warm speech/vocal synthesis using modulated oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';

    // Vocal formant frequencies
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    // Pitch modulation mimicking human speech cadence
    const baseFreq = 220; // A3 pitch
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

    // Add rhythmic pitch variations
    for (let t = 0.2; t < duration; t += 0.3) {
      const freqVar = baseFreq + (Math.sin(t * 8) * 35);
      osc1.frequency.setValueAtTime(freqVar, now + t);
      osc2.frequency.setValueAtTime(freqVar * 1.5, now + t);
      filter.frequency.setValueAtTime(600 + (Math.cos(t * 10) * 400), now + t);
    }

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
    gain.gain.setValueAtTime(0.12, now + duration - 0.15);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    timerId = setTimeout(() => {
      if (!isStopped) {
        onEnded();
      }
    }, duration * 1000);

    return {
      stop: () => {
        isStopped = true;
        if (timerId) clearTimeout(timerId);
        try {
          gain.gain.cancelScheduledValues(ctx.currentTime);
          gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          setTimeout(() => {
            osc1.stop();
            osc2.stop();
            osc1.disconnect();
            osc2.disconnect();
          }, 60);
        } catch (e) {
          // ignore cleanup errors
        }
      },
    };
  } catch (e) {
    console.warn('Voice synth playback failed', e);
    timerId = setTimeout(() => onEnded(), durationSeconds * 1000);
    return {
      stop: () => {
        if (timerId) clearTimeout(timerId);
      },
    };
  }
}

