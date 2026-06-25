import { useState } from 'react';
import * as Tone from 'tone';
import { NOTES, CHORD_TYPES } from '../data/chords';
import { getHighlightedIndices, getRootIndices, getChordNoteNames, getToneNotes } from '../utils/music';
import { VOICE_META, getVoice, releaseVoice } from '../audio/voiceEngine';
import { Piano } from './Piano';

const CATEGORIES = [
  { id: 'triad',    label: 'Triads'   },
  { id: 'seventh',  label: 'Sevenths' },
  { id: 'extended', label: 'Extended' },
];

// ── Small presentational components ────────────────────────────

function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

function CategoryLabel({ children }) {
  return <p className="category-label">{children}</p>;
}

// ── Voice selector (iOS segmented control) ──────────────────────

function VoiceSelector({ voice, loading, onChange }) {
  const current = VOICE_META.find(v => v.id === voice);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
      <div className="seg-ctrl">
        {VOICE_META.map(v => (
          <button
            key={v.id}
            className={`seg-btn${voice === v.id ? ' active' : ''}`}
            onClick={() => onChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
      <p style={{
        fontSize: '12px',
        color: '#6e6e73',
        marginTop: '8px',
        minHeight: '18px',
        transition: 'opacity 0.2s',
      }}>
        {loading ? '● Loading samples...' : current?.desc}
      </p>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────

export function ChordExplorer() {
  const [root,      setRoot]    = useState(0);
  const [type,      setType]    = useState('Major');
  const [voice,     setVoice]   = useState('grand');
  const [playing,   setPlaying] = useState(false);
  const [arp,       setArp]     = useState(false);
  const [activeIdx, setActIdx]  = useState(null);
  const [loading,   setLoading] = useState(false);

  const chord      = CHORD_TYPES[type];
  const highlighted = getHighlightedIndices(root, chord.intervals);
  const rootIdxs   = getRootIndices(root);
  const noteNames  = getChordNoteNames(root, chord.intervals);
  const toneNotes  = getToneNotes(root, chord.intervals);

  // ── Voice switch ───────────────────────────────────────────

  const handleVoiceChange = async (newVoice) => {
    if (newVoice === voice || loading) return;
    releaseVoice(voice);
    setPlaying(false);
    setActIdx(null);
    setVoice(newVoice);
    // Pre-warm grand piano (samples need fetching)
    if (newVoice === 'grand') {
      setLoading(true);
      await getVoice('grand', { onLoaded: () => setLoading(false) }).catch(() => setLoading(false));
    }
  };

  // ── Playback ───────────────────────────────────────────────

  const playChord = async () => {
    if (playing || loading) return;

    let synth;
    try {
      synth = await getVoice(voice, {
        onLoadStart: () => setLoading(true),
        onLoaded:    () => setLoading(false),
      });
    } catch {
      setLoading(false);
      return;
    }

    setPlaying(true);
    const noteDuration = voice === 'pad' ? '4n' : '2n';

    if (arp) {
      toneNotes.forEach(({ tone, index }, i) => {
        setTimeout(() => setActIdx(index), i * 220);
        synth.triggerAttackRelease(tone, '8n', Tone.now() + i * 0.22);
      });
      setTimeout(() => {
        setPlaying(false);
        setActIdx(null);
      }, toneNotes.length * 220 + 1100);
    } else {
      synth.triggerAttackRelease(toneNotes.map(n => n.tone), noteDuration);
      setTimeout(() => setPlaying(false), voice === 'pad' ? 3200 : 1500);
    }
  };

  return (
    <div>
      {/* Voice selector */}
      <VoiceSelector voice={voice} loading={loading} onChange={handleVoiceChange} />

      {/* Root note */}
      <div style={{ marginBottom: '18px' }}>
        <SectionLabel>Root note</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {NOTES.map((n, i) => (
            <button
              key={n}
              className={`note-btn${root === i ? ' active' : ''}`}
              onClick={() => setRoot(i)}
              style={{ fontWeight: n.includes('#') ? 400 : 500 }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Chord types, grouped by category */}
      <div style={{ marginBottom: '24px' }}>
        <SectionLabel>Chord type</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {CATEGORIES.map(cat => (
            <div key={cat.id}>
              <CategoryLabel>{cat.label}</CategoryLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {Object.entries(CHORD_TYPES)
                  .filter(([, v]) => v.category === cat.id)
                  .map(([name]) => (
                    <button
                      key={name}
                      className={`chord-btn${type === name ? ' active' : ''}`}
                      onClick={() => setType(name)}
                    >
                      {name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Piano keyboard */}
      <div style={{ marginBottom: '14px' }}>
        <Piano
          highlightedIndices={highlighted}
          rootIndices={rootIdxs}
          activeIndex={activeIdx}
        />
      </div>

      {/* Info and playback bar */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
      }}>
        {/* Chord name and formula */}
        <div style={{ flex: 1, minWidth: '130px' }}>
          <p style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--tx)' }}>
            {NOTES[root]}{' '}
            <span style={{ color: 'var(--accent)' }}>{type}</span>
          </p>
          <p style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '2px' }}>
            {chord.formula}
          </p>
        </div>

        {/* Note pills */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {noteNames.map((n, i) => (
            <span key={i} className={`note-pill ${i === 0 ? 'root' : 'tone'}`}>{n}</span>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className={`arp-btn${arp ? ' active' : ''}`} onClick={() => setArp(p => !p)}>
            Arpeggio
          </button>
          <button className="play-btn" onClick={playChord} disabled={playing || loading}>
            {loading ? 'Loading···' : playing ? '···' : '▶  Play'}
          </button>
        </div>
      </div>
    </div>
  );
}
