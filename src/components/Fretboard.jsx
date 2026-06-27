import { NOTES } from '../data/chords';
import { OPEN_STRINGS, STRING_NAMES, getGuitarVoicing, noteAtFret } from '../utils/guitar';

// ── Layout constants ────────────────────────────────────────────
const PL = 24;   // padding left  (fret numbers)
const PR = 12;   // padding right
const PT = 38;   // padding top   (mute/open markers)
const PB = 24;   // padding bottom (string names)
const COL = 30;  // gap between strings
const ROW = 34;  // gap between frets
const IW  = COL * 5;  // inner width
const IH  = ROW * 4;  // inner height (4 frets shown)
const SVG_W = PL + IW + PR;
const SVG_H = PT + IH + PB;

const sx = s => PL + s * COL;           // x centre of string s
const fy = f => PT + f * ROW;           // y of fret line f  (0 = nut)
const dotY = f => fy(f - 1) + ROW / 2; // y centre of the cell above fret f

// Colours
const ROOT_COLOR = '#34c759';  // Apple green  – root note
const TONE_COLOR = '#8480f8';  // soft purple  – other chord tones (reads well on dark bg)
const MUTE_COLOR = '#6e6e73';

/**
 * Guitar chord diagram rendered as an SVG inside the same dark card
 * used by the Piano component, so the two views feel like one product.
 */
export function Fretboard({ rootSemitone, intervals }) {
  const voicing = getGuitarVoicing(rootSemitone, intervals);

  return (
    <div className="piano-card">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ maxWidth: `${SVG_W * 2}px`, display: 'block', margin: '0 auto' }}
        aria-label="Guitar chord diagram"
      >
        {/* ── Fretboard wood background ── */}
        <rect x={PL} y={PT} width={IW} height={IH} fill="#28180a" rx="3"/>

        {/* ── Nut ── */}
        <rect x={PL} y={PT} width={IW} height={5} fill="#e8d090" rx="1"/>

        {/* ── Fret lines ── */}
        {[1, 2, 3, 4].map(f => (
          <line key={f}
            x1={PL}    y1={fy(f)}
            x2={PL+IW} y2={fy(f)}
            stroke="#5a3a18" strokeWidth={1}
          />
        ))}

        {/* ── Strings (thicker at low E, thinner at high e) ── */}
        {[0,1,2,3,4,5].map(s => (
          <line key={s}
            x1={sx(s)} y1={PT + 5}
            x2={sx(s)} y2={PT + IH}
            stroke="#c8c0a8"
            strokeWidth={Math.max(0.7, 2.2 - s * 0.28)}
          />
        ))}

        {/* ── Position marker at fret 3 ── */}
        <circle
          cx={PL + IW / 2}
          cy={fy(2) + ROW / 2}
          r={4}
          fill="#5a3a18" opacity={0.7}
        />

        {/* ── Fret numbers (left side) ── */}
        {[1,2,3,4].map(f => (
          <text key={f}
            x={PL - 8} y={dotY(f) + 4}
            textAnchor="middle"
            fontSize={9} fill="#6e6e73"
            fontFamily="-apple-system, system-ui, sans-serif"
          >{f}</text>
        ))}

        {/* ── Per-string markers ── */}
        {voicing.map((fret, s) => {
          const pitch   = fret >= 0 ? noteAtFret(s, fret) : -1;
          const isRoot  = pitch !== -1 && pitch === rootSemitone;
          const color   = isRoot ? ROOT_COLOR : TONE_COLOR;
          const noteLabel = pitch >= 0 ? NOTES[pitch] : '';

          if (fret === -1) {
            // Muted string — ✕ above nut
            return (
              <text key={s}
                x={sx(s)} y={PT - 16}
                textAnchor="middle" fontSize={12}
                fill={MUTE_COLOR}
                fontFamily="-apple-system, system-ui, sans-serif"
                fontWeight="600"
              >✕</text>
            );
          }

          if (fret === 0) {
            // Open string — hollow circle above nut
            return (
              <circle key={s}
                cx={sx(s)} cy={PT - 16}
                r={7}
                fill="none"
                stroke={color}
                strokeWidth={2}
              />
            );
          }

          // Fretted note — filled dot in the fret cell
          return (
            <g key={s}>
              <circle cx={sx(s)} cy={dotY(fret)} r={12} fill={color}/>
              <text
                x={sx(s)} y={dotY(fret) + 4}
                textAnchor="middle"
                fontSize={9.5} fill="white" fontWeight="700"
                fontFamily="-apple-system, system-ui, sans-serif"
              >{noteLabel}</text>
            </g>
          );
        })}

        {/* ── String name labels (bottom) ── */}
        {STRING_NAMES.map((name, s) => (
          <text key={s}
            x={sx(s)} y={SVG_H - 6}
            textAnchor="middle"
            fontSize={9} fontWeight="600" fill="#8e8e93"
            fontFamily="-apple-system, system-ui, sans-serif"
          >{name}</text>
        ))}
      </svg>

      {/* ── Legend ── */}
      <div className="piano-legend">
        {[
          { color: ROOT_COLOR, label: 'Root note'  },
          { color: TONE_COLOR, label: 'Chord tone' },
        ].map(({ color, label }) => (
          <div key={label} className="legend-item">
            <span className="legend-swatch" style={{ background: color }}/>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
