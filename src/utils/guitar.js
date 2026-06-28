/**
 * guitar.js
 * Guitar string layout, chord voicing algorithm, and MIDI-accurate
 * note names for each string/fret combination.
 *
 * Standard tuning (low to high): E2 A2 D3 G3 B3 E4
 */

import { NOTES } from '../data/chords';

// Open string pitch classes (C=0)
export const OPEN_STRINGS = [4, 9, 2, 7, 11, 4]; // E A D G B e

// Open string MIDI note numbers
// MIDI: C4 = 60, so E2 = 40, A2 = 45, D3 = 50, G3 = 55, B3 = 59, E4 = 64
export const BASE_MIDI = [40, 45, 50, 55, 59, 64];

// Display names for each string (low to high)
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

/**
 * Returns the Tone.js note name for a given string and fret.
 * e.g. getStringNote(0, 3) → 'G2'  (3rd fret on low E string = G2)
 *      getStringNote(5, 0) → 'E4'  (open high e)
 *      getStringNote(1, 3) → 'C3'  (3rd fret on A string = C3)
 */
export function getStringNote(stringIdx, fret) {
  const midi   = BASE_MIDI[stringIdx] + fret;
  const pitch  = NOTES[midi % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${pitch}${octave}`;
}

/**
 * Find an open-position voicing (frets 0–4) for a chord.
 * Returns an array of 6 values — fret number or -1 (muted).
 *
 * Also applies bass-string muting logic:
 * if the lowest sounding string doesn't carry the root but the
 * next string does, the lowest is muted (e.g. C Major: x32010).
 */
export function getGuitarVoicing(rootSemitone, intervals) {
  const pitches = new Set(intervals.map(iv => (rootSemitone + iv) % 12));

  const frets = OPEN_STRINGS.map(open => {
    for (let f = 0; f <= 4; f++) {
      if (pitches.has((open + f) % 12)) return f;
    }
    return -1;
  });

  // Mute lowest string if root is better served on the next string
  const low = frets.findIndex(f => f >= 0);
  if (low >= 0 && low < 5) {
    const lowNote  = (OPEN_STRINGS[low] + frets[low]) % 12;
    const next     = frets.findIndex((f, i) => i > low && f >= 0);
    if (lowNote !== rootSemitone && next >= 0) {
      const nextNote = (OPEN_STRINGS[next] + frets[next]) % 12;
      if (nextNote === rootSemitone) frets[low] = -1;
    }
  }

  return frets;
}

/** Pitch class of the note at a given string and fret. */
export function noteAtFret(stringIdx, fret) {
  return (OPEN_STRINGS[stringIdx] + fret) % 12;
}
