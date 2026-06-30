import { useState, useEffect } from 'react';
import { ChordExplorer }      from './components/ChordExplorer';
import { ScaleExplorer }       from './components/ScaleExplorer';
import { ProgressionBuilder }  from './components/ProgressionBuilder';
import { EarTraining }         from './components/EarTraining';
import { VOICE_META, getVoice, releaseVoice } from './audio/voiceEngine';

const PHASES = [
  { id: 'chords',       label: 'Chord Explorer'      },
  { id: 'scales',       label: 'Scale Explorer'       },
  { id: 'progressions', label: 'Progression Builder'  },
  { id: 'ear',          label: 'Ear Training'         },
];

export default function App() {
  const [phase,       setPhase]       = useState('chords');
  const [voice,       setVoice]       = useState('grand');
  const [loading,     setLoading]     = useState(false);
  const [view,        setView]        = useState('Piano');
  const [guitarVoice, setGuitarVoice] = useState('steel');

  // ── Remove the loading screen after React is ready ──────────
  useEffect(() => {
    const loader = document.getElementById('cl-loader');
    if (!loader) return;

    // Brief pause so the app has visually settled before fade
    const fadeTimer = setTimeout(() => {
      loader.classList.add('cl-out');

      const removeTimer = setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 600); // matches the CSS transition duration

      return () => clearTimeout(removeTimer);
    }, 480);

    return () => clearTimeout(fadeTimer);
  }, []);

  // ── Piano voice ──────────────────────────────────────────────
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

  const currentVoice  = VOICE_META.find(v => v.id === voice);
  const isEarTraining = phase === 'ear';

  const sharedProps = {
    voice,
    loading,
    view,
    onViewChange:        setView,
    guitarVoice,
    onGuitarVoiceChange: setGuitarVoice,
  };

  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 20px 56px' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', color: '#1d1d1f' }}>
          Chord<span style={{ color: '#5856d6' }}>Lab</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#6e6e73', marginTop: '4px' }}>
          Music theory, instantly.
        </p>
      </div>

      {/* Piano voice selector (hidden on Ear Training and Guitar view) */}
      {view === 'Piano' && !isEarTraining && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div className="seg-ctrl">
            {VOICE_META.map(v => (
              <button key={v.id}
                className={`seg-btn${voice === v.id ? ' active' : ''}`}
                onClick={() => handleVoiceChange(v.id)}
              >{v.label}</button>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: '#6e6e73', marginTop: '7px', minHeight: '18px' }}>
            {loading ? '● Loading samples...' : currentVoice?.desc}
          </p>
        </div>
      )}

      {/* Phase navigation */}
      <nav className="phase-nav" aria-label="Phase navigation">
        {PHASES.map(p => (
          <button key={p.id}
            className={`phase-tab${phase === p.id ? ' active' : ''}`}
            onClick={() => setPhase(p.id)}
            aria-current={phase === p.id ? 'page' : undefined}
          >
            {p.label}
          </button>
        ))}
      </nav>

      {/* Phase content */}
      {phase === 'chords'       && <ChordExplorer     {...sharedProps} />}
      {phase === 'scales'       && <ScaleExplorer      {...sharedProps} />}
      {phase === 'progressions' && <ProgressionBuilder {...sharedProps} />}
      {phase === 'ear' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div className="seg-ctrl">
              {VOICE_META.map(v => (
                <button key={v.id}
                  className={`seg-btn${voice === v.id ? ' active' : ''}`}
                  onClick={() => handleVoiceChange(v.id)}
                >{v.label}</button>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#6e6e73', marginTop: '7px', minHeight: '18px' }}>
              {loading ? '● Loading samples...' : currentVoice?.desc}
            </p>
          </div>
          <EarTraining voice={voice} loading={loading} />
        </>
      )}

    </main>
  );
}
