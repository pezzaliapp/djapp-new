/**
 * AudioEngine — singleton centrale
 *
 * Responsabilità:
 *  - Gestisce un singolo AudioContext (unlock su gesto utente)
 *  - Registra e coordina i DeckEngine per ogni deck
 *  - Espone il master gain e il bus di output
 *
 * Non istanziare mai direttamente: usa l'export `audioEngine`.
 */

import { DeckEngine } from './DeckEngine.js'

class AudioEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.decks = {}       // { 'A': DeckEngine, 'B': DeckEngine, ... }
    this._ready = false
  }

  /** Chiama questa funzione al primo gesto utente */
  async init() {
    if (this._ready) return

    this.ctx = new (window.AudioContext || window.webkitAudioContext)({
      // latencyHint 'interactive' → priorità alla bassa latenza
      latencyHint: 'interactive',
      sampleRate: 44100,
    })

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume()
    }

    // Master gain → destination
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.9
    this.masterGain.connect(this.ctx.destination)

    // Crea deck iniziali A e B
    for (const id of ['A', 'B']) {
      this.decks[id] = new DeckEngine(this.ctx, this.masterGain, id)
    }

    this._ready = true
    console.log('[AudioEngine] init — latency:', this.ctx.baseLatency, 's')
  }

  get ready() { return this._ready }

  /** Restituisce il DeckEngine per id ('A', 'B', ...) */
  deck(id) {
    if (!this._ready) throw new Error('AudioEngine not initialized')
    if (!this.decks[id]) throw new Error(`Deck ${id} not found`)
    return this.decks[id]
  }

  /** Aggiunge un deck on-the-fly (per espansione a 4 deck) */
  addDeck(id) {
    if (!this._ready) throw new Error('AudioEngine not initialized')
    if (!this.decks[id]) {
      this.decks[id] = new DeckEngine(this.ctx, this.masterGain, id)
    }
    return this.decks[id]
  }

  setMasterVolume(value) {
    if (!this.masterGain) return
    this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01)
  }

  /** Tempo corrente del contesto audio in secondi */
  get now() { return this.ctx?.currentTime ?? 0 }
}

// Singleton esportato
export const audioEngine = new AudioEngine()
