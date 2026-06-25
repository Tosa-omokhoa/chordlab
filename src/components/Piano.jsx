import './Piano.css';
import { buildPianoNotes, blackKeyOffset } from '../utils/music';

const ALL   = buildPianoNotes();
const WKS   = ALL.filter(k => !k.isBlack);
const BKS   = ALL.filter(k =>  k.isBlack);
const W     = 1 / 14; // white key width as fraction of total

function wkClass(key, highlighted, rootIdxs, activeIdx) {
  if (key.index === activeIdx)      return 'pk-w wk-active';
  if (rootIdxs.has(key.index))      return 'pk-w wk-root';
  if (highlighted.has(key.index))   return 'pk-w wk-tone';
  return 'pk-w';
}

function bkClass(key, highlighted, rootIdxs, activeIdx) {
  if (key.index === activeIdx)      return 'pk-b bk-active';
  if (rootIdxs.has(key.index))      return 'pk-b bk-root';
  if (highlighted.has(key.index))   return 'pk-b bk-tone';
  return 'pk-b';
}

export function Piano({ highlightedIndices, rootIndices, activeIndex }) {
  return (
    <div className="piano-card">
      <div className="piano-keys">
        {/* White keys */}
        {WKS.map((key, i) => (
          <div
            key={key.name}
            className={wkClass(key, highlightedIndices, rootIndices, activeIndex)}
            style={{
              left:  `${i * W * 100}%`,
              width: `calc(${W * 100}% - 2px)`,
            }}
          >
            {key.semitone === 0 && (
              <span className={`key-label${highlightedIndices.has(key.index) ? ' lit' : ''}`}>
                {key.octave === 3 ? 'C3' : 'C4'}
              </span>
            )}
          </div>
        ))}

        {/* Black keys */}
        {BKS.map(key => (
          <div
            key={key.name}
            className={bkClass(key, highlightedIndices, rootIndices, activeIndex)}
            style={{
              left:  `${blackKeyOffset(key) * W * 100}%`,
              width: `${0.62 * W * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="piano-legend">
        {[
          { color: '#34c759', label: 'Root note'  },
          { color: '#5856d6', label: 'Chord tone' },
          { color: '#ff9f0a', label: 'Arpeggio'   },
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
