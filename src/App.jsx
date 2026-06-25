import { ChordExplorer } from './components/ChordExplorer';

export default function App() {
  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', padding: '36px 20px 48px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 600,
          letterSpacing: '-0.5px',
          color: '#1d1d1f',
        }}>
          Chord<span style={{ color: '#5856d6' }}>Lab</span>
        </h1>
        <p style={{ fontSize: '13px', color: '#6e6e73', marginTop: '4px' }}>
          Music theory, instantly.
        </p>
      </div>

      <ChordExplorer />

    </main>
  );
}
