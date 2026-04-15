/**
 * JogWheel — componente jog wheel professionale
 *
 * Feature:
 *  - Touch: tracking per touchIdentifier → nessun conflitto tra deck
 *  - Mouse: drag con pulsante sinistro (laptop/desktop)
 *  - Modalità: nudge (variazione velocità) / scratch (riposizionamento)
 *  - Rotazione visuale SVG sincronizzata col playback
 *  - Multitouch: supporta due jog simultanei su iPhone
 *
 * Props:
 *  deckId  — 'A' | 'B' | 'C' | 'D'
 *  side    — 'left' | 'right' (per indicatore visuale)
 */

import React, { useRef, useEffect, useCallback, useState } from 'react'
import {
  registerJogRef,
  resolveTouchDeck,
  releaseTouchId,
} from '@hooks/useMultitouch.js'
import { getAngleDeg, angleDelta, getElementCenter, computeScratchRate } from '@utils/angleUtils.js'
import { audioEngine } from '@audio/AudioEngine.js'
import { useDeckStore } from '@store/useDeckStore.js'
import styles from './JogWheel.module.css'

export default function JogWheel({ deckId, side = 'left' }) {
  const svgRef = useRef(null)
  const setJogAngle = useDeckStore((s) => s.setJogAngle)
  const jogMode = useDeckStore((s) => s.decks[deckId]?.jogMode ?? 'nudge')
  const playing = useDeckStore((s) => s.decks[deckId]?.playing ?? false)

  // Stato locale del gesto attivo
  const gesture = useRef({
    active: false,
    prevAngle: 0,
    prevTime: 0,
    touchId: null,    // per touch: identifier del tocco "proprietario"
    isTouch: false,
  })

  // Angolo visuale (gradi) — usato solo per l'animazione SVG
  const [visualAngle, setVisualAngle] = useState(0)
  const visualAngleRef = useRef(0)

  // Animazione continua del piatto durante il playback
  const animRef = useRef(null)
  const lastFrameTime = useRef(0)

  useEffect(() => {
    // Registra questo elemento nel registro multitouch globale
    registerJogRef(deckId, svgRef.current)
    return () => registerJogRef(deckId, null)
  }, [deckId])

  // ── Animazione rotazione durante play ────────────────────────
  useEffect(() => {
    const RPM = 33.3
    const DEG_PER_MS = (RPM * 360) / 60000

    const tick = (ts) => {
      if (lastFrameTime.current > 0) {
        const dt = ts - lastFrameTime.current
        // Ruota solo se playing E nessun gesto attivo (scratch ferma il piatto)
        if (playing && !gesture.current.active) {
          visualAngleRef.current = (visualAngleRef.current + DEG_PER_MS * dt) % 360
          setVisualAngle(visualAngleRef.current)
          setJogAngle(deckId, visualAngleRef.current)
        }
      }
      lastFrameTime.current = ts
      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, deckId, setJogAngle])

  // ── Logica gesto comune ───────────────────────────────────────

  const onGestureStart = useCallback((clientX, clientY, touchId = null) => {
    const el = svgRef.current
    if (!el) return

    const { cx, cy } = getElementCenter(el)
    const angle = getAngleDeg(clientX, clientY, cx, cy)

    gesture.current = {
      active: true,
      prevAngle: angle,
      prevTime: performance.now(),
      touchId,
      isTouch: touchId !== null,
    }
  }, [])

  const onGestureMove = useCallback((clientX, clientY) => {
    if (!gesture.current.active) return

    const el = svgRef.current
    if (!el) return

    const { cx, cy } = getElementCenter(el)
    const angle = getAngleDeg(clientX, clientY, cx, cy)
    const now = performance.now()

    const delta = angleDelta(gesture.current.prevAngle, angle)
    const dt = now - gesture.current.prevTime

    if (Math.abs(delta) < 0.1) {
      // Movimento troppo piccolo, ignora
      gesture.current.prevAngle = angle
      gesture.current.prevTime = now
      return
    }

    // Aggiorna angolo visuale
    visualAngleRef.current = (visualAngleRef.current + delta + 360) % 360
    setVisualAngle(visualAngleRef.current)
    setJogAngle(deckId, visualAngleRef.current)

    // Azione audio
    if (audioEngine.ready) {
      try {
        const deck = audioEngine.deck(deckId)
        if (jogMode === 'scratch') {
          const { scratchRate, direction } = computeScratchRate(delta, dt)
          deck.scratch(delta, scratchRate)
        } else {
          // Nudge: piccola variazione di playback rate
          const nudgeFactor = 1 + (delta / 180) * 0.15
          deck.nudge(nudgeFactor)
        }
      } catch (_) { /* audio non inizializzato */ }
    }

    gesture.current.prevAngle = angle
    gesture.current.prevTime = now
  }, [deckId, jogMode, setJogAngle])

  const onGestureEnd = useCallback(() => {
    if (!gesture.current.active) return
    gesture.current.active = false

    // Ripristina playback rate normale dopo nudge
    if (audioEngine.ready) {
      try {
        audioEngine.deck(deckId).nudgeRelease()
      } catch (_) { /* */ }
    }
  }, [deckId])

  // ── Touch handlers ────────────────────────────────────────────

  const onTouchStart = useCallback((e) => {
    e.preventDefault() // blocca scroll/zoom

    // Troviamo il primo touch che punta su questo elemento
    for (const touch of e.changedTouches) {
      const owner = resolveTouchDeck(touch)
      if (owner === deckId) {
        // Ignora se c'è già un touch attivo su questo jog
        if (gesture.current.active && gesture.current.isTouch) break
        onGestureStart(touch.clientX, touch.clientY, touch.identifier)
        break
      }
    }
  }, [deckId, onGestureStart])

  const onTouchMove = useCallback((e) => {
    e.preventDefault()

    for (const touch of e.changedTouches) {
      if (touch.identifier === gesture.current.touchId) {
        onGestureMove(touch.clientX, touch.clientY)
        break
      }
    }
  }, [onGestureMove])

  const onTouchEnd = useCallback((e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === gesture.current.touchId) {
        releaseTouchId(touch.identifier)
        onGestureEnd()
        break
      }
    }
  }, [onGestureEnd])

  // ── Mouse handlers (laptop / desktop) ────────────────────────

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    e.preventDefault()
    onGestureStart(e.clientX, e.clientY, null)

    const handleMouseMove = (ev) => onGestureMove(ev.clientX, ev.clientY)
    const handleMouseUp = () => {
      onGestureEnd()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [onGestureStart, onGestureMove, onGestureEnd])

  // ── SVG render ────────────────────────────────────────────────

  const deckColor = deckId === 'A' ? 'var(--deck-a)' : 'var(--deck-b)'
  const plateBg = jogMode === 'scratch' ? '#1a1a1a' : '#141414'

  return (
    <div className={styles.jogContainer} data-touch-lock data-deck={deckId}>
      {/* Label modalità */}
      <div className={styles.modeLabel} style={{ color: deckColor }}>
        {jogMode.toUpperCase()}
      </div>

      <svg
        ref={svgRef}
        className={styles.jogSvg}
        viewBox="0 0 300 300"
        xmlns="http://www.w3.org/2000/svg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{ touchAction: 'none', cursor: 'grab' }}
      >
        {/* Outer ring */}
        <circle cx="150" cy="150" r="148" fill="none" stroke="#222" strokeWidth="3" />

        {/* Piatto — ruota con visualAngle */}
        <g transform={`rotate(${visualAngle}, 150, 150)`}>
          {/* Piatto base */}
          <circle cx="150" cy="150" r="142" fill={plateBg} />

          {/* Texture righe radiali */}
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 15 * Math.PI) / 180
            const x1 = 150 + Math.cos(a) * 90
            const y1 = 150 + Math.sin(a) * 90
            const x2 = 150 + Math.cos(a) * 138
            const y2 = 150 + Math.sin(a) * 138
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#2a2a2a" strokeWidth="1.5" />
            )
          })}

          {/* Marker posizione (punto bianco a 12 ore) */}
          <circle cx="150" cy="14" r="4" fill={deckColor} opacity="0.9" />

          {/* Anello intermedio texture */}
          <circle cx="150" cy="150" r="88" fill="none" stroke="#1e1e1e" strokeWidth="20" />
          <circle cx="150" cy="150" r="88" fill="none" stroke="#252525" strokeWidth="1" />
        </g>

        {/* Hub centrale fisso */}
        <circle cx="150" cy="150" r="50" fill="#0f0f0f" stroke="#222" strokeWidth="1" />
        <circle cx="150" cy="150" r="30" fill="#0a0a0a" stroke={deckColor} strokeWidth="1" opacity="0.4" />

        {/* Label deck nel hub */}
        <text
          x="150" y="156"
          textAnchor="middle"
          fontSize="22"
          fontWeight="700"
          fontFamily="var(--font-mono)"
          fill={deckColor}
          opacity="0.8"
          style={{ userSelect: 'none' }}
        >
          {deckId}
        </text>

        {/* Indicatore attività gesto */}
        {gesture.current.active && (
          <circle cx="150" cy="150" r="148" fill="none"
            stroke={deckColor} strokeWidth="2" opacity="0.3" />
        )}
      </svg>

      {/* Display angolo (debug/tecnico) */}
      <div className={styles.angleDisplay} style={{ color: deckColor }}>
        {Math.round(visualAngle)}°
      </div>
    </div>
  )
}
