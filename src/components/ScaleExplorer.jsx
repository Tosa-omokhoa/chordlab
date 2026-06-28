import { useState, useRef } from 'react';
import * as Tone from 'tone';
import { NOTES } from '../data/chords';
import { SCALE_TYPES, SCALE_CATEGORIES } from '../data/scales';
import {
  getScaleIndices, getHighlightedIndices, getRootIndices,
  getChordNoteNames, getToneNotes, getDiatonicChords,
} from '../utils/music';
import { getVoice }  from '../audio/voiceEngine';
import { Piano }     from './Piano';
import { Fretboard } from './Fretboard';

function SectionLabel({ children }) { return <p className="section-label">{children}</p>; }
function CategoryLabel({ children }) { return <p className="category-label">{children}</p>; }

function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle">
      <div className="view-seg">
        {['Piano','Guitar'].map(v => (
          <button key={v} className={`view-btn${view === v ? ' active' : ''}`}
            onClick={() => onChange(v)}>{v}</button>
        ))}
      </div>
    </div>
  );
}

export function ScaleExplorer({ voice, loading, view, onViewChange, guitarVoice, onGuitarVoiceChange }) {
  const [root,    setRoot]    = useState(0);
  const [scale,   setScale]   = useState('Major');
  const [selIdx,  setSelIdx]  = useState(null);
  const [playing, setPlaying] = useState(false);
  const [arp,     setArp]     = useState(false);
  const [actIdx,  setActIdx]  = useState(null);
  const fretboardRef          = useRef(null);

  const scaleData  = SCALE_TYPES[scale];
  const diatonic   = getDiatonicChords(root, scaleData.intervals);
  const selChord   = diatonic && selIdx !== null ? diatonic[selIdx] : null;

  const scaleIndices  = getScaleIndices(root, scaleData.intervals);
  const highlighted   = selChord
    ? getHighlightedIndices(selChord.root, selChord.intervals) : scaleIndices;
  const rootIdxs      = selChord ? getRootIndices(selChord.root) : getRootIndices(root);

  const guitarRoot      = selChord ? selChord.root      : root;
  const guitarIntervals = selChord ? selChord.intervals  : [0];

  const playNotes = async (chordRoot, intervals) => {
    if (playing || loading) return;

    if (view === 'Guitar' && fretboardRef.current) {
      setPlaying(true);
      const dur = await fretboardRef.current.strum({ arp });
      setTimeout(() => setPlaying(false), dur);
      return;
    }

    let synth;
    try { synth = await getVoice(voice); } catch { return; }
    const tones = getToneNotes(chordRoot, intervals);
    setPlaying(true);
    if (arp) {
      tones.forEach(({ tone, index }, i) => {
        setTimeout(() => setActIdx(index), i * 220);
        synth.triggerAttackRelease(tone, '8n', Tone.now() + i * 0.22);
      });
      setTimeout(() => { setPlaying(false); setActIdx(null); }, tones.length * 220 + 1000);
    } else {
      synth.triggerAttackRelease(tones.map(n => n.tone), voice === 'pad' ? '4n' : '2n');
      setTimeout(() => setPlaying(false), voice === 'pad' ? 3200 : 1400);
    }
  };

  const playScale = async () => {
    if (playing || loading) return;

    if (view === 'Guitar' && fretboardRef.current) {
      setSelIdx(null);
      setPlaying(true);
      const dur = await fretboardRef.current.strum({ arp: true }); // always arp for scale
      setTimeout(() => setPlaying(false), dur);
      return;
    }

    let synth;
    try { synth = await getVoice(voice); } catch { return; }
    const tones = scaleData.intervals
      .map(iv => ({ tone:`${NOTES[(root+iv)%12]}${3+Math.floor((root+iv)/12)}`, index:root+iv }))
      .filter(n => n.index < 24);
    setSelIdx(null); setPlaying(true);
    tones.forEach(({ tone, index }, i) => {
      setTimeout(() => setActIdx(index), i * 200);
      synth.triggerAttackRelease(tone, '8n', Tone.now() + i * 0.2);
    });
    setTimeout(() => { setPlaying(false); setActIdx(null); }, tones.length * 200 + 900);
  };

  const noteNames = selChord
    ? getChordNoteNames(selChord.root, selChord.intervals)
    : scaleData.intervals.map(iv => NOTES[(root + iv) % 12]);

  return (
    <div>
      {/* Root note */}
      <div style={{ marginBottom: '18px' }}>
        <SectionLabel>Root note</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {NOTES.map((n, i) => (
            <button key={n}
              className={`note-btn${root === i ? ' active' : ''}`}
              onClick={() => { setRoot(i); setSelIdx(null); }}
              style={{ fontWeight: n.includes('#') ? 400 : 500 }}
            >{n}</button>
          ))}
        </div>
      </div>

      {/* Scale type */}
      <div style={{ marginBottom: '24px' }}>
        <SectionLabel>Scale type</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {SCALE_CATEGORIES.map(cat => (
            <div key={cat.id}>
              <CategoryLabel>{cat.label}</CategoryLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {Object.entries(SCALE_TYPES)
                  .filter(([, v]) => v.category === cat.id)
                  .map(([name]) => (
                    <button key={name}
                      className={`chord-btn${scale === name ? ' active' : ''}`}
                      onClick={() => { setScale(name); setSelIdx(null); }}
                    >{name}</button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View toggle + instrument */}
      <ViewToggle view={view} onChange={onViewChange} />
      {view === 'Guitar' && !selChord && (
        <p style={{ fontSize:'11px', color:'var(--tx3)', textAlign:'center', marginBottom:'8px' }}>
          Select a chord below to see its guitar voicing.
        </p>
      )}
      <div style={{ marginBottom: '14px' }}>
        {view === 'Guitar'
          ? <Fretboard
              ref={fretboardRef}
              rootSemitone={guitarRoot}
              intervals={guitarIntervals}
              guitarVoice={guitarVoice}
              onGuitarVoiceChange={onGuitarVoiceChange}
            />
          : <Piano highlightedIndices={highlighted} rootIndices={rootIdxs} activeIndex={actIdx} />
        }
      </div>

      {/* Diatonic chords */}
      {diatonic && (
        <div style={{
          background:'var(--surface)', borderRadius:'var(--r-card)',
          boxShadow:'var(--shadow-card)', padding:'16px 20px', marginBottom:'14px',
        }}>
          <p className="section-label" style={{ marginBottom:'12px' }}>Chords in this scale</p>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
            {diatonic.map((chord, idx) => (
              <button key={idx}
                className={['diatonic-btn', selIdx===idx?'active':'',
                  chord.quality==='Minor'?'minor':'', chord.quality==='Dim'?'dim':''].join(' ')}
                onClick={() => {
                  if (selIdx === idx) { setSelIdx(null); return; }
                  setSelIdx(idx);
                  playNotes(chord.root, chord.intervals);
                }}
              >
                <span className="degree-roman">{chord.degree}</span>
                <span className="degree-name">{chord.name}</span>
              </button>
            ))}
          </div>
          {selIdx !== null && (
            <p style={{ fontSize:'11px', color:'var(--tx3)', marginTop:'10px' }}>
              Tap again to return to scale view.
            </p>
          )}
        </div>
      )}

      {/* Info bar */}
      <div style={{
        background:'var(--surface)', borderRadius:'var(--r-card)',
        boxShadow:'var(--shadow-card)', padding:'16px 20px',
        display:'flex', alignItems:'center', flexWrap:'wrap', gap:'14px',
      }}>
        <div style={{ flex:1, minWidth:'130px' }}>
          <p style={{ fontSize:'20px', fontWeight:600, letterSpacing:'-0.3px', color:'var(--tx)' }}>
            {selChord
              ? <>{NOTES[selChord.root]} <span style={{color:'var(--accent)'}}>{selChord.quality}</span></>
              : <>{NOTES[root]} <span style={{color:'var(--accent)'}}>{scale}</span></>}
          </p>
          <p style={{ fontSize:'11px', color:'var(--tx2)', marginTop:'2px' }}>
            {selChord ? `Degree ${selChord.degree}` : scaleData.formula}
          </p>
        </div>
        <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
          {noteNames.map((n,i) => (
            <span key={i} className={`note-pill ${i===0?'root':'tone'}`}>{n}</span>
          ))}
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <button className={`arp-btn${arp?' active':''}`} onClick={() => setArp(p=>!p)}>
            Arpeggio
          </button>
          <button className="play-btn"
            onClick={selChord ? () => playNotes(selChord.root, selChord.intervals) : playScale}
            disabled={playing||loading}>
            {loading?'Loading···':playing?'···':'▶  Play'}
          </button>
        </div>
      </div>
    </div>
  );
}
