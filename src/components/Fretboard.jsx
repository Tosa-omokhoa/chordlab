import { forwardRef, useImperativeHandle, useState, useRef, useCallback } from 'react';
import { NOTES }              from '../data/chords';
import { GUITAR_VOICES, getGuitarSynths, strumChord } from '../audio/guitarEngine';
import { getGuitarVoicing, noteAtFret, getStringNote, STRING_NAMES, OPEN_STRINGS } from '../utils/guitar';

// ── SVG layout constants ────────────────────────────────────────
const PL  = 26;   // left padding  (fret numbers)
const PR  = 14;   // right padding
const PT  = 42;   // top padding   (mute / open markers + string names)
const PB  = 26;   // bottom padding (legend)
const COL = 32;   // column gap between strings
const ROW = 36;   // row gap between frets
const IW  = COL * 5;          // inner width
const IH  = ROW * 4;          // inner height  (shows 4 frets)
const SW  = PL + IW + PR;     // total SVG width
const SH  = PT + IH + PB;     // total SVG height

const sx = s => PL + s * COL;           // x centre of string s
const fy = f => PT + f * ROW;           // y of fret line f (0 = nut line)
const dy = f => fy(f - 1) + ROW / 2;   // y of dot in fret cell f (1-indexed)

// ── Colour palette ──────────────────────────────────────────────
const ROOT_COLOR  = '#34c759';   // Apple green
const TONE_COLOR  = '#8480f8';   // soft violet
const GLOW_GOLD   = '#ffd060';   // string vibration glow
const STRING_BASE = '#b8b0a0';   // resting string colour
const MUTE_COLOR  = '#636366';

// ── Sub-components ──────────────────────────────────────────────

function VoiceToggle({ voice, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: '12px', gap: '8px',
    }}>
      <div className="gtr-voice-seg">
        {GUITAR_VOICES.map(v => (
          <button
            key={v.id}
            className={`gtr-voice-btn${voice === v.id ? ' active' : ''}`}
            onClick={() => onChange(v.id)}
            title={v.desc}
          >{v.label}</button>
        ))}
      </div>
      <span style={{ fontSize: '11px', color: '#6e6e75', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {GUITAR_VOICES.find(v => v.id === voice)?.desc}
      </span>
    </div>
  );
}

