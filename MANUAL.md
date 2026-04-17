# djApp — Manuale d'uso

**Versione documento:** 1.0
**App:** djApp by PezzaliApp
**URL produzione:** [https://www.alessandropezzali.it/djapp-new/](https://www.alessandropezzali.it/djapp-new/)
**Autore:** Alessandro Pezzali — PezzaliApp
**Ambito:** Uso completo su laptop (macOS, Windows) e mobile (Android, iPhone/iPad)

---

## Indice

1. [Cos'è djApp](#1-cosè-djapp)
2. [Requisiti](#2-requisiti)
3. [Installazione come PWA](#3-installazione-come-pwa)
4. [Panoramica dell'interfaccia](#4-panoramica-dellinterfaccia)
5. [Caricamento dei brani](#5-caricamento-dei-brani)
6. [Deck A e Deck B — comandi completi](#6-deck-a-e-deck-b--comandi-completi)
7. [Mixer centrale](#7-mixer-centrale)
8. [Effetti — COLOR FX e BEAT FX](#8-effetti--color-fx-e-beat-fx)
9. [Pannello Beatmatch (overlay)](#9-pannello-beatmatch-overlay)
10. [Registratore WAV (overlay)](#10-registratore-wav-overlay)
11. [Scorciatoie da tastiera](#11-scorciatoie-da-tastiera)
12. [Workflow completo — mixare due brani](#12-workflow-completo--mixare-due-brani)
13. [Uso su mobile](#13-uso-su-mobile)
14. [Risoluzione problemi](#14-risoluzione-problemi)
15. [Note tecniche](#15-note-tecniche)

---

## 1. Cos'è djApp

djApp è un'applicazione web per il mixaggio di due tracce audio in tempo reale, pensata per girare **direttamente nel browser** senza plugin, senza download di software, senza account. Funziona come una consolle DJ a due deck con mixer centrale, equalizzazione a 3 bande per canale, crossfader, catena di effetti e analisi automatica del BPM.

È una **Progressive Web App (PWA)**: può essere installata su macOS, Windows, Android e iOS e comportarsi come un'app nativa (icona nel launcher, finestra dedicata, funzionamento offline dell'interfaccia).

È costruita sopra la Web Audio API e la grafica React. Due overlay aggiuntivi — **Recorder WAV** e **Beatmatch** — estendono le funzioni base con registrazione del mix in WAV PCM stereo 16-bit e sincronizzazione automatica del tempo tra i due deck.

---

## 2. Requisiti

### 2.1 Browser supportati

| Piattaforma | Browser consigliato | Note |
|---|---|---|
| macOS | Chrome (ultima versione) | Esperienza piena, installazione PWA nativa |
| macOS | Safari 17+ | Funziona, installazione PWA via "Aggiungi al Dock" |
| Windows | Chrome, Edge | Esperienza piena |
| Android | Chrome | Esperienza piena |
| iPhone/iPad | Safari | Obbligatorio per PWA su iOS |

### 2.2 Connessione

- **Prima apertura**: serve connessione internet (si scarica l'app)
- **Uso successivo**: l'interfaccia funziona offline grazie al Service Worker. I brani però vanno caricati localmente dal tuo dispositivo
- **HTTPS**: djApp gira solo su https. I deploy su Cloudflare Pages / GitHub Pages sono già HTTPS di default

### 2.3 Hardware

- CPU dual-core o superiore
- **Cuffie**: fortemente consigliate per il monitoraggio pre-fader in produzione
- Scheda audio stereo standard integrata
- Latenza audio dipendente dal browser: 20-40 ms su Chrome, 40-80 ms su Safari

---

## 3. Installazione come PWA

Installare djApp come app ha 3 vantaggi: l'icona sta nel launcher come qualsiasi altra app, si apre in finestra pulita senza la barra del browser, e continua a funzionare anche in modalità aereo (serve solo al momento del caricamento iniziale dell'interfaccia).

### 3.1 macOS — Chrome

1. Apri Chrome e vai su `https://www.alessandropezzali.it/djapp-new/`
2. Attendi il caricamento completo della pagina
3. Nella barra degli indirizzi, sul lato destro, cerca **l'icona monitor con freccia ⊕** (tooltip "Installa djApp")
4. Click sull'icona → conferma con **"Installa"**
5. djApp apparirà in `/Applicazioni/Chrome Apps/` e in Launchpad
6. Per disinstallare: tasto destro sull'icona in Dock o Launchpad → "Rimuovi"

**Metodo alternativo tramite menu:**

- Click sui tre puntini verticali ⋮ in alto a destra
- `Trasmetti, salva e condividi` → `Installa pagina come app...`
- Scegli il nome → `Installa`

### 3.2 macOS — Safari

1. Apri Safari e vai su djApp
2. Menu **File** → **Aggiungi al Dock...**
3. Scegli nome e icona → `Aggiungi`
4. L'app appare nel Dock e può essere trascinata nella cartella Applicazioni

### 3.3 Windows — Chrome o Edge

1. Apri il browser e vai su djApp
2. Sul lato destro della barra indirizzi, icona **⊕** (Chrome) o **▢ con +** (Edge) → tooltip "Installa"
3. Click → `Installa`
4. djApp appare in Start Menu e come icona sul Desktop
5. Puoi pinnare nella Taskbar con tasto destro → "Aggiungi alla barra delle applicazioni"

### 3.4 Android — Chrome

1. Apri Chrome su Android e vai su djApp
2. Chrome mostra in basso un bottom-sheet **"Installa app"** (oppure menu ⋮ → "Installa app")
3. Tocca → `Installa`
4. L'icona appare in home screen e nel drawer app
5. Si apre in modalità full-screen senza barra del browser

### 3.5 iPhone / iPad — Safari

**Obbligatorio usare Safari** (Chrome iOS non supporta l'installazione PWA — è Safari sotto il cofano con limitazioni).

1. Apri Safari e vai su djApp
2. Tocca l'icona **Condividi** (quadrato con freccia verso l'alto, nella barra in basso)
3. Scorri il foglio verso il basso fino a **"Aggiungi alla schermata Home"**
4. Tocca → scegli il nome → **Aggiungi**
5. L'icona compare in home. Apertura a tutto schermo, senza barra indirizzi

**Limitazioni iOS**: Safari non supporta AudioWorklet in modo completo come Chrome. Il recorder WAV può avere qualità leggermente inferiore. Per DJ set seri su iOS è meglio usare un iPad con iPadOS 17+.

---

## 4. Panoramica dell'interfaccia

L'interfaccia è divisa in **5 zone principali**, dall'alto verso il basso:

1. **Header** (in alto): logo djApp, indicatore `● READY` che diventa verde quando l'AudioContext è attivo
2. **Waveform Overview** (sotto l'header): due forme d'onda affiancate — deck A in blu a sinistra, deck B in verde a destra, con indicatore `30s/120s` per lo zoom temporale
3. **Deck A | Mixer | Deck B** (zona centrale, 3 colonne):
   - Deck A a sinistra con jog wheel, pitch, cue, loop
   - Mixer al centro con BPM, PHASE, EQ per canale, crossfader
   - Deck B a destra, speculare al A
4. **Barra effetti** (sotto i deck): `COLOR FX` a sinistra, `BEAT FX` a destra
5. **Library** (in basso): campo di ricerca, pulsante `+ IMPORT`, area drop files

**Overlay attivi** (si sovrappongono all'interfaccia):

- **Pannello Beatmatch** — posizionabile via drag, collassabile. Mostra BPM effettivi e pulsanti SYNC
- **Pill Recorder** — in basso a destra, mostra timer e pulsante REC/STOP

---

## 5. Caricamento dei brani

Ci sono tre modi per caricare un brano in un deck.

### 5.1 Drag & drop

Trascina un file audio dal Finder/Esplora risorse direttamente sulla waveform del deck A o B. Formati supportati: **MP3, WAV, M4A, AAC, FLAC, OGG, OPUS**.

### 5.2 Pulsante LOAD FILE

Sotto ogni deck c'è il pulsante **`LOAD FILE`**. Click → si apre il file picker del sistema → scegli il brano.

### 5.3 Library

Sotto i deck c'è la barra `Search tracks...` con pulsante `+ IMPORT`. Importa più brani in una sola volta; da lì puoi trascinarli sul deck A o B.

### 5.4 Analisi automatica

Appena caricato il brano, djApp:

- Disegna la waveform (blu per A, verde per B)
- **Calcola il BPM** automaticamente (analisi onset detection sul worker)
- Mostra durata totale e tempo rimanente nel display del deck

Il BPM analizzato appare accanto al titolo e nel MIXER centrale. L'analisi dura 2-5 secondi per un brano da 4 minuti.

---

## 6. Deck A e Deck B — comandi completi

Ogni deck è composto da 7 blocchi di controllo. Di seguito la guida dettagliata.

### 6.1 Jog wheel / NUDGE

Il grande disco con la lettera del deck ("A" o "B") al centro è il **jog wheel**, usato per il pitch-bend temporaneo.

- **Ruota in senso orario** → il deck **accelera** per la durata della rotazione (utile se il deck è in ritardo sull'altro)
- **Ruota in senso antiorario** → il deck **rallenta** (utile se è in anticipo)
- **Rilascia** → torna al tempo impostato dal PITCH slider
- Il valore corrente di nudge è mostrato in gradi (es. `63°` o `-19°`) sotto la rotella

Il pulsante **`NUDGE`** sotto il jog abilita/disabilita la modalità fine. Con NUDGE attivo, ogni giro del jog corrisponde a un pitch-bend più dolce.

### 6.2 KEY (tonalità)

Sotto il jog: `KEY ♭ 0 ♯ M.TEMPO`

- **♭ (bemolle)**: abbassa la tonalità di mezzo tono
- **0**: tonalità originale (reset)
- **♯ (diesis)**: alza di mezzo tono
- **M.TEMPO** (Master Tempo): se attivo, cambiare il pitch **non** altera la tonalità del brano (pitch-shifting indipendente). Se disattivo, pitch e tonalità sono legati (il brano suona più acuto se acceleri)

> ⚠️ **Nota versione corrente**: KEY e M.TEMPO sono presenti come UI ma non attivi in questa build. Il pitch slider influenza attualmente sia tempo sia tonalità. Implementazione in roadmap.

### 6.3 SYNC (pulsante integrato)

Il pulsante `⇌ SYNC` in UI serve per allineare automaticamente il deck al tempo dell'altro.

> ⚠️ **Nota versione corrente**: il pulsante SYNC integrato non è ancora cablato. Usa il **pannello Beatmatch overlay** (vedi [sezione 9](#9-pannello-beatmatch-overlay)) che ha due pulsanti `SYNC B→A` e `SYNC A→B` pienamente funzionanti.

### 6.4 QUANTIZE

Il pulsante `+ QUANTIZE` forza gli eventi (CUE, loop IN/OUT, hot cue) a scattare sulla battuta successiva invece che sul momento esatto del click. Utile per i DJ principianti che vogliono loop perfetti.

> ⚠️ **Nota versione corrente**: QUANTIZE è UI fittizia in questa build. In roadmap.

### 6.5 PITCH

Slider orizzontale con indicatore percentuale a destra (es. `+2.4%`, `-19.0%`).

- Range: tipicamente **±8%, ±16%** o **±50%** secondo la modalità
- **0%**: velocità originale del brano
- **Positivo**: accelera (e il BPM reale aumenta)
- **Negativo**: rallenta

Ad ogni variazione del pitch, il **`playbackRate`** del BufferSource cambia di conseguenza. Il BPM effettivo è sempre `BPM_originale × (1 + pitch/100)`. Nel display principale viene ora mostrato il valore aggiornato grazie all'overlay Beatmatch.

### 6.6 Trasporto — CUE / PLAY / STOP

Tre pulsanti sotto il PITCH:

- **`CUE`**: porta il cursore al cue point (di default: l'inizio del brano). Premendolo di nuovo in play esegue preview fino a rilascio
- **`▶ PLAY`**: avvia la riproduzione dal cursore corrente. Durante il play il pulsante diventa `⏸ PAUSE`
- **`■ STOP`**: ferma la riproduzione e riporta al cue point

Il cue point può essere spostato cliccando sulla waveform nel punto desiderato mentre il deck è in pause.

### 6.7 HOT CUE

Griglia di **8 pulsanti numerati (1-8)** con sopra `HOT CUE` e `CLR`, più un selettore `A B C D` che permette 4 banchi da 8 = 32 hot cue in totale.

**Uso previsto:**
- Click su un pulsante numero **vuoto** durante il play → memorizza il tempo corrente come hot cue
- Click su un pulsante **con hot cue memorizzato** → salta a quel punto
- **Click su `CLR`** + click su un hot cue → cancella quel hot cue
- **Banchi A/B/C/D**: cambiano il set degli 8 hot cue attivi (A = primo set, B = secondo, ecc.)

> ⚠️ **Nota versione corrente**: gli hot cue sono UI fittizia in questa build — click visibili ma senza handler audio. Implementazione in roadmap. Lo stesso vale per LOOP, IN/OUT, JUMP.

### 6.8 LOOP

Sotto gli hot cue, barra LOOP con valori in frazioni di battuta:

`1/4 | 1/2 | 1 | 2 | 4 | 8 | 16`

- Click su un valore → imposta la lunghezza del loop in battute
- Pulsante **`IN`**: marca l'inizio del loop
- Pulsante **`OUT`**: marca la fine del loop e lo attiva
- Pulsante **`LOOP`**: attiva/disattiva il loop corrente
- Pulsanti **`◀◀ ▶▶`**: dimezza o raddoppia la lunghezza del loop attivo

### 6.9 JUMP

Sotto LOOP, barra JUMP con valori `◁1 | 1▷ | ◁2 | 2▷`:

- `◁1`: salta indietro di 1 battuta
- `1▷`: salta avanti di 1 battuta
- `◁2`: salta indietro di 2 battute
- `2▷`: salta avanti di 2 battute

> ⚠️ **Stato**: in UI ma non attivo.

### 6.10 SCRATCH (solo deck B nell'interfaccia corrente)

In alto al jog del deck B appare `● SCRATCH`. Quando attivo, il jog wheel diventa una superficie da scratch: la riproduzione segue il movimento del dito/mouse in tempo reale, con effetto di pitch-bend istantaneo in entrambe le direzioni.

---

## 7. Mixer centrale

La colonna centrale concentra tutti i controlli di missaggio tra i due deck.

### 7.1 Display BPM

In alto nel mixer: `90.0 BPM 92.2` con sotto `Δ 2.2`.

- **Primo numero** = BPM **effettivo** del deck A (include il pitch)
- **Secondo numero** = BPM effettivo del deck B
- **Δ** = differenza assoluta tra i due BPM

Grazie all'overlay Beatmatch questi valori si aggiornano live al variare del pitch.

### 7.2 PHASE meter

Sotto il BPM: barra orizzontale con un pallino colorato e un valore numerico (es. `-19`, `+45`).

Indica **di quanto il beat del deck B è sfasato rispetto al deck A**:

- **Pallino al centro (valore ≈ 0)** → i beat sono allineati ✅
- **Pallino a destra (valore positivo)** → deck B è in **anticipo** rispetto ad A
- **Pallino a sinistra (valore negativo)** → deck B è in **ritardo** su A

Si corregge con il **NUDGE** del deck B o con un micro-aggiustamento del pitch.

### 7.3 Canali A e B

Due colonne di fader verticali con testo `A` e `B` in alto, colori blu (A) e verde (B).

Ogni canale ha 4 fader in sequenza verticale:

1. **HI** — taglia/boost delle **alte frequenze** (cymbals, hi-hat, armonici). Range ±24 dB tipico
2. **MID** — banda **medi** (voce, chitarre, snare)
3. **LO** — **bassi** (kick, sub). Il fader più importante per il mixaggio pulito
4. **GAIN** — volume generale del canale **prima degli EQ**. Si usa per bilanciare il livello dei due brani (alcuni sono masterizzati più forti di altri)

Il valore numerico accanto a ogni fader indica il valore corrente in dB o unità relative.

> 💡 **Trucco EQ-swap**: per una transizione pulita tra due brani, tira giù il LO del brano uscente mentre alzi il LO del brano entrante. Evita che due kick si pestino creando fango sonoro.

### 7.4 Crossfader A↔B / CENTER

Slider orizzontale in basso nel mixer con ai lati le lettere `A` e `B`.

- **Tutto a sinistra**: solo deck A, deck B muto
- **Tutto a destra**: solo deck B, deck A muto
- **Centro (CENTER)**: entrambi i deck al 100%
- Posizioni intermedie: miscela lineare tra i due

Il pulsante `CENTER` riporta lo slider esattamente al centro.

### 7.5 AudioMeter del Master

Il livello complessivo del master in uscita è riflesso dall'**icona audio della tab del browser** e implicitamente dal volume di sistema.

---

## 8. Effetti — COLOR FX e BEAT FX

Nella barra in basso, sotto i deck, due blocchi di effetti in serie sul master.

### 8.1 COLOR FX

Filtri colore sul segnale in uscita. Visibili a sinistra:

| Nome | Descrizione |
|---|---|
| **DELAY** | Ritardo con feedback. % indica il wet |
| **FILTER** | Filtro passa-alto / passa-basso. Slider centrale = neutro, verso sx = LPF, verso dx = HPF |
| **FLANGER** | Modulazione flanger. % = intensità |

Ogni effetto ha uno slider continuo (0-100%) e un valore numerico. L'etichetta gialla indica l'effetto selezionato.

### 8.2 BEAT FX

Effetti ritmici sincronizzati al BPM. Visibili a destra:

| Nome | Descrizione |
|---|---|
| **DELAY** | Ritardo sincronizzato a beat |
| **ECHO** | Eco più lungo con decadimento |
| **PING PONG** | Ritardo che alterna tra canale sx e dx |
| **REVERB** | Riverbero a coda variabile |
| **FILTER** | Filtro risonante |
| **FLANGER** | Flanger sincronizzato |
| **PHASER** | Phaser 4-stadi |
| **ROLL** | Loop a battute che si divide progressivamente |
| **TRANS** | Transformer (gate ritmico) |

**Selezione della durata**: `1/8 | 1/4 | 1/2 | 1 | 2 | 4` (frazioni di battuta).

**`70%`** = wet amount (percentuale segnale processato).

**`ON`** = pulsante enable/disable. Attivo quando acceso blu.

Solo un BEAT FX e un COLOR FX alla volta sono attivi. Si selezionano cliccando il nome.

---

## 9. Pannello Beatmatch (overlay)

Overlay aggiuntivo che aggiunge tre capacità:

1. Visualizza i **BPM effettivi** aggiornati al variare del pitch (il display integrato non lo fa)
2. Fornisce un **SYNC automatico** bidirezionale che allinea il tempo dei due deck
3. È **draggable** e **collassabile**, con posizione salvata

### 9.1 Struttura del pannello

Pannello nero con bordo blu. Header in alto con `BEATMATCH`, valore `Δ` compatto e freccia `▾/▸` per collassare.

Corpo (quando espanso):

```
Deck A            91.50 (+1.7%)
Deck B            91.50
Δ effettivo       0.00
[ SYNC B→A ] [ SYNC A→B ]
```

### 9.2 Spostare il pannello

Click + trascinamento **sull'header** (area con scritta "BEATMATCH") → muovi il pannello ovunque. Il rilascio salva la posizione in `localStorage` del browser. Alla successiva apertura, ritrovi il pannello nel punto in cui l'hai lasciato.

### 9.3 Collassare

Click sulla freccia **`▾`** in alto a destra del pannello → si comprime, lasciando solo l'header visibile con il `Δ` corrente. Click di nuovo sulla freccia **`▸`** → si espande. Stato salvato in localStorage.

### 9.4 Uso del SYNC

**Prerequisito**: entrambi i deck devono essere in PLAY (altrimenti i pulsanti sono disabilitati).

- **`SYNC B→A`**: calcola il playbackRate del deck B necessario per portarlo al BPM effettivo del deck A. Lo applica **istantaneamente** al BufferSource. Dopo il click: `Δ effettivo: 0.00`
- **`SYNC A→B`**: viceversa, porta A al BPM di B

Il SYNC allinea il **tempo** (BPM identici) ma **non la fase** (beat 1 allineati). Per allineare la fase:

1. Premi STOP sul deck entrante
2. Conta i beat del deck master ("1-2-3-4-1-2-3-4...")
3. Sul beat 1 successivo, PLAY sul deck entrante
4. Osserva il PHASE meter: se non centrato, usa NUDGE per correggere

### 9.5 Limitazioni

- Il SYNC scrive direttamente sul `playbackRate` del BufferSource, bypassando lo slider PITCH visivo. Dopo un SYNC lo slider può essere disallineato dal rate reale. **Reset**: STOP + PLAY del deck interessato riparte con playbackRate=1.0
- Se il BPM analizzato automaticamente è errato (es. rilevato a metà o doppio), anche il SYNC sarà errato. In tal caso usa il pitch manuale

---

## 10. Registratore WAV (overlay)

Overlay che registra il mix completo in uscita (tutto quello che senti nei tuoi altoparlanti) come file WAV stereo 16-bit.

### 10.1 Struttura del pill

In basso a destra: pannello nero con bordo giallo, contenente:

- Pallino indicatore (grigio = idle, rosso lampeggiante = recording)
- Timer `mm:ss`
- Pulsante **`● REC`** (giallo) / **`■ STOP`** (rosso)

### 10.2 Come registrare

1. Carica e fai partire i brani come faresti in un mix normale
2. Quando vuoi iniziare, click su **`● REC`**
3. Il pulsante diventa rosso `■ STOP`, il timer inizia a scorrere, il pallino lampeggia
4. Mixa normalmente — il recorder cattura **tutto quello che esce dal master**: deck A, deck B, crossfader, EQ, effetti
5. Al termine click su **`■ STOP`**
6. Parte automaticamente il download di un file chiamato:

   ```
   djapp-mix-2026-04-17T22-34-12.wav
   ```

### 10.3 Caratteristiche del file WAV

- **Formato**: WAV PCM non compresso
- **Canali**: stereo (2 canali)
- **Profondità**: 16-bit
- **Sample rate**: quella dell'AudioContext del browser (44.1 kHz o 48 kHz, tipicamente)
- **Dimensione**: circa **10 MB per minuto** a 48 kHz

### 10.4 Limitazioni del recorder

- **Solo audio del browser**: il microfono e altre sorgenti di sistema **non** vengono registrati
- **Memoria**: per set molto lunghi (> 60 minuti) la RAM del browser può esaurirsi. In quel caso l'app può diventare lenta o bloccarsi. Raccomandato per set di **max 30-45 minuti continui**
- **Pausa non supportata**: una sessione REC→STOP produce un file. Per concatenare sessioni si tagliano e incollano in un editor esterno (Audacity, Reaper, DAW)

---

## 11. Scorciatoie da tastiera

djApp include un sistema di shortcuts per il controllo rapido da laptop.

| Tasto | Azione (tipica) |
|---|---|
| `Spazio` | Play/Pause del deck focalizzato |
| `Q` | Cue deck A |
| `E` | Cue deck B |
| `1` – `8` | Hot cue 1-8 del deck focalizzato (quando implementati) |
| `Shift + 1-8` | Memorizza hot cue |
| `←` / `→` | Nudge deck focalizzato |
| `↑` / `↓` | Incrementa / decrementa pitch |
| `A` / `B` | Seleziona deck attivo per scorciatoie |
| `R` | Start/Stop registrazione (shortcut overlay) |

> ⚠️ **Nota**: il set esatto degli shortcut attivi dipende dalla versione. Per verificare, apri djApp e premi `?` (se presente il tooltip). In assenza di help integrato, prova i tasti sopra per capire cosa è attivo nella tua build.

---

## 12. Workflow completo — mixare due brani

Questa è la procedura passo-passo per mixare due brani, dall'inserimento in deck fino alla transizione finita e alla registrazione del risultato.

### 12.1 Preparazione

1. Carica **Brano A** sul deck A (drag-and-drop o LOAD FILE). Attendi che la waveform sia disegnata e il BPM rilevato
2. Carica **Brano B** sul deck B allo stesso modo
3. Imposta il **crossfader in posizione A** (tutto a sinistra)
4. Metti il **volume canale A al 100%**, **volume canale B a 0%** (o tieni il canale B in cue cuffia se hai uscite separate)
5. Attiva il pannello **Beatmatch**: dovrebbe già essere visibile. Se collassato, click sulla freccia per espanderlo

### 12.2 Preascolto

1. **PLAY su deck A** — il pubblico sente A
2. **PLAY su deck B** con crossfader ancora tutto a sinistra — tu senti B in pre-fader se hai monitor; altrimenti, in assenza di monitor separato, alza momentaneamente il volume canale B solo per ascoltare
3. Nota il BPM di B rispetto ad A nel pannello Beatmatch

### 12.3 Beatmatching — pareggia il tempo

Hai due strade.

**Strada A — SYNC automatico (rapido):**

Con entrambi i deck in PLAY, nel pannello Beatmatch click su **`SYNC B→A`**. Il BPM di B viene portato al BPM effettivo di A. `Δ effettivo: 0.00`. Fatto.

**Strada B — pitch manuale (classico):**

Muovi lo slider PITCH del deck B finché il suo BPM effettivo (letto nel pannello Beatmatch) coincide con quello di A. Esempio: A = 90.00, B = 92.20 → pitch B a circa -2.4% → B ora è 90.05. Sufficiente.

### 12.4 Allineamento della fase

Tempi uguali, ma i beat 1 dei due brani non sono allineati — ora si risolve.

1. **STOP** su deck B (non lo togli dal mix, lo azzeri sul cue point)
2. Ascolta deck A e **conta le battute ad alta voce**: "1, 2, 3, 4, 1, 2, 3, 4..." sul kick della cassa
3. Scegli un momento in cui comincia una frase musicale di 8 o 16 battute (es. dopo un break)
4. Sul conteggio "**1**" di quella frase, premi **PLAY** su deck B
5. Guarda il **PHASE meter** centrale:
   - Pallino centrato → sei in fase ✅
   - Pallino a destra → B in anticipo, ruota il **jog wheel di B in senso antiorario** per farlo rallentare momentaneamente
   - Pallino a sinistra → B in ritardo, **jog orario** per accelerare
6. Correzioni piccole e continue finché il pallino resta stabile al centro

### 12.5 Transizione con EQ-swap

Ora i due brani suonano insieme, sincronizzati in tempo e fase, ma il pubblico sente solo A (crossfader a sinistra, volume B a 0). Fai la transizione in ~16-32 battute:

1. Battute 1-4: **abbassa LO canale A** (bassi di A), **alza LO canale B** (bassi di B). Ora i bassi vengono dal brano B ma il resto da A
2. Battute 5-12: **alza gradualmente il volume canale B** fino al 100%
3. Battute 13-20: **inizia a spostare il crossfader verso B** (o abbassa volume canale A se non usi il crossfader)
4. Battute 21-32: crossfader completamente su B, volume canale A a 0. Transizione completata
5. **Azzera gli EQ di A** (LO di A torna al centro, pronta per un nuovo brano quando A sarà di nuovo il deck entrante)

### 12.6 Registrazione

Puoi registrare tutta la sessione:

1. Premi **`● REC`** all'inizio, prima di lanciare il primo brano
2. Mixa normalmente
3. Premi **`■ STOP`** alla fine — scarica il WAV
4. Apri il file in QuickTime, VLC, o in una DAW (Audacity, Reaper, Logic, Ableton) per verificare, editare, normalizzare, esportare in MP3

---

## 13. Uso su mobile

### 13.1 Android

- Tutto funziona in modalità portrait o landscape
- Consigliato **landscape** per avere i due deck affiancati come sul desktop
- Il jog wheel si usa con trascinamento del dito
- **Audio**: tramite cuffie Bluetooth la latenza può essere alta (100-300ms), meglio cuffie cablate via USB-C o jack 3.5mm se disponibile

### 13.2 iPhone / iPad

- **Safari obbligatorio** (vedi sezione 3.5)
- Su iPhone lo schermo è stretto — alcune sezioni si impilano verticalmente con scroll
- **iPad**: esperienza molto vicina al desktop, consigliato per l'uso reale
- **Audio**: cuffie con jack o Lightning per latenza bassa. Bluetooth introduce ~200ms di latenza che rende difficile il beatmatching manuale
- **Recorder WAV**: funziona ma con sample rate diverso (tipicamente 44.1 kHz) e qualità leggermente inferiore rispetto a Chrome desktop

### 13.3 Limitazioni comuni a tutti i mobile

- **Sleep del browser**: se il telefono va in sleep, l'AudioContext viene sospeso. Il mix si interrompe. Tenere lo schermo acceso durante il set (attivare "mantieni schermo acceso" nelle impostazioni)
- **Notifiche e chiamate**: una chiamata in arrivo interrompe l'audio. Abilitare la modalità "Non disturbare" prima del set
- **Multitasking**: Safari iOS può scaricare la tab se vai su un'altra app per troppo tempo. Tenere djApp sempre in primo piano

---

## 14. Risoluzione problemi

### 14.1 Chrome non mostra l'icona "Installa"

**Cause probabili:**
1. Service Worker non registrato o in errore
2. Manifest con `start_url` o `scope` errati
3. Icone 192/512 non caricate

**Soluzione**: apri DevTools (`Cmd+Opt+I` o `F12`) → tab **Application** → **Manifest**. Chrome elenca in basso i requisiti mancanti. Correggere e svuotare cache (`Clear site data`).

### 14.2 Audio distorto o silenzioso

- Controllare che il volume master del sistema non sia a 0 o muto
- Verificare che l'AudioContext sia attivo: l'indicatore `● READY` in alto a destra deve essere verde
- Alcuni brani con livello di picco molto alto saturano sommati — abbassare GAIN di un canale

### 14.3 Deck A e B invertiti nel pannello Beatmatch

Se il PITCH di un deck muove il BPM dell'altro nel pannello, il mapping è sbagliato. **Workaround**: STOP + PLAY di entrambi i deck nell'ordine corretto (prima A, poi B) per riarmare il mapping.

### 14.4 Service Worker blocca gli aggiornamenti

Dopo una modifica del codice, Chrome può continuare a servire la versione vecchia dalla cache del SW.

**Soluzione:**
1. DevTools → Application → Service Workers → **`Unregister`**
2. Application → Storage → **`Clear site data`**
3. Chiudere la tab
4. Riaprire l'URL

### 14.5 Il recorder produce un WAV vuoto o corrotto

- Non chiudere la tab prima di aver premuto STOP
- Se il set è stato molto lungo (> 60 min), la memoria può essere stata saturata
- Su iOS/Safari: verificare che AudioWorklet sia supportato. Safari 17+ lo supporta parzialmente

### 14.6 Brani MP3 con BPM rilevato sbagliato

L'algoritmo di rilevamento lavora su un'analisi onset-based. Per alcuni generi (ambient, classica, brani con pochi kick) può fallire. In quel caso:

- Inserire manualmente il BPM corretto se l'interfaccia lo consente
- Oppure usare il pitch manuale senza fidarsi del display

---

## 15. Note tecniche

### 15.1 Stack tecnologico

- **Frontend**: React 18 + Vite
- **Audio**: Web Audio API nativa (no librerie audio esterne)
- **Sorgenti**: AudioBufferSourceNode per ogni deck
- **BPM detection**: Web Worker dedicato (`bpmDetector.worker`)
- **Bundling**: Vite → output in `assets/`
- **Service Worker**: strategia cache-first per shell, network-first per HTML, **bypass totale** per range requests, audio, blob, video (necessario per evitare interruzioni audio su Chrome)
- **Overlay Recorder e Beatmatch**: JavaScript vanilla puro, caricati prima del bundle React via monkey-patch di `AudioContext`

### 15.2 Sample rate e latenza

| Browser | Sample rate tipico | Latenza tipica |
|---|---|---|
| Chrome Mac | 48 kHz | 20-40 ms |
| Chrome Windows | 48 kHz | 30-50 ms |
| Safari Mac | 44.1 kHz | 30-60 ms |
| Safari iOS | 44.1 kHz | 40-100 ms |
| Chrome Android | 48 kHz | 50-150 ms |

### 15.3 Come funziona il SYNC dell'overlay

Il pannello Beatmatch intercetta `AudioContext.prototype.createBufferSource` e traccia ogni sorgente attiva. Al click di `SYNC B→A` calcola:

```
playbackRate_B = (BPM_originale_A × playbackRate_A) / BPM_originale_B
```

E lo applica direttamente al BufferSource del deck B con `setValueAtTime(rate, currentTime)`. Il cambio è istantaneo e preciso a 4 decimali.

### 15.4 Privacy

- **Nessun tracking**: djApp non invia dati a server esterni
- **Nessun account**: non servono login o registrazioni
- **I brani restano sul tuo dispositivo**: non vengono mai caricati su server
- **Service Worker**: cache locale solo dell'interfaccia

### 15.5 Licenza e redistribuzione

djApp è un progetto personale di Alessandro Pezzali sotto il brand PezzaliApp. La distribuzione e le modifiche seguono la licenza indicata nel repository GitHub `pezzaliapp/djapp-new`.

### 15.6 Supporto

Per bug, segnalazioni, richieste di feature:

- GitHub Issues: `https://github.com/pezzaliapp/djapp-new/issues`
- Sito autore: `https://alessandropezzali.it`

---

**Fine del manuale.**

*Documento aggiornato al 17 aprile 2026.*
