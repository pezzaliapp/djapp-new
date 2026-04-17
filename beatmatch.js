/*!
 * djApp Beatmatch v1.1
 * - Display BPM effettivo (origBPM * playbackRate)
 * - SYNC B→A e A→B automatico
 * - Pannello compatto, draggable, collapsibile, posizione salvata
 * (c) PezzaliApp
 */
(function () {
  'use strict';
  if (window.__djappBeatmatch) return;
  window.__djappBeatmatch = true;

  var OrigCtx = window.AudioContext || window.webkitAudioContext;
  if (!OrigCtx) { console.warn('[Beatmatch] no AudioContext'); return; }

  // ---- 1. Tracking BufferSource ----
  var sources = [];
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
    if (sources.length > 50) sources.splice(0, sources.length - 50);
    return node;
  };

  function activeSources() {
    return sources
      .filter(function (s) { return s.startedAt > 0 && !s.ended && s.node.buffer; })
      .sort(function (a, b) { return a.startedAt - b.startedAt; })
      .slice(0, 2);
  }

  // ---- 2. BPM originali + mapping span → deck ----
  var orig = { A: null, B: null };
  var spanMap = new WeakMap();
  var spanLastKnown = new WeakMap();

  function parseBpm(txt) {
    var v = parseFloat((txt || '').trim());
    return (isFinite(v) && v > 20 && v < 300) ? v : null;
  }

  function collectSpans() {
    return document.querySelectorAll('[class*="_bpmValue"]');
  }

  function classifySpan(span) {
    if (spanMap.has(span)) return spanMap.get(span);
    if (!orig.A || !orig.B) return null;
    var seen = spanLastKnown.get(span);
    var v = parseBpm(seen != null ? seen : span.textContent);
    if (v == null) return null;
    var deck = Math.abs(v - orig.A) <= Math.abs(v - orig.B) ? 'A' : 'B';
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
      orig.A = uniq[0];
      orig.B = uniq[1];
      spans.forEach(function (s) {
        var v = parseBpm(s.textContent);
        if (v == null) return;
        spanMap.set(s, Math.abs(v - orig.A) <= Math.abs(v - orig.B) ? 'A' : 'B');
      });
      return true;
    }
    return false;
  }

  function updateDeltaSpan(effA, effB) {
    var cand = document.querySelectorAll('[class*="_delta"], [class*="_bpmDelta"], [class*="_diff"]');
    var d = Math.abs(effA - effB).toFixed(1);
    cand.forEach(function (el) {
      if (!el.children.length) {
        var txt = el.textContent.trim();
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

    collectSpans().forEach(function (s) {
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

  // ---- 3. UI compatta, draggable, collapsibile ----
  var ui = null;
  var POS_KEY = 'djapp_bm_pos';
  var COLLAPSED_KEY = 'djapp_bm_collapsed';

  function loadPos() {
    try {
      var raw = localStorage.getItem(POS_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (typeof p.x === 'number' && typeof p.y === 'number') return p;
    } catch (e) {}
    return null;
  }
  function savePos(x, y) {
    try { localStorage.setItem(POS_KEY, JSON.stringify({ x: x, y: y })); } catch (e) {}
  }
  function loadCollapsed() {
    try { return localStorage.getItem(COLLAPSED_KEY) === '1'; } catch (e) { return false; }
  }
  function saveCollapsed(v) {
    try { localStorage.setItem(COLLAPSED_KEY, v ? '1' : '0'); } catch (e) {}
  }

  function clampX(x, w) {
    return Math.max(0, Math.min(window.innerWidth - (w || 180), x));
  }
  function clampY(y, h) {
    return Math.max(0, Math.min(window.innerHeight - (h || 100), y));
  }

  function renderUI() {
    if (ui || !document.body) return;

    var style = document.createElement('style');
    style.textContent = [
      '#djapp-bm{position:fixed;z-index:2147483646;',
      'background:#0d0d0d;color:#fff;border:1px solid #4a9eff;border-radius:8px;',
      'font:500 10px/1.35 -apple-system,system-ui,sans-serif;',
      'box-shadow:0 4px 14px rgba(0,0,0,.4);user-select:none;min-width:150px}',
      '#djapp-bm .hdr{display:flex;align-items:center;gap:6px;padding:5px 8px;',
      'cursor:grab;border-radius:7px 7px 0 0;background:rgba(74,158,255,.08)}',
      '#djapp-bm .hdr:active{cursor:grabbing}',
      '#djapp-bm.collapsed .hdr{border-radius:7px}',
      '#djapp-bm .ttl{color:#4a9eff;font-weight:700;font-size:9px;letter-spacing:.06em;',
      'text-transform:uppercase;flex:1}',
      '#djapp-bm .hd-delta{color:#e8ff47;font-variant-numeric:tabular-nums;font-weight:600}',
      '#djapp-bm .tgl{background:none;border:0;color:#4a9eff;cursor:pointer;',
      'font-size:12px;padding:0 2px;line-height:1}',
      '#djapp-bm .body{padding:6px 8px 8px}',
      '#djapp-bm.collapsed .body{display:none}',
      '#djapp-bm .row{display:flex;justify-content:space-between;gap:10px;padding:1px 0}',
      '#djapp-bm .v{font-variant-numeric:tabular-nums}',
      '#djapp-bm .d{color:#e8ff47;font-weight:600}',
      '#djapp-bm .btns{display:flex;gap:4px;margin-top:6px}',
      '#djapp-bm button.sync{flex:1;border:1px solid #4a9eff;background:transparent;',
      'color:#4a9eff;padding:4px 6px;border-radius:5px;cursor:pointer;',
      'font:600 10px/1 inherit}',
      '#djapp-bm button.sync:hover{background:#4a9eff;color:#0d0d0d}',
      '#djapp-bm button.sync:disabled{opacity:.35;cursor:not-allowed}'
    ].join('');
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'djapp-bm';
    wrap.innerHTML =
      '<div class="hdr">' +
        '<span class="ttl">Beatmatch</span>' +
        '<span class="hd-delta" id="bm-hd-d">—</span>' +
        '<button class="tgl" id="bm-tgl" title="Mostra/nascondi">▾</button>' +
      '</div>' +
      '<div class="body">' +
        '<div class="row"><span>Deck A</span><span class="v" id="bm-a">—</span></div>' +
        '<div class="row"><span>Deck B</span><span class="v" id="bm-b">—</span></div>' +
        '<div class="row"><span>Δ effettivo</span><span class="v d" id="bm-d">—</span></div>' +
        '<div class="btns">' +
          '<button class="sync" id="bm-sync-ba">SYNC B→A</button>' +
          '<button class="sync" id="bm-sync-ab">SYNC A→B</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);

    // Posizione iniziale: salvata, oppure in alto a sinistra sotto header
    var saved = loadPos();
    if (saved) {
      wrap.style.left = clampX(saved.x, wrap.offsetWidth) + 'px';
      wrap.style.top = clampY(saved.y, wrap.offsetHeight) + 'px';
    } else {
      wrap.style.left = '16px';
      wrap.style.top = '60px';
    }

    if (loadCollapsed()) wrap.classList.add('collapsed');

    ui = {
      wrap: wrap,
      a: wrap.querySelector('#bm-a'),
      b: wrap.querySelector('#bm-b'),
      d: wrap.querySelector('#bm-d'),
      hdD: wrap.querySelector('#bm-hd-d'),
      syncBA: wrap.querySelector('#bm-sync-ba'),
      syncAB: wrap.querySelector('#bm-sync-ab'),
      tgl: wrap.querySelector('#bm-tgl'),
      hdr: wrap.querySelector('.hdr')
    };

    ui.tgl.addEventListener('click', function (e) {
      e.stopPropagation();
      var c = wrap.classList.toggle('collapsed');
      saveCollapsed(c);
      ui.tgl.textContent = c ? '▸' : '▾';
    });
    ui.tgl.textContent = wrap.classList.contains('collapsed') ? '▸' : '▾';

    // Drag (mouse)
    var drag = null;
    ui.hdr.addEventListener('mousedown', function (e) {
      if (e.target === ui.tgl) return;
      var r = wrap.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!drag) return;
      wrap.style.left = clampX(e.clientX - drag.dx, wrap.offsetWidth) + 'px';
      wrap.style.top = clampY(e.clientY - drag.dy, wrap.offsetHeight) + 'px';
    });
    document.addEventListener('mouseup', function () {
      if (!drag) return;
      drag = null;
      var r = wrap.getBoundingClientRect();
      savePos(r.left, r.top);
    });

    // Drag (touch)
    ui.hdr.addEventListener('touchstart', function (e) {
      if (e.target === ui.tgl) return;
      var t = e.touches[0];
      var r = wrap.getBoundingClientRect();
      drag = { dx: t.clientX - r.left, dy: t.clientY - r.top };
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!drag) return;
      var t = e.touches[0];
      wrap.style.left = clampX(t.clientX - drag.dx, wrap.offsetWidth) + 'px';
      wrap.style.top = clampY(t.clientY - drag.dy, wrap.offsetHeight) + 'px';
    }, { passive: true });
    document.addEventListener('touchend', function () {
      if (!drag) return;
      drag = null;
      var r = wrap.getBoundingClientRect();
      savePos(r.left, r.top);
    });

    ui.syncBA.addEventListener('click', function () { doSync('BA'); });
    ui.syncAB.addEventListener('click', function () { doSync('AB'); });
  }

  function updateUI(effA, effB, rateA, rateB, activeCount) {
    if (!ui) return;
    if (effA == null || effB == null) {
      ui.a.textContent = orig.A ? orig.A.toFixed(1) : '—';
      ui.b.textContent = orig.B ? orig.B.toFixed(1) : '—';
      var d0 = orig.A && orig.B ? Math.abs(orig.A - orig.B).toFixed(1) : '—';
      ui.d.textContent = d0;
      ui.hdD.textContent = d0 !== '—' ? 'Δ' + d0 : '—';
      ui.syncBA.disabled = true;
      ui.syncAB.disabled = true;
      return;
    }
    ui.a.textContent = effA.toFixed(2) + (Math.abs(rateA - 1) > 0.0005 ? ' (' + ((rateA - 1) * 100).toFixed(1) + '%)' : '');
    ui.b.textContent = effB.toFixed(2) + (Math.abs(rateB - 1) > 0.0005 ? ' (' + ((rateB - 1) * 100).toFixed(1) + '%)' : '');
    var delta = Math.abs(effA - effB).toFixed(2);
    ui.d.textContent = delta;
    ui.hdD.textContent = 'Δ' + delta;
    ui.syncBA.disabled = activeCount < 2;
    ui.syncAB.disabled = activeCount < 2;
  }

  // ---- 4. SYNC ----
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
      var newRateB = Math.max(0.5, Math.min(2.0, effA / orig.B));
      srcB.playbackRate.setValueAtTime(newRateB, srcB.context.currentTime);
      console.log('[Beatmatch] SYNC B→A: rateB=' + newRateB.toFixed(4));
    } else {
      var newRateA = Math.max(0.5, Math.min(2.0, effB / orig.A));
      srcA.playbackRate.setValueAtTime(newRateA, srcA.context.currentTime);
      console.log('[Beatmatch] SYNC A→B: rateA=' + newRateA.toFixed(4));
    }
  }

  function start() {
    renderUI();
    setInterval(tick, 150);
    console.log('[Beatmatch v1.1] attivo');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
