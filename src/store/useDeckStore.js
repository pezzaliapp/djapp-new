/**
 * useDeckStore — stato UI per tutti i deck
 *
 * Contiene lo stato visuale/logico del deck.
 * La sorgente di verità audio rimane in DeckEngine.
 * Questo store guida la UI (React) e coordina le azioni.
 */

import { create } from 'zustand'

const makeDeckState = (id) => ({
  id,
  /** Metadati traccia */
  trackTitle: null,
  trackArtist: null,
  trackDuration: 0,

  /** Transport */
  playing: false,
  position: 0,        // secondi
  progress: 0,        // 0.0 → 1.0

  /** Jog */
  jogAngle: 0,        // angolo visuale del jog wheel (gradi)
  jogMode: 'nudge',   // 'nudge' | 'scratch'

  /** Pitch */
  playbackRate: 1.0,
  bpm: null,

  /** Cue */
  cuePoint: 0,
  hotCues: [null, null, null, null, null, null, null, null],

  /** Sync */
  syncEnabled: false,
  syncMaster: false,

  /** Loop */
  loopActive: false,
  loopStart: null,
  loopEnd: null,
})

export const useDeckStore = create((set, get) => ({
  decks: {
    A: makeDeckState('A'),
    B: makeDeckState('B'),
    // Aggiungere C e D qui per espansione 4 deck
  },

  // ── Helpers ──────────────────────────────────

  /** Restituisce lo stato di un deck */
  getDeck: (id) => get().decks[id],

  /** Aggiorna campi parziali di un deck */
  updateDeck: (id, patch) =>
    set((state) => ({
      decks: {
        ...state.decks,
        [id]: { ...state.decks[id], ...patch },
      },
    })),

  // ── Transport ────────────────────────────────

  setPlaying: (id, playing) =>
    set((state) => ({
      decks: { ...state.decks, [id]: { ...state.decks[id], playing } },
    })),

  setPosition: (id, position, progress) =>
    set((state) => ({
      decks: { ...state.decks, [id]: { ...state.decks[id], position, progress } },
    })),

  // ── Jog ─────────────────────────────────────

  setJogAngle: (id, jogAngle) =>
    set((state) => ({
      decks: { ...state.decks, [id]: { ...state.decks[id], jogAngle } },
    })),

  setJogMode: (id, jogMode) =>
    set((state) => ({
      decks: { ...state.decks, [id]: { ...state.decks[id], jogMode } },
    })),

  // ── Track ────────────────────────────────────

  setTrack: (id, { title, artist, duration }) =>
    set((state) => ({
      decks: {
        ...state.decks,
        [id]: {
          ...state.decks[id],
          trackTitle: title,
          trackArtist: artist,
          trackDuration: duration,
          position: 0,
          progress: 0,
        },
      },
    })),

  // ── Cue ─────────────────────────────────────

  setCuePoint: (id, cuePoint) =>
    set((state) => ({
      decks: { ...state.decks, [id]: { ...state.decks[id], cuePoint } },
    })),

  setHotCue: (id, index, position) =>
    set((state) => {
      const hotCues = [...state.decks[id].hotCues]
      hotCues[index] = position
      return {
        decks: { ...state.decks, [id]: { ...state.decks[id], hotCues } },
      }
    }),

  // ── Pitch / BPM ─────────────────────────────

  setPlaybackRate: (id, playbackRate) =>
    set((state) => ({
      decks: { ...state.decks, [id]: { ...state.decks[id], playbackRate } },
    })),

  setBPM: (id, bpm) =>
    set((state) => ({
      decks: { ...state.decks, [id]: { ...state.decks[id], bpm } },
    })),
}))
