/**
 * DeckEngine — motore audio per un singolo deck
 *
 * Chain audio:
 *   AudioBufferSourceNode
 *     → lowFilter (BiquadFilter)
 *     → midFilter
 *     → highFilter
 *     → channelGain
 *     → masterBus
 *
 * Supporta:
 *  - caricamento file locale (File API / ArrayBuffer)
 *  - play / pause / cue
 *  - playbackRate (pitch + scratch)
 *  - EQ 3 bande
 *  - gain canale
 */

export class DeckEngine {
  constructor(ctx, masterBus, id) {
    this.ctx = ctx
    this.id = id

    /** Buffer audio caricato */
    this.buffer = null

    /** Sorgente attiva (ricreata ad ogni play) */
    this._source = null

    /** Posizione di playback accumulata */
    this._startOffset = 0
    this._startTime = 0
    this._playing = false

    /** playbackRate target (1.0 = normale) */
    this._playbackRate = 1.0

    // ── Catena nodi ──────────────────────────────
    this.channelGain = ctx.createGain()
    this.channelGain.gain.value = 0.8

    // EQ 3 bande
    this.lowFilter = ctx.createBiquadFilter()
    this.lowFilter.type = 'lowshelf'
    this.lowFilter.frequency.value = 200
    this.lowFilter.gain.value = 0

    this.midFilter = ctx.createBiquadFilter()
    this.midFilter.type = 'peaking'
    this.midFilter.frequency.value = 1000
    this.midFilter.Q.value = 1
    this.midFilter.gain.value = 0

    this.highFilter = ctx.createBiquadFilter()
    this.highFilter.type = 'highshelf'
    this.highFilter.frequency.value = 4000
    this.highFilter.gain.value = 0

    // Connessione catena fissa
    this.lowFilter.connect(this.midFilter)
    this.midFilter.connect(this.highFilter)
    this.highFilter.connect(this.channelGain)
    this.channelGain.connect(masterBus)
  }

  // ── Load ────────────────────────────────────────

  /**
   * Carica un File o un ArrayBuffer.
   * Ritorna true se caricato con successo.
   */
  async loadFile(fileOrBuffer) {
    let arrayBuffer
    if (fileOrBuffer instanceof File) {
      arrayBuffer = await fileOrBuffer.arrayBuffer()
    } else {
      arrayBuffer = fileOrBuffer
    }

    try {
      this.buffer = await this.ctx.decodeAudioData(arrayBuffer)
      this._startOffset = 0
      console.log(`[Deck ${this.id}] loaded — duration: ${this.buffer.duration.toFixed(2)}s`)
      return true
    } catch (err) {
      console.error(`[Deck ${this.id}] decode error:`, err)
      return false
    }
  }

  // ── Transport ────────────────────────────────────

  play() {
    if (!this.buffer || this._playing) return

    // Ogni play crea un nuovo SourceNode (non riutilizzabile)
    this._source = this.ctx.createBufferSource()
    this._source.buffer = this.buffer
    this._source.playbackRate.value = this._playbackRate
    this._source.connect(this.lowFilter)

    this._source.onended = () => {
      // Solo se finito naturalmente (non per stop manuale)
      if (this._playing) {
        this._playing = false
        this._startOffset = 0
      }
    }

    this._source.start(0, this._clampOffset(this._startOffset))
    this._startTime = this.ctx.currentTime
    this._playing = true
  }

  pause() {
    if (!this._playing) return
    this._startOffset = this._currentPosition()
    this._source?.stop()
    this._source = null
    this._playing = false
  }

  stop() {
    this.pause()
    this._startOffset = 0
  }

  /** Vai a un punto nel tempo (secondi) */
  seek(positionSeconds) {
    const wasPlaying = this._playing
    if (this._playing) this.pause()
    this._startOffset = this._clampOffset(positionSeconds)
    if (wasPlaying) this.play()
  }

  /** Imposta un cue point e vai */
  cue(positionSeconds) {
    this.pause()
    this._startOffset = this._clampOffset(positionSeconds)
  }

  // ── Scratch / Jog ────────────────────────────────

  /**
   * Chiamata dal JogWheel durante scratch.
   * deltaAngleDeg: angolo percorso in gradi (positivo = avanti, negativo = indietro)
   * scratchSpeed: moltiplicatore (es. 1.0 normale, 2.0 veloce)
   */
  scratch(deltaAngleDeg, scratchSpeed = 1.0) {
    if (!this.buffer || !this._playing) return
    const deltaSeconds = (deltaAngleDeg / 360) * (this.buffer.duration * 0.02) * scratchSpeed
    const newPos = this._clampOffset(this._currentPosition() + deltaSeconds)
    // Sposta sorgente in tempo reale
    this._moveSourceTo(newPos)
  }

  /**
   * Nudge: piccola variazione di velocità temporanea (per sincronizzare il beat).
   * factor: 1.0 = normale, >1 = accelera, <1 = rallenta
   */
  nudge(factor) {
    if (!this._source) return
    this._source.playbackRate.setTargetAtTime(
      this._playbackRate * factor,
      this.ctx.currentTime,
      0.05,
    )
  }

  /** Ripristina playback rate normale dopo un nudge */
  nudgeRelease() {
    if (!this._source) return
    this._source.playbackRate.setTargetAtTime(
      this._playbackRate,
      this.ctx.currentTime,
      0.08,
    )
  }

  // ── Parametri ────────────────────────────────────

  setGain(value) {
    this.channelGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01)
  }

  setPlaybackRate(rate) {
    this._playbackRate = rate
    if (this._source) {
      this._source.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.01)
    }
  }

  setEQ(band, gainDb) {
    const filter = { low: this.lowFilter, mid: this.midFilter, high: this.highFilter }[band]
    if (!filter) return
    filter.gain.setTargetAtTime(gainDb, this.ctx.currentTime, 0.01)
  }

  // ── Getters ──────────────────────────────────────

  get playing() { return this._playing }
  get duration() { return this.buffer?.duration ?? 0 }
  get position() { return this._currentPosition() }
  get progress() {
    return this.duration > 0 ? this._currentPosition() / this.duration : 0
  }

  // ── Privati ──────────────────────────────────────

  _currentPosition() {
    if (!this._playing) return this._startOffset
    return this._startOffset + (this.ctx.currentTime - this._startTime) * this._playbackRate
  }

  _clampOffset(pos) {
    const max = this.buffer?.duration ?? 0
    return Math.max(0, Math.min(pos, max))
  }

  /**
   * Riposiziona la sorgente senza interrompere il playback percepito.
   * Tecnica: ferma e riparte dalla nuova posizione nello stesso render cycle.
   */
  _moveSourceTo(positionSeconds) {
    const wasPlaying = this._playing
    if (wasPlaying) {
      this._source?.stop()
      this._source = null
      this._playing = false
    }
    this._startOffset = positionSeconds
    if (wasPlaying) this.play()
  }
}
