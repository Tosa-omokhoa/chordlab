import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { NOTES, CHORD_TYPES } from '../data/chords';
import { getHighlightedIndices, getRootIndices, getToneNotes } from '../utils/music';
import { getVoice } from '../audio/voiceEngine';
import { Piano } from './Piano';

// ── Defaults and helpers ────────────────────────────────────────

// C · G · Am · F: the most recognised chord progression in pop music
const DEFAULT_SLOTS = [
  { root: 0, type: 'Major' },
  { root: 7, type: 'Major' },
  { root: 9, type: 'Minor' },
  { root: 5, type: 'Major' },
];

function encodeProgression(slots) {
  return slots.map(s => `${s.root}:${encodeURIComponent(s.type)}`).join('-');
}

function decodeProgression(str) {
  try {
    const parts = str.split('-').map(part => {
      const ci = part.indexOf(':');
      const root = parseInt(part.slice(0, ci), 10);
      const type = decodeURIComponent(part.slice(ci + 1));
      if (isNaN(root) || !CHORD_TYPES[type]) return null;
      return { root, type };
    }).filter(Boolean);
    return parts.length === 4 ? parts : null;
  } catch { return null; }
}

// ── Component ───────────────────────────────────────────────────

export function ProgressionBuilder({ voice, loading }) {
  const [slots,      setSlots]      = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const prog   = params.get('p');
    if (prog) { const d = decodeProgression(prog); if (d) return d; }
    return DEFAULT_SLOTS;
  });
  const [editSlot,   setEditSlot]   = useState(0);
  const [bpm,        setBpm]        = useState(90);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [shared,     setShared]     = useState(false);

  // Keep a ref to slots so the Tone sequence always reads current values
  const seqRef   = useRef(null);
  const slotsRef = useRef(slots);
  useEffect(() => { slotsRef.current = slots; }, [slots]);

  // Stop everything on unmount (phase switch or page leave)
  useEffect(() => () => stopPlayback(), []);

  // ── Playback ────────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    if (seqRef.current) {
      try { seqRef.current.stop(0); seqRef.current.dispose(); } catch {}
      seqRef.current = null;
    }
    try { Tone.Transport.stop(); Tone.Transport.cancel(); } catch {}
    setIsPlaying(false);
    setActiveSlot(null);
  }, []);

  const startPlayback = async () => {
    if (loading) return;
    stopPlayback();

    let synth;
    try { synth = await getVoice(voice); } catch { return; }

    Tone.Transport.bpm.value = bpm;

    seqRef.current = new Tone.Sequence((time, slotIdx) => {
      const slot  = slotsRef.current[slotIdx];
      if (!slot) return;

      const chord   = CHORD_TYPES[slot.type];
      const tones   = getToneNotes(slot.root, chord.intervals);
      const noteDur = voice === 'pad' ? '1m' : '2n';

      synth.triggerAttackRelease(tones.map(n => n.tone), noteDur, time);

      // Sync visual highlight to audio clock
      const msUntil = Math.max(0, (time - Tone.getContext().currentTime) * 1000);
      setTimeout(() => setActiveSlot(slotIdx), msUntil);
    }, [0, 1, 2, 3], '1m');

    seqRef.current.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
    setActiveSlot(0);
  };

  const togglePlay = () => isPlaying ? stopPlayback() : startPlayback();

  // Update BPM live without restarting
  useEffect(() => {
    if (isPlaying) Tone.Transport.bpm.value = bpm;
  }, [bpm, isPlaying]);

  // ── Slot editing ────────────────────────────────────────────

  const updateSlot = (field, value) => {
    setSlots(prev => {
      const next = [...prev];
      next[editSlot] = { ...next[editSlot], [field]: value };
      return next;
    });
  };

  // ── Sharing ─────────────────────────────────────────────────

  const shareProgression = () => {
    const encoded = encodeProgression(slots);
    const url = `${window.location.origin}${window.location.pathname}?p=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    });
  };

  // ── Piano display ───────────────────────────────────────────

  const displaySlot  = isPlaying && activeSlot !== null
    ? slots[activeSlot]
    : slots[editSlot];
  const pianoHl      = displaySlot
    ? getHighlightedIndices(displaySlot.root, CHORD_TYPES[displaySlot.type].intervals)
    : new Set();
  const pianoRoot    = displaySlot ? getRootIndices(displaySlot.root) : new Set();
  const currentSlot  = slots[editSlot];

  return (
    <div>

      {/* ── Slot grid ── */}
      <p className="section-label" style={{ marginBottom: '10px' }}>Progression</p>
      <div className="seq-grid">
        {slots.map((slot, i) => (
          <button
            key={i}
            className={[
              'slot-card',
              editSlot === i && !isPlaying ? 'selected' : '',
              activeSlot === i            ? 'playing'  : '',
            ].join(' ')}
            onClick={() => { if (!isPlaying) setEditSlot(i); }}
            title={isPlaying ? 'Stop playback to edit' : `Edit slot ${i + 1}`}
          >
            <span className="slot-num">{i + 1}</span>
            <span className="slot-root">{NOTES[slot.root]}</span>
            <span className="slot-type">{slot.type}</span>
          </button>
        ))}
      </div>

      {/* ── Inline slot editor (hidden while playing) ── */}
      {!isPlaying && (
        <div className="slot-editor">
          <p className="section-label" style={{ marginBottom: '12px' }}>
            Editing slot {editSlot + 1}
            <span style={{ color: 'var(--accent)', fontWeight: 600, marginLeft: 6, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>
              {NOTES[currentSlot.root]} {currentSlot.type}
            </span>
          </p>

          <p className="category-label" style={{ marginBottom: '6px' }}>Root note</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
            {NOTES.map((n, i) => (
              <button
                key={n}
                className={`note-btn${currentSlot.root === i ? ' active' : ''}`}
                style={{ minWidth: '32px', padding: '5px 8px', fontSize: '12px', fontWeight: n.includes('#') ? 400 : 500 }}
                onClick={() => updateSlot('root', i)}
              >
                {n}
              </button>
            ))}
          </div>

          <p className="category-label" style={{ marginBottom: '6px' }}>Chord type</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {Object.keys(CHORD_TYPES).map(name => (
              <button
                key={name}
                className={`chord-btn${currentSlot.type === name ? ' active' : ''}`}
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={() => updateSlot('type', name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Piano preview ── */}
      <div style={{ marginBottom: '14px' }}>
        <Piano
          highlightedIndices={pianoHl}
          rootIndices={pianoRoot}
          activeIndex={null}
        />
      </div>

      {/* ── Controls bar ── */}
      <div className="controls-bar">

        {/* BPM control */}
        <div className="bpm-ctrl">
          <button
            className="bpm-step"
            onClick={() => setBpm(b => Math.max(60, b - 5))}
            aria-label="Decrease BPM"
          >−</button>
          <span className="bpm-value">
            {bpm}
            <span className="bpm-unit">BPM</span>
          </span>
          <button
            className="bpm-step"
            onClick={() => setBpm(b => Math.min(160, b + 5))}
            aria-label="Increase BPM"
          >+</button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Share */}
        <button
          className={`share-btn${shared ? ' copied' : ''}`}
          onClick={shareProgression}
          title="Copy shareable link"
        >
          {shared ? '✓ Copied' : '↗ Share'}
        </button>

        {/* Play / Stop */}
        <button
          className={`play-btn${isPlaying ? ' stop' : ''}`}
          onClick={togglePlay}
          disabled={loading}
        >
          {loading ? 'Loading···' : isPlaying ? '■  Stop' : '▶  Play'}
        </button>
      </div>

    </div>
  );
}
