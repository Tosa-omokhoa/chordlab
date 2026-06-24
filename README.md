# ChordLab

> Music theory, instantly. Pick a root note, pick a chord type, hear it.

**Live demo:** (deploy to get URL)

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

That is it. Vercel auto-detects Vite.

---

## Project structure

```
src/
  data/
    chords.js          All chord definitions and interval data
  utils/
    music.js           Piano layout helpers, highlight logic, Tone.js note builders
  hooks/
    useSynth.js        Lazy-init PolySynth, playChord / playNote helpers
  components/
    Piano.jsx          Keyboard renderer (dumb, takes highlighted/root sets as props)
    Piano.css          Piano-specific styles
    ChordExplorer.jsx  Phase 1: root selector, chord type selector, info bar
  App.jsx              Root layout (will hold nav + routing in later phases)
  main.jsx             React entry point
  index.css            Global styles and shared CSS classes
```

---

## Phases

| Phase | Module              | Status  |
|-------|---------------------|---------|
| 1     | Chord Explorer      | Done    |
| 2     | Scale Explorer      | Up next |
| 3     | Progression Builder | Planned |
| 4     | Guitar fretboard    | Planned |
| 5     | Ear Training        | Planned |

---

## Phase 2 plan: Scale Explorer

New route `/scales`. Select a root + scale type (major, minor, pentatonic,
blues, dorian, mixolydian, etc.). Piano highlights every note in the scale
across two octaves. Below the piano, a "Chords in this scale" row shows all
diatonic chords, each clickable and playable.

The Piano component already supports this with no changes; only the
highlight calculation changes (`getScaleIndices` in `music.js`).

---

## Author

Omokhoa Oshose Tosayoname  
github.com/Tosa-omokhoa
