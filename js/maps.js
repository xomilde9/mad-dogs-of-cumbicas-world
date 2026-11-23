'use strict';
// ================= MAPAS: Cumbica (Centro/Praça/Terrenos), Viela, Campo, Industrial + interiores =================
(function (M) {
  const SP = M.spr, T = 16, MAPS = M.maps = {};
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
    warp(x, y, to, tx, ty, dir = 'up', o = {}) { this.warps[this.i(x, y)] = Object.assign({ to, tx, ty, dir }, o); }
    zone(x, y, w, h, name, enc, bg) { this.zones.push({ x, y, w, h, name, enc, bg }); }
    say(x, y, fn) { this.inter[this.i(x, y)] = fn; }
    zoneAt(x, y) { for (let k = this.zones.length - 1; k >= 0; k--) { const z = this.zones[k]; if (x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h) return z; } return { name: this.name, enc: this.enc || null, bg: this.bg }; }
    render() {
      if (this.canvas) return this.canvas;
      const c = M.mk(this.w * T, this.h * T), x = M.cx(c);
      for (let j = 0; j < this.h; j++) for (let k = 0; k < this.w; k++) {
        let n = this.g[this.i(k, j)]; const t = n === 'grass' ? SP.tiles['grass' + ((k * 7 + j * 13 + (k * j)) % 3)] : SP.tiles[n]; x.drawImage(t, k * T, j * T);
        if (n === 'water') {
          const nw = (a, b) => this.inb(a, b) && this.g[this.i(a, b)] === 'water';
          x.fillStyle = '#1d4f9a'; if (!nw(k, j - 1)) x.fillRect(k * T, j * T, T, 2); if (!nw(k, j + 1)) x.fillRect(k * T, j * T + T - 2, T, 2); if (!nw(k - 1, j)) x.fillRect(k * T, j * T, 2, T); if (!nw(k + 1, j)) x.fillRect(k * T + T - 2, j * T, 2, T);
        }
      }
      this.items.slice().sort((a, b) => (a.y + a.h) - (b.y + b.h)).forEach(it => { x.drawImage(it.b || SP.objs[it.n].c, it.x * T, it.y * T); });
      this.canvas = c; return c;
    }
  }
  M.MapDef = MapDef;
  const add = (m) => (MAPS[m.id] = m);
  const treeRowX = (m, y, skip) => { for (let x = 0; x < m.w; x += 2) if (!skip || !skip(x)) m.tree(x, y); };
  const treeColY = (m, x, skip) => { for (let y = 0; y < m.h; y += 2) if (!skip || !skip(y)) m.tree(x, y); };

  // ===================== CUMBICA — CENTRO =====================
  (() => {
    const m = add(new MapDef('cumbica', 'Cumbica', 44, 34, { music: 'cumbica', bg: 'rua' }));
    m.fill('walk', 17, 0, 2, 34); m.fill('walk', 22, 0, 2, 34); m.fill('walk', 0, 13, 44, 2); m.fill('walk', 0, 18, 44, 2);
    m.fill('road', 19, 0, 3, 34); m.fill('road', 0, 15, 44, 3);
    for (let y = 0; y < 34; y++) if (y < 15 || y > 17) m.fill('roadV', 20, y, 1, 1);
    for (let x = 0; x < 44; x++) if (x < 19 || x > 21) m.fill('roadH', x, 16, 1, 1);
    // bordas de árvore
    treeRowX(m, 0, x => x >= 16 && x <= 22); treeRowX(m, 32, x => x >= 16 && x <= 22);
    treeColY(m, 0, y => y >= 12 && y <= 19 || y === 0 || y === 32); treeColY(m, 42, y => y >= 12 && y <= 19 || y === 0 || y === 32);
    m.fill('walk', 0, 13, 2, 2); m.fill('walk', 0, 18, 2, 2); m.fill('walk', 42, 13, 2, 2); m.fill('walk', 42, 18, 2, 2);
    for (const y of [15, 16, 17]) m.obj('cone', 1, y);
    // Casa da Gabe, Oficina do Zé, Mercado
    const d1 = m.bld(5, 9, 5, 4, 'orange', 2); m.warp(d1[0], d1[1], 'casa_gabe', 5, 6, 'up');
    const d2 = m.bld(11, 9, 6, 4, 'grey', 2, { garage: true }); m.warp(d2[0], d2[1], 'oficina', 6, 7, 'up'); m.warp(d2[0] + 1, d2[1], 'oficina', 6, 7, 'up');
    const d3 = m.bld(25, 9, 7, 4, 'blue', 3, { awning: true }); m.warp(d3[0], d3[1], 'mercado', 6, 7, 'up');
    const d4 = m.bld(34, 9, 5, 4, 'yellow', 2); m.block(d4[0], d4[1]); m.say(d4[0], d4[1], 'casa_trancada');
    m.obj('sign', 16, 13); m.say(16, 13, 'placa_oficina'); m.obj('sign', 32, 13); m.say(32, 13, 'placa_mercado'); m.obj('sign', 10, 13); m.say(10, 13, 'placa_casa');
    m.obj('poste', 23, 11); m.obj('poste', 17, 11); m.obj('poste', 23, 20); m.obj('poste', 17, 20);
    // Terreno do fundão (NW)
    m.fill('dirt', 2, 3, 14, 6);
    m.fill('tall', 3, 3, 6, 3); m.fill('tall', 10, 5, 5, 3); m.fill('tall', 3, 7, 3, 2);
    m.obj('tires', 9, 4); m.obj('crate', 8, 7); m.obj('barrel', 15, 3); m.obj('box', 7, 3); m.obj('trash', 2, 7); m.obj('crate', 9, 7);
    m.fill('walk', 2, 9, 15, 1); m.fill('walk', 2, 10, 15, 3, 0); m.fill('grass', 2, 10, 15, 3);
    m.zone(2, 2, 15, 8, 'Terreno Abandonado', 'terreno', 'rua');
    // Praça dos Cachorros (NE)
    m.fill('fence', 24, 2, 18, 1); m.fill('fence', 24, 8, 18, 1); m.fill('fence', 24, 3, 1, 5); m.fill('fence', 41, 3, 1, 5);
    m.fill('walk', 24, 5, 1, 2); m.block(24, 5, 1, 2, 0);
    m.fill('dirt', 25, 5, 4, 2);
    m.fill('water', 29, 4, 4, 2); m.fill('tall', 34, 3, 6, 2); m.fill('tall', 25, 3, 3, 1); m.fill('tall', 25, 7, 3, 1);
    m.fill('flowers', 26, 3, 0, 0); m.fill('flowers', 33, 6, 1, 1); m.fill('flowers', 28, 3, 1, 1); m.fill('flowers', 34, 7, 2, 1);
    m.obj('statue', 36, 6); m.obj('bench', 29, 7); m.obj('lamp', 32, 6); m.obj('bush', 40, 7); m.say(40, 7, 'moita');
    m.tree(38, 6); m.tree(39, 3); m.fill('tall', 39, 3, 0, 0);
    m.say(36, 7, 'estatua'); m.say(37, 7, 'estatua'); m.say(36, 6, 'estatua'); m.say(37, 6, 'estatua');
    m.zone(24, 2, 18, 7, 'Praça dos Cachorros', 'praca', 'praca');
    for (let x = 24; x < 42; x += 2) m.tree(x, 0);
    // Posto de gasolina (SW)
    m.fill('concrete', 3, 22, 12, 7);
    m.obj('pump', 5, 23); m.obj('pump', 8, 23); m.obj('pump', 11, 23); m.obj('carR', 4, 26);
    const d5 = m.bld(10, 25, 5, 4, 'grey', 2); m.block(d5[0], d5[1]); m.say(d5[0], d5[1], 'conveniencia');
    m.obj('busstop', 3, 20); m.say(4, 21, 'busstop'); m.say(3, 21, 'busstop'); m.say(5, 21, 'busstop');
    m.obj('trash', 13, 20); m.obj('barrel', 14, 28);
    for (const [x, y] of [[14, 22], [15, 31], [4, 30], [8, 30], [12, 30]]) m.tree(x, y);
    // Casas decorativas (S)
    for (const [x, st, dx] of [[25, 'orange', 2], [31, 'purple', 1], [37, 'brick', 2]]) { const d = m.bld(x, 21, 5, 4, st, dx); m.block(d[0], d[1]); m.say(d[0], d[1], 'casa_trancada'); }
    m.obj('carB', 26, 25); m.obj('carY', 32, 25); m.fill('walk', 25, 25, 17, 1); m.fill('grass', 25, 25, 0, 0);
    // Terreno abandonado (SE)
    m.fill('dirt', 25, 26, 17, 6); m.fill('tall', 28, 28, 6, 3); m.fill('tall', 36, 27, 5, 3);
    m.obj('crate', 26, 27); m.obj('crate', 27, 27); m.obj('tires', 35, 31); m.obj('barrel', 40, 31); m.obj('box', 25, 30);
    m.zone(24, 26, 18, 7, 'Terreno Abandonado', 'terreno', 'rua');
    // saídas
    for (const x of [19, 20, 21]) { m.warp(x, 0, 'viela', 14, 25, 'up', { need: 'starter', msg: 'Antes de sair do bairro, melhor falar com o Zé na Oficina.' }); m.warp(x, 33, 'industrial', 15, 2, 'down', { need: 'obra', msg: 'A rua tá interditada. Obra da prefeitura.' }); }
    for (const y of [15, 16, 17]) m.warp(43, y, 'campo', 2, 12, 'right', { need: 'starter', msg: 'Antes de sair do bairro, melhor falar com o Zé na Oficina.' });
    m.dyn.push({ n: 'cone', x: 19, y: 30, show: f => !f.obra, solid: f => !f.obra }, { n: 'cone', x: 21, y: 30, show: f => !f.obra, solid: f => !f.obra }, { n: 'cone', x: 20, y: 31, show: f => !f.obra, solid: f => !f.obra });
    m.start = [7, 14];
  })();

  // ===================== VIELA DOS MALUCOS =====================
  (() => {
    const m = add(new MapDef('viela', 'Viela dos Malucos', 30, 28, { music: 'bairro', bg: 'viela', enc: 'viela' }));
    m.fill('concrete', 0, 0, 30, 28); m.fill('dirt', 3, 18, 24, 8); m.fill('gravel', 3, 10, 24, 6); m.fill('concrete', 3, 2, 24, 6);
    const mu = (x, y, n) => m.obj(n || 'muro', x, y);
    for (let x = 0; x < 30; x += 3) mu(x, 0, (x === 6 || x === 18) ? 'graf' : 'muro');
    for (let y = 2; y < 26; y += 2) { mu(0, y, y % 6 === 0 ? 'graf' : 'muro'); mu(27, y, y % 4 === 0 ? 'graf' : 'muro'); }
    for (const x of [0, 3, 6, 9, 16, 19, 22, 25]) mu(x, 26); m.obj('crate', 12, 26); m.obj('crate', 12, 27);
    for (const x of [3, 6, 9, 15, 18, 21]) mu(x, 8, x === 6 ? 'graf' : 'muro'); mu(12, 8, 'grafCol');
    m.obj('crate', 24, 8); m.obj('crate', 24, 9); m.obj('crate', 26, 8); m.obj('crate', 26, 9);
    for (const x of [6, 9, 12, 15, 18, 21, 24]) mu(x, 16, x === 15 ? 'graf' : 'muro');
    // base dos mad dogs
    const d = m.bld(11, 3, 7, 4, 'rust', 3); m.warp(d[0], d[1], 'base', 6, 7, 'up');
    m.obj('banner', 10, 5); m.obj('banner', 18, 5);
    m.obj('box', 5, 4); m.say(5, 4, 'caixa_bolinha'); m.obj('tires', 21, 4); m.obj('tires', 22, 4); m.obj('trash', 24, 3); m.obj('pallet', 7, 6); m.obj('barrel', 4, 7);
    m.obj('box', 4, 24); m.say(4, 24, 'achado1'); m.obj('trash', 25, 11); m.say(25, 11, 'achado2'); m.obj('moto', 20, 12); m.obj('crate', 8, 13); m.obj('barrel', 23, 24); m.obj('pallet', 16, 20);
    m.fill('tall', 4, 19, 6, 4); m.fill('tall', 18, 11, 6, 4); m.fill('tall', 4, 3, 4, 3); m.fill('tall', 20, 2, 5, 3);
    m.say(12, 9, 'grafite'); m.say(13, 9, 'grafite'); m.say(14, 9, 'grafite');
    for (const x of [13, 14, 15]) m.warp(x, 27, 'cumbica', 20, 2, 'down');
    m.start = [14, 25];
  })();

  // ===================== CAMPO DOS VIRA-LATAS =====================
  (() => {
    const m = add(new MapDef('campo', 'Campo dos Vira-Latas', 36, 26, { music: 'cumbica', bg: 'campo', enc: 'campo' }));
    for (let x = 0; x < 36; x += 2) { m.tree(x, 0); m.tree(x, 24); }
    treeColY(m, 0, y => y <= 0 || y >= 24 || (y >= 10 && y <= 12)); treeColY(m, 34, y => y <= 0 || y >= 24 || (y >= 10 && y <= 12));
    m.fill('dirt', 13, 8, 10, 9); m.fill('walk', 0, 10, 4, 4); m.fill('walk', 32, 10, 4, 4);
    m.fill('tall', 4, 3, 8, 5); m.fill('tall', 4, 17, 8, 6); m.fill('tall', 14, 19, 8, 3); m.fill('tall', 23, 3, 10, 5); m.fill('tall', 27, 18, 6, 5);
    m.fill('water', 26, 11, 5, 4);
    for (const [x, y] of [[3, 9], [12, 3], [22, 17], [33, 16], [10, 15], [24, 9], [31, 9]]) m.fill('flowers', x, y, 1, 1);
    m.obj('poste', 12, 11); m.obj('poste', 23, 11); m.obj('bench', 15, 6); m.obj('bench', 18, 6); m.obj('bench', 15, 18); m.obj('trash', 20, 6);
    m.obj('box', 33, 3); m.say(33, 3, 'achado3'); m.obj('bush', 4, 22); m.obj('barrel', 24, 6);
    m.zone(0, 0, 36, 26, 'Campo dos Vira-Latas', 'campo', 'campo');
    for (const y of [10, 11, 12, 13]) { m.warp(0, y, 'cumbica', 41, 16, 'left'); m.warp(35, y, 'campo', 33, 12, 'left', { block: 'A estrada pra Pimentas tá em obras. Volte depois!' }); }
    m.start = [2, 12];
  })();

  // ===================== ÁREA INDUSTRIAL =====================
  (() => {
    const m = add(new MapDef('industrial', 'Área Industrial', 32, 28, { music: 'bairro', bg: 'industrial', enc: 'industrial' }));
    m.fill('concrete', 0, 0, 32, 28); m.fill('gravel', 2, 2, 8, 9); m.fill('gravel', 22, 2, 8, 9); m.fill('gravel', 2, 9, 28, 4); m.fill('gravel', 13, 0, 5, 3);
    m.fill('chain', 0, 2, 1, 26); m.fill('chain', 31, 2, 1, 26); m.fill('chain', 1, 27, 30, 1);
    for (const x of [0, 3, 6, 9]) m.obj(x % 6 === 0 ? 'container' : 'containerB', x, 0);
    for (const x of [19, 22, 25, 28]) m.obj(x % 6 === 1 ? 'container' : 'containerB', x, 0);
    for (const y of [0, 1]) { m.obj('crate', 12, y); m.obj('crate', 13, y); m.obj('crate', 17, y); m.obj('crate', 18, y); } m.obj('crate', 31, 0); m.obj('crate', 31, 1);
    const d = m.bld(10, 3, 12, 6, 'purple', 5, { corrugated: true }); m.warp(d[0], d[1], 'galpao', 7, 9, 'up', { need: 'chave', msg: 'Trancado. Precisa da Chave do Galpão.' });
    m.obj('flag', 9, 7); m.obj('flag', 22, 7);
    m.obj('containerB', 3, 14); m.obj('container', 3, 16); m.obj('container', 25, 14); m.obj('containerB', 25, 16); m.obj('tank', 12, 17); m.obj('tank', 15, 17); m.obj('tank', 18, 17);
    for (const [x, y] of [[9, 14], [10, 14], [22, 18], [20, 22], [8, 24], [23, 24]]) m.obj('barrel', x, y);
    m.obj('pallet', 24, 24); m.say(24, 24, 'achado_peca'); m.obj('pallet', 6, 22); m.obj('tires', 28, 23); m.obj('carR', 13, 23); m.obj('cone', 11, 12); m.obj('cone', 20, 12);
    m.fill('tall', 3, 19, 6, 4); m.fill('tall', 21, 19, 6, 4); m.fill('tall', 3, 4, 5, 3); m.fill('tall', 24, 4, 5, 3);
    for (const x of [14, 15, 16]) m.warp(x, 0, 'cumbica', 20, 31, 'up');
    m.zone(0, 0, 32, 28, 'Área Industrial', 'industrial', 'industrial');
    m.start = [15, 2];
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
    m.warp(5, 7, 'cumbica', 7, 13, 'down');
  })();
  (() => {
    const m = room('oficina', 'Oficina do Zé', 13, 10, 'concrete', { wall: 'wallG' });
    m.obj('rack', 1, 2); m.obj('workbench', 4, 2); m.obj('rack', 10, 2); m.obj('moto', 2, 6); m.obj('tires', 11, 6); m.obj('tires', 11, 7); m.obj('barrel', 1, 8); m.obj('table', 7, 4);
    m.warp(6, 8, 'cumbica', 13, 13, 'down');
  })();
  (() => {
    const m = room('mercado', 'Mercado Cumbica', 13, 10, 'tile');
    m.obj('shelf', 1, 2); m.obj('shelf', 4, 2); m.obj('shelf', 10, 2); m.obj('counter', 7, 4); m.obj('shelf', 2, 6); m.obj('plant', 11, 7); m.obj('crate', 1, 8);
    for (const x of [7, 8, 9]) m.say(x, 4, 'loja_mercado');
    m.warp(6, 8, 'cumbica', 28, 13, 'down');
  })();
  (() => {
    const m = room('base', 'Base dos Mad Dogs', 14, 10, 'wood', { music: 'story' });
    m.obj('banner', 2, 2); m.obj('banner', 11, 2); m.obj('stove', 9, 2); m.obj('couch', 3, 3); m.obj('table', 6, 5); m.obj('dogbed', 9, 6); m.obj('dogbed', 9, 7); m.obj('tv', 1, 6); m.obj('plant', 12, 8);
    m.fill('rug', 5, 6, 4, 2);
    m.warp(6, 8, 'viela', 14, 7, 'down');
  })();
  (() => {
    const m = room('galpao', 'Galpão Abandonado', 16, 12, 'concrete', { wall: 'wallG', music: 'boss', bg: 'industrial' });
    m.obj('flag', 3, 2); m.obj('flag', 12, 2); m.obj('rack', 5, 2); m.obj('rack', 9, 2); m.obj('crate', 1, 4); m.obj('crate', 1, 5); m.obj('crate', 13, 4); m.obj('pallet', 13, 5); m.obj('barrel', 14, 8); m.obj('moto', 10, 8); m.obj('tires', 2, 9); m.obj('couch', 3, 7);
    m.fill('rug', 6, 3, 3, 1);
    m.warp(7, 10, 'industrial', 15, 9, 'down');
  })();
})(window.MD);
