import { useRef, useCallback } from 'react';
import * as Tone from 'tone';

/**
 * Initialises and caches a PolySynth instance.
 * The synth is lazy: it is created only on the first user interaction
 * (required by browsers to unlock the AudioContext).
 */
export function useSynth() {
  const synthRef = useRef(null);

  const getSynth = useCallback(async () => {
    await Tone.start(); // unlocks AudioContext on first gesture
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope:   { attack: 0.04, decay: 0.18, sustain: 0.35, release: 1.8 },
        volume:     -8,
      }).toDestination();
    }
    return synthRef.current;
  }, []);

  /** Play multiple notes simultaneously. */
  const playChord = useCallback(async (toneNoteNames, duration = '2n') => {
    const synth = await getSynth();
    synth.triggerAttackRelease(toneNoteNames, duration);
  }, [getSynth]);

  /** Play a single note, optionally at a scheduled Tone.js time. */
  const playNote = useCallback(async (toneNoteName, duration = '8n', time) => {
    const synth = await getSynth();
    synth.triggerAttackRelease(toneNoteName, duration, time ?? Tone.now());
  }, [getSynth]);

  return { getSynth, playChord, playNote };
}
