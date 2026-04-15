# djApp — by PezzaliApp

DJ app professionale. React + Vite + Web Audio API + Zustand.

---

## Stack

| Layer | Tecnologia |
|---|---|
| UI | React 18 + Vite 5 |
| State | Zustand |
| Audio | Web Audio API (AudioContext, BiquadFilter, GainNode) |
| Jog | SVG + Touch API multitouch + Mouse drag |
| Stile | CSS Modules (design system dark premium) |
| Deploy | GitHub Pages / Cloudflare Pages |

---

## Avvio in locale

```bash
# 1. Installa dipendenze
npm install

# 2. Avvia dev server
npm run dev

# 3. Apri nel browser
# http://localhost:3000

# Per test iPhone fisico sulla stessa rete:
# http://<tuo-ip-locale>:3000
```

---

## Build produzione

```bash
npm run build
# output in /dist
```

---

## Struttura progetto

```
src/
├── audio-engine/
│   ├── AudioEngine.js      ← Singleton AudioContext + routing master
│   └── DeckEngine.js       ← Catena audio per singolo deck
├── components/
│   ├── Deck/               ← Deck completo (transport, pitch, hot cues)
│   ├── FX/                 ← FX strip (placeholder espandibile)
│   ├── JogWheel/           ← Jog wheel SVG multitouch + mouse
│   ├── Library/            ← Browser tracce + drag & drop
│   ├── Mixer/              ← Crossfader + EQ 3 bande + gain
│   └── Waveform/           ← Canvas waveform + playhead
├── hooks/
│   ├── useJogControl.js    ← Bridge gesto → DeckEngine
│   ├── useMultitouch.js    ← Routing touch → deck (multitouch iPhone)
│   └── usePositionSync.js  ← RAF loop: posizione audio → store
├── store/
│   ├── useDeckStore.js     ← Stato UI deck (transport, cue, jog)
│   ├── useLibraryStore.js  ← Libreria tracce locale
│   └── useMixerStore.js    ← Crossfader, gain, EQ
├── styles/
│   └── global.css          ← Design system + variabili CSS
└── utils/
    ├── angleUtils.js       ← Geometria jog (angolo, delta, scratch rate)
    └── formatUtils.js      ← Formattazione tempo, BPM, pitch
```

---

## Architettura multitouch jog

Il problema iPhone: due dita su due jog wheel = eventi sullo stesso documento.

Soluzione implementata in `useMultitouch.js`:
1. Ogni `JogWheel` registra il proprio elemento DOM: `registerJogRef(deckId, el)`
2. Su `touchstart`: `resolveTouchDeck(touch)` trova il deck corretto tramite `elementFromPoint`
3. Ogni touch identifier viene mappato al proprio deck per tutta la gesture
4. Su `touchend`: `releaseTouchId(identifier)` libera il mapping

Risultato: due jog indipendenti simultanei su iPhone.

---

## File da sviluppare subito dopo

### Priorità 1 — Funzionalità core
- [ ] `BeatDetector.js` — analisi BPM offline via Worker
- [ ] `ScratchNode` via AudioWorklet — scratch professionale a bassa latenza
- [ ] Aggiornamento waveform scrollante (la forma d'onda si sposta, il playhead è fisso)

### Priorità 2 — Performance
- [ ] Zoom waveform (vista overview + dettaglio)
- [ ] Beat grid overlay sul Canvas
- [ ] Hot cue set/jump implementazione completa

### Priorità 3 — Feature avanzate
- [ ] Sync BPM automatico tra deck
- [ ] FX chain reale (reverb Web Audio, delay, filter sweep)
- [ ] Loop engine (in/out point, loop attivo)
- [ ] Keyboard shortcuts manager (`useKeyboard.js`)
- [ ] MIDI input (Web MIDI API)

---

## Note tecniche

**AudioContext unlock**: il contesto viene inizializzato al primo `pointerdown`
sull'app (requisito browser per autoplay policy).

**playbackRate Safari**: su iOS Safari il range `playbackRate` è limitato a
`[0.5, 4.0]`. Scratch estremi oltre questi limiti vengono clampati automaticamente.

**Touch action**: `touch-action: none` sul jog SVG previene scroll/zoom.
Il `touchmove` con `preventDefault()` blocca il bounce iOS.

**Vite alias**: usa `@/`, `@audio/`, `@components/`, `@store/`, `@hooks/`, `@utils/`
per import puliti senza path relativi profondi.
