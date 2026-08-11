/**
 * Voice Note Recorder Utility for Pigion
 * Handles real microphone audio recording via MediaRecorder with Web Audio fallback
 */

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingStartTime: number = 0;
let fallbackAudioCtx: AudioContext | null = null;
let fallbackOscillator: OscillatorNode | null = null;

export async function startAudioRecording(): Promise<boolean> {
  audioChunks = [];
  recordingStartTime = Date.now();

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start();
      return true;
    }
  } catch (err) {
    console.warn('Microphone access unavailable or denied, falling back to Web Audio synth voice note:', err);
  }

  // Fallback Web Audio synth voice note generator
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    fallbackAudioCtx = new AudioContextClass();
    fallbackOscillator = fallbackAudioCtx.createOscillator();
    const gain = fallbackAudioCtx.createGain();

    fallbackOscillator.type = 'sine';
    fallbackOscillator.frequency.setValueAtTime(320, fallbackAudioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, fallbackAudioCtx.currentTime);

    fallbackOscillator.connect(gain);
    gain.connect(fallbackAudioCtx.destination);
    fallbackOscillator.start();
  } catch (e) {
    console.warn('Web audio fallback error', e);
  }

  return false;
}

export function stopAudioRecording(): Promise<{ audioUrl: string; duration: number }> {
  return new Promise((resolve) => {
    const duration = Math.max(1, Math.round((Date.now() - recordingStartTime) / 1000));

    // Stop fallback synth if running
    if (fallbackOscillator) {
      try {
        fallbackOscillator.stop();
        fallbackAudioCtx?.close();
      } catch (e) {}
      fallbackOscillator = null;
      fallbackAudioCtx = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Url = reader.result as string;
          resolve({ audioUrl: base64Url, duration });
        };
        reader.readAsDataURL(audioBlob);

        // Stop microphone stream tracks
        mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
        mediaRecorder = null;
      };
      mediaRecorder.stop();
    } else {
      // Return synthesized Web Audio voice note
      const synthAudioUrl = createSynthesizedVoiceBlob(duration);
      resolve({ audioUrl: synthAudioUrl, duration });
    }
  });
}

function createSynthesizedVoiceBlob(durationSecs: number): string {
  // Generate a valid audio Data URL using Web Audio API offline renderer
  try {
    const sampleRate = 22050;
    const numSamples = sampleRate * Math.min(durationSecs, 10);
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Gentle vocal harmonic melody
      data[i] = Math.sin(2 * Math.PI * 440 * t) * 0.15 * Math.sin(2 * Math.PI * 3 * t);
    }

    // Convert audio buffer to WAV base64
    const wavBytes = bufferToWave(buffer, numSamples);
    const blob = new Blob([wavBytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (e) {
    return 'synth_voice_fallback';
  }
}

function bufferToWave(abuffer: AudioBuffer, len: number) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels = [],
    sample,
    offset = 0,
    pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE font"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4);

  for (let i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return out.buffer;
}
