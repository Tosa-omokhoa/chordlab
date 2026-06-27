/**
 * guitar.js
 * Standard tuning pitch classes (C=0) and chord voicing algorithm.
 * Strings indexed 0–5, low E to high e.
 */

// Pitch class of each open string (E A D G B e)
export const OPEN_STRINGS = [4, 9, 2, 7, 11, 4];

// Display names for each string
export const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

/**
 * Find an open-position voicing (frets 0–4) for a chord.
 * Returns an array of 6 fret values:
 *   0  = open string
 *   1–4 = fret number
 *  -1  = muted / skip this string
 */
export function getGuitarVoicing(rootSemitone, intervals) {
  const pitches = new Set(intervals.map(iv => (rootSemitone + iv) % 12));

  // For each string, find the lowest fret (0–4) that plays a chord tone
  const frets = OPEN_STRINGS.map(open => {
    for (let f = 0; f <= 4; f++) {
      if (pitches.has((open + f) % 12)) return f;
    }
    return -1;
  });

  // If the lowest sounding string doesn't carry the root but the next one does,
  // mute the lowest string so the chord has the root in the bass.
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
