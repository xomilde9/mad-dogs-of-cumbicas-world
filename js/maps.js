'use strict';
// ================= MAPAS: um único mundo conectado — CUMBICA, Guarulhos/SP (versão compactada p/ gameplay) =================
// Os ginásios e personagens são adaptações FICTÍCIAS. Base Aérea e Aeroporto: apenas fachada/cerca, sem acesso público.
(function (M) {
  const SP = M.spr, T = 16, MAPS = M.maps = {};
  const P = M.places = { gyms: [], labels: [] };
  class MapDef {
    constructor(id, name, w, h, o = {}) {
      Object.assign(this, { id, name, w, h, music: 'cumbica', bg: 'rua', banner: true, indoor: false }, o);
      this.g = new Array(w * h).fill('grass'); this.sol = new Uint8Array(w * h); this.items = []; this.warps = {}; this.zones = []; this.inter = {}; this.dyn = []; this.canvas = null;
    }
    i(x, y) { return y * this.w + x; }
    inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    fill(n, x, y, w, h) { for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) if (this.inb(k, j)) { this.g[this.i(k, j)] = n; this.sol[this.i(k, j)] = SP.solidGround.has(n) ? 1 : 0; } }
    block(x, y, w = 1, h = 1, v = 1) { for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) if (this.inb(k, j)) this.sol[this.i(k, j)] = v; }
    obj(n, x, y) { const d = SP.objs[n]; this.items.push({ n, x, y, w: d.w, h: d.h }); if (d.solid) this.block(x, y, d.w, d.h); }
    tree(x, y) { this.obj('tree', x, y); }
    bld(x, y, w, h, st, dx, o) { this.items.push({ b: SP.building(w, h, st, dx, o), x, y, w, h }); this.block(x, y, w, h); return [x + dx, y + h - 1]; }
    warp(x, y, to, tx, ty, dir = 'up', o = {}) { this.warps[this.i(x, y)] = Object.assign({ to, tx, ty, dir }, o); if (this.g[this.i(x, y)] !== 'mat' && !SP.solidGround.has(this.g[this.i(x, y)])) this.sol[this.i(x, y)] = 0; }
    zone(x, y, w, h, name, enc, bg) { this.zones.push({ x, y, w, h, name, enc, bg }); }
    say(x, y, fn) { this.inter[this.i(x, y)] = fn; }
    sign(x, y, text) { this.obj('sign', x, y); this.say(x, y, text); }
    free(x, y, w, h) { for (let j = y; j < y + h; j++) for (let k = x; k < x + w; k++) if (!this.inb(k, j) || this.g[this.i(k, j)] !== 'grass' || this.sol[this.i(k, j)]) return false; return true; }
    zoneAt(x, y) { for (let k = this.zones.length - 1; k >= 0; k--) { const z = this.zones[k]; if (x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h) return z; } return { name: this.name, enc: this.enc || null, bg: this.bg }; }
    render() {
      if (this.canvas) return this.canvas;
      const c = M.mk(this.w * T, this.h * T), x = M.cx(c);
      // Microdetalhes determinísticos: enriquecem o terreno sem mudar colisões ou escala dos tiles.
      const hash = (a, b, s) => { let v = (a * 374761393 + b * 668265263 + s * 1442695041) | 0; v = Math.imul(v ^ (v >>> 13), 1274126177); return (v ^ (v >>> 16)) >>> 0; };
      for (let j = 0; j < this.h; j++) for (let k = 0; k < this.w; k++) {
        let n = this.g[this.i(k, j)]; const ox = k * T, oy = j * T;
        const t = n === 'grass' ? SP.tiles['grass' + ((k * 7 + j * 13 + (k * j)) % 3)] : SP.tiles[n]; x.drawImage(t, ox, oy);
        const dot = (seed, px, py, color, w = 1, h = 1) => { x.fillStyle = color; x.fillRect(ox + px, oy + py, w, h); };
        const r1 = hash(k, j, 1), r2 = hash(k, j, 2), r3 = hash(k, j, 3), r4 = hash(k, j, 4);
        if (n === 'grass') {
          dot(r1, 2 + r1 % 12, 2 + (r1 >>> 5) % 11, '#83cc78');
          dot(r2, 2 + r2 % 12, 2 + (r2 >>> 6) % 11, '#438d4b');
          if ((r3 % 4) === 0) { const px = 3 + r3 % 10, py = 4 + (r3 >>> 4) % 8; dot(r3, px, py, '#347f42'); dot(r3, px + 1, py - 1, '#a0d77c'); }
        } else if (n === 'dirt' || n === 'gravel') {
          dot(r1, 1 + r1 % 13, 2 + (r1 >>> 5) % 12, n === 'dirt' ? '#e0c18c' : '#c4bbac', 2, 1);
          dot(r2, 1 + r2 % 13, 2 + (r2 >>> 5) % 12, n === 'dirt' ? '#a98150' : '#81796f');
          if ((r3 % 3) === 0) dot(r3, 3 + r3 % 10, 3 + (r3 >>> 4) % 10, '#ead2a5');
        } else if (n === 'walk' || n === 'concrete') {
          dot(r1, 2 + r1 % 11, 2 + (r1 >>> 5) % 11, '#f0eadb');
          dot(r2, 2 + r2 % 11, 2 + (r2 >>> 5) % 11, n === 'walk' ? '#aaa596' : '#777d88');
          if ((r3 % 5) === 0) dot(r3, 4 + r3 % 8, 4 + (r3 >>> 4) % 8, '#b8b4aa', 2, 1);
        } else if (n === 'road' || n === 'roadH' || n === 'roadV') {
          if ((r1 % 3) === 0) dot(r1, 2 + r1 % 12, 2 + (r1 >>> 5) % 12, '#747985');
          if ((r2 % 4) === 0) dot(r2, 2 + r2 % 12, 2 + (r2 >>> 5) % 12, '#484d59', 2, 1);
        } else if (n === 'water') {
          if ((r1 % 3) === 0) { const px = 2 + r1 % 10, py = 3 + (r1 >>> 5) % 11; dot(r1, px, py, '#8bc5f2', 3, 1); dot(r1, px + 1, py + 1, '#2e70bb', 2, 1); }
          const nw = (a, b) => this.inb(a, b) && this.g[this.i(a, b)] === 'water';
          x.fillStyle = '#1d4f9a'; if (!nw(k, j - 1)) x.fillRect(ox, oy, T, 2); if (!nw(k, j + 1)) x.fillRect(ox, oy + T - 2, T, 2); if (!nw(k - 1, j)) x.fillRect(ox, oy, 2, T); if (!nw(k + 1, j)) x.fillRect(ox + T - 2, oy, 2, T);
        } else if (n === 'wood') {
          dot(r1, 2 + r1 % 11, 3 + (r1 >>> 5) % 10, '#edc17b', 2, 1);
          dot(r2, 2 + r2 % 11, 4 + (r2 >>> 5) % 9, '#986638');
        }
      }
      // Bordas orgânicas entre terrenos: transições em pixel art, sem alterar tiles ou colisões.
      const groundAt = (a, b) => this.inb(a, b) ? this.g[this.i(a, b)] : 'void';
      for (let j = 0; j < this.h; j++) for (let k = 0; k < this.w; k++) {
        const n = groundAt(k, j), ox = k * T, oy = j * T;
        const edge = (px, py, color, w = 1, h = 1) => { x.fillStyle = color; x.fillRect(ox + px, oy + py, w, h); };
        const around = [[0,-1],[1,0],[0,1],[-1,0]];
        if (n === 'grass') {
          for (let d = 0; d < 4; d++) {
            const [dx,dy] = around[d], other = groundAt(k + dx, j + dy);
            if (other === 'dirt' || other === 'gravel') {
              const seed = hash(k, j, 20 + d), p = 2 + seed % 10;
              if (d === 0 || d === 2) {
                const yy = d === 0 ? 0 : 15;
                edge(p, yy, '#3d8747', 2, 1); edge(p + 1, yy + (d === 0 ? 1 : -1), '#a0d77c', 1, 1);
                edge((p + 6) % 13 + 1, yy, '#5da95b', 1, 1);
              } else {
                const xx = d === 3 ? 0 : 15;
                edge(xx, p, '#3d8747', 1, 2); edge(xx + (d === 3 ? 1 : -1), p + 1, '#a0d77c', 1, 1);
              }
            }
          }
        } else if (n === 'water') {
          for (let d = 0; d < 4; d++) {
            const [dx,dy] = around[d], other = groundAt(k + dx, j + dy);
            if (other !== 'water') {
              const seed = hash(k, j, 40 + d), p = 2 + seed % 9;
              x.fillStyle = '#a8d9f4';
              if (d === 0) { x.fillRect(ox + p, oy, 4, 1); x.fillRect(ox + p + 1, oy + 1, 2, 1); }
              if (d === 2) { x.fillRect(ox + p, oy + 15, 4, 1); x.fillRect(ox + p + 1, oy + 14, 2, 1); }
              if (d === 3) { x.fillRect(ox, oy + p, 1, 4); x.fillRect(ox + 1, oy + p + 1, 1, 2); }
              if (d === 1) { x.fillRect(ox + 15, oy + p, 1, 4); x.fillRect(ox + 14, oy + p + 1, 1, 2); }
              x.fillStyle = '#3977b8';
              if (d === 0) x.fillRect(ox + p + 4, oy + 1, 2, 1);
              if (d === 2) x.fillRect(ox + p + 4, oy + 14, 2, 1);
            }
          }
        } else if (n === 'dirt') {
          for (let d = 0; d < 4; d++) {
            const [dx,dy] = around[d], other = groundAt(k + dx, j + dy);
            if (other === 'grass') {
              const seed = hash(k, j, 60 + d), p = 2 + seed % 10;
              if (d === 0 || d === 2) {
                const yy = d === 0 ? 0 : 15;
                edge(p, yy, '#b18a55', 3, 1);
                edge(p + 1, yy + (d === 0 ? 1 : -1), '#d8bd8a', 2, 1);
              } else {
                const xx = d === 3 ? 0 : 15;
                edge(xx, p, '#b18a55', 1, 3);
                edge(xx + (d === 3 ? 1 : -1), p + 1, '#d8bd8a', 1, 2);
              }
            }
          }
        }
      }
      this.items.slice().sort((a, b) => (a.y + a.h) - (b.y + b.h)).forEach(it => { x.drawImage(it.b || SP.objs[it.n].c, it.x * T, it.y * T); });
      this.canvas = c; return c;
    }
  }
  M.MapDef = MapDef;
  const add = (m) => (MAPS[m.id] = m);
  const nb = (f) => f.badges || 0;

  // ===================== MUNDO: CUMBICA (104 x 96) =====================
  (() => {
    const W = 104, H = 96, m = add(new MapDef('cumbica', 'Cumbica', W, H, { music: 'cumbica', bg: 'rua' }));
    const rnd = M.seed(20261123);
    const line = (n, x1, y1, x2, y2, gap) => { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (!gap || !gap(x, y)) m.fill(n, x, y, 1, 1); };
    const fenceRect = (x, y, w, h, gaps = [], n = 'fence') => {
      m.fill(n, x, y, w, 1); m.fill(n, x, y + h - 1, w, 1); m.fill(n, x, y, 1, h); m.fill(n, x + w - 1, y, 1, h);
      gaps.forEach(([gx, gy]) => m.fill('walk', gx, gy, 1, 1));
    };
    const gate = (x, y, w, h, need, msg) => {
      for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) m.dyn.push({ n: 'cone', x: x + k, y: y + j, show: f => nb(f) < need, solid: f => nb(f) < need, msg });
    };
    const rowHouses = (x0, x1, y, styles, wk) => {
      let x = x0, i = 0;
      while (x + 5 <= x1 + 1) { const d = m.bld(x, y, 5, 4, styles[i % styles.length], i % 2 ? 1 : 2); m.say(d[0], d[1], 'Ninguém atende. Tá trancado.'); x += 6; i++; }
      if (wk) m.fill('walk', x0, y + 4, x1 - x0 + 1, 1);
    };
    const scatter = (x, y, w, h, n) => { for (let t = 0; t < n * 8 && n > 0; t++) { const tx = x + Math.floor(rnd() * (w - 1)), ty = y + Math.floor(rnd() * (h - 1)); if (m.free(tx, ty, 2, 2)) { m.tree(tx, ty); n--; } } };
    const ST = ['orange', 'yellow', 'purple', 'brick'];

    // ---- avenidas, ruas e calçadas ----
    line('walk', 48, 0, 49, 95); line('walk', 53, 0, 54, 95); line('walk', 0, 36, 103, 37); line('walk', 0, 41, 103, 42);
    line('walk', 76, 14, 77, 95); line('walk', 81, 14, 82, 95); line('walk', 12, 59, 49, 59); line('walk', 12, 62, 49, 62); line('walk', 0, 73, 103, 73); line('walk', 0, 76, 103, 76);
    line('road', 50, 0, 52, 95); line('road', 0, 38, 103, 40); line('road', 78, 14, 80, 95); line('road', 12, 60, 49, 61); line('road', 0, 74, 103, 75);
    for (let y = 0; y < H; y++) { if (y < 38 || y > 40 && !(y >= 74 && y <= 75)) m.fill('roadV', 51, y, 1, 1); if (y >= 14 && !(y >= 38 && y <= 40) && !(y >= 74 && y <= 75)) m.fill('roadV', 79, y, 1, 1); }
    for (let x = 0; x < W; x++) if (!(x >= 50 && x <= 52) && !(x >= 78 && x <= 80)) m.fill('roadH', x, 39, 1, 1);
    // cones nas pontas das vias
    for (const [x, y] of [[50, 0], [51, 0], [52, 0], [50, 95], [51, 95], [52, 95], [0, 38], [0, 39], [0, 40], [103, 38], [103, 39], [103, 40], [0, 74], [0, 75], [103, 74], [103, 75], [78, 95], [79, 95], [80, 95]]) m.obj('cone', x, y);

    // Karaokê fictício na área comercial: fachada e entrada para a cena especial.
    d = m.bld(2, 64, 8, 4, 'purple', 2, { awning: true }); m.warp(d[0], d[1], 'karaoke', 7, 10, 'up');
    m.fill('walk', 2, 68, 8, 2); m.sign(3, 69, 'KARAOKÊ CUMBICA — música alta, segredos mais altos ainda.');

    // ---- BARREIRAS (liberam conforme as insígnias) ----
    line('chain', 22, 2, 22, 53, (x, y) => y >= 36 && y <= 42); gate(22, 36, 1, 7, 1, 'O acesso ao Jardim Cumbica é pra quem já tem 1 insígnia.');
    line('chain', 23, 29, 47, 29, (x) => x === 40 || x === 41); m.fill('walk', 40, 29, 2, 1); gate(40, 29, 2, 1, 1, 'A trilha do Bosque dos Sapos só abre pra quem tem 1 insígnia.');
    line('chain', 47, 2, 47, 28);
    line('chain', 2, 53, 21, 53);
    line('chain', 24, 54, 24, 95, (x, y) => (y >= 59 && y <= 62) || (y >= 73 && y <= 76)); gate(24, 59, 1, 4, 4, 'A região dos Grafites é pra quem tem 4 insígnias.'); gate(24, 73, 1, 4, 4, 'A região dos Grafites é pra quem tem 4 insígnias.');
    line('chain', 55, 29, 55, 72, (x, y) => y >= 36 && y <= 42); gate(55, 36, 1, 7, 2, 'Leste da Monteiro Lobato: volte com 2 insígnias.');
    line('chain', 55, 2, 55, 28);
    line('chain', 55, 29, 82, 29, (x) => x >= 76 && x <= 82); m.fill('walk', 76, 29, 7, 1); gate(76, 29, 7, 1, 7, 'A estrada da Base Aérea é pra quem tem 7 insígnias.');
    line('chain', 55, 73, 55, 95, (x, y) => y >= 73 && y <= 76); gate(55, 73, 1, 4, 5, 'A Cidade Industrial Satélite é pra quem tem 5 insígnias.');
    line('chain', 83, 2, 83, 95, (x, y) => (y >= 36 && y <= 42) || (y >= 73 && y <= 76)); gate(83, 36, 1, 7, 6, 'O lado do aeroporto é pra quem tem 6 insígnias.'); gate(83, 73, 1, 4, 6, 'O lado do aeroporto é pra quem tem 6 insígnias.');

    // ================= REGIÃO INICIAL: Vila Nova/Jardim Cumbica (centro-oeste) =================
    rowHouses(24, 34, 32, ST, false);
    let d = m.bld(36, 32, 5, 4, 'orange', 2); m.warp(d[0], d[1], 'casa_gabe', 5, 6, 'up'); P.casa = d;
    d = m.bld(42, 32, 6, 4, 'grey', 2, { garage: true }); m.warp(d[0], d[1], 'oficina', 6, 7, 'up'); m.warp(d[0] + 1, d[1], 'oficina', 6, 7, 'up'); P.oficina = d;
    m.sign(43, 36, 'OFICINA DO ZÉ — Mecânica, solda e consultoria canina.'); m.sign(35, 36, 'Casa da Gabe.');
    rowHouses(24, 34, 44, ST.slice(1), true);
    m.sign(53, 43, 'Cruzamento: AV. SANTOS DUMONT × AV. MONTEIRO LOBATO.'); m.sign(47, 43, 'AV. MONTEIRO LOBATO →  Aeroporto e Base Aérea ao norte.');
    for (const [x, y] of [[48, 34], [54, 34], [48, 43], [54, 44], [34, 34], [20, 34], [66, 34]]) m.obj('poste', x, y);
    m.obj('busstop', 30, 41); m.say(31, 42, 'Ponto de ônibus. Uma tia diz: "O 2022 só passa quando você não precisa dele."');
    // Base dos Mad Dogs
    d = m.bld(26, 50, 6, 4, 'rust', 2); m.warp(d[0], d[1], 'base', 6, 7, 'up'); P.base = d; m.fill('walk', 26, 54, 7, 1); m.obj('banner', 25, 51); m.obj('banner', 32, 51);
    // Praça Cummins (Ginásio 1)
    fenceRect(35, 43, 13, 16, [[40, 43], [41, 43], [40, 58], [41, 58]]);
    m.fill('dirt', 36, 44, 11, 14); m.fill('walk', 40, 44, 2, 1); m.fill('walk', 38, 49, 7, 1); m.fill('walk', 40, 57, 2, 1);
    d = m.bld(38, 45, 6, 4, 'blue', 2); P.gyms[1] = { name: 'Praça Cummins', door: d, front: [d[0], d[1] + 1] }; m.warp(d[0], d[1], 'gym1', 7, 10, 'up', { badges: 0 });
    m.obj('banner', 37, 46); m.obj('banner', 44, 46); m.sign(39, 49, 'GINÁSIO 1 — Praça Cummins (adaptação fictícia). Velocidade e esquiva. Líder: Rafa Zigue-Zague.');
    for (const [x, y] of [[37, 52], [40, 53], [43, 52], [38, 55], [44, 55], [41, 55]]) m.obj('cone', x, y);
    for (const [x, y] of [[41, 51], [36, 54], [45, 53], [39, 51]]) m.obj('hurdle', x, y);
    m.fill('tall', 45, 50, 2, 7); m.fill('tall', 36, 56, 2, 2); m.fill('tall', 36, 50, 1, 2);
    m.obj('lamp', 46, 44); m.obj('bench', 42, 57); m.obj('lamp', 36, 44);
    m.zone(35, 43, 13, 16, 'Praça Cummins', 'praca', 'praca');
    // Comércio da Rua Capitão Aviador Walter Ribeiro
    d = m.bld(26, 55, 7, 4, 'blue', 3, { awning: true }); m.warp(d[0], d[1], 'mercado', 6, 7, 'up'); P.mercado = d;
    for (const [x, st] of [[12, 'yellow'], [18, 'purple']]) { const dd = m.bld(x, 55, 5, 4, st, 2, { awning: true }); m.say(dd[0], dd[1], 'Loja fechada pro almoço. Volta mais tarde.'); }
    rowHouses(2, 10, 55, ST, false); m.fill('walk', 2, 59, 10, 1);
    for (const [x, st] of [[25, 'brick'], [30, 'yellow']]) { const dd = m.bld(x, 64, 5, 4, st, 2, { awning: st === 'yellow' }); m.say(dd[0], dd[1], 'Padaria e lanchonete. Fechada.'); }
    m.fill('walk', 25, 63, 23, 1); m.fill('walk', 25, 68, 10, 1);
    m.sign(36, 59, 'RUA CAP. AVIADOR WALTER RIBEIRO — comércio do bairro.'); m.obj('poste', 34, 57); m.obj('poste', 11, 57);
    // Praça Benjamim de Godoy Lopes
    fenceRect(36, 64, 12, 9, [[40, 64], [41, 64], [40, 72], [41, 72]]);
    m.fill('dirt', 37, 65, 10, 7); m.fill('walk', 40, 65, 2, 1); m.fill('water', 40, 68, 4, 2); m.fill('tall', 37, 66, 2, 5); m.fill('tall', 44, 66, 3, 5);
    m.obj('statue', 38, 70); m.obj('bench', 44, 71); m.obj('bush', 46, 71); m.say(46, 71, '@moita_benjamim'); m.obj('lamp', 39, 66);
    m.zone(36, 64, 12, 9, 'Praça Benjamim de Godoy Lopes', 'praca2', 'praca');
    // Cidade Jardim Cumbica (sul)
    rowHouses(26, 46, 79, ST, true); rowHouses(26, 46, 86, ST.slice(2), true);
    m.fill('tall', 26, 91, 20, 2); m.obj('trash', 47, 83); m.sign(47, 78, 'CIDADE JARDIM CUMBICA — Estrada Velha Guarulhos–São Miguel ao norte.');
    m.zone(25, 77, 22, 17, 'Cidade Jardim Cumbica', 'cidade', 'rua');

    // ================= NOROESTE: Jardim Cumbica e CEU =================
    rowHouses(2, 20, 32, ST, false); rowHouses(2, 20, 44, ST.slice(1), true);
    m.fill('tall', 3, 49, 18, 4); m.obj('crate', 8, 49); m.obj('tires', 14, 49);
    m.zone(2, 30, 20, 23, 'Jardim Cumbica', 'terreno', 'rua');
    m.fill('walk', 11, 17, 2, 19); m.fill('court', 4, 20, 16, 11); m.fill('walk', 11, 20, 2, 11);
    fenceRect(3, 19, 18, 13, [[11, 19], [12, 19], [11, 31], [12, 31]]);
    d = m.bld(8, 12, 9, 5, 'blue', 4); P.gyms[2] = { name: 'CEU Jardim Cumbica', door: d, front: [d[0], d[1] + 1] }; m.warp(d[0], d[1], 'gym2', 7, 10, 'up', { badges: 1 });
    m.obj('banner', 6, 14); m.obj('banner', 18, 14); m.sign(10, 17, 'GINÁSIO 2 — CEU Jardim Cumbica (adaptação fictícia). Estratégia. Líder: Profª Ludmila.');
    for (const [x, y] of [[5, 21], [17, 21], [5, 29], [17, 29]]) m.obj('hurdle', x, y);
    m.fill('tall', 4, 3, 6, 7); m.fill('tall', 14, 3, 7, 7); m.fill('tall', 3, 12, 3, 5); m.fill('tall', 19, 12, 2, 5);
    m.zone(3, 2, 19, 34, 'CEU Jardim Cumbica', 'ceu', 'campo');
    scatter(2, 2, 20, 10, 10); scatter(2, 13, 20, 4, 3);

    // ================= BOSQUE DOS SAPOS =================
    m.fill('dirt', 40, 16, 2, 13); m.fill('dirt', 38, 16, 6, 1);
    m.fill('water', 32, 9, 9, 6); m.fill('water', 34, 15, 4, 1);
    for (const [x, y] of [[31, 10], [41, 10], [31, 13], [41, 13], [36, 8]]) m.obj('sapo', x, y);
    m.sign(39, 17, 'BOSQUE DOS SAPOS — "Respeite o sapo". Trilha liberada.');
    m.fill('tall', 25, 3, 7, 6); m.fill('tall', 36, 3, 10, 4); m.fill('tall', 25, 17, 6, 10); m.fill('tall', 34, 19, 5, 8); m.fill('tall', 43, 18, 3, 9);
    m.obj('hole', 27, 13); m.say(27, 13, '@buraco_sapo'); m.obj('bush', 45, 26); m.say(45, 26, '@moita_bosque'); m.obj('box', 25, 28); m.say(25, 28, '@achado_bosque');
    m.zone(23, 2, 24, 27, 'Bosque dos Sapos', 'bosque', 'campo');
    scatter(23, 2, 24, 27, 70);

    // ================= CAMINHO DOS GRAFITES CODAJAS (sudoeste) =================
    m.fill('concrete', 2, 63, 22, 10); m.fill('dirt', 6, 70, 12, 3); m.fill('walk', 11, 63, 3, 1);
    for (const [x, n] of [[2, 'muro'], [5, 'graf'], [8, 'muro'], [14, 'muro'], [17, 'graf'], [20, 'muro']]) m.obj(n, x, 63); m.obj('crate', 23, 63); m.obj('crate', 23, 64);
    d = m.bld(14, 65, 7, 4, 'rust', 3); P.gyms[5] = { name: 'Caminho dos Grafites Codajas', door: d, front: [d[0], d[1] + 1] }; m.warp(d[0], d[1], 'gym5', 7, 10, 'up', { badges: 4 });
    m.obj('banner', 13, 66); m.obj('banner', 21, 66); m.sign(16, 69, 'GINÁSIO 5 — Caminho dos Grafites Codajas (adaptação fictícia). Caos criativo. Líder: MC Spray.');
    m.obj('graf', 2, 65); m.obj('grafCol', 2, 67); m.obj('graf', 2, 69); m.obj('muro', 6, 66); m.obj('muro', 9, 68); m.obj('graf', 6, 70);
    m.obj('box', 11, 66); m.obj('tires', 20, 70); m.obj('trash', 12, 71); m.say(12, 71, '@achado_grafite'); m.obj('barrel', 22, 71);
    m.fill('tall', 8, 65, 4, 2); m.fill('tall', 15, 70, 4, 2);
    m.say(5, 64, '@grafite_codajas'); m.say(6, 64, '@grafite_codajas');
    m.zone(2, 63, 22, 10, 'Caminho dos Grafites Codajas', 'grafites', 'viela');

    // ================= LESTE 1: Monteiro Lobato × Papa João Paulo I =================
    m.fill('walk', 56, 43, 2, 30);
    // Praça Sargento Amarildo Luís de Oliveira
    fenceRect(58, 30, 17, 6, [[65, 35], [66, 35]]); m.fill('dirt', 59, 31, 15, 4); m.fill('walk', 65, 35, 2, 1);
    m.obj('statue', 65, 32); m.obj('bench', 61, 33); m.obj('bench', 69, 33); m.tree(60, 31); m.tree(71, 31); m.fill('flowers', 63, 34, 1, 1); m.fill('flowers', 68, 34, 1, 1);
    m.obj('box', 73, 34); m.say(73, 34, '@achado_amarildo'); m.say(65, 33, 'Monumento à memória do Sargento Amarildo. Uma placa: "Cumbica não esquece quem cuida dela."'); m.say(66, 33, 'Monumento à memória do Sargento Amarildo. Uma placa: "Cumbica não esquece quem cuida dela."');
    m.zone(58, 30, 17, 6, 'Praça Sargento Amarildo Luís de Oliveira', 'amarildo', 'praca');
    // Arena Farias (Parque Uirapuru) — Ginásio 3
    fenceRect(58, 43, 17, 20, [[62, 43], [63, 43], [58, 50], [58, 51]]); m.fill('walk', 62, 43, 2, 1); m.fill('pitch', 60, 51, 13, 10); m.fill('walk', 59, 44, 14, 1); m.fill('walk', 60, 48, 13, 1);
    d = m.bld(64, 44, 8, 4, 'green', 3); P.gyms[3] = { name: 'Arena Farias', door: d, front: [d[0], d[1] + 1] }; m.warp(d[0], d[1], 'gym3', 7, 10, 'up', { badges: 2 });
    m.obj('banner', 62, 45); m.obj('banner', 73, 45); m.sign(66, 49, 'GINÁSIO 3 — Arena Farias, Parque Uirapuru (adaptação fictícia). Força e resistência. Líder: Tonho Pitbull.');
    m.obj('poste', 59, 55); m.obj('poste', 73, 55); m.obj('bench', 64, 49); m.fill('tall', 60, 49, 2, 2); m.fill('tall', 71, 49, 2, 2); m.obj('barrel', 60, 61); m.obj('lamp', 73, 51);
    m.zone(58, 43, 17, 20, 'Arena Farias — Parque Uirapuru', 'arena', 'campo');
    // Praça Vicente Ferreira Campos — Ginásio 4
    fenceRect(58, 64, 17, 9, [[58, 67], [58, 68], [66, 72]]); m.fill('walk', 56, 63, 22, 1); m.fill('dirt', 59, 65, 15, 7); m.fill('walk', 62, 69, 10, 1); m.fill('water', 60, 70, 3, 2);
    d = m.bld(64, 65, 7, 4, 'yellow', 3); P.gyms[4] = { name: 'Praça Vicente Ferreira Campos', door: d, front: [d[0], d[1] + 1] }; m.warp(d[0], d[1], 'gym4', 7, 10, 'up', { badges: 3 });
    m.obj('banner', 63, 66); m.obj('banner', 71, 66); m.sign(66, 70, 'GINÁSIO 4 — Praça Vicente Ferreira Campos (adaptação fictícia). Defesa territorial. Líder: Seu Osvaldo.');
    for (const [x, y] of [[60, 66], [72, 66], [60, 68], [72, 68], [68, 71]]) m.obj('crate', x, y); m.obj('lamp', 59, 70); m.obj('lamp', 73, 70);
    m.zone(58, 64, 17, 9, 'Praça Vicente Ferreira Campos', 'praca4', 'praca');
    m.obj('busstop', 66, 41); m.obj('poste', 75, 43); m.sign(75, 36, 'AV. PAPA JOÃO PAULO I — segue pro norte até a Base Aérea.');
    m.zone(56, 30, 27, 43, 'Av. Papa João Paulo I', null, 'rua');
    m.zone(58, 30, 17, 6, 'Praça Sargento Amarildo Luís de Oliveira', 'amarildo', 'praca'); m.zone(58, 43, 17, 20, 'Arena Farias — Parque Uirapuru', 'arena', 'campo'); m.zone(58, 64, 17, 9, 'Praça Vicente Ferreira Campos', 'praca4', 'praca');

    // ================= SUL: Cidade Industrial Satélite =================
    m.fill('concrete', 56, 77, 27, 18); m.fill('gravel', 56, 92, 22, 2); m.fill('walk', 58, 84, 10, 1);
    d = m.bld(58, 79, 10, 5, 'purple', 4, { corrugated: true }); P.gyms[6] = { name: 'Cidade Industrial Satélite', door: d, front: [d[0], d[1] + 1] }; m.warp(d[0], d[1], 'gym6', 7, 10, 'up', { badges: 5 });
    m.obj('flag', 57, 81); m.obj('flag', 68, 81); m.sign(61, 84, 'GINÁSIO 6 — Complexo Industrial fictício (CIS). Ataques pesados. Líder: Mestre Betoneira.');
    d = m.bld(70, 79, 6, 5, 'grey', 2, { garage: true }); m.say(d[0], d[1], 'Galpão logístico. Só funcionário.');
    d = m.bld(60, 87, 10, 5, 'rust', 4, { corrugated: true }); m.warp(d[0], d[1], 'galpao', 7, 9, 'up', { need: 'chave', msg: 'Galpão Abandonado. Trancado com cadeado preto: precisa da Chave do Galpão.' }); P.galpao = d;
    d = m.bld(71, 87, 5, 5, 'grey', 2, { corrugated: true }); m.say(d[0], d[1], 'Galpão logístico. Só funcionário.');
    m.obj('container', 58, 85); m.obj('containerB', 61, 85); m.obj('container', 64, 85); m.obj('tank', 70, 85); m.obj('tank', 73, 85); m.obj('carY', 56, 89); m.obj('barrel', 74, 78); m.obj('tires', 57, 93);
    m.obj('pallet', 75, 93); m.say(75, 93, '@achado_peca'); m.obj('cone', 66, 92); m.obj('cone', 69, 92);
    m.fill('tall', 56, 87, 3, 5); m.fill('tall', 70, 92, 6, 2); m.fill('tall', 76, 86, 1, 6);
    m.zone(56, 77, 27, 18, 'Cidade Industrial Satélite', 'industrial', 'industrial');
    m.sign(57, 77, 'ESTRADA VELHA GUARULHOS–SÃO MIGUEL — seguindo a leste.');

    // ================= NORDESTE: Base Aérea (só fachada/cerca) =================
    m.fill('concrete', 56, 2, 27, 26); m.fill('runway', 56, 9, 22, 4); m.fill('walk', 58, 25, 20, 3); m.fill('tall', 57, 15, 5, 5); m.fill('tall', 72, 15, 5, 4);
    line('chain', 56, 14, 82, 14);
    d = m.bld(58, 3, 10, 6, 'grey', 4, { garage: true, corrugated: true }); m.say(d[0], d[1], 'Hangar da Base. Área restrita.');
    d = m.bld(70, 3, 8, 6, 'grey', 2, { garage: true }); m.say(d[0], d[1], 'Hangar da Base. Área restrita.');
    m.obj('plane', 59, 9); m.obj('plane', 68, 10);
    m.sign(66, 15, 'BASE AÉREA DE SÃO PAULO — ÁREA MILITAR RESTRITA. ACESSO PROIBIDO A CIVIS.'); m.sign(78, 15, 'ÁREA MILITAR RESTRITA. Meia-volta, volver.');
    d = m.bld(62, 20, 9, 5, 'purple', 4); P.gyms[8] = { name: 'Região da Base Aérea', door: d, front: [d[0], d[1] + 1] }; m.warp(d[0], d[1], 'gym8', 7, 10, 'up', { badges: 7 });
    m.obj('banner', 60, 21); m.obj('banner', 71, 20); m.sign(64, 25, 'GINÁSIO 8 — Arena Aeronáutica (fictícia, fora da área militar). Elite. Líder: Cmte. Aurora.');
    d = m.bld(72, 20, 4, 5, 'blue', 1); P.champion = d; m.warp(d[0], d[1], 'campeao', 7, 10, 'up', { badges: 8, msg: 'Salão do Campeão. Só quem tem as 8 insígnias de Cumbica entra.' });
    m.obj('statue', 59, 16); m.say(59, 17, 'Memorial aeronáutico (fictício): um cachorro de ouro olhando pro céu.'); m.say(60, 17, 'Memorial aeronáutico (fictício): um cachorro de ouro olhando pro céu.');
    m.zone(56, 2, 27, 26, 'Região da Base Aérea', 'base', 'industrial');

    // ================= LESTE 2: Santos Dumont, Aeroporto e Vila Nova Cumbica =================
    m.fill('concrete', 84, 2, 19, 26); m.fill('runway', 84, 15, 19, 12);
    d = m.bld(86, 8, 14, 6, 'grey', 6, { garage: true }); m.say(d[0], d[1], 'Terminal do Aeroporto Internacional de Guarulhos. Área restrita.');
    m.obj('plane', 88, 17); m.obj('plane', 95, 21); line('chain', 84, 28, 102, 28);
    m.sign(93, 29, 'AEROPORTO INTERNACIONAL DE GUARULHOS — acesso restrito a passageiros e funcionários.');
    m.zone(84, 2, 19, 27, 'Aeroporto Internacional de Guarulhos (restrito)', null, 'industrial');
    d = m.bld(88, 32, 8, 4, 'grey', 3);
    m.obj('banner', 86, 33); m.obj('banner', 97, 33);
    P.gyms[7] = { name: 'Av. Santos Dumont', door: d, front: [d[0], d[1] + 1] }; m.warp(d[0], d[1], 'gym7', 7, 10, 'up', { badges: 6 });
    m.sign(92, 36, 'GINÁSIO 7 — Circuito da Av. Santos Dumont (adaptação fictícia). Velocidade e precisão. Líder: Cap. Tânia Turbo.');
    for (let x = 85; x <= 101; x += 4) { m.obj('cone', x, 43); m.obj('hurdle', x + 2, 43); }
    m.obj('busstop', 92, 41); m.obj('carR', 98, 30); m.obj('poste', 84, 34); m.obj('poste', 101, 34);
    m.zone(84, 29, 19, 14, 'Av. Santos Dumont — Circuito', 'vila', 'rua');
    rowHouses(84, 101, 45, ST, true); rowHouses(84, 101, 52, ST.slice(1), true);
    m.fill('pitch', 87, 59, 11, 10); m.obj('poste', 86, 63); m.obj('poste', 98, 63); m.fill('tall', 84, 59, 2, 12); m.fill('tall', 99, 59, 3, 12); m.fill('tall', 87, 70, 14, 2);
    m.obj('box', 100, 69); m.say(100, 69, '@achado_vila'); m.sign(85, 58, 'CAMPINHO DA VILA NOVA CUMBICA. Proibido pisar na grama (mas todo mundo pisa).');
    m.zone(84, 43, 19, 30, 'Vila Nova Cumbica', 'vila', 'rua');

    // ---- bordas de árvores do mapa ----
    for (let x = 0; x < W; x += 2) { if (!(x >= 48 && x <= 54)) m.tree(x, 0); if (!(x >= 48 && x <= 54) && !(x >= 76 && x <= 82)) m.tree(x, 94); }
    for (let y = 2; y < H - 2; y += 2) { if (!(y >= 36 && y <= 42) && !(y >= 72 && y <= 76)) { m.tree(0, y); m.tree(102, y); } }
    scatter(25, 30, 22, 3, 3); scatter(25, 49, 9, 5, 3); scatter(2, 74, 20, 21, 6); scatter(26, 94, 20, 1, 0); scatter(2, 78, 22, 16, 8);
    scatter(76, 77, 6, 16, 0); scatter(84, 72, 18, 22, 10); scatter(84, 30, 18, 5, 2);
    // etiquetas do mapa geral
    P.labels = [['Av. Santos Dumont', 12, 39], ['Av. Monteiro Lobato', 51, 8], ['Av. Papa João Paulo I', 79, 55], ['Estrada Velha Guarulhos–S. Miguel', 14, 75], ['R. Cap. Av. Walter Ribeiro', 22, 60]];
    m.start = [38, 36];
  })();

  // ===================== INTERIORES =====================
  const room = (id, name, w, h, floor, o = {}) => {
    const m = add(new MapDef(id, name, w, h, Object.assign({ indoor: true, music: 'cumbica', bg: 'rua' }, o)));
    m.fill('void', 0, 0, w, h); m.fill(floor, 1, 2, w - 2, h - 3); m.fill(o.wall || 'wallI', 1, 0, w - 2, 2);
    const mx = Math.floor(w / 2); m.fill('mat', mx, h - 2, 1, 1); m.matX = mx; m.matY = h - 2; m.start = [mx, h - 3];
    return m;
  };
  (() => {
    const m = room('casa_gabe', 'Casa da Gabe', 11, 9, 'wood');
    m.fill('rug', 4, 4, 3, 2); m.obj('bed', 2, 2); m.obj('stove', 8, 2); m.obj('plant', 9, 2); m.obj('table', 5, 2); m.obj('tv', 2, 6); m.obj('plant', 9, 6);
    m.warp(5, 7, 'cumbica', 38, 36, 'down');
  })();
  (() => {
    const m = room('oficina', 'Oficina do Zé', 13, 10, 'concrete', { wall: 'wallG' });
    m.obj('rack', 1, 2); m.obj('workbench', 4, 2); m.obj('rack', 10, 2); m.obj('moto', 2, 6); m.obj('tires', 11, 6); m.obj('tires', 11, 7); m.obj('barrel', 1, 8); m.obj('table', 7, 4);
    m.warp(6, 8, 'cumbica', 44, 36, 'down');
  })();
  (() => {
    const m = room('mercado', 'Mercado Cumbica', 13, 10, 'tile');
    m.obj('shelf', 1, 2); m.obj('shelf', 4, 2); m.obj('shelf', 10, 2); m.obj('counter', 7, 4); m.obj('shelf', 2, 6); m.obj('plant', 11, 7); m.obj('crate', 1, 8);
    for (const x of [7, 8, 9]) m.say(x, 4, '@loja_mercado');
    m.warp(6, 8, 'cumbica', 29, 59, 'down');
  })();
  (() => {
    const m = room('base', 'Base dos Mad Dogs', 14, 10, 'wood', { music: 'story' });
    m.obj('banner', 2, 2); m.obj('banner', 11, 2); m.obj('stove', 9, 2); m.obj('couch', 3, 3); m.obj('dogbed', 9, 6); m.obj('dogbed', 9, 7); m.obj('tv', 1, 6); m.obj('plant', 12, 8);
    m.fill('rug', 5, 6, 4, 2); m.obj('table', 6, 5);
    m.warp(6, 8, 'cumbica', 28, 54, 'down');
  })();
  (() => {
    const m = room('galpao', 'Galpão Abandonado', 16, 12, 'concrete', { wall: 'wallG', music: 'boss', bg: 'industrial' });
    m.obj('flag', 3, 2); m.obj('flag', 12, 2); m.obj('rack', 5, 2); m.obj('rack', 9, 2); m.obj('crate', 1, 4); m.obj('crate', 1, 5); m.obj('crate', 13, 4); m.obj('pallet', 13, 5); m.obj('barrel', 14, 8); m.obj('moto', 10, 8); m.obj('tires', 2, 9); m.obj('couch', 3, 7);
    m.fill('rug', 6, 3, 3, 1);
    m.warp(7, 10, 'cumbica', 64, 92, 'down');
  })();

  (() => {
    const m = room('karaoke', 'Karaokê de Cumbica', 15, 13, 'tile', { music: 'story', wall: 'wallI' });
    m.fill('rug', 3, 4, 9, 4); m.obj('table', 2, 3); m.obj('table', 11, 3); m.obj('counter', 7, 2); m.obj('couch', 2, 8); m.obj('couch', 10, 8); m.obj('tv', 6, 1); m.obj('plant', 1, 2); m.obj('plant', 13, 2);
    m.warp(7, 11, 'cumbica', 6, 68, 'down');
  })();

  // ---- Ginásios (interiores) — 15x13, corredor central x=6..8 sempre livre ----
  const GYM = [
    null,
    { id: 'gym1', name: 'Ginásio — Praça Cummins', floor: 'concrete', bg: 'praca', exit: 1, obs: m => { for (const [x, y] of [[3, 5], [5, 8], [10, 5], [12, 8], [3, 10], [11, 10], [2, 3], [12, 3]]) m.obj('cone', x, y); for (const [x, y] of [[2, 7], [12, 6], [4, 4], [10, 9]]) m.obj('hurdle', x, y); } },
    { id: 'gym2', name: 'Ginásio — CEU Jardim Cumbica', floor: 'court', bg: 'campo', exit: 2, obs: m => { m.obj('shelf', 1, 2); m.obj('shelf', 11, 2); m.obj('table', 2, 6); m.obj('table', 11, 6); m.obj('plant', 1, 10); m.obj('plant', 13, 10); m.obj('table', 3, 9); } },
    { id: 'gym3', name: 'Ginásio — Arena Farias', floor: 'pitch', bg: 'campo', exit: 3, obs: m => { m.obj('poste', 1, 6); m.obj('poste', 13, 6); m.obj('bench', 2, 10); m.obj('bench', 11, 10); m.obj('barrel', 3, 3); m.obj('barrel', 12, 3); } },
    { id: 'gym4', name: 'Ginásio — Praça Vicente Ferreira Campos', floor: 'tile', bg: 'praca', exit: 4, obs: m => { for (const [x, y] of [[3, 6], [4, 6], [10, 6], [11, 6], [3, 9], [11, 9]]) m.obj('crate', x, y); m.obj('plant', 1, 3); m.obj('plant', 13, 3); m.obj('bench2', 1, 11 - 1); } },
    { id: 'gym5', name: 'Ginásio — Caminho dos Grafites', floor: 'concrete', bg: 'viela', exit: 5, obs: m => { m.obj('graf', 1, 5); m.obj('grafCol', 11, 7); m.obj('muro', 1, 9); m.obj('muro', 11, 3); m.obj('box', 4, 3); m.obj('tires', 12, 10); } },
    { id: 'gym6', name: 'Ginásio — Cidade Industrial', floor: 'gravel', bg: 'industrial', exit: 6, obs: m => { m.obj('container', 1, 4); m.obj('containerB', 11, 4); m.obj('barrel', 1, 8); m.obj('barrel', 13, 8); m.obj('tank', 2, 9); m.obj('pallet', 12, 10); } },
    { id: 'gym7', name: 'Ginásio — Av. Santos Dumont', floor: 'road', bg: 'rua', exit: 7, obs: m => { m.fill('roadH', 1, 6, 13, 1); m.fill('roadH', 1, 9, 13, 1); m.obj('carR', 1, 3); m.obj('carB', 11, 7); m.obj('cone', 4, 8); m.obj('cone', 10, 5); m.obj('poste', 13, 10); m.obj('poste', 1, 10); } },
    { id: 'gym8', name: 'Ginásio — Arena Aeronáutica', floor: 'tile', bg: 'industrial', exit: 8, obs: m => { m.fill('rug', 6, 2, 3, 9); m.obj('banner', 2, 2); m.obj('banner', 12, 2); m.obj('statue', 1, 6); m.obj('statue', 12, 6); m.obj('plant', 1, 10); m.obj('plant', 13, 10); } },
  ];
  for (let i = 1; i <= 8; i++) { const g = GYM[i], m = room(g.id, g.name, 15, 13, g.floor, { music: 'boss', bg: g.bg, wall: i === 5 || i === 6 ? 'wallG' : 'wallI' }); g.obs(m); const gg = P.gyms[i]; m.warp(m.matX, m.matY, 'cumbica', gg.front[0], gg.front[1], 'down'); m.gym = i; }
  (() => {
    const m = room('campeao', 'Salão do Campeão de Cumbica', 15, 13, 'rug', { music: 'boss', bg: 'industrial', wall: 'wallG' });
    m.obj('banner', 2, 2); m.obj('banner', 12, 2); m.obj('statue', 1, 5); m.obj('statue', 12, 5); m.obj('flag', 4, 2); m.obj('flag', 10, 2); m.obj('plant', 1, 10); m.obj('plant', 13, 10);
    m.warp(m.matX, m.matY, 'cumbica', 73, 25, 'down');
  })();
})(window.MD);
