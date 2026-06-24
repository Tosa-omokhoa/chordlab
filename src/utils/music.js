import { NOTES } from '../data/chords';

// Piano spans C3 to B4: 2 octaves, 24 semitones total
export const PIANO_ROOT_OCTAVE = 3;
export const PIANO_NOTE_COUNT  = 24;

/**
 * Build the full ordered list of piano notes for C3–B4.
 * Returns an array of note objects; white and black keys are interleaved
 * in chromatic order, matching piano layout.
 */
export function buildPianoNotes() {
  const notes = [];
  for (let oct = PIANO_ROOT_OCTAVE; oct < PIANO_ROOT_OCTAVE + 2; oct++) {
    for (let s = 0; s < 12; s++) {
      notes.push({
        name:    `${NOTES[s]}${oct}`,
        note:    NOTES[s],
        octave:  oct,
        semitone: s,
        index:   (oct - PIANO_ROOT_OCTAVE) * 12 + s,
        isBlack: [1, 3, 6, 8, 10].includes(s),
      });
    }
  }
  return notes;
}

/**
 * Which piano key indices should be highlighted for a root + chord?
 * Notes are highlighted in both octaves where possible.
 */
export function getHighlightedIndices(rootSemitone, intervals) {
  const set = new Set();
  intervals.forEach(iv => {
    const i = rootSemitone + iv;
    if (i < PIANO_NOTE_COUNT) set.add(i);
    // Repeat in second octave if the base note fits in the first
    if (i < 12 && i + 12 < PIANO_NOTE_COUNT) set.add(i + 12);
  });
  return set;
}

/** Both piano positions of the root note (octave 1 and octave 2). */
export function getRootIndices(rootSemitone) {
  const set = new Set([rootSemitone]);
  if (rootSemitone + 12 < PIANO_NOTE_COUNT) set.add(rootSemitone + 12);
  return set;
}

/** Pitch class names for the notes in a chord (e.g. ['C','E','G']). */
export function getChordNoteNames(rootSemitone, intervals) {
  return intervals.map(iv => NOTES[(rootSemitone + iv) % 12]);
}

/**
 * Tone.js note strings for triggering audio (e.g. ['C3','E3','G3']).
 * Clips any note that falls outside the piano range.
 */
export function getToneNotes(rootSemitone, intervals) {
  return intervals
    .map(iv => {
      const total  = rootSemitone + iv;
      const note   = NOTES[total % 12];
      const octave = PIANO_ROOT_OCTAVE + Math.floor(total / 12);
      return { tone: `${note}${octave}`, index: total };
    })
    .filter(n => n.index < PIANO_NOTE_COUNT);
}

/**
 * Left-edge offset (in white-key-width units) for a black key.
 * The keyboard has 14 white keys total (7 per octave).
 * A black key between white keys i and i+1 sits at offset (i + 0.7).
 */
export function blackKeyOffset(key) {
  const octShift    = (key.octave - PIANO_ROOT_OCTAVE) * 7;
  const inOctavePos = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 }[key.semitone];
  return octShift + inOctavePos + 0.7;
}
