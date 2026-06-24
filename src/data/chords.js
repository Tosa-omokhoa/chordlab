// All 12 chromatic pitch classes
export const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

/**
 * Chord definitions.
 * intervals: semitone offsets from root (e.g. [0,4,7] = major triad)
 * formula:   music-theory shorthand for display
 * category:  used for grouping in future UI phases
 */
export const CHORD_TYPES = {
  // Triads
  'Major':     { intervals: [0, 4, 7],       formula: '1 · 3 · 5',          category: 'triad' },
  'Minor':     { intervals: [0, 3, 7],       formula: '1 · ♭3 · 5',         category: 'triad' },
  'Sus 2':     { intervals: [0, 2, 7],       formula: '1 · 2 · 5',          category: 'triad' },
  'Sus 4':     { intervals: [0, 5, 7],       formula: '1 · 4 · 5',          category: 'triad' },
  'Aug':       { intervals: [0, 4, 8],       formula: '1 · 3 · ♯5',         category: 'triad' },
  'Dim':       { intervals: [0, 3, 6],       formula: '1 · ♭3 · ♭5',        category: 'triad' },
  // Sevenths
  'Maj 7':     { intervals: [0, 4, 7, 11],   formula: '1 · 3 · 5 · 7',      category: 'seventh' },
  'Min 7':     { intervals: [0, 3, 7, 10],   formula: '1 · ♭3 · 5 · ♭7',   category: 'seventh' },
  'Dom 7':     { intervals: [0, 4, 7, 10],   formula: '1 · 3 · 5 · ♭7',    category: 'seventh' },
  'Dim 7':     { intervals: [0, 3, 6,  9],   formula: '1 · ♭3 · ♭5 · ♭♭7', category: 'seventh' },
  'ø7':        { intervals: [0, 3, 6, 10],   formula: '1 · ♭3 · ♭5 · ♭7',  category: 'seventh' },
  // Extended
  'Add 9':     { intervals: [0, 4, 7, 14],   formula: '1 · 3 · 5 · 9',      category: 'extended' },
  '6th':       { intervals: [0, 4, 7,  9],   formula: '1 · 3 · 5 · 6',      category: 'extended' },
  'Min 6':     { intervals: [0, 3, 7,  9],   formula: '1 · ♭3 · 5 · 6',     category: 'extended' },
};

export const CHORD_CATEGORIES = ['triad', 'seventh', 'extended'];
