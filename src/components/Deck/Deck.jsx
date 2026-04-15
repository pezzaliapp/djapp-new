/**
 * Deck — componente completo di un singolo deck
 *
 * Contiene:
 *  - Info traccia
 *  - Transport controls (play, pause, cue, stop)
 *  - JogWheel
 *  - Pitch slider
 *  - Hot cue buttons
 *  - BPM display
 *  - Loop controls (placeholder)
 */

import React, { useCallback, useRef } from 'react'
import JogWheel from '@components/JogWheel/JogWheel.jsx'
import { audioEngine } from '@audio/AudioEngine.js'
import { useDeckStore } from '@store/useDeckStore.js'
import { useLibraryStore } from '@store/useLibraryStore.js'
import styles from './Deck.module.css'

export default function Deck({ deckId, side }) {
  const deck = useDeckStore((s) => s.decks[deckId])
  const updateDeck = useDeckStore((s) => s.updateDeck)
  const setPlaying = useDeckStore((s) => s.setPlaying)
  const setTrack = useDeckStore((s) => s.setTrack)
  const setJogMode = useDeckStore((s) => s.setJogMode)
  const selectedTrack = useLibraryStore((s) => s.selectedTrack)

  const fileInputRef = useRef(null)

  const deckColor = deckId === 'A' ? 'var(--deck-a)' : 'var(--deck-b)'

  // ── Transport ────────────────────────────────────────

  const handlePlay = useCallback(async () => {
    if (!audioEngine.ready) return
    const eng = audioEngine.deck(deckId)
    if (deck.playing) {
      eng.pause()
      setPlaying(deckId, false)
    } else {
      eng.play()
      setPlaying(deckId, true)
    }
  }, [deckId, deck.playing, setPlaying])

  const handleCue = useCallback(() => {
    if (!audioEngine.ready) return
    const eng = audioEngine.deck(deckId)
    eng.cue(deck.cuePoint)
    setPlaying(deckId, false)
  }, [deckId, deck.cuePoint, setPlaying])

  const handleStop = useCallback(() => {
    if (!audioEngine.ready) return
    audioEngine.deck(deckId).stop()
    setPlaying(deckId, false)
  }, [deckId, setPlaying])

  // ── Caricamento file ─────────────────────────────────

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!audioEngine.ready) await audioEngine.init()

    const eng = audioEngine.deck(deckId)
    const ok = await eng.loadFile(file)
    if (ok) {
      setTrack(deckId, {
        title: file.name.replace(/\.[^.]+$/, ''),
        artist: 'Local File',
        duration: eng.duration,
      })
    }
    e.target.value = ''
  }, [deckId, setTrack])

  const handleLoadFromLibrary = useCallback(async () => {
    if (!selectedTrack?.file) return
    if (!audioEngine.ready) await audioEngine.init()

    const eng = audioEngine.deck(deckId)
    const ok = await eng.loadFile(selectedTrack.file)
    if (ok) {
      setTrack(deckId, {
        title: selectedTrack.title,
        artist: selectedTrack.artist ?? 'Unknown',
        duration: eng.duration,
      })
    }
  }, [deckId, selectedTrack, setTrack])

  // ── Pitch ────────────────────────────────────────────

  const handlePitchChange = useCallback((e) => {
    const rate = parseFloat(e.target.value)
    if (!audioEngine.ready) return
    audioEngine.deck(deckId).setPlaybackRate(rate)
    updateDeck(deckId, { playbackRate: rate })
  }, [deckId, updateDeck])

  // ── Jog mode ─────────────────────────────────────────

  const toggleJogMode = useCallback(() => {
    const next = deck.jogMode === 'nudge' ? 'scratch' : 'nudge'
    setJogMode(deckId, next)
  }, [deckId, deck.jogMode, setJogMode])

  // ── Formato tempo ────────────────────────────────────

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const remaining = deck.trackDuration - deck.position

  return (
    <div className={styles.deck} data-side={side} data-playing={deck.playing}>
      <div className={styles.deckAccent} style={{ background: deckColor }} />

      {/* ── Track info ────────────────────────────────── */}
      <div className={styles.trackInfo}>
        <div className={styles.trackTitle}>
          {deck.trackTitle ?? '— no track loaded —'}
        </div>
        <div className={styles.trackArtist}>
          {deck.trackArtist ?? ''}
        </div>
        <div className={styles.trackTime}>
          <span className={styles.timeCurrent}>{formatTime(deck.position)}</span>
          <span className={styles.timeSep}> / </span>
          <span className={styles.timeRemaining}>-{formatTime(remaining)}</span>
        </div>
      </div>

      {/* ── BPM display ───────────────────────────────── */}
      <div className={styles.bpmDisplay} style={{ color: deckColor }}>
        <span className={styles.bpmValue}>
          {deck.bpm ? deck.bpm.toFixed(1) : '—.—'}
        </span>
        <span className={styles.bpmLabel}>BPM</span>
      </div>

      {/* ── Jog Wheel ────────────────────────────────── */}
      <JogWheel deckId={deckId} side={side} />

      {/* ── Jog mode toggle ──────────────────────────── */}
      <button
        className={styles.jogModeBtn}
        style={{ borderColor: deckColor, color: deck.jogMode === 'scratch' ? deckColor : 'var(--text-secondary)' }}
        onClick={toggleJogMode}
      >
        {deck.jogMode === 'scratch' ? 'SCRATCH' : 'NUDGE'}
      </button>

      {/* ── Pitch slider ─────────────────────────────── */}
      <div className={styles.pitchSection}>
        <span className={styles.pitchLabel}>PITCH</span>
        <input
          type="range"
          className={styles.pitchSlider}
          min="0.7"
          max="1.3"
          step="0.001"
          value={deck.playbackRate}
          onChange={handlePitchChange}
          style={{ accentColor: deckColor }}
        />
        <span className={styles.pitchValue} style={{ color: deckColor }}>
          {deck.playbackRate !== 1
            ? `${((deck.playbackRate - 1) * 100).toFixed(1)}%`
            : '±0%'}
        </span>
      </div>

      {/* ── Transport ────────────────────────────────── */}
      <div className={styles.transport}>
        <button className={styles.btnCue} onClick={handleCue}>CUE</button>

        <button
          className={styles.btnPlay}
          onClick={handlePlay}
          style={{ borderColor: deck.playing ? deckColor : 'var(--border-default)' }}
        >
          {deck.playing ? '⏸' : '▶'}
        </button>

        <button className={styles.btnStop} onClick={handleStop}>■</button>
      </div>

      {/* ── Hot cues ─────────────────────────────────── */}
      <div className={styles.hotCues}>
        {deck.hotCues.slice(0, 4).map((cue, i) => (
          <button
            key={i}
            className={styles.hotCueBtn}
            style={{
              background: cue !== null ? deckColor : 'transparent',
              borderColor: cue !== null ? deckColor : 'var(--border-default)',
              color: cue !== null ? '#000' : 'var(--text-muted)',
            }}
            onClick={() => {
              // TODO: set / jump hot cue
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* ── File loader ──────────────────────────────── */}
      <div className={styles.loaderRow}>
        <button
          className={styles.loadBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          LOAD FILE
        </button>
        <button
          className={styles.loadBtn}
          onClick={handleLoadFromLibrary}
          disabled={!selectedTrack}
        >
          FROM LIBRARY
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
