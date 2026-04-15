/**
 * usePositionSync — sincronizza la posizione audio → store UI
 *
 * Esegue un loop requestAnimationFrame che legge la posizione
 * corrente dal DeckEngine e aggiorna lo store Zustand.
 *
 * Montato una volta nell'App o nei singoli Deck.
 */

import { useEffect } from 'react'
import { audioEngine } from '@audio/AudioEngine.js'
import { useDeckStore } from '@store/useDeckStore.js'

const DECK_IDS = ['A', 'B']

export function usePositionSync() {
  const setPosition = useDeckStore((s) => s.setPosition)
  const setPlaying  = useDeckStore((s) => s.setPlaying)

  useEffect(() => {
    let rafId

    const sync = () => {
      if (audioEngine.ready) {
        for (const id of DECK_IDS) {
          try {
            const eng = audioEngine.deck(id)
            setPosition(id, eng.position, eng.progress)

            // Sincronizza stato playing se il buffer è finito
            const storeState = useDeckStore.getState().decks[id]
            if (storeState.playing && !eng.playing) {
              setPlaying(id, false)
            }
          } catch (_) {}
        }
      }
      rafId = requestAnimationFrame(sync)
    }

    rafId = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(rafId)
  }, [setPosition, setPlaying])
}
