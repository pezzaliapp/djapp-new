/*!
 * djApp Beatmatch v1.0
 * 1) Mostra il BPM EFFETTIVO (BPM originale × playbackRate) nei display
 * 2) Aggiunge un pannello "BEATMATCH" con SYNC B→A e SYNC A→B
 * Deve essere caricato DOPO recorder.js ma PRIMA del bundle React.
 * (c) PezzaliApp
 */
(function () {
  'use strict';
  if (window.__djappBeatmatch) return;
  window.__djappBeatmatch = true;

  var OrigCtx = window.AudioContext || window.webkitAudioContext;
  if (!OrigCtx) { console.warn('[Beatmatch] no AudioContext'); return; }

  // ---- 1. Traccia tutti i BufferSource creati, in ordine di start ----
  var sources = []; // { node, startedAt, ended }

  var origCreate = OrigCtx.prototype.createBufferSource;
  OrigCtx.prototype.createBufferSource = function () {
    var node = origCreate.call(this);
    var entry = { node: node, startedAt: 0, ended: false };
    sources.push(entry);
    var origStart = node.start.bind(node);
    node.start = function () {
      entry.startedAt = performance.now();
      return origStart.apply(null, arguments);
    };
    node.addEventListener('ended', function () { entry.ended = true; });
    // Limita array a ultimi 50 per evitare memory bloat
    if (sources.length > 50) sources.splice(0, sources.length - 50);
    return node;
  };

  function activeSources() {
    return sources
      .filter(function (s) { return s.startedAt > 0 && !s.ended && s.node.buffer; })
      .sort(function (a, b) { return a.startedAt - b.startedAt; })
      .slice(0, 2); // primo = deck A, secondo = deck B
  }

  // ---- 2. BPM originali e display patching ----
  var orig = { A: null, B: null };       // BPM originali analizzati
  var spanMap = new WeakMap();           // span → 'A' | 'B'
  var spanLastKnown = new WeakMap();     // span → ultimo valore che NOI abbiamo scritto

  function parseBpm(txt) {
    var v = parseFloat((txt || '').trim());
    return (isFinite(v) && v > 20 && v < 300) ? v : null;
  }

  function collectSpans() {
    return document.querySelectorAll('[class*="_bpmValue"]');
  }

  function classifySpan(span) {
    // Se già classificato, ritorna
    if (spanMap.has(span)) return spanMap.get(span);
    // Se non abbiamo ancora gli originali, non classifichiamo
    if (!orig.A || !orig.B) return null;
    // Altrimenti, il testo corrente (che potrebbe essere già stato modificato da noi)
    // NON è utile. Usiamo lastKnown se c'è.
    var seen = spanLastKnown.get(span);
    var v = parseBpm(seen != null ? seen : span.textContent);
    if (v == null) return null;
    var dA = Math.abs(v - orig.A);
    var dB = Math.abs(v - orig.B);
    var deck = dA <= dB ? 'A' : 'B';
    spanMap.set(span, deck);
    return deck;
  }

  function captureOriginals() {
    if (orig.A && orig.B) return true;
    var spans = collectSpans();
    var vals = [];
    spans.forEach(function (s) {
      var v = parseBpm(s.textContent);
      if (v != null) vals.push(v);
    });
    var uniq = Array.from(new Set(vals));
    if (uniq.length >= 2) {
      // Il primo valore distinto letto → A, secondo → B
      orig.A = uniq[0];
      orig.B = uniq[1];
      // Prima classificazione
      spans.forEach(function (s) {
        var v = parseBpm(s.textContent);
        if (v == null) return;
        if (Math.abs(v - orig.A) <= Math.abs(v - orig.B)) spanMap.set(s, 'A');
        else spanMap.set(s, 'B');
      });
      return true;
    }
    return false;
  }

  function updateDeltaSpan(effA, effB) {
    // Cerca lo span che contiene la delta tipo "Δ 2.2" o "2.2"
    // Euristica: elemento con classe tipo _bpmDelta o testo che inizia con Δ
    var cand = document.querySelectorAll('[class*="_delta"], [class*="_bpmDelta"], [class*="_diff"]');
    var d = Math.abs(effA - effB).toFixed(1);
    cand.forEach(function (el) {
      if (!el.children.length) {
        var txt = el.textContent.trim();
        // se contiene una freccia Δ o solo un numero
        if (/^Δ\s*/.test(txt)) el.textContent = 'Δ ' + d;
        else if (/^\s*-?\d+(\.\d+)?\s*$/.test(txt)) el.textContent = d;
      }
    });
  }

  function tick() {
    if (!captureOriginals()) { updateUI(null, null); return; }

    var act = activeSources();
    var rateA = act[0] ? act[0].node.playbackRate.value : 1.0;
    var rateB = act[1] ? act[1].node.playbackRate.value : 1.0;

    var effA = orig.A * rateA;
    var effB = orig.B * rateB;

    // Aggiorna ogni span in base al deck mappato
    var spans = collectSpans();
    spans.forEach(function (s) {
      var deck = classifySpan(s);
      if (!deck) return;
      var target = (deck === 'A' ? effA : effB).toFixed(1);
      if (s.textContent.trim() !== target) {
        s.textContent = target;
        spanLastKnown.set(s, target);
      }
    });

    updateDeltaSpan(effA, effB);
    updateUI(effA, effB, rateA, rateB, act.length);
  }

  // ---- 3. Pannello BEATMATCH in basso a sinistra ----
  var ui = null;
  function renderUI() {
    if (ui || !document.body) return;
    var style = document.createElement('style');
    style.textContent = [
      '#djapp-bm{position:fixed;bottom:16px;left:16px;z-index:2147483646;',
      'background:#0d0d0d;color:#fff;border:1px solid #4a9eff;border-radius:10px;',
      'padding:10px 12px;font:500 11px/1.4 -apple-system,system-ui,sans-serif;',
      'min-width:200px;box-shadow:0 6px 18px rgba(0,0,0,.4)}',
      '#djapp-bm b{color:#4a9eff;font-size:10px;letter-spacing:.05em;text-transform:uppercase}',
      '#djapp-bm .row{display:flex;justify-content:space-between;gap:12px;margin-top:4px}',
      '#djapp-bm .v{font-variant-numeric:tabular-nums}',
      '#djapp-bm .d{color:#e8ff47;font-weight:600}',
      '#djapp-bm .btns{display:flex;gap:6px;margin-top:8px}',
      '#djapp-bm button{flex:1;border:1px solid #4a9eff;background:transparent;color:#4a9eff;',
      'padding:6px 8px;border-radius:6px;cursor:pointer;font:600 11px/1 inherit}',
      '#djapp-bm button:hover{background:#4a9eff;color:#0d0d0d}',
      '#djapp-bm button:disabled{opacity:.4;cursor:not-allowed}'
    ].join('');
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'djapp-bm';
    wrap.innerHTML =
      '<b>Beatmatch</b>' +
      '<div class="row"><span>Deck A</span><span class="v" id="bm-a">—</span></div>' +
      '<div class="row"><span>Deck B</span><span class="v" id="bm-b">—</span></div>' +
      '<div class="row"><span>Δ effettivo</span><span class="v d" id="bm-d">—</span></div>' +
      '<div class="btns">' +
        '<button id="bm-sync-ba" title="Porta B al BPM di A">SYNC B→A</button>' +
        '<button id="bm-sync-ab" title="Porta A al BPM di B">SYNC A→B</button>' +
      '</div>';
    document.body.appendChild(wrap);
    ui = {
      a: wrap.querySelector('#bm-a'),
      b: wrap.querySelector('#bm-b'),
      d: wrap.querySelector('#bm-d'),
      syncBA: wrap.querySelector('#bm-sync-ba'),
      syncAB: wrap.querySelector('#bm-sync-ab')
    };
    ui.syncBA.addEventListener('click', function () { doSync('BA'); });
    ui.syncAB.addEventListener('click', function () { doSync('AB'); });
  }

  function updateUI(effA, effB, rateA, rateB, activeCount) {
    if (!ui) return;
    if (effA == null || effB == null) {
      ui.a.textContent = orig.A ? orig.A.toFixed(1) + ' (stop)' : '—';
      ui.b.textContent = orig.B ? orig.B.toFixed(1) + ' (stop)' : '—';
      ui.d.textContent = orig.A && orig.B ? Math.abs(orig.A - orig.B).toFixed(1) : '—';
      ui.syncBA.disabled = true;
      ui.syncAB.disabled = true;
      return;
    }
    ui.a.textContent = effA.toFixed(2) + (rateA !== 1 ? ' (' + ((rateA - 1) * 100).toFixed(1) + '%)' : '');
    ui.b.textContent = effB.toFixed(2) + (rateB !== 1 ? ' (' + ((rateB - 1) * 100).toFixed(1) + '%)' : '');
    ui.d.textContent = Math.abs(effA - effB).toFixed(2);
    ui.syncBA.disabled = activeCount < 2;
    ui.syncAB.disabled = activeCount < 2;
  }

  // ---- 4. SYNC automatico ----
  // Calcola e applica il playbackRate target sul deck scelto
  function doSync(dir) {
    var act = activeSources();
    if (act.length < 2 || !orig.A || !orig.B) {
      alert('Servono entrambi i deck in play per sincronizzare');
      return;
    }
    var srcA = act[0].node, srcB = act[1].node;
    var effA = orig.A * srcA.playbackRate.value;
    var effB = orig.B * srcB.playbackRate.value;
    if (dir === 'BA') {
      // Porta B al BPM di A → rateB_new = effA / origB
      var newRateB = effA / orig.B;
      newRateB = Math.max(0.5, Math.min(2.0, newRateB));
      srcB.playbackRate.setValueAtTime(newRateB, srcB.context.currentTime);
      console.log('[Beatmatch] SYNC B→A: rateB=' + newRateB.toFixed(4) + ' (BPM B ora ≈ ' + (orig.B * newRateB).toFixed(2) + ')');
    } else {
      var newRateA = effB / orig.A;
      newRateA = Math.max(0.5, Math.min(2.0, newRateA));
      srcA.playbackRate.setValueAtTime(newRateA, srcA.context.currentTime);
      console.log('[Beatmatch] SYNC A→B: rateA=' + newRateA.toFixed(4) + ' (BPM A ora ≈ ' + (orig.A * newRateA).toFixed(2) + ')');
    }
  }

  // ---- 5. Avvio ----
  function start() {
    renderUI();
    setInterval(tick, 150);
    console.log('[Beatmatch] attivo');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