function StrumControl({ dir, onDir }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '10px', color: '#636366', letterSpacing: '0.8px',
        textTransform: 'uppercase', fontWeight: 600 }}>Strum</span>
      {[
        { id: 'down', label: '↓', title: 'Down strum (low → high)' },
        { id: 'up',   label: '↑', title: 'Up strum (high → low)'  },
      ].map(d => (
        <button key={d.id}
          className={`gtr-dir-btn${dir === d.id ? ' active' : ''}`}
          onClick={() => onDir(d.id)}
          title={d.title}
        >{d.label}</button>
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

export const Fretboard = forwardRef(function Fretboard(
  { rootSemitone, intervals, guitarVoice, onGuitarVoiceChange },
  ref
) {
  const [strumDir,  setStrumDir]  = useState('down');
  const [vibStates, setVibStates] = useState({}); // { stringIdx: timestamp }
  const [loading,   setLoading]   = useState(false);

  const voicing      = getGuitarVoicing(rootSemitone, intervals);
  const voicingRef   = useRef(voicing);
  voicingRef.current = voicing;

  const strumDirRef   = useRef(strumDir);
  strumDirRef.current = strumDir;

  const guitarVoiceRef   = useRef(guitarVoice);
  guitarVoiceRef.current = guitarVoice;

  // Trigger a visual vibration on a string
  const animateString = useCallback((stringIdx) => {
    const ts = Date.now() + Math.random(); // unique per strike
    setVibStates(prev => ({ ...prev, [stringIdx]: ts }));
    setTimeout(() => {
      setVibStates(prev => {
        if (prev[stringIdx] !== ts) return prev;
        const next = { ...prev };
        delete next[stringIdx];
        return next;
      });
    }, 1000);
  }, []);

  // strum() is called by the parent (ChordExplorer, etc.) via ref
  const strum = useCallback(async ({ arp = false } = {}) => {
    setLoading(true);
    let duration;
    try {
      duration = await strumChord(
        guitarVoiceRef.current,
        voicingRef.current,
        getStringNote,
        {
          direction: strumDirRef.current,
          arp,
          onStrike:  animateString,
        }
      );
    } finally {
      setLoading(false);
    }
    return duration ?? 2000;
  }, [animateString]);

  useImperativeHandle(ref, () => ({ strum, animateString }), [strum, animateString]);

  // ── Per-string rendering helpers ──────────────────────────────

  const pitch    = (s, f) => noteAtFret(s, f);
  const isRoot   = (s, f) => f >= 0 && pitch(s, f) === rootSemitone;
  const dotColor = (s, f) => isRoot(s, f) ? ROOT_COLOR : TONE_COLOR;

  const baseStrokeW = s => Math.max(0.7, 2.2 - s * 0.27);

  return (
    <div className="piano-card">

      {/* Guitar voice + strum controls */}
      <VoiceToggle voice={guitarVoice} onChange={onGuitarVoiceChange} />
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '14px' }}>
        <StrumControl dir={strumDir} onDir={setStrumDir} />
        {loading && (
          <span style={{ fontSize: '11px', color: '#636366' }}>● loading…</span>
        )}
      </div>

      {/* SVG fretboard */}
      <svg
        viewBox={`0 0 ${SW} ${SH}`}
        width="100%"
        style={{ maxWidth: `${SW * 2}px`, display: 'block', margin: '0 auto' }}
        aria-label="Guitar chord diagram"
      >
        {/* Fretboard wood */}
        <defs>
          <linearGradient id="fbGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#200e04"/>
            <stop offset="15%"  stopColor="#2d1508"/>
            <stop offset="85%"  stopColor="#2d1508"/>
            <stop offset="100%" stopColor="#200e04"/>
          </linearGradient>
        </defs>
        <rect x={PL} y={PT} width={IW} height={IH} fill="url(#fbGrad)" rx="3"/>

        {/* Nut */}
        <rect x={PL} y={PT} width={IW} height={5} fill="#e8d090" rx="1"/>

        {/* Fret lines */}
        {[1,2,3,4].map(f => (
          <line key={f}
            x1={PL} y1={fy(f)} x2={PL+IW} y2={fy(f)}
            stroke="#5a3820" strokeWidth={1}
          />
        ))}

        {/* Position marker — fret 3 */}
        <circle cx={PL + IW/2} cy={fy(2) + ROW/2} r={4} fill="#6a3a18" opacity={0.7}/>

        {/* String names above nut */}
        {STRING_NAMES.map((name, s) => (
          <text key={s}
            x={sx(s)} y={PT - 28}
            textAnchor="middle" fontSize={9} fontWeight="600"
            fill="#8e8e93"
            fontFamily="-apple-system, system-ui, sans-serif"
          >{name}</text>
        ))}

        {/* Fret numbers */}
        {[1,2,3,4].map(f => (
          <text key={f}
            x={PL - 9} y={dy(f) + 4}
            textAnchor="middle" fontSize={9} fill="#636366"
            fontFamily="-apple-system, system-ui, sans-serif"
          >{f}</text>
        ))}

        {/* ── Base strings ── */}
        {[0,1,2,3,4,5].map(s => (
          <line key={`str-${s}`}
            x1={sx(s)} y1={PT + 5}
            x2={sx(s)} y2={PT + IH}
            stroke={STRING_BASE}
            strokeWidth={baseStrokeW(s)}
          />
        ))}

        {/* ── Vibration glow overlays (keyed by timestamp so animation restarts) ── */}
        {[0,1,2,3,4,5].map(s => {
          const ts = vibStates[s];
          if (!ts) return null;
          const f    = voicing[s];
          const col  = f >= 0 ? dotColor(s, f) : GLOW_GOLD;
          return (
            <line
              key={`glow-${s}-${ts}`}
              x1={sx(s)} y1={PT + 5}
              x2={sx(s)} y2={PT + IH}
              stroke={col}
              strokeWidth={baseStrokeW(s) + 2.8}
              strokeLinecap="round"
              className="gtr-string-glow"
            />
          );
        })}

        {/* ── Per-string markers (mute / open / fretted) ── */}
        {voicing.map((fret, s) => {
          const note = fret >= 0 ? NOTES[pitch(s, fret)] : '';
          const col  = dotColor(s, fret);

          if (fret === -1) {
            return (
              <text key={`mk-${s}`}
                x={sx(s)} y={PT - 14}
                textAnchor="middle" fontSize={13} fontWeight="700"
                fill={MUTE_COLOR}
                fontFamily="-apple-system, system-ui, sans-serif"
              >✕</text>
            );
          }

          if (fret === 0) {
            // Open string — hollow circle
            return (
              <circle key={`mk-${s}`}
                cx={sx(s)} cy={PT - 14}
                r={7}
                fill="none"
                stroke={col}
                strokeWidth={2}
                className={vibStates[s] ? 'gtr-dot-active' : ''}
              />
            );
          }

          // Fretted note — filled dot with note name
          const y = dy(fret);
          return (
            <g key={`mk-${s}`}>
              <circle
                cx={sx(s)} cy={y} r={13}
                fill={col}
                className={vibStates[s] ? 'gtr-dot-active' : ''}
              />
              <text
                x={sx(s)} y={y + 4}
                textAnchor="middle" fontSize={9.5}
                fill="white" fontWeight="700"
                fontFamily="-apple-system, system-ui, sans-serif"
              >{note}</text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="piano-legend" style={{ marginTop: '16px' }}>
        {[
          { color: ROOT_COLOR, label: 'Root note'  },
          { color: TONE_COLOR, label: 'Chord tone' },
          { color: GLOW_GOLD,  label: 'Vibrating'  },
        ].map(({ color, label }) => (
          <div key={label} className="legend-item">
            <span className="legend-swatch" style={{ background: color }}/>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
