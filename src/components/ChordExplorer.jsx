import { useState } from 'react';
import * as Tone from 'tone';
import { NOTES, CHORD_TYPES } from '../data/chords';
import {
  getHighlightedIndices,
  getRootIndices,
  getChordNoteNames,
  getToneNotes,
} from '../utils/music';
import { useSynth } from '../hooks/useSynth';
import { Piano } from './Piano';

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: '10px', fontWeight: 500, letterSpacing: '1.5px',
      textTransform: 'uppercase', color: 'var(--txm)',
      margin: '0 0 8px',
    }}>
      {children}
    </p>
  );
}

/**
 * Phase 1: Chord Explorer.
 * Select a root note and chord type; the piano highlights the notes
 * and the Play button sounds them via Tone.js.
 */
export function ChordExplorer() {
  const [root,      setRoot]    = useState(0);       // semitone 0–11, 0 = C
  const [type,      setType]    = useState('Major');
  const [playing,   setPlaying] = useState(false);
  const [arp,       setArp]     = useState(false);
  const [activeIdx, setActIdx]  = useState(null);    // arpeggio cursor index
  const { getSynth } = useSynth();

  const chord      = CHORD_TYPES[type];
  const highlighted = getHighlightedIndices(root, chord.intervals);
  const rootIdxs   = getRootIndices(root);
  const noteNames  = getChordNoteNames(root, chord.intervals);
  const toneNotes  = getToneNotes(root, chord.intervals);

  const playChord = async () => {
    if (playing) return;
    const synth = await getSynth();
    setPlaying(true);

    if (arp) {
      // Arpeggio: trigger notes one by one with visual cursor
      toneNotes.forEach(({ tone, index }, i) => {
        setTimeout(() => setActIdx(index), i * 220);
        synth.triggerAttackRelease(tone, '8n', Tone.now() + i * 0.22);
      });
      setTimeout(() => {
        setPlaying(false);
        setActIdx(null);
      }, toneNotes.length * 220 + 900);
    } else {
      // Block chord: all notes at once
      synth.triggerAttackRelease(toneNotes.map(n => n.tone), '2n');
      setTimeout(() => setPlaying(false), 1400);
    }
  };

  return (
    <div>
      {/* Root note selector */}
      <SectionLabel>Root note</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '1rem' }}>
        {NOTES.map((n, i) => (
          <button
            key={n}
            className={`cl-btn${root === i ? ' active' : ''}`}
            onClick={() => setRoot(i)}
            style={{ minWidth: '34px', fontWeight: n.includes('#') ? 400 : 500 }}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Chord type selector */}
      <SectionLabel>Chord type</SectionLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '1.25rem' }}>
        {Object.keys(CHORD_TYPES).map(t => (
          <button
            key={t}
            className={`cl-btn${type === t ? ' active' : ''}`}
            onClick={() => setType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Piano keyboard */}
      <div style={{ marginBottom: '12px' }}>
        <Piano
          highlightedIndices={highlighted}
          rootIndices={rootIdxs}
          activeIndex={activeIdx}
        />
      </div>

      {/* Info and playback bar */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        background: 'var(--surf)', border: '0.5px solid var(--bord)',
        borderRadius: '10px', padding: '12px 16px',
      }}>
        {/* Chord name and formula */}
        <div style={{ flex: 1, minWidth: '130px' }}>
          <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 500, color: 'var(--tx)' }}>
            {NOTES[root]}{' '}
            <span style={{ color: 'var(--acc)' }}>{type}</span>
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--txm)' }}>
            {chord.formula}
          </p>
        </div>

        {/* Note name pills */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {noteNames.map((n, i) => (
            <span key={i} className={`cl-tag ${i === 0 ? 'cl-tag-root' : 'cl-tag-tone'}`}>
              {n}
            </span>
          ))}
        </div>

        {/* Arp toggle and play button */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className={`cl-btn${arp ? ' active' : ''}`}
            onClick={() => setArp(prev => !prev)}
          >
            Arp
          </button>
          <button className="cl-play" onClick={playChord} disabled={playing}>
            {playing ? '···' : '▶ Play'}
          </button>
        </div>
      </div>
    </div>
  );
}
