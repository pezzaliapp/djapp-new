/**
 * FXPanel — striscia effetti
 *
 * Stato attuale: placeholder strutturato.
 * Architettura predisposta per:
 *  - FX chain per deck (reverb, delay, filter, flanger)
 *  - Wet/dry knob per slot
 *  - Routing sorgente (A / B / master)
 *
 * Ogni FX slot sarà un nodo nella catena Web Audio.
 */

import React from 'react'
import styles from './FXPanel.module.css'

const FX_SLOTS = [
  { id: 'reverb',   label: 'REVERB',   color: '#9b59b6' },
  { id: 'delay',    label: 'DELAY',    color: '#e67e22' },
  { id: 'filter',   label: 'FILTER',   color: '#3498db' },
  { id: 'flanger',  label: 'FLANGER',  color: '#1abc9c' },
]

function FXSlot({ slot }) {
  return (
    <div className={styles.slot} style={{ '--fx-color': slot.color }}>
      <div className={styles.slotName}>{slot.label}</div>
      <div className={styles.slotKnob}>
        <svg width="28" height="28" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="12" fill="#1a1a1a" stroke={slot.color} strokeWidth="1" opacity="0.4" />
          <line x1="14" y1="14" x2="14" y2="4" stroke={slot.color} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </svg>
      </div>
      <div className={styles.slotWet}>0%</div>
    </div>
  )
}

export default function FXPanel() {
  return (
    <div className={styles.fxPanel}>
      <span className={styles.label}>FX</span>
      <div className={styles.slots}>
        {FX_SLOTS.map((slot) => (
          <FXSlot key={slot.id} slot={slot} />
        ))}
      </div>
      <span className={styles.comingSoon}>— in sviluppo —</span>
    </div>
  )
}
