// All scale definitions used in Phase 2: Scale Explorer
// intervals: semitone offsets from root
// formula:   step pattern (W = whole, H = half, WH = whole+half)
// category:  used for grouping in the UI

export const SCALE_TYPES = {
  // ── Diatonic ───────────────────────────────────────────────
  'Major':            { intervals:[0,2,4,5,7,9,11],  formula:'W · W · H · W · W · W · H',  category:'diatonic' },
  'Natural Minor':    { intervals:[0,2,3,5,7,8,10],  formula:'W · H · W · W · H · W · W',  category:'diatonic' },
  'Harmonic Minor':   { intervals:[0,2,3,5,7,8,11],  formula:'W · H · W · W · H · A · H',  category:'diatonic' },

  // ── Modes ──────────────────────────────────────────────────
  'Dorian':           { intervals:[0,2,3,5,7,9,10],  formula:'W · H · W · W · W · H · W',  category:'mode' },
  'Phrygian':         { intervals:[0,1,3,5,7,8,10],  formula:'H · W · W · W · H · W · W',  category:'mode' },
  'Lydian':           { intervals:[0,2,4,6,7,9,11],  formula:'W · W · W · H · W · W · H',  category:'mode' },
  'Mixolydian':       { intervals:[0,2,4,5,7,9,10],  formula:'W · W · H · W · W · H · W',  category:'mode' },
  'Locrian':          { intervals:[0,1,3,5,6,8,10],  formula:'H · W · W · H · W · W · W',  category:'mode' },

  // ── Pentatonic & other ─────────────────────────────────────
  'Pentatonic Major': { intervals:[0,2,4,7,9],        formula:'W · W · WH · W · WH',        category:'other' },
  'Pentatonic Minor': { intervals:[0,3,5,7,10],        formula:'WH · W · W · WH · W',        category:'other' },
  'Blues':            { intervals:[0,3,5,6,7,10],      formula:'WH · W · H · H · WH · W',    category:'other' },
  'Whole Tone':       { intervals:[0,2,4,6,8,10],      formula:'W · W · W · W · W · W',      category:'other' },
};

export const SCALE_CATEGORIES = [
  { id:'diatonic', label:'Diatonic'           },
  { id:'mode',     label:'Modes'              },
  { id:'other',    label:'Pentatonic & other' },
];
