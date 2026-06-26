import { NOTES } from '../data/chords';

export const PIANO_ROOT_OCTAVE = 3;
export const PIANO_NOTE_COUNT  = 24;

/** Build the full ordered list of piano notes for C3–B4. */
export function buildPianoNotes() {
  const notes = [];
  for (let oct = PIANO_ROOT_OCTAVE; oct < PIANO_ROOT_OCTAVE + 2; oct++) {
    for (let s = 0; s < 12; s++) {
      notes.push({
        name:     `${NOTES[s]}${oct}`,
        note:     NOTES[s],
        octave:   oct,
        semitone: s,
        index:    (oct - PIANO_ROOT_OCTAVE) * 12 + s,
        isBlack:  [1, 3, 6, 8, 10].includes(s),
      });
    }
  }
  return notes;
}

/**
 * Chord highlight: which key indices to light up for a root + chord intervals.
 * Notes appear in both octaves where they fit.
 */
export function getHighlightedIndices(rootSemitone, intervals) {
  const set = new Set();
  intervals.forEach(iv => {
    const n = rootSemitone + iv;
    if (n < PIANO_NOTE_COUNT) set.add(n);
    if (n < 12 && n + 12 < PIANO_NOTE_COUNT) set.add(n + 12);
  });
  return set;
}

/**
 * Scale highlight: every piano key whose pitch class belongs to the scale.
 * Works across the full C3–B4 range regardless of root.
 */
export function getScaleIndices(rootSemitone, scaleIntervals) {
  const set = new Set();
  for (let i = 0; i < PIANO_NOTE_COUNT; i++) {
    const relToRoot = (i % 12 - rootSemitone + 12) % 12;
    if (scaleIntervals.includes(relToRoot)) set.add(i);
  }
  return set;
}

/** Both piano positions of the root note. */
export function getRootIndices(rootSemitone) {
  const set = new Set([rootSemitone]);
  if (rootSemitone + 12 < PIANO_NOTE_COUNT) set.add(rootSemitone + 12);
  return set;
}

/**
 * Diatonic triads for any heptatonic (7-note) scale.
 * Returns null for pentatonic / other non-7-note scales.
 *
 * Each chord: { degree, root, quality, intervals, name }
 * e.g. C Major → [{ degree:'I', root:0, quality:'Major', name:'C' }, ...]
 */
export function getDiatonicChords(rootSemitone, scaleIntervals) {
  if (scaleIntervals.length !== 7) return null;

  const ROMAN = ['I','II','III','IV','V','VI','VII'];

  return scaleIntervals.map((iv, degree) => {
    const chordRoot = (rootSemitone + iv) % 12;

    // Third and fifth relative to this degree's root
    let third = scaleIntervals[(degree + 2) % 7] - iv;
    let fifth  = scaleIntervals[(degree + 4) % 7] - iv;
    if (third < 0) third += 12;
    if (fifth < 0) fifth += 12;
    if (fifth < third) fifth += 12; // wrap-around case (e.g. degree VII)

    let quality, intervals, symbol;
    if      (third === 4 && fifth === 7) { quality='Major'; intervals=[0,4,7]; symbol=''  }
    else if (third === 3 && fifth === 7) { quality='Minor'; intervals=[0,3,7]; symbol='m' }
    else if (third === 3 && fifth === 6) { quality='Dim';   intervals=[0,3,6]; symbol='°' }
    else if (third === 4 && fifth === 8) { quality='Aug';   intervals=[0,4,8]; symbol='+' }
    else                                 { quality='Major'; intervals=[0,third,fifth]; symbol='' }

    return {
      degree:    ROMAN[degree],
      root:      chordRoot,
      quality,
      intervals,
      name:      NOTES[chordRoot] + symbol,
    };
  });
}

/** Pitch class names for the notes in a chord. */
export function getChordNoteNames(rootSemitone, intervals) {
  return intervals.map(iv => NOTES[(rootSemitone + iv) % 12]);
}

/** Tone.js note strings for a chord, clipped to the piano range. */
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

/** Left-edge offset (white-key-width units) for a black key. */
export function blackKeyOffset(key) {
  const octShift    = (key.octave - PIANO_ROOT_OCTAVE) * 7;
  const inOctavePos = { 1:0, 3:1, 6:3, 8:4, 10:5 }[key.semitone];
  return octShift + inOctavePos + 0.7;
}
