import React, { useEffect, useRef, useState } from 'react'
import Deck from '@components/Deck/Deck.jsx'
import Mixer from '@components/Mixer/Mixer.jsx'
import Waveform from '@components/Waveform/Waveform.jsx'
import Library from '@components/Library/Library.jsx'
import FXPanel from '@components/FX/FXPanel.jsx'
import { audioEngine } from '@audio/AudioEngine.js'
import { usePositionSync } from '@hooks/usePositionSync.js'
import styles from './App.module.css'

export const DECK_IDS = ['A', 'B']

function PositionSyncProvider() {
  usePositionSync()
  return null
}

// Tab mobile: 0=DeckA, 1=Mixer, 2=DeckB, 3=Library
const MOBILE_TABS = [
  { id: 0, icon: '◉', label: 'DECK A', color: 'var(--deck-a)' },
  { id: 1, icon: '⇌', label: 'MIXER',  color: 'var(--text-secondary)' },
  { id: 2, icon: '◉', label: 'DECK B', color: 'var(--deck-b)' },
  { id: 3, icon: '♪', label: 'LIBRARY', color: 'var(--text-secondary)' },
]

export default function App() {
  const engineReady = useRef(false)
  const [mobileTab, setMobileTab] = useState(0)
  const isMobile = window.innerWidth <= 600

  useEffect(() => {
    const unlock = async () => {
      if (!engineReady.current) {
        await audioEngine.init()
        engineReady.current = true
        document.removeEventListener('pointerdown', unlock)
      }
    }
    document.addEventListener('pointerdown', unlock, { once: true })
    return () => document.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <div className={styles.app}>
      <PositionSyncProvider />

      {/* Header */}
      <header className={styles.header}>
        <span className={styles.brand}>djApp</span>
        <span className={styles.brandSub}>by PezzaliApp</span>
        <div className={styles.headerStatus}>
          <span className={styles.dot} />
          READY
        </div>
      </header>

      {/* Waveform zone */}
      <section className={styles.waveformZone}>
        {isMobile ? (
          // Mobile: mostra solo la waveform del deck attivo
          <Waveform deckId={mobileTab === 2 ? 'B' : 'A'} />
        ) : (
          DECK_IDS.map((id) => <Waveform key={id} deckId={id} />)
        )}
      </section>

      {/* Performance zone */}
      <main className={styles.performanceZone}>
        {isMobile ? (
          // Mobile: mostra il pannello selezionato
          <>
            {mobileTab === 0 && <Deck deckId="A" side="left" />}
            {mobileTab === 1 && <Mixer deckIds={DECK_IDS} />}
            {mobileTab === 2 && <Deck deckId="B" side="right" />}
            {mobileTab === 3 && <Library />}
          </>
        ) : (
          <>
            <Deck deckId="A" side="left" />
            <Mixer deckIds={DECK_IDS} />
            <Deck deckId="B" side="right" />
          </>
        )}
      </main>

      {/* FX (solo desktop) */}
      <section className={styles.fxZone}>
        <FXPanel />
      </section>

      {/* Library (solo desktop) */}
      <section className={styles.libraryZone}>
        <Library />
      </section>

      {/* Tab bar mobile */}
      <nav className={styles.mobileNav}>
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            className={styles.mobileTab}
            data-active={mobileTab === tab.id}
            onClick={() => setMobileTab(tab.id)}
          >
            <span
              className={styles.mobileTabIcon}
              style={{ color: mobileTab === tab.id ? tab.color : 'var(--text-muted)' }}
            >
              {tab.icon}
            </span>
            <span className={styles.mobileTabLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
