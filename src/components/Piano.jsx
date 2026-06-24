import { useMemo } from 'react';
import { buildPianoNotes, blackKeyOffset } from '../utils/music';

// These are built once at module load time, not per render
const ALL_PIANO_NOTES = buildPianoNotes();
const WHITE_KEYS      = ALL_PIANO_NOTES.filter(k => !k.isBlack);
const BLACK_KEYS      = ALL_PIANO_NOTES.filter(k =>  k.isBlack);

// Width of one white key as a fraction of the total keyboard width (14 keys)
const WKW = 1 / 14;

// Piano key colours. These intentionally use fixed palette values
// because a piano is always visually black and white.
const WK_COLORS = {
  normal: '#f0eff8',
  root:   '#5DCAA5', // teal 300
  tone:   '#AFA9EC', // purple 300
  active: '#FAC775', // amber 300 (arpeggio cursor)
};
const BK_COLORS = {
  normal: '#17172b',
  root:   '#0F6E56', // teal 600
  tone:   '#534AB7', // purple 600
  active: '#BA7517', // amber 600
};

/**
 * Piano keyboard component.
 *
 * Props:
 *   highlightedIndices  Set<number>   piano key indices that belong to the chord
 *   rootIndices         Set<number>   piano key indices of the root note (both octaves)
 *   activeIndex         number|null   key index currently sounding during arpeggio
 */
export function Piano({ highlightedIndices, rootIndices, activeIndex }) {
  const wkColor = (key) => {
    if (key.index === activeIndex)         return WK_COLORS.active;
    if (rootIndices.has(key.index))        return WK_COLORS.root;
    if (highlightedIndices.has(key.index)) return WK_COLORS.tone;
    return WK_COLORS.normal;
  };

  const bkColor = (key) => {
    if (key.index === activeIndex)         return BK_COLORS.active;
    if (rootIndices.has(key.index))        return BK_COLORS.root;
    if (highlightedIndices.has(key.index)) return BK_COLORS.tone;
    return BK_COLORS.normal;
  };

  return (
    <div className="piano-wrap">
      <div className="piano-keys">
        {/* White keys */}
        {WHITE_KEYS.map((key, i) => (
          <div
            key={key.name}
            className="piano-white-key"
            style={{
              left:       `${i * WKW * 100}%`,
              width:      `calc(${WKW * 100}% - 1.5px)`,
              background: wkColor(key),
            }}
          >
            {/* Only label the C notes as octave reference */}
            {key.semitone === 0 && (
              <span className="key-label" style={{
                color: highlightedIndices.has(key.index) ? '#534AB7' : '#b0b8cc',
              }}>
                {key.octave === 3 ? 'C3' : 'C4'}
              </span>
            )}
          </div>
        ))}

        {/* Black keys, rendered on top */}
        {BLACK_KEYS.map(key => (
          <div
            key={key.name}
            className="piano-black-key"
            style={{
              left:       `${blackKeyOffset(key) * WKW * 100}%`,
              width:      `${0.6 * WKW * 100}%`,
              background: bkColor(key),
            }}
          />
        ))}
      </div>

      {/* Colour legend */}
      <div className="piano-legend">
        {[
          { color: '#5DCAA5', label: 'Root note' },
          { color: '#AFA9EC', label: 'Chord tone' },
          { color: '#FAC775', label: 'Arpeggio'  },
        ].map(({ color, label }) => (
          <div key={label} className="legend-item">
            <span className="legend-swatch" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
