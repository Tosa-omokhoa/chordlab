# ChordLab

> **Music theory, instantly.** A browser-based instrument and theory tool for keyboard players, guitarists, and producers. No account. No download. Works on any device.

**Live:** [chordlab-tosa.vercel.app](https://chordlab-tosa.vercel.app)

---

## What it does

ChordLab is a progressive music theory tool built in five phases. Each phase is a standalone module that lives under one roof and shares a single voice engine.

| Phase | Module | Status |
|-------|--------|--------|
| 1 | Chord Explorer | Live |
| 2 | Scale Explorer | Live |
| 3 | Progression Builder | Live |
| 4 | Guitar Fretboard | Live |
| 5 | Ear Training | Live |

---

## Features

### Phase 1: Chord Explorer

Pick any root note and chord type. The piano lights up the exact keys to press, with the root shown in green and chord tones in purple. Fourteen chord types across three categories: triads, sevenths, and extended. Arpeggio mode plays notes one by one with a visual cursor. Three keyboard voices: Grand (Salamander acoustic piano samples), Electric (FM synthesis with Rhodes character), and Pad (layered oscillators with chorus and reverb).

### Phase 2: Scale Explorer

Twelve scales including all seven diatonic modes, pentatonic major and minor, blues, harmonic minor, and whole tone. The piano highlights every note in the selected scale across two full octaves. For any seven-note scale, a "Chords in this scale" panel computes and displays all diatonic triads, each one clickable and playable. Clicking a diatonic chord switches the piano to show that chord in context.

### Phase 3: Progression Builder

A four-slot chord sequencer with adjustable BPM (60 to 160). Tap a slot to select it, then use the root and chord pickers to set the chord. Hit Play and the sequencer loops through all four chords, each card scaling up as it plays. A Share button encodes the entire progression into the URL and copies it to the clipboard. Any shareable link opens with that progression loaded automatically. The default progression is C, G, Am, F.

### Phase 4: Guitar Fretboard

A Piano / Guitar toggle appears above the instrument in every phase. The guitar view renders an SVG chord diagram using Karplus-Strong physical string synthesis (Tone.js `PluckSynth`). Each of the six strings has its own independent synth instance so all strings ring simultaneously and decay naturally. Three guitar voices: Steel (acoustic, bright pick attack), Nylon (classical, warm finger pluck), and Electric (Fender-clean character with a subtle chorus). Wound strings (low E, A, D) receive a darker dampening coefficient automatically. Notes play at real guitar register octaves (E2 A2 D3 G3 B3 E4), completely different from the piano register. A strum direction toggle switches between down-strum (low to high) and up-strum. When a string sounds, a golden glow overlay line animates along it using CSS keyframes that simulate string vibration physics.

### Phase 5: Ear Training

ChordLab plays a mystery chord and you identify it from four multiple-choice options. Three difficulty levels: Easy (six triads), Medium (nine types including sevenths), Hard (all fourteen types). After each answer the chord name is revealed, the piano shows which keys were played, and your score and streak update. A best-streak tracker runs for the session.

---

## Tech stack

- **React 18** with Vite
- **Tone.js 14** for all audio synthesis and the Salamander Grand Piano sampler
- **SVG** for the guitar fretboard (no canvas, no third-party charting)
- **CSS custom properties** for the design system
- **Vercel** for deployment (auto-deploys on every push to main)

No backend. No database. No authentication. Every session is stateless; the Progression Builder encodes state in the URL.

---

## Getting started

```bash
git clone https://github.com/Tosa-omokhoa/chordlab.git
cd chordlab
npm install
npm run dev
```

Open `http://localhost:5173`.

### Build for production

```bash
npm run build
npm run preview
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Vercel auto-detects Vite. No configuration needed.

---

## Project structure

```
chordlab/
  src/
    audio/
      voiceEngine.js        Piano synths: Grand (Salamander), Electric, Pad
      guitarEngine.js       Guitar synths: Steel, Nylon, Electric (6 PluckSynths per voice)
    data/
      chords.js             14 chord definitions with intervals and formulas
      scales.js             12 scale definitions across 3 categories
    utils/
      music.js              Piano highlight logic, scale indices, diatonic chord calculator
      guitar.js             Voicing algorithm, MIDI-accurate string notes, fret helpers
    hooks/
      useSynth.js           Legacy hook (retained for compatibility)
    components/
      Piano.jsx             Two-octave keyboard renderer (C3 to B4)
      Piano.css             Piano key styles
      Fretboard.jsx         SVG guitar chord diagram with per-string animation
      ChordExplorer.jsx     Phase 1
      ScaleExplorer.jsx     Phase 2
      ProgressionBuilder.jsx Phase 3
      EarTraining.jsx       Phase 5
    App.jsx                 Root: phase navigation, shared voice and view state
    main.jsx                React entry point
    index.css               Design system: tokens, buttons, layout, responsive breakpoints
  index.html
  package.json
  vite.config.js
```

---

## Design principles

The visual language follows a single rule throughout: the dark mahogany piano card (and fretboard card) is the centrepiece of every phase. It carries the same `#1c1c1e` background in both Piano and Guitar views, and all instrument-specific colour choices (root in green, chord tones in purple, arpeggio cursor in amber) stay consistent regardless of which instrument is displayed. The surrounding UI uses Apple-style off-white surfaces (`#f0f0f5`), sentence case labels, a maximum font weight of 600, and the iOS segmented control pattern for all multi-option toggles.

---

## Sharing

The Progression Builder encodes progressions as URL parameters:

```
https://chordlab-tosa.vercel.app/?p=0:Major-7:Major-9:Minor-5:Major
```

Format: `root:type` pairs joined by `-`. Root is a semitone index (0=C, 1=C#, ... 11=B). Type is the chord name URL-encoded. Any link in this format loads the progression automatically.

---

## Roadmap

Future enhancements under consideration:

- Chord inversions and voice leading display
- Multiple guitar voicing positions with position indicator
- Capo support
- MIDI keyboard input
- Ear Training timed mode and leaderboard
- Mobile app wrapper (Capacitor)

---

## Author

**Omokhoa Oshose Tosayoname**

Mechanical Engineering graduate, University of Nigeria Nsukka. Data scientist, AI/ML engineer, and petroleum engineering researcher.

- GitHub: [github.com/Tosa-omokhoa](https://github.com/Tosa-omokhoa)
- LinkedIn: [linkedin.com/in/oshose-omokhoa-3982aa364](https://linkedin.com/in/oshose-omokhoa-3982aa364)
- Email: tosayoname@gmail.com

---

## License

MIT
