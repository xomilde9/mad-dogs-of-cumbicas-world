'use strict';
// ================= ÁUDIO: sintetizador chiptune original (WebAudio) =================
(function (M) {
  const rep = (s, n) => Array(n).fill(s).join(' ');
  const SONGS = {
    title: { tempo: 132, loop: true, v: [
      { w: 'square', g: 0.10, n: 'A4:1 C5:1 E5:1 A5:1 G5:2 E5:1 C5:1 D5:1 F5:1 A5:1 D6:1 C6:2 A5:1 F5:1 E5:1 G5:1 B5:1 E6:1 D6:2 B5:1 G5:1 A5:2 E5:1 C5:1 A4:4' },
      { w: 'triangle', g: 0.20, n: 'A2:2 A2:2 A2:2 E3:2 D3:2 D3:2 D3:2 A2:2 E3:2 E3:2 E3:2 B2:2 A2:2 E3:2 A2:4' },
      { w: 'noise', g: 0.05, n: rep('x:1 r:1', 16) }] },
    cumbica: { tempo: 120, loop: true, v: [
      { w: 'square', g: 0.09, n: 'E5:1 G5:1 E5:1 C5:1 D5:1 F5:1 D5:1 B4:1 C5:1 E5:1 G5:1 C6:1 B5:2 G5:2 A5:1 F5:1 A5:1 C6:1 G5:1 E5:1 G5:1 E5:1 D5:1 F5:1 G5:1 B5:1 C6:4' },
      { w: 'triangle', g: 0.2, n: 'C3:2 G3:2 C3:2 G3:2 C3:2 G3:2 C3:2 G3:2 F3:2 C4:2 F3:2 C4:2 G3:2 D4:2 C3:4' },
      { w: 'noise', g: 0.035, n: rep('r:1 x:1', 16) }] },
    bairro: { tempo: 108, loop: true, v: [
      { w: 'square', g: 0.09, n: 'D5:2 F5:1 A5:1 G5:2 F5:1 E5:1 D5:2 F5:1 A5:1 C6:2 A5:2 Bb4:2 D5:1 F5:1 E5:2 D5:1 C5:1 D5:4 r:2 A4:2' },
      { w: 'triangle', g: 0.2, n: 'D3:4 A3:4 D3:4 F3:4 Bb2:4 F3:4 A2:4 A3:4' },
      { w: 'noise', g: 0.03, n: rep('x:1 r:1', 16) }] },
    battle: { tempo: 168, loop: true, v: [
      { w: 'square', g: 0.09, n: 'E5:0.5 E5:0.5 r:0.5 E5:0.5 G5:0.5 E5:0.5 D5:0.5 E5:0.5 A5:1 G5:1 E5:1 D5:1 F5:0.5 F5:0.5 r:0.5 F5:0.5 A5:0.5 F5:0.5 E5:0.5 F5:0.5 B5:1 A5:1 F5:1 E5:1' },
      { w: 'triangle', g: 0.2, n: rep('A2:0.5 A3:0.5 A2:0.5 A3:0.5', 4) + ' ' + rep('F2:0.5 F3:0.5 F2:0.5 F3:0.5', 4) },
      { w: 'noise', g: 0.05, n: rep('x:0.5 r:0.5 x:0.5 x:0.5', 8) }] },
    boss: { tempo: 176, loop: true, v: [
      { w: 'square', g: 0.1, n: 'A5:0.5 A5:0.5 G5:0.5 A5:0.5 C6:1 A5:1 G5:0.5 G5:0.5 F5:0.5 G5:0.5 Bb5:1 G5:1 F5:0.5 F5:0.5 E5:0.5 F5:0.5 A5:1 F5:1 E5:1 E5:1 G#5:1 B5:1' },
      { w: 'sawtooth', g: 0.07, n: rep('A2:1', 4) + ' ' + rep('G2:1', 4) + ' ' + rep('F2:1', 4) + ' ' + rep('E2:1', 4) },
      { w: 'noise', g: 0.06, n: rep('x:0.5', 32) }] },
    story: { tempo: 90, loop: true, v: [
      { w: 'triangle', g: 0.14, n: 'E5:2 G5:2 B5:4 A5:2 F#5:2 D5:4 G5:2 B5:2 E6:4 D6:2 B5:2 E5:4' },
      { w: 'square', g: 0.05, n: 'E3:4 B3:4 D3:4 A3:4 G3:4 D4:4 E3:8' }] },
    victory: { tempo: 150, loop: false, v: [
      { w: 'square', g: 0.1, n: 'C5:0.5 C5:0.5 C5:0.5 C5:1.5 Ab4:1.5 Bb4:1.5 C5:1 Bb4:0.5 C5:3' },
      { w: 'triangle', g: 0.18, n: 'C3:1 C3:1 C3:1 C3:1 Ab2:1 Ab2:1 Bb2:1 Bb2:1 C3:3' }] },
    defeat: { tempo: 80, loop: false, v: [
      { w: 'triangle', g: 0.16, n: 'E4:1 D4:1 C4:1 B3:3' }, { w: 'square', g: 0.05, n: 'A2:2 G2:1 E2:3' }] },
  };
  const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function parse(str) {
    return str.trim().split(/\s+/).map(tok => {
      const [n, d] = tok.split(':'); const beats = parseFloat(d);
      if (n === 'r') return { f: null, b: beats };
      if (n === 'x') return { f: -1, b: beats };
      const m = /^([A-G])([#b]?)(\d)$/.exec(n);
      let s = SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
      const midi = 12 * (parseInt(m[3]) + 1) + s;
      return { f: 440 * Math.pow(2, (midi - 69) / 12), b: beats };
    });
  }
  Object.values(SONGS).forEach(s => s.v.forEach(v => { v.ev = parse(v.n); v.len = v.ev.reduce((a, e) => a + e.b, 0); }));

  let ctx = null, mus = null, sfx = null, nbuf = null, cur = null, timer = null, voices = [], song = null, endTimer = null, prevTrack = null;
  function init() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    mus = ctx.createGain(); sfx = ctx.createGain(); mus.connect(ctx.destination); sfx.connect(ctx.destination);
    vol();
    nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function vol() { if (!ctx) return; mus.gain.value = M.settings.music * 0.7; sfx.gain.value = M.settings.sfx; }
  function tone(f0, f1, dur, wave = 'square', g = 0.15, delay = 0, out = sfx) {
    if (!ctx) return; const t = ctx.currentTime + delay; const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = wave; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    a.gain.setValueAtTime(g, t); a.gain.linearRampToValueAtTime(0.0001, t + dur); o.connect(a); a.connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, g = 0.15, delay = 0, hp = 800, out = sfx) {
    if (!ctx) return; const t = ctx.currentTime + delay; const s = ctx.createBufferSource(), a = ctx.createGain(), f = ctx.createBiquadFilter();
    s.buffer = nbuf; f.type = 'highpass'; f.frequency.value = hp; a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(a); a.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function tick() {
    if (!ctx || !song) return;
    const beat = 60 / song.tempo;
    for (const v of voices) {
      while (v.next < ctx.currentTime + 0.3) {
        if (v.i >= v.d.ev.length) { if (song.loop) v.i = 0; else { v.done = true; break; } }
        const e = v.d.ev[v.i++]; const dur = e.b * beat;
        if (e.f === -1) noise(0.07, v.d.g * 2.2, v.next - ctx.currentTime, 3000, mus);
        else if (e.f) {
          const t = v.next, o = ctx.createOscillator(), a = ctx.createGain();
          o.type = v.d.w; o.frequency.value = e.f; a.gain.setValueAtTime(v.d.g, t);
          a.gain.linearRampToValueAtTime(v.d.g * 0.7, t + dur * 0.7); a.gain.linearRampToValueAtTime(0.0001, t + dur * 0.97);
          o.connect(a); a.connect(mus); o.start(t); o.stop(t + dur);
        }
        v.next += dur;
      }
    }
  }
  function play(name) {
    prevTrack = name; if (!ctx) return; if (cur === name) return; stop(); cur = name;
    song = SONGS[name]; if (!song) return;
    const t0 = ctx.currentTime + 0.06;
    voices = song.v.map(d => ({ d, i: 0, next: t0, done: false }));
    timer = setInterval(tick, 40); tick();
  }
  function stop() { if (timer) clearInterval(timer); timer = null; voices = []; song = null; cur = null; if (endTimer) { clearTimeout(endTimer); endTimer = null; } }
  function jingle(name, resume = true) {
    return new Promise(res => {
      const back = prevTrack; stop();
      if (!ctx) { setTimeout(res, 800); return; }
      cur = name; song = SONGS[name]; const t0 = ctx.currentTime + 0.05;
      voices = song.v.map(d => ({ d, i: 0, next: t0, done: false })); timer = setInterval(tick, 40); tick();
      const total = Math.max(...song.v.map(v => v.len)) * 60 / song.tempo * 1000 + 250;
      endTimer = setTimeout(() => { stop(); if (resume && back) { prevTrack = null; play(back); } res(); }, total);
    });
  }
  const SFX = {
    menu: () => tone(880, 880, 0.04, 'square', 0.1),
    ok: () => { tone(660, 660, 0.05, 'square', 0.12); tone(990, 990, 0.07, 'square', 0.12, 0.05); },
    back: () => tone(440, 330, 0.08, 'square', 0.12),
    err: () => tone(160, 120, 0.15, 'square', 0.15),
    step: () => noise(0.03, 0.04, 0, 2500),
    bump: () => tone(110, 90, 0.05, 'triangle', 0.12),
    door: () => { tone(500, 200, 0.18, 'square', 0.1); noise(0.12, 0.08, 0.1, 400); },
    battleStart: () => { for (let i = 0; i < 8; i++) tone(300 + i * 90, 340 + i * 90, 0.07, 'square', 0.1, i * 0.06); noise(0.3, 0.08, 0.2, 500); },
    hit: () => { noise(0.14, 0.25, 0, 500); tone(180, 60, 0.14, 'square', 0.15); },
    crit: () => { noise(0.2, 0.3, 0, 400); tone(300, 60, 0.2, 'sawtooth', 0.18); },
    weak: () => { noise(0.08, 0.12, 0, 1500); tone(200, 120, 0.1, 'square', 0.08); },
    bite: () => { noise(0.05, 0.2, 0, 1200); noise(0.08, 0.25, 0.08, 800); tone(240, 90, 0.12, 'square', 0.12, 0.08); },
    bark: () => { tone(520, 300, 0.12, 'sawtooth', 0.14); tone(480, 250, 0.14, 'sawtooth', 0.14, 0.15); },
    swoosh: () => { noise(0.2, 0.1, 0, 2000); tone(300, 900, 0.18, 'triangle', 0.06); },
    shake: () => tone(200, 160, 0.1, 'triangle', 0.15),
    throw: () => tone(400, 900, 0.2, 'triangle', 0.1),
    recruitOk: () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, f, 0.12, 'square', 0.12, i * 0.1)); },
    recruitFail: () => { tone(500, 200, 0.3, 'sawtooth', 0.12); },
    level: () => { [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.1, 'square', 0.12, i * 0.08)); },
    heal: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, f, 0.14, 'triangle', 0.15, i * 0.12)); },
    faint: () => tone(400, 60, 0.5, 'triangle', 0.18),
    item: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, f, 0.1, 'square', 0.1, i * 0.07)); },
    buy: () => { tone(1200, 1200, 0.05, 'square', 0.1); tone(1600, 1600, 0.08, 'square', 0.1, 0.06); },
    alert: () => { tone(900, 900, 0.08, 'square', 0.14); tone(1200, 1200, 0.12, 'square', 0.14, 0.09); },
    save: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, f, 0.1, 'triangle', 0.14, i * 0.09)); },
    text: () => tone(1000, 1000, 0.015, 'square', 0.035),
  };
  M.audio = { unlock() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); if (prevTrack && !cur && ctx) { const p = prevTrack; prevTrack = null; play(p); } }, play, stop, jingle, vol,
    sfx(n) { if (!ctx) return; try { SFX[n] && SFX[n](); } catch (e) { } }, get current() { return cur; } };
})(window.MD);
