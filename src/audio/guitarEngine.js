/**
 * guitarEngine.js
 *
 * Three guitar voices, each with 6 independent PluckSynth instances
 * (one per string) so every string rings simultaneously and naturally.
 *
 * Karplus-Strong synthesis (PluckSynth) is purpose-built for plucked
 * strings and produces far more convincing results than a generic
 * oscillator synth for guitar sounds.
 *
 * Voices:
 *   steel    — acoustic steel-string: bright attack, long sustain
 *   nylon    — classical nylon-string: warm, rounded, intimate
 *   electric — Fender-clean electric: glassy top end, slight chorus
 */

import * as Tone from 'tone';

// ── Voice metadata ──────────────────────────────────────────────
export const GUITAR_VOICES = [
  { id: 'steel',    label: 'Steel',    desc: 'Acoustic steel string'    },
  { id: 'nylon',    label: 'Nylon',    desc: 'Classical nylon string'   },
  { id: 'electric', label: 'Electric', desc: 'Clean electric, Fender'  },
];

// ── Synth cache ─────────────────────────────────────────────────
const _cache = {};

/**
 * PluckSynth parameters per voice.
 * Wound strings (low E, A, D) get a warmer dampening multiplier.
 */
const VOICE_CONFIG = {
  steel: {
    attackNoise: 1.5,     // punchy pick attack
    dampening:   6000,    // bright treble presence
    resonance:   0.988,   // long ring
    woundMult:   0.65,    // wound strings (0,1,2) are darker
    reverb:  { decay: 1.4, wet: 0.16 },
    chorus:  null,
  },
  nylon: {
    attackNoise: 0.5,     // soft finger pluck
    dampening:   2400,    // warm, rounded
    resonance:   0.967,   // moderate sustain
    woundMult:   0.80,
    reverb:  { decay: 2.2, wet: 0.22 },
    chorus:  null,
  },
  electric: {
    attackNoise: 1.0,
    dampening:   13000,   // glassy Strat pickup character
    resonance:   0.993,   // very long sustain
    woundMult:   0.72,
    reverb:  { decay: 1.0, wet: 0.10 },
    chorus:  { frequency: 2.5, delayTime: 3, depth: 0.28, wet: 0.18 },
  },
};

/**
 * Returns the cached synth group for a voice, creating it on first call.
 * Each group has:
 *   synths: PluckSynth[6]   — one per string (0 = low E, 5 = high e)
 *   ready:  boolean
 */
export async function getGuitarSynths(voiceId) {
  if (_cache[voiceId]) return _cache[voiceId];

  await Tone.start();
  const cfg = VOICE_CONFIG[voiceId];

  // Effects chain
  const reverb = new Tone.Reverb({ decay: cfg.reverb.decay, wet: cfg.reverb.wet });
  await reverb.ready;
  reverb.toDestination();

  let destination = reverb;

  if (cfg.chorus) {
    const chorus = new Tone.Chorus({
      frequency:  cfg.chorus.frequency,
      delayTime:  cfg.chorus.delayTime,
      depth:      cfg.chorus.depth,
      wet:        cfg.chorus.wet,
    });
    chorus.connect(reverb);
    chorus.start();
    destination = chorus;
  }

  // 6 strings — wound strings (0,1,2) use a lower dampening multiplier
  const synths = Array.from({ length: 6 }, (_, s) => {
    const isWound     = s < 3;
    const dampening   = cfg.dampening * (isWound ? cfg.woundMult : 1);
    const attackNoise = cfg.attackNoise * (isWound ? 0.9 : 1);

    const synth = new Tone.PluckSynth({
      attackNoise,
      dampening,
      resonance: cfg.resonance,
    });
    synth.connect(destination);
    return synth;
  });

  _cache[voiceId] = { synths, ready: true };
  return _cache[voiceId];
}

/**
 * Release all ringing notes across a voice's 6 strings.
 */
export function releaseGuitarVoice(voiceId) {
  if (!_cache[voiceId]) return;
  // PluckSynth has no releaseAll; notes decay naturally — nothing to do.
}

/**
 * Strum a chord using a pre-computed voicing.
 *
 * @param {string}   voiceId   - 'steel' | 'nylon' | 'electric'
 * @param {number[]} voicing   - 6-element array (fret or -1 for mute)
 * @param {function} getNote   - getStringNote(stringIdx, fret) → 'C3'
 * @param {object}   opts
 *   direction: 'down' | 'up'
 *   arp: boolean  (false = fast strum, true = slow arpeggio)
 *   onStrike: (stringIdx: number, msOffset: number) => void
 *             called just before each string fires (for animation)
 */
export async function strumChord(voiceId, voicing, getNote, opts = {}) {
  const { direction = 'down', arp = false, onStrike } = opts;

  const group = await getGuitarSynths(voiceId);
  const delay = arp ? 0.22 : 0.038; // seconds between strings

  const order = direction === 'down'
    ? [0, 1, 2, 3, 4, 5]
    : [5, 4, 3, 2, 1, 0];

  const active = order.filter(s => voicing[s] >= 0);

  active.forEach((s, i) => {
    const fret = voicing[s];
    const note = getNote(s, fret);
    const time = Tone.now() + i * delay;

    group.synths[s].triggerAttackRelease(note, '2n', time);

    if (onStrike) {
      const msOffset = i * delay * 1000;
      setTimeout(() => onStrike(s), msOffset);
    }
  });

  // Return total strum duration in ms so the caller can reset playing state
  return active.length * delay * 1000 + 1200;
}
