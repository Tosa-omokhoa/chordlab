import { useState } from 'react';
import { ChordExplorer } from './components/ChordExplorer';
import { ScaleExplorer }  from './components/ScaleExplorer';
import { VOICE_META, getVoice, releaseVoice } from './audio/voiceEngine';

const PHASES = [
  { id: 'chords',       label: 'Chord Explorer'       },
  { id: 'scales',       label: 'Scale Explorer'        },
  { id: 'progressions', label: 'Progression Builder', soon: true },
  { id: 'ear',          label: 'Ear Training',         soon: true },
];

export default function App() {
  const [phase,   setPhase]   = useState('chords');
  const [voice,   setVoice]   = useState('grand');
  const [loading, setLoading] = useState(false);

  const handleVoiceChange = async (newVoice) => {
    if (newVoice === voice || loading) return;
    releaseVoice(voice);
    setVoice(newVoice);
    if (newVoice === 'grand') {
      setLoading(true);
      await getVoice('grand', { onLoaded: () => setLoading(false) })
        .catch(() => setLoading(false));
    }
  };

  const currentVoice = VOICE_META.find(v => v.id === voice);

  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', padding: '36px 20px 56px' }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', color: '#1d1d1f' }}>
          Chord<span style={{ color: '#5856d6' }}>Lab</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#6e6e73', marginTop: '4px' }}>
          Music theory, instantly.
        </p>
      </div>

      {/* ── Voice selector (shared across all phases) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
        <div className="seg-ctrl">
          {VOICE_META.map(v => (
            <button
              key={v.id}
              className={`seg-btn${voice === v.id ? ' active' : ''}`}
              onClick={() => handleVoiceChange(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: '#6e6e73', marginTop: '8px', minHeight: '18px' }}>
          {loading ? '● Loading samples...' : currentVoice?.desc}
        </p>
      </div>

      {/* ── Phase navigation ── */}
      <div className="phase-nav">
        {PHASES.map(p => (
          <button
            key={p.id}
            className={`phase-tab${phase === p.id ? ' active' : ''}${p.soon ? ' soon' : ''}`}
            onClick={() => !p.soon && setPhase(p.id)}
            disabled={p.soon}
          >
            {p.label}
            {p.soon && <span className="soon-badge">Soon</span>}
          </button>
        ))}
      </div>

      {/* ── Phase content ── */}
      {phase === 'chords' && <ChordExplorer voice={voice} loading={loading} />}
      {phase === 'scales' && <ScaleExplorer voice={voice} loading={loading} />}

    </main>
  );
}
