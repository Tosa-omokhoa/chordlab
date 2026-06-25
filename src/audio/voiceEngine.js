/**
 * voiceEngine.js
 * Module-level voice cache so synths persist across renders.
 * Three voices: Grand (Salamander samples), Electric (FM/Rhodes),
 * Pad (layered oscillators with reverb and chorus).
 */
import * as Tone from 'tone';

// Salamander Grand Piano sample map (C3–C6 subset for our range)
const SALAM_URLS = {
  'A0':'A0.mp3', 'C1':'C1.mp3', 'D#1':'Ds1.mp3', 'F#1':'Fs1.mp3',
  'A1':'A1.mp3', 'C2':'C2.mp3', 'D#2':'Ds2.mp3', 'F#2':'Fs2.mp3',
  'A2':'A2.mp3', 'C3':'C3.mp3', 'D#3':'Ds3.mp3', 'F#3':'Fs3.mp3',
  'A3':'A3.mp3', 'C4':'C4.mp3', 'D#4':'Ds4.mp3', 'F#4':'Fs4.mp3',
  'A4':'A4.mp3', 'C5':'C5.mp3', 'D#5':'Ds5.mp3', 'F#5':'Fs5.mp3',
  'A5':'A5.mp3', 'C6':'C6.mp3',
};

const BASE_URL = 'https://tonejs.github.io/audio/salamander/';

// Synth instances live here; never re-created unless the page reloads
const _cache = {};

export const VOICE_META = [
  { id: 'grand',    label: 'Grand',    desc: 'Salamander acoustic piano' },
  { id: 'electric', label: 'Electric', desc: 'FM synthesis, Rhodes feel'  },
  { id: 'pad',      label: 'Pad',      desc: 'Warm strings with reverb'   },
];

/**
 * Returns the synth for the requested voice, creating it on first call.
 * @param {string} id - 'grand' | 'electric' | 'pad'
 * @param {{ onLoadStart?: () => void, onLoaded?: () => void }} callbacks
 */
export async function getVoice(id, { onLoadStart, onLoaded } = {}) {
  if (_cache[id]) return _cache[id];
  await Tone.start();

  if (id === 'grand') {
    onLoadStart?.();
    const rev = new Tone.Reverb({ decay: 2.2, wet: 0.12 });
    await rev.ready;
    rev.toDestination();

    return new Promise((resolve, reject) => {
      const sampler = new Tone.Sampler({
        urls: SALAM_URLS,
        baseUrl: BASE_URL,
        onload: () => {
          _cache.grand = sampler;
          onLoaded?.();
          resolve(sampler);
        },
        onerror: (err) => {
          console.error('Salamander load error:', err);
          reject(err);
        },
      });
      sampler.connect(rev);
    });
  }

  if (id === 'electric') {
    // FM synth tuned to a bright Rhodes/Wurlitzer character
    const rev = new Tone.Reverb({ decay: 2.5, wet: 0.18 });
    await rev.ready;
    rev.toDestination();

    const cho = new Tone.Chorus({ frequency: 4, delayTime: 2.5, depth: 0.5, wet: 0.3 });
    cho.connect(rev);
    cho.start();

    const poly = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity:        3.01,
      modulationIndex:    13,
      oscillator:         { type: 'sine' },
      envelope:           { attack: 0.002, decay: 0.45, sustain: 0.12, release: 1.2 },
      modulation:         { type: 'square' },
      modulationEnvelope: { attack: 0.002, decay: 0.2,  sustain: 0,    release: 0.2 },
      volume: -5,
    });
    poly.connect(cho);
    _cache.electric = poly;
    return poly;
  }

  if (id === 'pad') {
    // Lush, slow-attack pad with deep chorus and long reverb tail
    const rev = new Tone.Reverb({ decay: 5, wet: 0.45 });
    await rev.ready;
    rev.toDestination();

    const cho = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0.4 });
    cho.connect(rev);
    cho.start();

    const poly = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 22 },
      envelope:   { attack: 0.9, decay: 0.2, sustain: 0.8, release: 3.5 },
      volume: -10,
    });
    poly.connect(cho);
    _cache.pad = poly;
    return poly;
  }

  throw new Error(`Unknown voice id: ${id}`);
}

/** Stop any ringing notes on a voice without disposing it. */
export function releaseVoice(id) {
  try { _cache[id]?.releaseAll?.(); } catch (_) {}
}
