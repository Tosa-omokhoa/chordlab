import { useState, useCallback } from 'react';
import * as Tone from 'tone';
import { NOTES, CHORD_TYPES } from '../data/chords';
import { getHighlightedIndices, getRootIndices, getToneNotes } from '../utils/music';
import { getVoice } from '../audio/voiceEngine';
import { Piano }   from './Piano';

// ── Difficulty pools ────────────────────────────────────────────
const DIFFICULTY = {
  easy: {
    label: 'Easy',
    desc:  'Basic triads',
    types: ['Major', 'Minor', 'Sus 2', 'Sus 4', 'Aug', 'Dim'],
  },
  medium: {
    label: 'Medium',
    desc:  'Triads + sevenths',
    types: ['Major', 'Minor', 'Maj 7', 'Min 7', 'Dom 7', 'Dim', 'Aug', 'Sus 4', 'ø7'],
  },
  hard: {
    label: 'Hard',
    desc:  'All chord types',
    types: Object.keys(CHORD_TYPES),
  },
};

// ── Utilities ───────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(difficulty) {
  const pool  = DIFFICULTY[difficulty].types;
  const root  = Math.floor(Math.random() * 12);
  const type  = pool[Math.floor(Math.random() * pool.length)];
  const wrong = shuffle(pool.filter(t => t !== type)).slice(0, 3);
  return { root, type, choices: shuffle([type, ...wrong]) };
}

// ── Sub-components ──────────────────────────────────────────────
function ScoreBar({ score, onReset }) {
  const pct = score.total > 0
    ? Math.round((score.correct / score.total) * 100)
    : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      background: 'var(--surface)', borderRadius: 'var(--r-card)',
      boxShadow: 'var(--shadow-card)', padding: '12px 16px',
      marginBottom: '14px', flexWrap: 'wrap',
    }}>
      {/* Correct / total */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.5px' }}>
          {score.correct}
        </span>
        <span style={{ fontSize: '13px', color: 'var(--tx3)', fontWeight: 500 }}>
          / {score.total}
        </span>
        {pct !== null && (
          <span style={{ fontSize: '11px', color: 'var(--tx3)', marginLeft: '4px' }}>
            ({pct}%)
          </span>
        )}
      </div>

      {/* Streak */}
      {score.streak > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: 'rgba(255,149,0,0.12)', border: '0.5px solid rgba(255,149,0,0.3)',
          borderRadius: '100px', padding: '3px 10px',
        }}>
          <span style={{ fontSize: '13px' }}>🔥</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#c07000' }}>
            {score.streak}
          </span>
        </div>
      )}

      {/* Best streak */}
      {score.best > 0 && (
        <span style={{ fontSize: '11px', color: 'var(--tx3)' }}>
          Best {score.best}
        </span>
      )}

      <div style={{ flex: 1 }}/>

      {/* Reset */}
      {score.total > 0 && (
        <button onClick={onReset} style={{
          padding: '5px 12px', border: '1px solid var(--border-light)',
          borderRadius: 'var(--r-pill)', background: 'transparent',
          fontSize: '11px', color: 'var(--tx3)', cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.12s',
        }}>
          Reset
        </button>
      )}
    </div>
  );
}

function DifficultyPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div className="view-seg" style={{ background: 'rgba(116,116,128,0.13)', borderRadius: 'var(--r-pill)', padding: '3px' }}>
        {Object.entries(DIFFICULTY).map(([id, d]) => (
          <button key={id}
            className={`view-btn${value === id ? ' active' : ''}`}
            style={{ padding: '7px 20px', fontSize: '13px' }}
            onClick={() => onChange(id)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: 'var(--tx3)' }}>
        {DIFFICULTY[value].desc} · {DIFFICULTY[value].types.length} chord types
      </p>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
export function EarTraining({ voice, loading }) {
  const [difficulty, setDifficulty] = useState('easy');
  const [question,   setQuestion]   = useState(null);
  const [phase,      setPhase]      = useState('idle');   // idle | listening | answered
  const [selected,   setSelected]   = useState(null);
  const [playing,    setPlaying]    = useState(false);
  const [score,      setScore]      = useState({ correct: 0, total: 0, streak: 0, best: 0 });

  // ── Audio ─────────────────────────────────────────────────────
  const playQuestion = useCallback(async (q) => {
    if (loading || !q) return;
    setPlaying(true);
    try {
      const synth = await getVoice(voice);
      const tones = getToneNotes(q.root, CHORD_TYPES[q.type].intervals);
      synth.triggerAttackRelease(tones.map(n => n.tone), voice === 'pad' ? '4n' : '2n');
    } catch {}
    setTimeout(() => setPlaying(false), voice === 'pad' ? 3000 : 1400);
  }, [voice, loading]);

  // ── Game flow ─────────────────────────────────────────────────
  const startRound = useCallback(() => {
    const q = makeQuestion(difficulty);
    setQuestion(q);
    setSelected(null);
    setPhase('listening');
    playQuestion(q);
  }, [difficulty, playQuestion]);

  const replay = () => {
    if (!question || playing) return;
    playQuestion(question);
  };

  const handleChoice = (choice) => {
    if (phase !== 'listening' || !question) return;
    const correct = choice === question.type;
    setSelected(choice);
    setPhase('answered');
    setScore(prev => {
      const streak = correct ? prev.streak + 1 : 0;
      return {
        correct: prev.correct + (correct ? 1 : 0),
        total:   prev.total + 1,
        streak,
        best:    Math.max(prev.best, streak),
      };
    });
  };

  const handleDifficultyChange = (d) => {
    setDifficulty(d);
    setQuestion(null);
    setPhase('idle');
    setSelected(null);
  };

  const reset = () => {
    setScore({ correct: 0, total: 0, streak: 0, best: 0 });
    setQuestion(null);
    setPhase('idle');
    setSelected(null);
  };

  // ── Derived ───────────────────────────────────────────────────
  const isAnswered  = phase === 'answered';
  const wasCorrect  = isAnswered && selected === question?.type;

  const pianoHl   = isAnswered && question
    ? getHighlightedIndices(question.root, CHORD_TYPES[question.type].intervals)
    : new Set();
  const pianoRoot = isAnswered && question
    ? getRootIndices(question.root)
    : new Set();

  const chord = question ? CHORD_TYPES[question.type] : null;

  // ── Choice button state ───────────────────────────────────────
  const btnState = (choice) => {
    if (!isAnswered) return 'default';
    if (choice === question.type) return 'correct';
    if (choice === selected)      return 'wrong';
    return 'dimmed';
  };

  return (
    <div>
      <ScoreBar score={score} onReset={reset} />
      <DifficultyPicker value={difficulty} onChange={handleDifficultyChange} />

      {/* Mystery chord card */}
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r-card)',
        boxShadow: 'var(--shadow-card)', padding: '24px 20px',
        textAlign: 'center', marginBottom: '14px', minHeight: '110px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '10px',
      }}>
        {phase === 'idle' && (
          <>
            <p style={{ fontSize: '15px', color: 'var(--tx2)', fontWeight: 500 }}>
              Listen and identify the chord.
            </p>
            <button
              className="play-btn"
              onClick={startRound}
              disabled={loading}
              style={{ marginTop: '4px' }}
            >
              {loading ? 'Loading···' : '▶  Start'}
            </button>
          </>
        )}

        {phase === 'listening' && (
          <>
            <p style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-1px',
              color: 'var(--tx3)', userSelect: 'none' }}>? ? ?</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: playing ? 'var(--accent)' : 'var(--tx3)' }}>
                {playing ? '● Playing...' : 'Choose an answer below'}
              </span>
              <button
                onClick={replay}
                disabled={playing}
                style={{
                  padding: '5px 12px', border: '1px solid var(--border-light)',
                  borderRadius: 'var(--r-pill)', background: 'transparent',
                  fontSize: '11px', color: 'var(--tx2)', cursor: playing ? 'default' : 'pointer',
                  fontFamily: 'inherit', opacity: playing ? 0.4 : 1,
                }}
              >
                ↺ Replay
              </button>
            </div>
          </>
        )}

        {phase === 'answered' && question && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--tx)' }}>
                {NOTES[question.root]}{' '}
                <span style={{ color: 'var(--accent)' }}>{question.type}</span>
              </p>
              <span style={{
                fontSize: '22px',
                color: wasCorrect ? '#34c759' : '#ff3b30',
              }}>
                {wasCorrect ? '✓' : '✗'}
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--tx3)' }}>
              {chord?.formula}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={replay} disabled={playing} style={{
                padding: '7px 14px', border: '1px solid var(--border-light)',
                borderRadius: 'var(--r-pill)', background: 'transparent',
                fontSize: '12px', color: 'var(--tx2)', cursor: 'pointer',
                fontFamily: 'inherit', opacity: playing ? 0.4 : 1,
              }}>↺ Replay</button>
              <button className="play-btn" onClick={startRound} disabled={loading || playing}>
                Next chord →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Answer choices (2x2 grid) */}
      {phase !== 'idle' && question && (
        <div className="et-choices">
          {question.choices.map(choice => {
            const state = btnState(choice);
            return (
              <button
                key={choice}
                className={`et-choice-btn et-${state}`}
                onClick={() => handleChoice(choice)}
                disabled={isAnswered}
              >
                <span className="et-choice-name">{choice}</span>
                {state === 'correct' && <span className="et-badge et-badge-correct">✓</span>}
                {state === 'wrong'   && <span className="et-badge et-badge-wrong">✗</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Piano reveal after answer */}
      {isAnswered && (
        <div style={{ marginTop: '14px' }}>
          <p className="section-label" style={{ marginBottom: '8px' }}>
            Chord on the keyboard
          </p>
          <Piano
            highlightedIndices={pianoHl}
            rootIndices={pianoRoot}
            activeIndex={null}
          />
        </div>
      )}

      {/* Motivational footer */}
      {score.total >= 5 && (
        <p style={{
          textAlign: 'center', fontSize: '11px', color: 'var(--tx3)',
          marginTop: '14px',
        }}>
          {score.correct === score.total
            ? 'Perfect score. Exceptional ear.'
            : score.correct / score.total >= 0.8
            ? 'Strong listening. Keep going.'
            : score.correct / score.total >= 0.5
            ? 'Good progress. Each round sharpens your ear.'
            : 'Ear training takes time. Keep playing.'}
        </p>
      )}
    </div>
  );
}
