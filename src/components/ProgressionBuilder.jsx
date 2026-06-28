import { useState, useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';
import { NOTES, CHORD_TYPES } from '../data/chords';
import { getHighlightedIndices, getRootIndices, getToneNotes } from '../utils/music';
import { getGuitarVoicing, getStringNote }          from '../utils/guitar';
import { getVoice }                                  from '../audio/voiceEngine';
import { strumChord }                                from '../audio/guitarEngine';
import { Piano }     from './Piano';
import { Fretboard } from './Fretboard';

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
    const parts = str.split('-').map(p => {
      const ci   = p.indexOf(':');
      const root = parseInt(p.slice(0,ci), 10);
      const type = decodeURIComponent(p.slice(ci+1));
      if (isNaN(root) || !CHORD_TYPES[type]) return null;
      return { root, type };
    }).filter(Boolean);
    return parts.length === 4 ? parts : null;
  } catch { return null; }
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle">
      <div className="view-seg">
        {['Piano','Guitar'].map(v => (
          <button key={v} className={`view-btn${view===v?' active':''}`}
            onClick={() => onChange(v)}>{v}</button>
        ))}
      </div>
    </div>
  );
}

export function ProgressionBuilder({ voice, loading, view, onViewChange, guitarVoice, onGuitarVoiceChange }) {
  const [slots,      setSlots]      = useState(() => {
    const p = new URLSearchParams(window.location.search).get('p');
    if (p) { const d = decodeProgression(p); if (d) return d; }
    return DEFAULT_SLOTS;
  });
  const [editSlot,   setEditSlot]   = useState(0);
  const [bpm,        setBpm]        = useState(90);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [shared,     setShared]     = useState(false);

  const seqRef         = useRef(null);
  const slotsRef       = useRef(slots);
  const viewRef        = useRef(view);
  const guitarVoiceRef = useRef(guitarVoice);

  useEffect(() => { slotsRef.current = slots;            }, [slots]);
  useEffect(() => { viewRef.current  = view;             }, [view]);
  useEffect(() => { guitarVoiceRef.current = guitarVoice;}, [guitarVoice]);
  useEffect(() => () => stopPlayback(), []);

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

    // Pre-load whichever synth we need
    if (viewRef.current !== 'Guitar') {
      try { await getVoice(voice); } catch { return; }
    }

    Tone.Transport.bpm.value = bpm;

    seqRef.current = new Tone.Sequence(async (time, slotIdx) => {
      const slot  = slotsRef.current[slotIdx];
      if (!slot) return;

      const ms = Math.max(0, (time - Tone.getContext().currentTime) * 1000);
      setTimeout(() => setActiveSlot(slotIdx), ms);

      if (viewRef.current === 'Guitar') {
        // Guitar: strum the chord using the guitarEngine directly
        const voicing = getGuitarVoicing(slot.root, CHORD_TYPES[slot.type].intervals);
        await strumChord(guitarVoiceRef.current, voicing, getStringNote, {
          direction: 'down',
          arp: false,
        });
      } else {
        // Piano / keyboard synth
        try {
          const synth = await getVoice(voice);
          const tones = getToneNotes(slot.root, CHORD_TYPES[slot.type].intervals);
          synth.triggerAttackRelease(
            tones.map(n => n.tone),
            voice === 'pad' ? '1m' : '2n',
            time
          );
        } catch {}
      }
    }, [0,1,2,3], '1m');

    seqRef.current.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
    setActiveSlot(0);
  };

  const togglePlay = () => isPlaying ? stopPlayback() : startPlayback();

  useEffect(() => {
    if (isPlaying) Tone.Transport.bpm.value = bpm;
  }, [bpm, isPlaying]);

  const updateSlot = (field, value) => {
    setSlots(prev => {
      const next = [...prev];
      next[editSlot] = { ...next[editSlot], [field]: value };
      return next;
    });
  };

  const shareProgression = () => {
    const url = `${window.location.origin}${window.location.pathname}?p=${encodeProgression(slots)}`;
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    });
  };

  const displaySlot = isPlaying && activeSlot !== null ? slots[activeSlot] : slots[editSlot];
  const pianoHl     = displaySlot
    ? getHighlightedIndices(displaySlot.root, CHORD_TYPES[displaySlot.type].intervals) : new Set();
  const pianoRoot   = displaySlot ? getRootIndices(displaySlot.root) : new Set();
  const currentSlot = slots[editSlot];

  return (
    <div>
      {/* Slot grid */}
      <p className="section-label" style={{ marginBottom:'10px' }}>Progression</p>
      <div className="seq-grid">
        {slots.map((slot, i) => (
          <button key={i}
            className={['slot-card',
              editSlot===i && !isPlaying ? 'selected' : '',
              activeSlot===i             ? 'playing'  : '',
            ].join(' ')}
            onClick={() => { if (!isPlaying) setEditSlot(i); }}
          >
            <span className="slot-num">{i+1}</span>
            <span className="slot-root">{NOTES[slot.root]}</span>
            <span className="slot-type">{slot.type}</span>
          </button>
        ))}
      </div>

      {/* Slot editor */}
      {!isPlaying && (
        <div className="slot-editor">
          <p className="section-label" style={{ marginBottom:'12px' }}>
            Editing slot {editSlot+1}
            <span style={{ color:'var(--accent)', fontWeight:600, marginLeft:6,
              textTransform:'none', letterSpacing:0, fontSize:12 }}>
              {NOTES[currentSlot.root]} {currentSlot.type}
            </span>
          </p>
          <p className="category-label" style={{ marginBottom:'6px' }}>Root note</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'12px' }}>
            {NOTES.map((n,i) => (
              <button key={n}
                className={`note-btn${currentSlot.root===i?' active':''}`}
                style={{ minWidth:'32px', padding:'5px 8px', fontSize:'12px',
                  fontWeight:n.includes('#')?400:500 }}
                onClick={() => updateSlot('root', i)}
              >{n}</button>
            ))}
          </div>
          <p className="category-label" style={{ marginBottom:'6px' }}>Chord type</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
            {Object.keys(CHORD_TYPES).map(name => (
              <button key={name}
                className={`chord-btn${currentSlot.type===name?' active':''}`}
                style={{ fontSize:'11px', padding:'4px 10px' }}
                onClick={() => updateSlot('type', name)}
              >{name}</button>
            ))}
          </div>
        </div>
      )}

      {/* View toggle + instrument */}
      <ViewToggle view={view} onChange={onViewChange} />
      <div style={{ marginBottom:'14px' }}>
        {view === 'Guitar' && displaySlot
          ? <Fretboard
              rootSemitone={displaySlot.root}
              intervals={CHORD_TYPES[displaySlot.type].intervals}
              guitarVoice={guitarVoice}
              onGuitarVoiceChange={onGuitarVoiceChange}
            />
          : <Piano highlightedIndices={pianoHl} rootIndices={pianoRoot} activeIndex={null}/>
        }
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="bpm-ctrl">
          <button className="bpm-step" onClick={() => setBpm(b => Math.max(60, b-5))}>−</button>
          <span className="bpm-value">{bpm}<span className="bpm-unit"> BPM</span></span>
          <button className="bpm-step" onClick={() => setBpm(b => Math.min(160, b+5))}>+</button>
        </div>
        <div style={{ flex:1 }}/>
        <button className={`share-btn${shared?' copied':''}`} onClick={shareProgression}>
          {shared ? '✓ Copied' : '↗ Share'}
        </button>
        <button className={`play-btn${isPlaying?' stop':''}`}
          onClick={togglePlay} disabled={loading}>
          {loading?'Loading···':isPlaying?'■  Stop':'▶  Play'}
        </button>
      </div>
    </div>
  );
}
