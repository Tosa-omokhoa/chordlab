import { ChordExplorer } from './components/ChordExplorer';

/**
 * App root.
 * Phase 1 mounts ChordExplorer directly.
 * Later phases will add a nav bar and route between modules:
 *   /           ChordExplorer
 *   /scales     ScaleExplorer    (Phase 2)
 *   /progressions  ProgressionBuilder  (Phase 3)
 *   /ear-training  EarTraining    (Phase 5)
 */
export default function App() {
  return (
    <main style={{ maxWidth: '740px', margin: '0 auto', padding: '24px 20px 40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        paddingBottom: '14px',
        borderBottom: '0.5px solid var(--bord)',
        marginBottom: '1.5rem',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--tx)' }}>
          Chord<span style={{ color: 'var(--acc)' }}>Lab</span>
        </h1>
        <span style={{
          fontSize: '10px', color: 'var(--txm)',
          letterSpacing: '1.5px', textTransform: 'uppercase',
          paddingTop: '2px',
        }}>
          Phase 1 · Chord explorer
        </span>
      </div>

      <ChordExplorer />
    </main>
  );
}
