'use strict';
// ================= CORE: utilidades, input, loop, timers, texto, painéis =================
window.MD = window.MD || {};
(function (M) {
  M.W = 480; M.H = 320; M.T = 16; M.S = 2;
  M.mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  M.cx = (c) => { const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return x; };
  M.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  M.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  M.pick = (a) => a[Math.floor(Math.random() * a.length)];
  M.seed = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const h2r = (h) => { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; };
  M.rgb = h2r;
  M.shade = (h, f) => { const c = h2r(h).map(v => M.clamp(Math.round(v * f), 0, 255)); return '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''); };
  M.mix = (a, b, t) => { const x = h2r(a), y = h2r(b); return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

  // ---------- timers / tweens (relógio do jogo) ----------
  const timers = [], tws = [];
  M.wait = (ms) => new Promise(r => timers.push({ t: ms, r }));
  M.tween = (obj, prop, to, ms) => new Promise(r => { tws.push({ obj, prop, from: obj[prop], to, t: 0, ms: Math.max(1, ms), r }); });
  M.tick = (dt) => {
    for (let i = timers.length - 1; i >= 0; i--) { timers[i].t -= dt; if (timers[i].t <= 0) { const r = timers[i].r; timers.splice(i, 1); r(); } }
    for (let i = tws.length - 1; i >= 0; i--) {
      const w = tws[i]; w.t += dt; const k = Math.min(1, w.t / w.ms); w.obj[w.prop] = w.from + (w.to - w.from) * k;
      if (k >= 1) { tws.splice(i, 1); w.r(); }
    }
  };

  // ---------- configurações ----------
  M.settings = { music: 0.6, sfx: 0.8, speed: 2 };
  try { Object.assign(M.settings, JSON.parse(localStorage.getItem('mdcw_settings') || '{}')); } catch (e) { }
  M.saveSettings = () => { try { localStorage.setItem('mdcw_settings', JSON.stringify(M.settings)); } catch (e) { } };

  // ---------- texto pixelado (renderiza fonte do sistema e binariza) ----------
  const FONT = '"Courier New","DejaVu Sans Mono","Liberation Mono",monospace';
  const mctx = M.mk(8, 8).getContext('2d');
  const tcache = new Map();
  M.tw = (s, size = 15) => { mctx.font = `bold ${size}px ${FONT}`; return Math.ceil(mctx.measureText(s).width); };
  M.text = (ctx, s, x, y, color = '#fff', size = 15, shadow = null) => {
    s = String(s); if (!s) return;
    const key = s + '|' + color + '|' + size;
    let c = tcache.get(key);
    if (!c) {
      const w = M.tw(s, size) + 3, h = size + 6;
      c = M.mk(w, h); const x2 = c.getContext('2d', { willReadFrequently: true });
      x2.font = `bold ${size}px ${FONT}`; x2.textBaseline = 'top'; x2.fillStyle = '#000'; x2.fillText(s, 1, 2);
      const d = x2.getImageData(0, 0, w, h), rgb = h2r(color.length === 7 ? color : '#ffffff');
      for (let i = 0; i < d.data.length; i += 4) { const on = d.data[i + 3] > 105; d.data[i] = rgb[0]; d.data[i + 1] = rgb[1]; d.data[i + 2] = rgb[2]; d.data[i + 3] = on ? 255 : 0; }
      x2.putImageData(d, 0, 0);
      if (tcache.size > 1500) tcache.clear();
      tcache.set(key, c);
    }
    if (shadow) M.text(ctx, s, x + 1, y + 1, shadow, size);
    ctx.drawImage(c, Math.round(x - 1), Math.round(y - 2));
  };
  M.wrap = (s, maxW, size = 15) => {
    const out = []; let line = '';
    for (const para of String(s).split('\n')) {
      line = '';
      for (const w of para.split(' ')) {
        const t = line ? line + ' ' + w : w;
        if (M.tw(t, size) > maxW && line) { out.push(line); line = w; } else line = t;
      }
      out.push(line);
    }
    return out;
  };

  // ---------- painéis ----------
  M.rr = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x + 2, y, w - 4, h); ctx.fillRect(x, y + 2, w, h - 4); ctx.fillRect(x + 1, y + 1, w - 2, h - 2); };
  M.panel = (ctx, x, y, w, h, kind = 'light') => {
    if (kind === 'dark') { M.rr(ctx, x, y, w, h, '#c7a9e7'); M.rr(ctx, x + 3, y + 3, w - 6, h - 6, '#55418a'); M.rr(ctx, x + 5, y + 5, w - 10, h - 10, '#30234e'); }
    else if (kind === 'hud') { M.rr(ctx, x, y, w, h, '#352742'); M.rr(ctx, x + 2, y + 2, w - 4, h - 4, '#f2ecd0'); M.rr(ctx, x + 4, y + 4, w - 8, h - 8, '#e4dcb8'); }
    else if (kind === 'blue') { M.rr(ctx, x, y, w, h, '#202838'); M.rr(ctx, x + 2, y + 2, w - 4, h - 4, '#4a6a98'); M.rr(ctx, x + 4, y + 4, w - 8, h - 8, '#dfe8f4'); }
    else { M.rr(ctx, x, y, w, h, '#2a2a3a'); M.rr(ctx, x + 2, y + 2, w - 4, h - 4, '#e6c8ed'); M.rr(ctx, x + 3, y + 3, w - 6, h - 6, '#fff0df'); }
  };

  // ---------- input ----------
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Enter: 'ok', NumpadEnter: 'ok', Space: 'ok', KeyX: 'back', Escape: 'back', Backspace: 'back', KeyI: 'bag', KeyM: 'map', KeyQ: 'quest', KeyE: 'track', Tab: 'menu' };
  M.held = {}; M.ov = []; M.scene = null;
  M.openOv = (o) => { M.ov.push(o); return o; };
  M.closeOv = (o) => { const i = M.ov.indexOf(o); if (i >= 0) M.ov.splice(i, 1); };
  window.addEventListener('keydown', (e) => {
    const a = KEYMAP[e.code]; if (!a) return;
    e.preventDefault();
    if (M.audio) M.audio.unlock();
    M.held[a] = true;
    const top = M.ov[M.ov.length - 1];
    if (top) { if (top.key) top.key(a, e.repeat); }
    else if (M.scene && M.scene.key) { if (!e.repeat || ['up', 'down', 'left', 'right'].includes(a)) M.scene.key(a, e.repeat); }
  });
  // WebAudio precisa de um gesto do usuário para iniciar em navegadores modernos.
  // Clique/toque no jogo também libera e retoma a trilha que já foi solicitada na tela de título.
  const unlockAudio = () => { if (M.audio) M.audio.unlock(); };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
  window.addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a) M.held[a] = false; });
  window.addEventListener('blur', () => { M.held = {}; });

  // ---------- transições ----------
  M.fx = { fade: 0, bars: 0, flash: 0 };
  M.fadeOut = (ms = 300) => M.tween(M.fx, 'fade', 1, ms);
  M.fadeIn = (ms = 300) => M.tween(M.fx, 'fade', 0, ms);
  M.drawFx = (ctx) => {
    if (M.fx.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${M.fx.flash})`; ctx.fillRect(0, 0, M.W, M.H); }
    if (M.fx.bars > 0) { const h = M.fx.bars * M.H / 2; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, M.W, h); ctx.fillRect(0, M.H - h, M.W, h); }
    if (M.fx.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${M.fx.fade})`; ctx.fillRect(0, 0, M.W, M.H); }
  };

  // ---------- loop ----------
  M.start = () => {
    const cv = document.getElementById('game'); const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false; M.screen = ctx;
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(60, now - last); last = now;
      M.tick(dt);
      const top = M.ov[M.ov.length - 1];
      if (M.scene && M.scene.update) M.scene.update(dt, !!top);
      for (const o of M.ov) if (o.update) o.update(dt);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, M.W, M.H);
      if (M.scene) M.scene.draw(ctx);
      for (const o of M.ov) o.draw(ctx);
      M.drawFx(ctx);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    cv.focus();
  };
})(window.MD);
