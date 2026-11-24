'use strict';
// ================= ARTE PROCEDURAL EM PIXEL ART (tudo gerado por código, sem imagens externas) =================
(function (M) {
  const SP = M.spr = { tiles: {}, objs: {} };
  const mkc = (w, h) => { const c = M.mk(w, h); return [c, M.cx(c)]; };
  const R = (x, col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const E = (x, cx, cy, rx, ry, col, filt) => {
    for (let yy = Math.floor(cy - ry); yy <= Math.ceil(cy + ry); yy++) for (let xx = Math.floor(cx - rx); xx <= Math.ceil(cx + rx); xx++) {
      const dx = (xx + .5 - cx) / rx, dy = (yy + .5 - cy) / ry; if (dx * dx + dy * dy <= 1 && (!filt || filt(xx, yy))) { x.fillStyle = col; x.fillRect(xx, yy, 1, 1); }
    }
  };
  function outline(c, col) {
    const x = c.getContext('2d', { willReadFrequently: true }); const w = c.width, h = c.height; const d = x.getImageData(0, 0, w, h); const a = d.data; const rgb = M.rgb(col);
    const op = (i, j) => i >= 0 && j >= 0 && i < w && j < h && a[(j * w + i) * 4 + 3] > 0;
    const out = [];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!op(i, j) && (op(i - 1, j) || op(i + 1, j) || op(i, j - 1) || op(i, j + 1))) out.push([i, j]);
    x.fillStyle = col; out.forEach(([i, j]) => x.fillRect(i, j, 1, 1));
  }
  SP.outline = outline;

  // ---------------- TILES de chão 16x16 ----------------
  const tl = SP.tiles;
  function T(name, fn) { const [c, x] = mkc(16, 16); fn(x, M.seed(name.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7))); tl[name] = c; }
  for (let v = 0; v < 3; v++) T('grass' + v, (x, r) => {
    R(x, '#6ab96b', 0, 0, 16, 16);
    for (let i = 0; i < 9; i++) R(x, '#5aa95e', Math.floor(r() * 16), Math.floor(r() * 16), 1, 1);
    for (let i = 0; i < 2; i++) { const a = 1 + Math.floor(r() * 12), b = 2 + Math.floor(r() * 12); R(x, '#4a9a52', a, b + 1, 1, 1); R(x, '#4a9a52', a + 1, b, 1, 1); R(x, '#4a9a52', a + 2, b + 1, 1, 1); R(x, '#8ad080', a + 1, b - 1, 1, 1); }
  });
  T('tall', (x, r) => {
    R(x, '#4a9a55', 0, 0, 16, 16);
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 3; cx++) {
      const ox = cx * 6 + (cy ? 3 : 0) - 1, oy = cy * 8 + 1;
      for (const [dx, h, col] of [[0, 6, '#2f7a3e'], [2, 8, '#8ad27a'], [4, 6, '#2f7a3e'], [1, 5, '#3d8f4b'], [3, 7, '#6cbc66']]) R(x, col, ox + dx, oy + (8 - h), 1, h);
    }
    R(x, '#2f7a3e', 0, 15, 16, 1);
  });
  T('road', (x, r) => { R(x, '#5b5f6c', 0, 0, 16, 16); for (let i = 0; i < 12; i++) R(x, '#666a78', Math.floor(r() * 16), Math.floor(r() * 16), 1, 1); for (let i = 0; i < 5; i++) R(x, '#4e525e', Math.floor(r() * 16), Math.floor(r() * 16), 2, 1); });
  T('roadH', (x, r) => { R(x, '#5b5f6c', 0, 0, 16, 16); for (let i = 0; i < 8; i++) R(x, '#666a78', Math.floor(r() * 16), Math.floor(r() * 16), 1, 1); R(x, '#e8c840', 2, 7, 5, 2); R(x, '#e8c840', 10, 7, 5, 2); });
  T('roadV', (x, r) => { R(x, '#5b5f6c', 0, 0, 16, 16); for (let i = 0; i < 8; i++) R(x, '#666a78', Math.floor(r() * 16), Math.floor(r() * 16), 1, 1); R(x, '#e8c840', 7, 2, 2, 5); R(x, '#e8c840', 7, 10, 2, 5); });
  T('walk', (x) => { R(x, '#cdc7b8', 0, 0, 16, 16); R(x, '#b2ac9d', 0, 7, 16, 1); R(x, '#b2ac9d', 7, 0, 1, 7); R(x, '#b2ac9d', 3, 8, 1, 8); R(x, '#e2ddd0', 0, 0, 16, 1); });
  T('dirt', (x, r) => { R(x, '#c9a56f', 0, 0, 16, 16); for (let i = 0; i < 14; i++) R(x, '#b38e58', Math.floor(r() * 16), Math.floor(r() * 16), 1 + Math.floor(r() * 2), 1); for (let i = 0; i < 6; i++) R(x, '#dcc08c', Math.floor(r() * 16), Math.floor(r() * 16), 1, 1); });
  T('flowers', (x, r) => {
    tl.grass0 && x.drawImage(tl.grass1, 0, 0);
    for (const [a, b] of [[3, 3], [10, 5], [5, 10], [12, 12]]) { R(x, '#3a8a46', a + 1, b + 2, 1, 3); R(x, '#e84a4a', a, b, 3, 3); R(x, '#ffd84a', a + 1, b + 1, 1, 1); }
  });
  T('water', (x, r) => { R(x, '#3f86d4', 0, 0, 16, 16); for (let i = 0; i < 4; i++) { const a = Math.floor(r() * 10), b = Math.floor(r() * 14); R(x, '#78b4ec', a, b, 4, 1); R(x, '#2f6fba', a + 1, b + 1, 3, 1); } });
  T('concrete', (x, r) => { R(x, '#8f939c', 0, 0, 16, 16); for (let i = 0; i < 10; i++) R(x, '#9ca0a9', Math.floor(r() * 16), Math.floor(r() * 16), 2, 1); R(x, '#7e828b', 0, 15, 16, 1); R(x, '#7e828b', 15, 0, 1, 16); });
  T('gravel', (x, r) => { R(x, '#a39a8c', 0, 0, 16, 16); for (let i = 0; i < 22; i++) R(x, r() > .5 ? '#8a8174' : '#bcb3a4', Math.floor(r() * 16), Math.floor(r() * 16), 1, 1); });
  T('wood', (x) => { R(x, '#d9a763', 0, 0, 16, 16); R(x, '#bd8a48', 0, 5, 16, 1); R(x, '#bd8a48', 0, 11, 16, 1); R(x, '#bd8a48', 4, 0, 1, 5); R(x, '#bd8a48', 11, 6, 1, 5); R(x, '#bd8a48', 6, 12, 1, 4); });
  T('tile', (x) => { R(x, '#ece8dc', 0, 0, 16, 16); R(x, '#cfc9b8', 0, 0, 8, 8); R(x, '#cfc9b8', 8, 8, 8, 8); });
  T('wallI', (x) => { R(x, '#e9d9b2', 0, 0, 16, 16); R(x, '#cdb88a', 0, 12, 16, 4); R(x, '#a68f62', 0, 11, 16, 1); R(x, '#f4ead0', 0, 0, 16, 1); });
  T('wallG', (x, r) => { R(x, '#6e727c', 0, 0, 16, 16); R(x, '#595d67', 0, 12, 16, 4); for (let i = 0; i < 4; i++) R(x, '#7e828c', 2 + i * 4, 2, 2, 8); });
  T('rug', (x) => { R(x, '#b8403c', 0, 0, 16, 16); R(x, '#e8c660', 1, 1, 14, 1); R(x, '#e8c660', 1, 14, 14, 1); R(x, '#e8c660', 1, 1, 1, 14); R(x, '#e8c660', 14, 1, 1, 14); R(x, '#8a2a2a', 4, 4, 8, 8); R(x, '#e8c660', 7, 7, 2, 2); });
  T('mat', (x) => { R(x, '#3a6ab8', 0, 0, 16, 16); R(x, '#8ab4f0', 1, 1, 14, 2); R(x, '#8ab4f0', 1, 13, 14, 2); R(x, '#2a4a88', 0, 8, 16, 1); });
  T('void', (x) => { R(x, '#0c0c14', 0, 0, 16, 16); });
  T('cliff', (x, r) => { R(x, '#b89870', 0, 0, 16, 16); for (let i = 0; i < 8; i++) { R(x, '#9a7a52', 0, i * 2, 16, 1); } for (let i = 0; i < 4; i++) R(x, '#d4b88c', (i * 5) % 16, 4 + i * 3, 4, 1); });
  T('stripe', (x) => { R(x, '#f0f0f0', 0, 0, 16, 16); R(x, '#f0f0f0', 0, 0, 16, 5); R(x, '#f0f0f0', 0, 11, 16, 5); R(x, '#e8e8e8', 0, 5, 16, 6); }); // faixa de pedestre base
  T('zebra', (x) => { R(x, '#5b5f6c', 0, 0, 16, 16); for (let i = 0; i < 4; i++) R(x, '#e8e8e8', 1 + i * 4, 1, 3, 14); });
  T('fence', (x) => { x.drawImage(tl.grass2, 0, 0); for (const px of [1, 9]) { R(x, '#6a3a1c', px, 3, 6, 12); R(x, '#a8683a', px + 1, 3, 4, 11); R(x, '#d89a5e', px + 1, 4, 2, 6); R(x, '#8a4a28', px, 2, 6, 1); R(x, '#3a2010', px, 15, 6, 1); } });
  T('chain', (x) => { x.drawImage(tl.gravel, 0, 0); R(x, '#4a4e5a', 0, 1, 2, 15); R(x, '#4a4e5a', 14, 1, 2, 15); for (let i = 0; i < 14; i++) { R(x, '#b8bec8', 2 + i, 3 + (i % 6) * 2, 1, 1); R(x, '#b8bec8', 2 + i, 12 - (i % 6) * 2, 1, 1); } R(x, '#4a4e5a', 0, 1, 16, 1); });
  T('court', (x) => { R(x, '#3a8a7a', 0, 0, 16, 16); R(x, '#f2f2f2', 0, 0, 16, 1); R(x, '#f2f2f2', 0, 0, 1, 16); R(x, '#2f7a6a', 8, 0, 8, 16); R(x, '#f2f2f2', 7, 0, 1, 16); });
  T('pitch', (x, r) => { R(x, '#4fae5a', 0, 0, 16, 16); R(x, '#5cbc66', 0, 0, 16, 8); for (let i = 0; i < 6; i++) R(x, '#46a050', Math.floor(r() * 16), Math.floor(r() * 16), 1, 1); R(x, '#eef6ee', 0, 15, 16, 1); });
  T('runway', (x) => { R(x, '#4a4e5a', 0, 0, 16, 16); R(x, '#e8e8e8', 2, 7, 6, 2); R(x, '#3e424e', 0, 0, 16, 1); });
  SP.groundNames = ['court', 'pitch', 'runway', 'fence', 'chain', 'grass', 'tall', 'road', 'roadH', 'roadV', 'walk', 'dirt', 'flowers', 'water', 'concrete', 'gravel', 'wood', 'tile', 'wallI', 'wallG', 'rug', 'mat', 'void', 'cliff', 'zebra'];
  SP.solidGround = new Set(['fence', 'chain', 'water', 'wallI', 'wallG', 'void', 'cliff']);

  // ---------------- PRÉDIOS ----------------
  const BSTY = {
    orange: { roof: '#d8742e', roofL: '#f09448', roofD: '#a8501c', wall: '#f2e6c4', trim: '#4a6a9a', win: '#6ab0e8', door: '#4a7ab8' },
    purple: { roof: '#7a4a8a', roofL: '#9a68a8', roofD: '#58306a', wall: '#c9bfd0', trim: '#58306a', win: '#8ab8e8', door: '#caa050' },
    blue: { roof: '#3a78c8', roofL: '#5a98e0', roofD: '#285a9c', wall: '#f0f0e8', trim: '#285a9c', win: '#9ad0f0', door: '#e8b840' },
    grey: { roof: '#7a7f8a', roofL: '#9aa0aa', roofD: '#585c66', wall: '#b8b4a8', trim: '#585c66', win: '#7098c0', door: '#6a6e78' },
    yellow: { roof: '#b84a3a', roofL: '#d86a5a', roofD: '#8a3428', wall: '#f4dc80', trim: '#8a3428', win: '#7ab8e0', door: '#7a4a2a' },
    brick: { roof: '#5a6070', roofL: '#7a8090', roofD: '#3a4050', wall: '#b8604a', trim: '#7a3a2a', win: '#a8d0e8', door: '#4a3a2a' },
    green: { roof: '#2f8a4c', roofL: '#52b266', roofD: '#1f6a3c', wall: '#f0f0e0', trim: '#1f6a3c', win: '#9ad0f0', door: '#e8c040' },
    rust: { roof: '#8a5a3a', roofL: '#a87a52', roofD: '#5e3a22', wall: '#9a8a7a', trim: '#5e3a22', win: '#6a88a0', door: '#3a3a44' },
  };
  SP.building = function (w, h, st, doorX, o = {}) {
    const P = BSTY[st], [c, x] = mkc(w * 16, h * 16), rh = (h - 2) * 16, W = w * 16;
    R(x, P.roof, 0, 0, W, rh);
    for (let yy = 0; yy < rh; yy += 8) { R(x, P.roofD, 0, yy + 7, W, 1); for (let xx = ((yy / 8) % 2) * 6; xx < W; xx += 12) R(x, P.roofD, xx, yy, 1, 7); }
    if (o.corrugated) for (let xx = 0; xx < W; xx += 4) { R(x, P.roofL, xx, 0, 1, rh); R(x, P.roofD, xx + 2, 0, 1, rh); }
    R(x, P.roofL, 0, 0, W, 2); R(x, P.roofD, 0, rh - 3, W, 3); R(x, P.roofD, 0, 0, 1, rh); R(x, P.roofD, W - 1, 0, 1, rh);
    R(x, P.wall, 0, rh, W, 32); R(x, M.shade(P.wall, .82), 0, rh, W, 3);
    if (st === 'brick') for (let yy = rh + 4; yy < h * 16 - 3; yy += 4) { R(x, P.trim, 0, yy, W, 1); for (let xx = ((yy >> 2) % 2) * 4; xx < W; xx += 8) R(x, P.trim, xx, yy - 3, 1, 3); }
    R(x, P.trim, 0, h * 16 - 3, W, 3);
    if (o.awning) for (let xx = 0; xx < W; xx += 4) { R(x, ((xx >> 2) % 2) ? '#f4f0e0' : '#d83a3a', xx, rh + 3, 4, 9); R(x, '#a82a2a', xx, rh + 11, 4, 1); }
    for (let i = 0; i < w; i++) {
      if (i === doorX || (o.garage && i === doorX + 1)) continue;
      if (Math.abs(i - doorX) % 2 !== 1 && !(w <= 2)) continue;
      const wx = i * 16 + 2, wy = rh + (o.awning ? 14 : 6);
      R(x, P.trim, wx - 1, wy - 1, 14, 15); R(x, P.win, wx, wy, 12, 13); R(x, '#d8f0ff', wx + 1, wy + 1, 3, 4); R(x, P.trim, wx + 5, wy, 2, 13); R(x, P.trim, wx, wy + 6, 12, 1);
    }
    const dx = doorX * 16;
    if (o.garage) { R(x, P.trim, dx, rh + 4, 32, h * 16 - 3 - rh - 4); R(x, '#9aa0ac', dx + 2, rh + 6, 28, h * 16 - 3 - rh - 6); for (let yy = rh + 8; yy < h * 16 - 3; yy += 3) R(x, '#7e8490', dx + 2, yy, 28, 1); }
    else { R(x, P.trim, dx + 1, rh + 7, 14, h * 16 - 3 - rh - 7); R(x, P.door, dx + 3, rh + 9, 10, h * 16 - 3 - rh - 9); R(x, M.shade(P.door, 1.25), dx + 4, rh + 10, 3, 5); R(x, M.shade(P.door, 1.25), dx + 9, rh + 10, 3, 5); R(x, '#f0d040', dx + 11, h * 16 - 10, 1, 2); }
    outline(c, '#2a2438'); const [c2, x2] = mkc(w * 16, h * 16); x2.drawImage(c, 0, 0); return c;
  };

  // ---------------- OBJETOS ----------------
  const ob = SP.objs;
  function O(name, w, h, fn, solid = true) { const [c, x] = mkc(w * 16, h * 16); fn(x, c); ob[name] = { c, w, h, solid }; }
  const OL = '#24203a';
  O('tree', 2, 2, (x, c) => {
    R(x, '#7a4a2a', 13, 24, 6, 7); R(x, '#5a3018', 13, 24, 2, 7);
    const tier = (top, bot, hw) => { for (let y = top; y <= bot; y++) { const k = (y - top) / (bot - top), w = Math.round(1 + (hw - 1) * k); R(x, '#2f8a4c', 16 - w, y, w * 2, 1); R(x, '#52b266', 16 - w, y, Math.max(1, Math.round(w * .5)), 1); R(x, '#1f6a3c', 16 + Math.round(w * .5), y, Math.ceil(w * .5), 1); } };
    tier(1, 12, 8); tier(8, 19, 11); tier(15, 26, 14); outline(c, '#14472a');
  });
  O('bush', 1, 1, (x, c) => { E(x, 8, 9, 6, 5, '#3f9a52'); E(x, 6, 7, 3, 2, '#68c070'); R(x, '#e84a6a', 10, 7, 2, 2); R(x, '#e84a6a', 5, 10, 2, 2); outline(c, '#1a5a30'); });
  O('bench', 2, 1, (x, c) => { R(x, '#8a5a30', 1, 4, 30, 4); R(x, '#b27a44', 1, 4, 30, 1); R(x, '#8a5a30', 1, 9, 30, 3); R(x, '#4a4a58', 3, 12, 2, 3); R(x, '#4a4a58', 27, 12, 2, 3); outline(c, OL); });
  O('lamp', 1, 2, (x, c) => { R(x, '#4a4e5a', 7, 6, 2, 25); R(x, '#4a4e5a', 5, 29, 6, 3); R(x, '#4a4e5a', 5, 3, 6, 3); R(x, '#fff0a0', 6, 4, 4, 2); E(x, 8, 3, 4, 2, '#fff0a0'); outline(c, OL); });
  O('busstop', 3, 2, (x, c) => {
    R(x, '#e8b030', 0, 2, 48, 6); R(x, '#c08a1c', 0, 7, 48, 2); R(x, '#4a4e5a', 2, 9, 2, 22); R(x, '#4a4e5a', 44, 9, 2, 22);
    R(x, '#a8d8f0', 4, 9, 40, 14); R(x, '#d8f0ff', 6, 10, 6, 8); R(x, '#8a5a30', 8, 24, 32, 3); R(x, '#8a5a30', 8, 27, 3, 4); R(x, '#8a5a30', 37, 27, 3, 4);
    R(x, '#2a2a3a', 18, 3, 12, 4); R(x, '#fff', 20, 4, 2, 2); R(x, '#fff', 24, 4, 4, 2); outline(c, OL);
  });
  O('pump', 1, 2, (x, c) => { R(x, '#d8363a', 3, 6, 10, 22); R(x, '#f0f0f0', 4, 8, 8, 7); R(x, '#3a3a48', 5, 10, 6, 3); R(x, '#2a2a3a', 3, 28, 10, 3); R(x, '#8a8a98', 13, 12, 2, 12); R(x, '#d8363a', 2, 4, 12, 3); outline(c, OL); });
  O('crate', 1, 1, (x, c) => { R(x, '#b8854a', 1, 2, 14, 13); R(x, '#8a5e30', 1, 2, 14, 2); R(x, '#8a5e30', 1, 13, 14, 2); R(x, '#8a5e30', 1, 2, 2, 13); R(x, '#8a5e30', 13, 2, 2, 13); for (let i = 0; i < 12; i++) R(x, '#8a5e30', 2 + i, 3 + i, 1, 1); outline(c, OL); });
  O('barrel', 1, 1, (x, c) => { E(x, 8, 9, 5.5, 6.5, '#3a6ab8'); R(x, '#2a4a88', 3, 6, 10, 1); R(x, '#2a4a88', 3, 11, 10, 1); R(x, '#6a9ae0', 5, 4, 2, 9); outline(c, OL); });
  O('cone', 1, 1, (x, c) => { R(x, '#f07a1c', 5, 3, 6, 10); R(x, '#f07a1c', 3, 10, 10, 3); R(x, '#f4f0e0', 5, 6, 6, 2); R(x, '#2a2a3a', 2, 13, 12, 2); outline(c, OL); });
  O('tires', 1, 1, (x, c) => { E(x, 8, 11, 6, 3.5, '#2a2a34'); E(x, 8, 8, 6, 3.5, '#3a3a46'); E(x, 8, 5, 6, 3.5, '#2a2a34'); E(x, 8, 5, 2.5, 1.5, '#8a8a98'); outline(c, '#101018'); });
  O('container', 3, 2, (x, c) => { const col = '#b8453a'; R(x, col, 0, 2, 48, 28); for (let i = 3; i < 46; i += 4) { R(x, M.shade(col, .8), i, 3, 1, 26); R(x, M.shade(col, 1.15), i + 1, 3, 1, 26); } R(x, M.shade(col, .7), 0, 2, 48, 2); R(x, M.shade(col, .7), 0, 28, 48, 2); R(x, '#f0f0f0', 6, 12, 12, 3); outline(c, OL); });
  O('containerB', 3, 2, (x, c) => { const col = '#3a6ab0'; R(x, col, 0, 2, 48, 28); for (let i = 3; i < 46; i += 4) { R(x, M.shade(col, .8), i, 3, 1, 26); R(x, M.shade(col, 1.15), i + 1, 3, 1, 26); } R(x, M.shade(col, .7), 0, 2, 48, 2); R(x, M.shade(col, .7), 0, 28, 48, 2); R(x, '#f0e060', 30, 12, 12, 3); outline(c, OL); });
  const car = (name, col) => O(name, 3, 2, (x, c) => { R(x, col, 2, 14, 44, 10); R(x, col, 10, 6, 26, 9); R(x, '#a8d8f0', 12, 8, 10, 6); R(x, '#a8d8f0', 24, 8, 10, 6); R(x, M.shade(col, .75), 2, 22, 44, 2); E(x, 12, 25, 4, 4, '#222'); E(x, 36, 25, 4, 4, '#222'); E(x, 12, 25, 1.6, 1.6, '#aaa'); E(x, 36, 25, 1.6, 1.6, '#aaa'); R(x, '#fff0a0', 44, 16, 2, 3); outline(c, OL); });
  car('carR', '#d8453a'); car('carB', '#3a68c8'); car('carY', '#e8c030');
  O('sign', 1, 1, (x, c) => { R(x, '#7a4a2a', 7, 9, 2, 6); R(x, '#f2e6c4', 2, 2, 12, 8); R(x, '#a8845a', 2, 2, 12, 1); R(x, '#a8845a', 2, 9, 12, 1); R(x, '#4a3a2a', 4, 4, 8, 1); R(x, '#4a3a2a', 4, 6, 6, 1); outline(c, OL); });
  O('statue', 2, 2, (x, c) => { R(x, '#a8a8b4', 4, 18, 24, 12); R(x, '#c8c8d4', 4, 18, 24, 2); R(x, '#8a8a96', 4, 28, 24, 2); E(x, 16, 12, 8, 5, '#e8c030'); E(x, 10, 7, 4, 4, '#e8c030'); R(x, '#e8c030', 6, 2, 3, 4); R(x, '#fff0a0', 12, 9, 6, 1); R(x, '#e8c030', 22, 6, 3, 6); R(x, '#222', 9, 6, 1, 1); outline(c, OL); });
  O('trash', 1, 1, (x, c) => { R(x, '#4a8a58', 3, 4, 10, 10); R(x, '#386a44', 2, 3, 12, 2); R(x, '#6ab07a', 4, 6, 2, 6); outline(c, OL); });
  O('poste', 1, 2, (x, c) => { R(x, '#8a8a92', 7, 2, 2, 29); R(x, '#8a8a92', 3, 4, 10, 2); R(x, '#5a5a62', 3, 4, 2, 3); R(x, '#5a5a62', 11, 4, 2, 3); outline(c, OL); });
  O('graf', 3, 2, (x, c) => {
    R(x, '#b4aea0', 0, 0, 48, 32); R(x, '#8f8a7c', 0, 0, 48, 3); R(x, '#8f8a7c', 0, 29, 48, 3);
    R(x, '#e84a8a', 4, 8, 14, 4); R(x, '#4ac8e8', 8, 12, 14, 4); R(x, '#f0d040', 20, 6, 10, 5); R(x, '#222', 24, 14, 18, 3); R(x, '#e84a8a', 30, 20, 12, 4); R(x, '#222', 6, 20, 10, 3);
    for (let i = 0; i < 6; i++) R(x, '#222', 10 + i * 6, 24, 3, 3); outline(c, OL);
  });
  O('grafCol', 3, 2, (x, c) => {
    R(x, '#3a3a46', 0, 0, 48, 32); R(x, '#2a2a34', 0, 0, 48, 3); R(x, '#2a2a34', 0, 29, 48, 3);
    E(x, 24, 16, 9, 7, '#c0212a'); E(x, 24, 16, 6, 4, '#3a3a46'); R(x, '#c0212a', 22, 8, 4, 3); for (let i = 0; i < 7; i++) R(x, '#e8e8e8', 10 + i * 4, 26, 2, 2); outline(c, OL);
  });
  O('muro', 3, 2, (x, c) => { R(x, '#cfc8ba', 0, 4, 48, 28); R(x, '#a8a090', 0, 2, 48, 4); R(x, '#8f8777', 0, 6, 48, 1); for (let i = 0; i < 48; i += 16) R(x, '#a8a090', i, 8, 1, 24); R(x, '#8f8777', 0, 29, 48, 3); outline(c, OL); });
  O('tank', 2, 2, (x, c) => { R(x, '#9aa0ac', 2, 6, 28, 24); E(x, 16, 6, 14, 5, '#bcc2ce'); R(x, '#7a808c', 2, 26, 28, 4); R(x, '#d83a3a', 6, 14, 20, 3); R(x, '#4a4e5a', 4, 28, 3, 4); R(x, '#4a4e5a', 25, 28, 3, 4); outline(c, OL); });
  O('hole', 1, 1, (x, c) => { E(x, 8, 9, 6, 4, '#3a2a1c'); E(x, 8, 8, 5, 3, '#241810'); outline(c, OL); }, false);
  O('box', 1, 1, (x, c) => { R(x, '#c9a070', 2, 4, 12, 10); R(x, '#a98050', 2, 4, 12, 3); R(x, '#8a6038', 7, 4, 2, 10); outline(c, OL); });
  O('moto', 2, 1, (x, c) => { E(x, 6, 11, 4.5, 4.5, '#222'); E(x, 25, 11, 4.5, 4.5, '#222'); E(x, 6, 11, 1.6, 1.6, '#aaa'); E(x, 25, 11, 1.6, 1.6, '#aaa'); R(x, '#c0212a', 9, 5, 12, 4); R(x, '#3a3a46', 8, 4, 6, 2); R(x, '#aaa', 20, 2, 5, 2); R(x, '#c0212a', 22, 5, 3, 5); R(x, '#fff0a0', 27, 4, 2, 2); outline(c, OL); });
  // interior
  O('bed', 2, 2, (x, c) => { R(x, '#8a5a30', 1, 1, 30, 30); R(x, '#f4f0e0', 3, 3, 26, 8); R(x, '#d8b8d8', 3, 3, 26, 2); R(x, '#5a8ad8', 3, 11, 26, 19); R(x, '#8ab0f0', 3, 11, 26, 3); R(x, '#4a7ac8', 3, 22, 26, 2); outline(c, OL); });
  O('table', 2, 1, (x, c) => { R(x, '#a8723c', 0, 3, 32, 8); R(x, '#c8924c', 0, 3, 32, 2); R(x, '#7a4e26', 2, 11, 3, 5); R(x, '#7a4e26', 27, 11, 3, 5); outline(c, OL); });
  O('shelf', 2, 2, (x, c) => { R(x, '#8a5a30', 0, 0, 32, 32); R(x, '#5e3a1c', 2, 2, 28, 12); R(x, '#5e3a1c', 2, 17, 28, 12); const cols = ['#e84a4a', '#f0d040', '#4ac8e8', '#8ae85a', '#e87ac8', '#f09040']; for (let i = 0; i < 7; i++) { R(x, cols[i % 6], 3 + i * 4, 5, 3, 8); R(x, cols[(i + 2) % 6], 3 + i * 4, 20, 3, 8); } outline(c, OL); });
  O('counter', 3, 1, (x, c) => { R(x, '#6a4a2e', 0, 2, 48, 13); R(x, '#d8c8a8', 0, 1, 48, 5); R(x, '#4a3220', 0, 13, 48, 2); R(x, '#4a8ad8', 36, -2 + 2, 8, 3); R(x, '#f0e060', 6, 0, 6, 3); outline(c, OL); });
  O('couch', 3, 1, (x, c) => { R(x, '#6a3a8a', 0, 2, 48, 13); R(x, '#8a5aaa', 3, 4, 42, 8); R(x, '#4a2a6a', 0, 2, 4, 13); R(x, '#4a2a6a', 44, 2, 4, 13); outline(c, OL); });
  O('plant', 1, 1, (x, c) => { R(x, '#a8584a', 4, 9, 8, 6); for (const [a, b] of [[3, 2], [8, 1], [6, 4], [10, 5], [2, 6]]) E(x, a + 2, b + 3, 3, 3, '#3f9a52'); outline(c, OL); });
  O('bench2', 3, 1, (x, c) => { R(x, '#6a6e78', 0, 4, 48, 8); R(x, '#8a8e98', 0, 4, 48, 2); R(x, '#d0a030', 4, 0, 4, 4); R(x, '#b8b8c4', 14, 2, 10, 2); R(x, '#4a4e5a', 2, 12, 3, 4); R(x, '#4a4e5a', 43, 12, 3, 4); outline(c, OL); });
  O('tv', 1, 1, (x, c) => { R(x, '#3a3a46', 1, 2, 14, 10); R(x, '#78c0e8', 3, 4, 10, 6); R(x, '#fff', 4, 5, 3, 1); R(x, '#3a3a46', 5, 12, 6, 2); outline(c, OL); });
  O('stove', 1, 2, (x, c) => { R(x, '#e8e8ec', 1, 4, 14, 27); R(x, '#a8a8b4', 1, 4, 14, 3); R(x, '#3a3a46', 3, 9, 10, 8); E(x, 5, 6, 1.5, 1.5, '#3a3a46'); E(x, 11, 6, 1.5, 1.5, '#3a3a46'); R(x, '#8a8a98', 3, 20, 10, 2); outline(c, OL); });
  O('workbench', 3, 1, (x, c) => { R(x, '#7a808c', 0, 3, 48, 9); R(x, '#a0a6b2', 0, 3, 48, 2); R(x, '#4a4e5a', 2, 12, 3, 4); R(x, '#4a4e5a', 43, 12, 3, 4); R(x, '#d83a3a', 8, 1, 3, 2); R(x, '#aaa', 14, 1, 6, 2); R(x, '#f0c030', 30, 0, 4, 3); outline(c, OL); });
  O('rack', 2, 2, (x, c) => { R(x, '#5a5e6a', 0, 0, 32, 32); for (let i = 0; i < 3; i++) { R(x, '#3a3e4a', 1, 3 + i * 10, 30, 2); } for (let i = 0; i < 5; i++) { R(x, ['#d83a3a', '#f0c030', '#3a78c8'][i % 3], 3 + i * 6, 6, 4, 4); R(x, ['#f0c030', '#d83a3a', '#8a8e98'][i % 3], 3 + i * 6, 16, 4, 4); } outline(c, OL); });
  O('pallet', 1, 1, (x, c) => { R(x, '#b89058', 1, 6, 14, 8); for (let i = 0; i < 4; i++) R(x, '#8a6a38', 1 + i * 4, 6, 2, 8); R(x, '#e8e0c8', 3, 2, 10, 5); outline(c, OL); });
  O('dogbed', 2, 1, (x, c) => { E(x, 16, 9, 14, 5.5, '#c8506a'); E(x, 16, 8, 11, 3.5, '#f0b8c8'); outline(c, OL); }, false);
  O('banner', 1, 2, (x, c) => { R(x, '#6a6e78', 3, 2, 2, 29); R(x, '#f08a1c', 5, 3, 10, 9); E(x, 10, 8, 2, 1.6, '#fff'); for (const [a, b] of [[7, 5], [9, 4], [11, 4], [13, 5]]) R(x, '#fff', a, b, 1, 2); outline(c, OL); });
  O('plane', 6, 3, (x, c) => { R(x, '#f0f0f4', 6, 18, 80, 10); E(x, 88, 23, 7, 5, '#f0f0f4'); R(x, '#2a4a98', 6, 24, 80, 2); R(x, '#d8d8e0', 36, 8, 8, 40); R(x, '#d8d8e0', 36, 28, 18, 12); R(x, '#a8a8b4', 4, 8, 8, 16); R(x, '#2a4a98', 4, 4, 6, 14); for (let i = 0; i < 9; i++) R(x, '#6a8ab8', 18 + i * 6, 20, 3, 2); outline(c, OL); });
  O('sapo', 1, 1, (x, c) => { E(x, 8, 10, 5, 4, '#5aa84a'); E(x, 5, 6, 2, 2, '#5aa84a'); E(x, 11, 6, 2, 2, '#5aa84a'); R(x, '#fff', 4, 5, 2, 2); R(x, '#fff', 10, 5, 2, 2); R(x, '#222', 5, 6, 1, 1); R(x, '#222', 11, 6, 1, 1); R(x, '#8ad07a', 5, 11, 6, 1); outline(c, OL); });
  O('hurdle', 1, 1, (x, c) => { R(x, '#f07a1c', 1, 6, 14, 3); R(x, '#f4f0e0', 4, 6, 3, 3); R(x, '#f4f0e0', 10, 6, 3, 3); R(x, '#3a3a46', 2, 9, 2, 5); R(x, '#3a3a46', 12, 9, 2, 5); outline(c, OL); });
  O('flag', 1, 2, (x, c) => { R(x, '#6a6e78', 3, 2, 2, 29); R(x, '#14141c', 5, 3, 10, 8); R(x, '#c0212a', 8, 5, 4, 4); outline(c, OL); });

  // ---------------- PESSOAS 16x24 ----------------
  const pcache = new Map();
  SP.person = function (p, dir, f) {
    const key = JSON.stringify(p) + dir + f; if (pcache.has(key)) return pcache.get(key);
    let [c, x] = mkc(16, 24);
    const sk = p.skin || '#f4c8a0', hr = p.hair || '#3a2a20', hrd = M.shade(hr, .78), hrl = M.shade(hr, 1.18);
    const sh = p.shirtless ? sk : (p.shirt || '#4a6ab8'), shd = M.shade(sh, .8), pa = p.pants || '#3a3a4a', pad = M.shade(pa, .82), so = p.shoes || '#f0f0f0';
    const long = p.style === 'long' || p.style === 'bun', bald = p.style === 'bald', bun = p.style === 'bun';
    const aL = f === 1 ? 1 : f === 2 ? -1 : 0;
    const eye = '#241818';
    const arms = (xl, xr) => { R(x, sh, xl, 12 + aL, 1, 3); R(x, sk, xl, 15 + aL, 1, 2); R(x, sh, xr, 12 - aL, 1, 3); R(x, sk, xr, 15 - aL, 1, 2); };
    if (dir === 'left' || dir === 'right') {
      if (long) R(x, hrd, 7, 4, 5, 14);
      const legs = f === 0 ? [{ x: 6, w: 4, e: 23 }] : f === 1 ? [{ x: 8, w: 3, e: 22, d: 1 }, { x: 5, w: 3, e: 23 }] : [{ x: 5, w: 3, e: 22, d: 1 }, { x: 8, w: 3, e: 23 }];
      legs.forEach(l => { R(x, l.d ? pad : pa, l.x, 18, l.w, l.e - 19); R(x, so, l.x - (dir ? 0 : 0), l.e - 1, l.w + 1, 2); });
      R(x, sh, 5, 12, 6, 6); R(x, shd, 5, 17, 6, 1);
      // Acabamento lateral: gola, costura da manga e barra da camiseta.
      R(x, M.shade(sh, 1.16), 6, 12, 3, 1); R(x, shd, 5, 16, 6, 1);
      R(x, M.shade(sh, 1.08), 6, 18, 4, 1);
      R(x, pad, 6, 21, 4, 1); R(x, M.shade(so, 1.12), 6, 22, 2, 1);
      R(x, sk, 4, 3, 7, 9); R(x, sk, 3, 8, 1, 2);
      R(x, hr, 4, 2, 8, 2); R(x, hr, 7, 3, 5, 9 + (long ? 5 : 0)); R(x, hr, 4, 3, 3, 2);
      if (bald) { R(x, sk, 4, 2, 8, 2); R(x, hr, 8, 5, 3, 3); }
      R(x, hrl, 5, 2, 3, 1);
      R(x, eye, 5, 7, 1, 2); R(x, '#c06a6a', 4, 10, 2, 1); if (p.blush) R(x, '#e8a0a0', 6, 9, 1, 1);
      if (p.extra === 'beard') R(x, p.beard || '#ccc', 4, 9, 6, 3);
      if (p.extra === 'glasses') { R(x, '#222', 3, 6, 4, 1); R(x, '#222', 4, 6, 1, 3); }
      if (p.extra === 'sunglasses') { R(x, '#171b25', 3, 6, 8, 4); R(x, '#e34b32', 4, 7, 2, 2); R(x, '#e9a52c', 6, 7, 2, 2); R(x, '#55b9a8', 8, 7, 2, 2); R(x, '#3977c5', 9, 7, 1, 2); R(x, '#fff0c8', 7, 6, 1, 1); }
      // Braço visível acompanha a passada no perfil; a mão alterna um pixel.
      R(x, sh, 7, 12 + aL, 2, 3);
      R(x, shd, 7, 14 + aL, 2, 1);
      R(x, sk, 7, 15 + aL, 2, 2);
      if (long) { R(x, hr, 8, 11, 3, 5); R(x, hrd, 10, 12, 1, 4); }
      if (bun) R(x, hr, 7, 0, 4, 2);
    } else {
      const le = f === 1 ? 22 : 23, re = f === 2 ? 22 : 23;
      if (long) R(x, hrd, 3, 4, 10, 14);
      R(x, pa, 5, 18, 3, le - 19); R(x, so, 5, le - 1, 3, 2); R(x, pa, 8, 18, 3, re - 19); R(x, so, 8, re - 1, 3, 2);
      R(x, sh, 4, 12, 8, 6); R(x, shd, 4, 17, 8, 1);
      // Gola, costuras e pequenos detalhes separam camiseta e calça em baixa resolução.
      R(x, M.shade(sh, 1.18), 6, 12, 4, 1); R(x, shd, 7, 13, 2, 1);
      R(x, M.shade(sh, 1.08), 5, 16, 1, 1); R(x, M.shade(sh, 1.08), 10, 16, 1, 1);
      // Costura central e luz no ombro dão leitura ao tronco em escala 16x32.
      R(x, M.shade(sh, 1.12), 5, 13, 2, 1); R(x, shd, 7, 15, 2, 1);
      arms(3, 12);
      if (dir === 'down') {
        R(x, sk, 4, 3, 8, 9); R(x, sk, 3, 5, 1, 3); R(x, sk, 12, 5, 1, 3);
        R(x, hr, 3, 2, 10, 3); R(x, hr, 3, 4, 2, long ? 9 : 4); R(x, hr, 11, 4, 2, long ? 9 : 4);
        if (bald) { R(x, sk, 4, 2, 8, 3); }
        else if (long || p.style === 'short' || bun) { R(x, hr, 4, 4, 8, 2); R(x, hrd, 4, 6, 1, 1); R(x, hrd, 7, 6, 2, 1); R(x, hrd, 11, 6, 1, 1); }
        R(x, hrl, 6, 2, 4, 1);
        R(x, eye, 6, 7, 1, 2); R(x, eye, 9, 7, 1, 2); R(x, '#c06a6a', 7, 10, 2, 1); if (p.blush) { R(x, '#eba5a5', 5, 9, 1, 1); R(x, '#eba5a5', 10, 9, 1, 1); }
        if (p.extra === 'beard') { R(x, p.beard || '#ccc', 4, 9, 8, 3); R(x, '#c06a6a', 7, 10, 2, 1); }
        if (p.extra === 'glasses') { R(x, '#222', 5, 7, 3, 1); R(x, '#222', 8, 7, 3, 1); R(x, '#222', 5, 6, 1, 3); R(x, '#222', 10, 6, 1, 3); }
        if (p.extra === 'sunglasses') { R(x, '#171b25', 3, 6, 10, 4); R(x, '#e34b32', 4, 7, 2, 2); R(x, '#e9a52c', 6, 7, 2, 2); R(x, '#55b9a8', 8, 7, 2, 2); R(x, '#3977c5', 10, 7, 2, 2); R(x, '#fff0c8', 7, 6, 1, 1); R(x, '#080a10', 2, 7, 2, 1); R(x, '#080a10', 12, 7, 2, 1); }
        if (long) { R(x, hr, 3, 12, 2, 4); R(x, hr, 11, 12, 2, 4); R(x, hrd, 3, 15, 2, 1); R(x, hrd, 11, 15, 2, 1); }
      } else {
        R(x, hr, 3, 2, 10, 10); R(x, hrl, 5, 3, 4, 1); R(x, hrd, 4, 10, 8, 2); R(x, sk, 6, 12, 4, 1);
        R(x, M.shade(sh, 1.12), 6, 12, 4, 1); R(x, shd, 4, 16, 8, 1);
        R(x, pad, 5, 20, 1, 2); R(x, pad, 10, 20, 1, 2);
        if (bald) { R(x, sk, 4, 3, 8, 7); R(x, hr, 4, 8, 8, 3); }
        if (long) { R(x, hr, 3, 12, 10, 5); R(x, hrd, 3, 16, 10, 1); R(x, hrl, 6, 12, 2, 4); }
      }
      if (bun) R(x, hr, 6, 0, 4, 2);
    }
    // extras comuns
    const down = dir === 'down', up = dir === 'up', side = !down && !up;
    if (p.extra === 'apron') { R(x, '#f4f0e0', 5, 13, 6, 5); R(x, '#d8d4c4', 5, 17, 6, 1); R(x, '#b8b0a0', 7, 14, 2, 1); }
    if (p.extra === 'coleira') { R(x, '#c0212a', side ? 5 : 6, 12, side ? 3 : 4, 1); if (down) { R(x, '#e8e8e8', 5, 14, 1, 1); R(x, '#e8e8e8', 10, 14, 1, 1); } }
    if (p.extra === 'wheelchair') { R(x, '#303744', 1, 19, 2, 4); R(x, '#303744', 13, 19, 2, 4); R(x, '#9098a8', 3, 18, 10, 1); R(x, '#707987', 4, 19, 8, 1); R(x, '#707987', 5, 20, 1, 2); R(x, '#707987', 10, 20, 1, 2); }
    if (p.extra === 'crawl') { R(x, pa, 2, 18, 12, 5); R(x, sh, 5, 17, 8, 4); R(x, sk, 1, 17, 4, 4); R(x, hr, 1, 16, 4, 2); R(x, sk, 5, 20, 2, 2); }
    if (p.shoulderCloth) { if (down) { R(x, p.shoulderCloth, 10, 11, 3, 3); R(x, M.shade(p.shoulderCloth, .78), 11, 13, 2, 3); } else if (side) { R(x, p.shoulderCloth, 9, 11, 3, 4); R(x, M.shade(p.shoulderCloth, .78), 10, 14, 2, 2); } else { R(x, p.shoulderCloth, 3, 11, 3, 4); R(x, M.shade(p.shoulderCloth, .78), 3, 14, 2, 2); } }
    if (p.pattern === 'stars') { const star = '#f4d66a'; [[4,13],[10,14],[6,17],[11,19],[3,21]].forEach(([sx,sy]) => { R(x, star, sx, sy, 1, 1); R(x, '#fff2b0', sx, sy+1, 1, 1); }); }
    if (p.pattern === 'green-orbs') { [[4,14],[10,17],[6,20]].forEach(([sx,sy]) => { R(x, '#8acb70', sx, sy, 2, 2); R(x, '#d8f0a0', sx, sy, 1, 1); }); }
    if (p.emblem === 'horseshoe') { R(x, '#d9b34a', 6, 8, 4, 1); R(x, '#d9b34a', 6, 8, 1, 3); R(x, '#d9b34a', 9, 8, 1, 3); R(x, '#d9b34a', 7, 11, 2, 1); }
    if (p.cap) {
      const cc = p.cap, cd = M.shade(cc, .75);
      if (down) { R(x, cc, 3, 1, 10, 4); R(x, cd, 3, 5, 10, 1); R(x, M.shade(cc, 1.2), 5, 1, 4, 1); }
      else if (up) { R(x, cc, 3, 1, 10, 5); R(x, cd, 3, 6, 10, 1); }
      else { R(x, cc, 4, 1, 8, 4); R(x, cd, 1, 4, 6, 1); R(x, cc, 2, 3, 4, 2); }
    }
    if (p.bandana) { const bc = p.bandana; if (down) { R(x, bc, 3, 2, 10, 3); R(x, M.shade(bc, .7), 3, 5, 10, 1); } else if (up) { R(x, bc, 3, 2, 10, 4); R(x, M.shade(bc, .7), 3, 6, 10, 1); R(x, bc, 12, 6, 2, 3); } else { R(x, bc, 4, 2, 8, 3); R(x, M.shade(bc, .7), 4, 5, 8, 1); R(x, bc, 11, 5, 2, 3); } }
    if (p.helmet) { const hc = p.helmet; if (down) { R(x, hc, 3, 1, 10, 5); R(x, '#222', 4, 6, 8, 1); R(x, '#5a6a8a', 4, 4, 8, 2); } else if (up) { R(x, hc, 3, 1, 10, 8); } else { R(x, hc, 3, 1, 9, 6); R(x, '#5a6a8a', 3, 4, 4, 3); } }
    if (dir === 'right') { const [c2, x2] = mkc(16, 24); x2.translate(16, 0); x2.scale(-1, 1); x2.drawImage(c, 0, 0); c = c2; }
    outline(c, '#2a2030');
    pcache.set(key, c); return c;
  };
  SP.GABE = { skin: '#f6d4c0', hair: '#f2cf62', style: 'bun', shirt: '#f2f2f2', pants: '#2a2a38', shoes: '#ececec', blush: true }; // cabelo loiro dourado

  // ---------------- RETRATOS 32x32 ----------------
  const porCache = new Map();
  SP.portrait = function (p, gabe) {
    const key = JSON.stringify(p); if (porCache.has(key)) return porCache.get(key);
    const [c, x] = mkc(32, 32);
    const sk = p.skin || '#f4c8a0', skd = M.shade(sk, .88), hr = p.hair || '#3a2a20', hrd = M.shade(hr, .72), hrl = M.shade(hr, 1.2);
    const long = p.style === 'long' || p.style === 'bun', bald = p.style === 'bald';
    R(x, '#3a4a6a', 0, 0, 32, 32); R(x, '#4a5e84', 0, 0, 32, 3); // fundo
    if (long) R(x, hrd, 4, 5, 24, 27);
    R(x, p.shirt || '#4a6ab8', 5, 26, 22, 6); R(x, M.shade(p.shirt || '#4a6ab8', .8), 5, 30, 22, 2);
    R(x, skd, 13, 22, 6, 5);
    E(x, 16, 15, 8.5, 10, sk); R(x, skd, 9, 22, 2, 1);
    if (!bald) { E(x, 16, 9, 9.5, 6, hr); R(x, hr, 7, 8, 18, 3); }
    if (long) { R(x, hr, 6, 10, 3, 17); R(x, hr, 23, 10, 3, 17); R(x, hrl, 7, 12, 1, 8); R(x, hrl, 24, 12, 1, 8); }
    if (gabe) { // franja reta, raízes escuras, topete e identidade da Gabe
      R(x, '#5a3b34', 9, 4, 14, 2); R(x, hr, 8, 6, 16, 5); R(x, hrd, 8, 10, 16, 1);
      for (const k of [10, 13, 17, 21]) R(x, sk, k, 10, 1, 1);
      E(x, 16, 3, 3.5, 2.5, hr); R(x, '#5a3b34', 14, 1, 4, 1);
    } else if (!bald) { R(x, hrl, 11, 5, 6, 2); R(x, hrd, 8, 10, 16, 1); }
    if (bald) { E(x, 16, 7, 8, 4, sk); R(x, hrd, 8, 13, 2, 3); R(x, hrd, 22, 13, 2, 3); }
    // olhos
    R(x, '#fff', 11, 15, 4, 3); R(x, '#fff', 18, 15, 4, 3);
    R(x, '#21161a', 12, 15, 3, 3); R(x, '#21161a', 19, 15, 3, 3); R(x, '#fff', 12, 15, 1, 1); R(x, '#fff', 19, 15, 1, 1);
    if (gabe || p.liner) { R(x, '#21161a', 10, 14, 6, 1); R(x, '#21161a', 17, 14, 6, 1); R(x, '#21161a', 9, 13, 1, 1); R(x, '#21161a', 23, 13, 1, 1); R(x, '#21161a', 11, 18, 3, 1); R(x, '#21161a', 19, 18, 3, 1); }
    else { R(x, hrd, 11, 13, 4, 1); R(x, hrd, 18, 13, 4, 1); }
    R(x, skd, 16, 17, 1, 3); R(x, '#d98a8a', 15, 21, 3, 1); R(x, '#b85a64', 14, 22, 5, 1); R(x, '#d98a8a', 15, 23, 3, 1);
    if (p.blush || gabe) { R(x, '#eba5a5', 10, 19, 3, 1); R(x, '#eba5a5', 20, 19, 3, 1); }
    if (gabe) { R(x, '#cfd6e0', 14, 19, 1, 1); }
    if (p.extra === 'beard') { R(x, p.beard || '#ccc', 9, 20, 15, 6); R(x, '#b85a64', 14, 22, 5, 1); }
    if (p.extra === 'glasses') { R(x, '#222', 10, 14, 6, 1); R(x, '#222', 17, 14, 6, 1); R(x, '#222', 10, 18, 6, 1); R(x, '#222', 17, 18, 6, 1); R(x, '#222', 10, 14, 1, 5); R(x, '#222', 15, 14, 1, 5); R(x, '#222', 17, 14, 1, 5); R(x, '#222', 22, 14, 1, 5); R(x, '#222', 16, 15, 1, 1); }
    if (p.cap) { R(x, p.cap, 7, 4, 18, 7); R(x, M.shade(p.cap, .7), 5, 10, 22, 2); R(x, M.shade(p.cap, 1.2), 10, 5, 6, 2); }
    if (p.bandana) { R(x, p.bandana, 7, 6, 18, 5); R(x, M.shade(p.bandana, .7), 7, 11, 18, 1); }
    if (p.helmet) { R(x, p.helmet, 6, 3, 20, 10); R(x, '#222', 8, 12, 16, 2); R(x, '#5a6a8a', 8, 9, 16, 4); }
    if (p.extra === 'coleira') { R(x, '#c0212a', 11, 26, 10, 2); }
    outline(c, '#1a1a28'); porCache.set(key, c); return c;
  };

  // ---------------- CACHORROS ----------------
  const dcache = new Map();
  SP.dogBig = function (sp) {
    if (dcache.has(sp.id)) return dcache.get(sp.id);
    const L = sp.look, [c, x] = mkc(40, 32), rnd = M.seed(sp.id * 7919 + 5);
    const body = L.c, belly = L.c2 || M.shade(body, 1.2), dark = M.shade(body, .78), eyec = L.eye || '#1a1418';
    const sn = L.sn == null ? 5 : L.sn, hr = L.hr || 6, lh = { tiny: 3, short: 4, normal: 7, long: 9 }[L.legs || 'normal'], bh = L.h || 10;
    let bl = L.len || 20; bl = Math.min(bl, 40 - (sn + hr) - 7);
    const hx = 2 + sn + hr + 1, bx = hx - 2, gy = 30, by = gy - lh - bh, hy = by + 1 + (L.hy || 0);
    const cxb = bx + bl / 2, cyb = by + bh / 2, inBody = (xx, yy) => { const dx = (xx + .5 - cxb) / (bl / 2), dy = (yy + .5 - cyb) / (bh / 2); return dx * dx + dy * dy <= 1; };
    const tx = bx + bl, ty = by + 1;
    // cauda
    switch (L.tail || 'curl') {
      case 'curl': E(x, tx + 2, ty - 1, 3.2, 3.2, body); E(x, tx + 2, ty - 1, 1.2, 1.2, dark); break;
      case 'stick': for (let i = 0; i < 7; i++) R(x, body, Math.round(tx - 1 + i * .9), Math.round(ty + 2 - i), 2, 2); break;
      case 'fluff': E(x, tx + 3, ty - 2, 4, 4, belly); E(x, tx + 3, ty - 2, 2.5, 2.5, body); break;
      case 'stub': R(x, body, tx - 1, ty + 1, 3, 3); break;
      case 'down': for (let i = 0; i < 6; i++) R(x, body, Math.round(tx - 1 + i * .5), ty + 1 + i, 2, 2); break;
      case 'whip': for (let i = 0; i < 6; i++) R(x, body, tx - 1 + i, Math.round(ty + 2 - i * .7), 2, 2); break;
    }
    // pernas de trás (longe)
    const legTop = by + bh * 0.55, legCol = L.socks ? belly : body;
    R(x, dark, bx + 7, legTop, 3, gy - legTop); R(x, dark, bx + bl - 9, legTop, 3, gy - legTop);
    E(x, cxb, cyb, bl / 2, bh / 2, body);
    if (L.c2 && !L.noBelly) E(x, cxb, cyb, bl / 2, bh / 2, belly, (xx, yy) => yy > cyb + bh * 0.22);
    E(x, cxb, cyb, bl / 2, bh / 2, dark, (xx, yy) => yy >= by + bh - 1 && inBody(xx, yy));
    // patches no corpo
    if (L.patch === 'saddle') E(x, cxb, cyb, bl / 2, bh / 2, L.pc, (xx, yy) => yy < cyb - 0.5 && xx > bx + 4 && xx < bx + bl - 2);
    if (L.patch === 'spots') for (let i = 0; i < 6; i++) E(x, bx + 3 + rnd() * (bl - 6), by + 2 + rnd() * (bh - 4), 1.5 + rnd() * 1.5, 1.5 + rnd(), L.pc, inBody);
    if (L.patch === 'stripe') for (let i = 0; i < bl; i += 3) for (let j = 0; j < bh; j++) { const xx = bx + i + (j >> 1); if (inBody(xx, by + j)) R(x, L.pc, xx, by + j, 1, 1); }
    if (L.patch === 'tan') E(x, bx + 3, by + bh * 0.7, 3.5, 3.5, L.pc, inBody);
    if (L.patch === 'mask') E(x, bx + 2, by + bh * 0.6, 4, 4, belly, inBody);
    // pernas da frente (perto)
    R(x, legCol, bx + 2, legTop, 3, gy - legTop); R(x, legCol, bx + bl - 6, legTop, 3, gy - legTop);
    if (L.socks) { R(x, L.pc || belly, bx + 2, gy - 3, 3, 3); R(x, L.pc || belly, bx + bl - 6, gy - 3, 3, 3); }
    R(x, M.shade(legCol, .7), bx + 2, gy - 1, 3, 1); R(x, M.shade(legCol, .7), bx + bl - 6, gy - 1, 3, 1);
    // juba
    if (L.mane) { E(x, hx + 2, hy + 2, hr + 3, hr + 3, L.mc || belly); E(x, bx + 4, by + bh * 0.4, 5, 5, L.mc || belly); }
    // cabeça
    E(x, hx, hy, hr, hr * 0.92, L.hc || body);
    if (L.patch === 'mask') { E(x, hx - 2, hy + 3, hr - 1.5, hr * 0.6, belly); R(x, body, hx - hr + 3, hy - hr + 1, 3, 2); }
    if (L.patch === 'bw') R(x, L.pc, hx - hr + 3, hy - hr + 1, 2, hr);
    // focinho
    const sxc = hx - hr - sn / 2 + 3, syc = hy + hr * 0.35, srx = sn / 2 + 3, sry = hr * 0.42, snc = L.snc || belly;
    E(x, sxc, syc, srx, sry, snc);
    R(x, '#1a1418', Math.round(sxc - srx), Math.round(syc - 1.5), 2, 3);
    R(x, M.shade(snc, .55), Math.round(sxc - srx + 2), Math.round(syc + sry - 1), Math.round(srx * 1.6), 1);
    if (L.tongue) R(x, '#e86a7a', Math.round(sxc - srx + 3), Math.round(syc + sry), 2, 2);
    // olho
    const ex = Math.round(hx - hr * 0.35 - 1), ey = Math.round(hy - hr * 0.2);
    R(x, eyec, ex, ey, 2, 2); R(x, '#fff', ex, ey, 1, 1);
    if (L.patch === 'tan') R(x, L.pc, ex - 1, ey - 3, 3, 1);
    // orelhas
    const ec = L.ec || dark;
    switch (L.ear || 'point') {
      case 'point': for (let i = 0; i < 7; i++) { const w = Math.max(1, Math.round(6 - i * .85)); R(x, ec, hx + 3 - Math.floor(w / 2), hy - hr + 1 - i, w, 1); } R(x, '#e8a0a8', hx + 2, hy - hr - 1, 1, 2); break;
      case 'big': for (let i = 0; i < 10; i++) { const w = Math.max(1, Math.round(6 - i * .6)); R(x, ec, hx + 2 - Math.floor(w / 2), hy - hr + 1 - i, w, 1); } R(x, '#e8a0a8', hx + 1, hy - hr - 3, 1, 4); break;
      case 'flop': E(x, hx + 3, hy + 2, 3, 5, ec); break;
      case 'round': E(x, hx + 2, hy - hr + 1, 3, 3, ec); break;
      case 'fluff': E(x, hx + 3, hy - hr + 3, 4, 4, belly); E(x, hx + 4, hy + 4, 4, 5, belly); E(x, hx - 1, hy - hr, 4, 3, L.c); break;
    }
    // coleira
    const colr = L.col || '#d8403c';
    R(x, colr, hx + hr - 4, Math.round(hy + hr * 0.45), 3, Math.round(hr * 0.9)); R(x, '#f4d040', hx + hr - 4, Math.round(hy + hr * 1.3), 2, 2);
    if (L.stud) { R(x, '#e8e8e8', hx + hr - 3, Math.round(hy + hr * 0.6), 1, 1); R(x, '#e8e8e8', hx + hr - 3, Math.round(hy + hr * 1.0), 1, 1); }
    outline(c, M.shade(body, .28));
    dcache.set(sp.id, c); return c;
  };
  // ---------------- SPRITES DE BATALHA 64x64 ----------------
  // Cada sprite ocupa um quadro quadrado transparente. A arte original é
  // ampliada por vizinho mais próximo e centralizada sem deformar a proporção.
  const battleDogCache = new Map();
  SP.battleDog = function (sp) {
    if (battleDogCache.has(sp.id)) return battleDogCache.get(sp.id);
    const [frame, fx] = mkc(64, 64);
    fx.imageSmoothingEnabled = false;
    const source = SP.dogBig(sp);
    const dw = 56, dh = 45;
    fx.clearRect(0, 0, 64, 64);
    fx.drawImage(source, 0, 0, source.width, source.height, Math.round((64 - dw) / 2), 60 - dh, dw, dh);
    battleDogCache.set(sp.id, frame);
    return frame;
  };
  // Demônio zombeteiro: sprite de batalha 64x64 inspirado na referência enviada.
  const battleDemonCache = new Map();
  SP.battleDemon = function (sp) {
    const key = sp.id || 'risonho';
    if (battleDemonCache.has(key)) return battleDemonCache.get(key);
    const [frame, x] = mkc(64, 64);
    const px = (col, a, b, w, h) => R(x, col, a, b, w, h);
    // Cauda arqueada para a direita.
    px('#17131d', 50, 22, 5, 4); px('#17131d', 53, 18, 5, 5); px('#17131d', 55, 14, 5, 5); px('#17131d', 52, 10, 5, 5);
    px('#c9363c', 52, 23, 3, 3); px('#ed6254', 55, 18, 3, 4); px('#ed6254', 56, 14, 3, 3);
    // Pernas e corpo.
    px('#17131d', 17, 43, 31, 17); px('#a90f31', 20, 43, 25, 14); px('#d52b43', 22, 40, 21, 16);
    px('#17131d', 16, 53, 13, 8); px('#17131d', 37, 53, 13, 8); px('#d52b43', 19, 51, 10, 7); px('#d52b43', 38, 51, 9, 7);
    px('#f4e8e8', 20, 57, 3, 3); px('#f4e8e8', 26, 57, 3, 3); px('#f4e8e8', 39, 57, 3, 3); px('#f4e8e8', 45, 57, 3, 3);
    // Braços abertos, com mãos de garra.
    px('#17131d', 10, 31, 12, 18); px('#a90f31', 12, 33, 9, 13); px('#d52b43', 9, 36, 7, 10);
    px('#17131d', 43, 31, 12, 18); px('#a90f31', 44, 33, 9, 13); px('#d52b43', 49, 36, 7, 10);
    px('#17131d', 7, 44, 9, 5); px('#e34a4e', 8, 43, 7, 4); px('#17131d', 50, 44, 9, 5); px('#e34a4e', 51, 43, 7, 4);
    // Cabeça e chifres roxos.
    px('#17131d', 13, 13, 39, 31); px('#b41436', 16, 17, 33, 25); px('#e23b46', 19, 16, 27, 21);
    px('#17131d', 10, 9, 13, 24); px('#725078', 13, 8, 9, 22); px('#9873a0', 15, 10, 5, 15);
    px('#17131d', 40, 9, 13, 24); px('#725078', 42, 8, 9, 22); px('#9873a0', 44, 10, 5, 15);
    px('#17131d', 16, 4, 8, 8); px('#725078', 18, 3, 6, 8); px('#17131d', 40, 4, 8, 8); px('#725078', 41, 3, 6, 8);
    // Olhos amarelos e sorriso azul cheio de dentes.
    px('#17131d', 17, 24, 13, 8); px('#f8cf35', 19, 25, 10, 5); px('#17131d', 34, 24, 13, 8); px('#f8cf35', 36, 25, 10, 5);
    px('#17131d', 23, 25, 3, 5); px('#17131d', 39, 25, 3, 5);
    px('#17131d', 17, 33, 31, 12); px('#174c70', 20, 34, 25, 7); px('#2386a5', 22, 34, 20, 3);
    for (let i = 0; i < 5; i++) px('#f4f1df', 22 + i * 4, 38, 2, 3);
    // Barriga marcada e brilho.
    px('#79142f', 27, 46, 12, 2); px('#79142f', 29, 50, 8, 2); px('#79142f', 27, 54, 12, 2);
    px('#ff8a69', 22, 18, 5, 2); px('#ff8a69', 14, 38, 2, 5);
    outline(frame, '#17131d');
    battleDemonCache.set(key, frame); return frame;
  };
  const battlePortraitCache = new WeakMap();
  SP.battlePortrait = function (portrait) {
    if (!portrait) return null;
    if (battlePortraitCache.has(portrait)) return battlePortraitCache.get(portrait);
    const [frame, fx] = mkc(64, 64);
    fx.imageSmoothingEnabled = false;
    fx.clearRect(0, 0, 64, 64);
    fx.drawImage(portrait, 0, 0, 32, 32, 0, 0, 64, 64);
    battlePortraitCache.set(portrait, frame);
    return frame;
  };
  SP.dogSmall = function (sp, dir, f) {
    const key = 's' + sp.id + dir + f; if (dcache.has(key)) return dcache.get(key);
    const L = sp.look, [c, x] = mkc(16, 16), body = L.c, belly = L.c2 || M.shade(body, 1.2), dark = M.shade(body, .78);
    const long = (L.len || 20) > 22, sh = (L.legs === 'tiny' || L.legs === 'short');
    const bx = 5, bw = long ? 9 : 7, by = sh ? 7 : 6, bh = sh ? 4 : 4, ly = by + bh, le = 14;
    const f1 = f === 1 ? 1 : 0, f2 = f === 2 ? 1 : 0;
    R(x, dark, bx + 1, ly, 2, le - ly - f1); R(x, dark, bx + bw - 3, ly, 2, le - ly - f2);
    R(x, body, bx, by, bw, bh); R(x, belly, bx + 1, by + bh - 1, bw - 2, 1); if (L.patch === 'saddle') R(x, L.pc, bx + 2, by, bw - 3, 2);
    if (L.patch === 'spots') { R(x, L.pc, bx + 2, by + 1, 2, 2); R(x, L.pc, bx + bw - 3, by, 2, 2); }
    R(x, L.socks ? belly : body, bx, ly, 2, le - ly - f2); R(x, L.socks ? belly : body, bx + bw - 2, ly, 2, le - ly - f1);
    R(x, L.hc || body, bx - 3, by - 2, 5, 5); R(x, L.snc || belly, bx - 5, by + 1, 3, 2); R(x, '#111', bx - 5, by + 1, 1, 1); R(x, '#111', bx - 2, by - 1, 1, 1);
    const ear = L.ear || 'point';
    if (ear === 'flop' || ear === 'round') R(x, L.ec || dark, bx - 1, by - 2, 2, 4); else if (ear === 'fluff') R(x, belly, bx - 1, by - 3, 3, 4); else { R(x, L.ec || dark, bx - 1, by - 4, 2, 3); R(x, L.ec || dark, bx - 2, by - 3, 1, 1); }
    const tail = L.tail || 'curl'; if (tail === 'stick' || tail === 'whip') { R(x, body, bx + bw, by - 1, 1, 2); R(x, body, bx + bw + 1, by - 3, 1, 3); } else if (tail === 'fluff') R(x, belly, bx + bw, by - 2, 3, 3); else if (tail === 'down') R(x, body, bx + bw, by + 1, 1, 4); else R(x, body, bx + bw, by, 2, 2);
    R(x, L.col || '#d8403c', bx - 1, by + 2, 2, 1);
    outline(c, M.shade(body, .28));
    if (dir === 'right') { const [c2, x2] = mkc(16, 16); x2.translate(16, 0); x2.scale(-1, 1); x2.drawImage(c, 0, 0); dcache.set(key, c2); return c2; }
    dcache.set(key, c); return c;
  };
  // ---------------- ESCALA DE SPRITES: proporção RPG portátil ----------------
  // Amplia por vizinho mais próximo para preservar pixels duros e contornos limpos.
  // Pessoas: 24x32 px. Cachorros: 32x32 px, com silhueta mais legível no mapa.
  const pixelArtCache = new WeakMap();
  function pixelArtSize(source, width, height) {
    if (!source) return source;
    let sizes = pixelArtCache.get(source);
    if (!sizes) { sizes = {}; pixelArtCache.set(source, sizes); }
    const key = width + 'x' + height;
    if (sizes[key]) return sizes[key];
    const [scaled, sx] = mkc(width, height);
    sx.imageSmoothingEnabled = false;
    sx.clearRect(0, 0, width, height);
    sx.drawImage(source, 0, 0, width, height);
    sizes[key] = scaled;
    return scaled;
  }
  const personBase = SP.person;
  SP.person = function (p, dir, frame) {
    const key = 'ow-person-' + JSON.stringify(p) + '-' + dir + '-' + frame;
    if (owCache.has(key)) return owCache.get(key);
    const [c, x] = mkc(16, 32);
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, 16, 32);
    // Canvas GBA de 1x2 tiles: 16x32. O desenho humano-base tem 16x24
    // e é apoiado na linha do chão; os quadros 1/2 alternam a passada.
    const walkBob = frame === 1 ? 0 : frame === 2 ? 1 : 0;
    const walkShift = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    x.drawImage(personBase(p, dir, frame), walkShift, 8 - walkBob);
    owCache.set(key, c);
    return c;
  };
  const dogSmallBase = SP.dogSmall;
  function dogFrontBack(sp, dir, frame) {
    const L = sp.look, [c, x] = mkc(16, 24);
    const body = L.c, belly = L.c2 || M.shade(body, 1.2), dark = M.shade(body, .72);
    const head = L.hc || body, ear = L.ec || dark, muzzle = L.snc || belly;
    const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    // Corpo visto de frente ou por trás, mantendo a silhueta compacta de GBA.
    R(x, dark, 5, 13, 6, 7);
    R(x, body, 4, 11, 8, 8);
    R(x, belly, 6, 14, 4, 4);
    R(x, dark, 5, 18 + step, 2, 4 - Math.max(0, step));
    R(x, dark, 9, 18 - step, 2, 4 - Math.max(0, -step));
    R(x, body, 4, 20 + step, 3, 2);
    R(x, body, 9, 20 - step, 3, 2);
    if (dir === 'up') {
      R(x, ear, 3, 5, 3, 5); R(x, ear, 10, 5, 3, 5);
      R(x, head, 4, 4, 8, 8);
      R(x, dark, 6, 7, 4, 2);
      if (L.tail === 'curl') { R(x, body, 7, 1, 3, 3); R(x, dark, 8, 2, 1, 1); }
      else if (L.tail === 'fluff') R(x, belly, 6, 1, 4, 3);
      else R(x, body, 7, 1, 2, 4);
    } else {
      if (L.ear === 'flop' || L.ear === 'round') {
        R(x, ear, 2, 5, 3, 5); R(x, ear, 11, 5, 3, 5);
      } else {
        R(x, ear, 3, 2, 3, 6); R(x, ear, 10, 2, 3, 6);
        R(x, M.shade(ear, .72), 4, 3, 1, 3); R(x, M.shade(ear, .72), 11, 3, 1, 3);
      }
      R(x, head, 4, 4, 8, 8);
      R(x, muzzle, 5, 8, 6, 3);
      R(x, '#17131a', 7, 8, 2, 2);
      R(x, '#17131a', 5, 6, 1, 1); R(x, '#17131a', 10, 6, 1, 1);
      if (L.tongue) R(x, '#e86a7a', 7, 11, 2, 2);
      if (L.patch === 'mask') { R(x, belly, 5, 5, 6, 3); R(x, head, 7, 5, 2, 2); }
    }
    if (L.patch === 'spots') { R(x, L.pc, 5, 15, 2, 2); R(x, L.pc, 9, 16, 2, 2); }
    if (L.patch === 'saddle') R(x, L.pc, 5, 12, 6, 3);
    R(x, L.col || '#d8403c', 5, 12, 6, 1);
    R(x, '#f4d040', 7, 12, 2, 1);
    outline(c, M.shade(body, .28));
    return c;
  }
  SP.dogSmall = function (sp, dir, frame) {
    const key = 'ow-dog-' + sp.id + '-' + dir + '-' + frame;
    if (owCache.has(key)) return owCache.get(key);
    const [c, x] = mkc(16, 32);
    x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, 16, 32);
    // Frente/costas possuem desenho próprio; laterais preservam o perfil de cada espécie.
    if (dir === 'down' || dir === 'up') x.drawImage(dogFrontBack(sp, dir, frame), 0, 8);
    else x.drawImage(dogSmallBase(sp, dir, frame), 0, 8);
    owCache.set(key, c);
    return c;
  };
  const owCache = new Map();
  const walkDirs = ['down', 'up', 'left', 'right'];
  const walkFrames = [0, 1, 2];
  function makeWalkSheet(drawFrame, look) {
    const [sheet, sx] = mkc(48, 128);
    sx.imageSmoothingEnabled = false;
    walkDirs.forEach((dir, row) => walkFrames.forEach((frame, col) => {
      sx.drawImage(drawFrame(look, dir, frame), col * 16, row * 32);
    }));
    return sheet;
  }
  SP.personWalkSheet = function (look) { return makeWalkSheet((p, d, f) => SP.person(p, d, f), look); };
  SP.dogWalkSheet = function (species) { return makeWalkSheet((p, d, f) => SP.dogSmall(p, d, f), species); };
})(window.MD);
