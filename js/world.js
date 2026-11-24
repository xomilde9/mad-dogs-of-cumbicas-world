'use strict';
// ================= MUNDO: movimento, colisão, NPCs, treinadores, portas, encontros, save =================
(function (M) {
  const SP = M.spr, D = M.D, T = 16, W = M.W, H = M.H, UI = M.ui;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  // Campo de visão GBA: 15x10 tiles (240x160 px). O render do mundo é ampliado 2x na tela 480x320.
  const VIEW_TILES_X = 15, VIEW_TILES_Y = 10, TRAINER_SIGHT_MAX = 7;
  const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const STEP_MS = 125;
  const Wd = M.world = { busy: false, npcs: {}, banner: null, p: null, lastZone: null, since: 0, bump: 0, cam: [0, 0] };

  // ---------- save persistente e compatível entre versões ----------
  const KEY = 'mdcw_save_v1'; // Não alterar: mantém os saves já existentes no navegador.
  const SAVE_FORMAT = 2;
  const freshGame = () => ({
    v: 1, saveFormat: SAVE_FORMAT, map: 'cumbica', x: 38, y: 36, dir: 'down',
    party: [], kennel: [], bag: { petisco: 5, agua: 3 }, money: 200,
    flags: { badges: 0 }, visited: {}, time: 0, dex: { seen: {}, own: {} }, steps: 0
  });
  const mergeDefaults = (defaults, saved) => {
    if (Array.isArray(defaults)) return Array.isArray(saved) ? saved : defaults;
    if (defaults && typeof defaults === 'object') {
      const out = Object.assign({}, defaults);
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        for (const k of Object.keys(saved)) out[k] = k in defaults ? mergeDefaults(defaults[k], saved[k]) : saved[k];
      }
      return out;
    }
    return saved === undefined || saved === null ? defaults : saved;
  };
  M.Save = {
    has() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } },
    save() {
      try {
        if (!M.G) return false;
        const G = M.G;
        if (Wd.p) { G.map = Wd.mapId; G.x = Wd.p.x; G.y = Wd.p.y; G.dir = Wd.p.dir; }
        G.saveFormat = SAVE_FORMAT;
        localStorage.setItem(KEY, JSON.stringify(G));
        return true;
      } catch (e) { console.warn('Não foi possível salvar o progresso:', e); return false; }
    },
    load() {
      try {
        const raw = localStorage.getItem(KEY); if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
        const G = mergeDefaults(freshGame(), parsed);
        if (!Array.isArray(G.party)) G.party = [];
        if (!Array.isArray(G.kennel)) G.kennel = [];
        if (!G.bag || typeof G.bag !== 'object') G.bag = {};
        if (!G.flags || typeof G.flags !== 'object') G.flags = { badges: 0 };
        if (!G.visited || typeof G.visited !== 'object') G.visited = {};
        if (!G.dex || typeof G.dex !== 'object') G.dex = { seen: {}, own: {} };
        if (!M.maps[G.map]) G.map = 'cumbica';
        G.x = Number.isFinite(Number(G.x)) ? Number(G.x) : 38;
        G.y = Number.isFinite(Number(G.y)) ? Number(G.y) : 36;
        if (!['up', 'down', 'left', 'right'].includes(G.dir)) G.dir = 'down';
        G.saveFormat = SAVE_FORMAT;
        M.G = G;
        // Regrava no formato atual após completar campos ausentes de saves antigos.
        this.save();
        return true;
      } catch (e) { console.warn('Save antigo inválido; mantendo opção de iniciar novo jogo.', e); return false; }
    },
    clear() { try { localStorage.removeItem(KEY); } catch (e) { } },
    export() {
      try {
        if (!this.save()) return false;
        const blob = new Blob([JSON.stringify({ game: "Mad Dogs of Cumbica's World", format: SAVE_FORMAT, data: M.G }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = 'mad-dogs-cumbica-save.json'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return true;
      } catch (e) { console.warn('Não foi possível exportar o save:', e); return false; }
    }
  };
  M.newGame = () => { M.G = freshGame(); };

  // ---------- NPCs ----------
  Wd.build = () => {
    Wd.npcs = {};
    for (const mapId in M.story.npcs) Wd.npcs[mapId] = M.story.npcs[mapId].map(d => Object.assign({ dir: 'down', hx: d.x, hy: d.y, mv: null, excl: 0, wt: 1000 + Math.random() * 2000, fr: 0 }, d, { px: d.x, py: d.y }));
  };
  const visible = (n) => !n.when || n.when(M.G.flags, M.G);
  const npcsHere = () => (Wd.npcs[Wd.mapId] || []).filter(visible);
  const npcAt = (x, y) => npcsHere().find(n => (n.x === x && n.y === y) || (n.mv && n.mv.tx === x && n.mv.ty === y));
  Wd.map = () => M.maps[Wd.mapId];
  const isDone = (n) => !!M.G.flags['d_' + n.id];

  function solidAt(x, y, who) {
    const m = Wd.map(); if (!m.inb(x, y)) return true; if (m.sol[m.i(x, y)]) { if (m.warps[m.i(x, y)] && who === 'p') return false; if (m.warps[m.i(x, y)]) return true; return true; }
    for (const d of m.dyn) if (d.x === x && d.y === y && d.solid && d.solid(M.G.flags)) return d;
    if (npcAt(x, y)) return true; if (who !== 'p' && Wd.p && ((Wd.p.x === x && Wd.p.y === y) || (Wd.p.mv && Wd.p.mv.tx === x && Wd.p.mv.ty === y))) return true;
    return false;
  }
  Wd.solidAt = solidAt;

  // ---------- carregar mapa ----------
  Wd.load = (mapId, x, y, dir) => {
    Wd.mapId = mapId; const m = M.maps[mapId]; m.render();
    Wd.p = { x, y, dir: dir || 'down', mv: null, fr: 0, px: x, py: y }; M.G.map = mapId;
    Wd.lastZone = null; Wd.since = 0; Wd.banner = null; Wd.zoneCheck(true);
    M.audio.play(m.music || 'cumbica');
  };
  Wd.zoneCheck = (force) => {
    const m = Wd.map(), z = m.zoneAt(Wd.p.x, Wd.p.y);
    if (z.name !== Wd.lastZone) { Wd.lastZone = z.name; if (m.banner || force) Wd.banner = { t: 0, name: z.name }; }
  };

  // ---------- entrada / avisos ----------
  const markVisited = () => { const G = M.G; if (Wd.mapId !== 'cumbica') return; const cx = Wd.p.x >> 2, cy = Wd.p.y >> 2; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) G.visited[(cx + i) + ',' + (cy + j)] = 1; };

  // ---------- batalhas ----------
  Wd.blackout = async () => {
    const G = M.G; G.party.forEach(D.heal); G.money = Math.floor(G.money * 0.9);
    await M.fadeOut(300); Wd.load('cumbica', 38, 36, 'down'); await M.fadeIn(400);
    await M.say(null, 'Gabe acordou em casa, com os cachorros dormindo ao redor. A equipe foi cuidada e Gabe perdeu 10% da grana no táxi.');
  };
  Wd.fight = async (def) => {
    const G = M.G, foes = def.team.map(([k, lv, nm]) => D.makeDog(D.SP[k], lv, nm ? { name: nm } : {}));
    const r = await M.battle({ foes, wild: false, trainer: { name: def.name, money: def.money, intro: def.intro, win: def.win }, bg: def.bg || Wd.map().bg, boss: !!def.boss });
    if (r === 'lose') { await Wd.blackout(); return 'lose'; }
    await M.fadeIn(250); M.audio.play(Wd.map().music || 'cumbica'); return r;
  };
  Wd.wild = async (spKey, lv, bg, o = {}) => {
    const dog = D.makeDog(typeof spKey === 'number' ? spKey : D.SP[spKey], lv);
    const r = await M.battle({ foes: [dog], wild: true, bg: bg || Wd.map().bg, noRecruit: o.noRecruit, boss: o.boss });
    if (r === 'lose') { await Wd.blackout(); return r; }
    await M.fadeIn(250); M.audio.play(Wd.map().music || 'cumbica'); return r;
  };
  Wd.encounter = async () => {
    const m = Wd.map(), z = m.zoneAt(Wd.p.x, Wd.p.y), tab = M.story.enc[z.enc]; if (!tab) return false;
    const tot = tab.reduce((a, b) => a + b[3], 0); let r = Math.random() * tot, pick = tab[0]; for (const e of tab) { r -= e[3]; if (r <= 0) { pick = e; break; } }
    const lv = M.ri(pick[1], pick[2]); const demon = D.makeDemon(lv, z.enc); const battleResult = await M.battle({ foes: [demon], wild: true, noRecruit: true, bg: z.bg }); if (battleResult === 'lose') { await Wd.blackout(); return true; } await M.fadeIn(250); M.audio.play(Wd.map().music || 'cumbica'); return true;
  };

  // ---------- treinadores ----------
  const walkNpc = (n, dir) => new Promise(res => { n.dir = dir; n.mv = { fx: n.x, fy: n.y, tx: n.x + DIRS[dir][0], ty: n.y + DIRS[dir][1], t: 0, done: res }; });
  Wd.challenge = async (n, walk) => {
    const G = M.G; if (!G.party.some(d => d.hp > 0)) return;
    if (walk) {
      M.audio.sfx('alert'); n.excl = 800; await M.wait(800);
      let guard = 0; while (guard++ < 12) { const dx = Wd.p.x - n.x, dy = Wd.p.y - n.y; if (Math.abs(dx) + Math.abs(dy) <= 1) break; const dir = Math.abs(dx) > Math.abs(dy) || (dy === 0) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); if (solidAt(n.x + DIRS[dir][0], n.y + DIRS[dir][1], 'n')) break; await walkNpc(n, dir); }
    }
    const dx = Wd.p.x - n.x, dy = Wd.p.y - n.y; if (Math.abs(dx) + Math.abs(dy) === 1) { n.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; Wd.p.dir = OPP[n.dir]; }
    const tr = n.tr, r = await Wd.fight({ name: n.name, team: tr.team, money: tr.money, intro: tr.intro, win: tr.win, bg: tr.bg, boss: tr.boss });
    if (r === 'win') { G.flags['d_' + n.id] = 1; if (n.onWin) await M.story.handlers[n.onWin](n); }
  };
  const lineOfSight = (n) => {
    if (!n.tr || isDone(n) || !n.tr.sight || !visible(n) || !M.G.party.some(d => d.hp > 0)) return false;
    const [dx, dy] = DIRS[n.dir], sight = M.clamp(Math.floor(n.tr.sight), 0, TRAINER_SIGHT_MAX);
    for (let k = 1; k <= sight; k++) { const x = n.x + dx * k, y = n.y + dy * k; if (Wd.p.x === x && Wd.p.y === y) return true; if (solidAt(x, y, 'n') && !(Wd.p.x === x && Wd.p.y === y)) return false; }
    return false;
  };

  // ---------- interação ----------
  const speak = async (n, lines) => { const arr = Array.isArray(lines) ? lines : [lines]; for (const l of arr) await M.say(n.name || null, l); };
  Wd.talk = async (n) => {
    if (!n.fixed) n.dir = OPP[Wd.p.dir];
    if (n.tr && !isDone(n)) { await Wd.challenge(n, false); return; }
    const t = n.t; if (typeof t === 'function') await t(n, M.G); else if (typeof t === 'string' && t[0] === '@') await M.story.handlers[t](n); else if (t) await speak(n, typeof t === 'object' && !Array.isArray(t) ? (t.after && isDone(n) ? t.after : t.text) : t);
  };
  const runInter = async (v) => {
    if (typeof v === 'function') return v();
    if (v[0] === '@') { const h = M.story.handlers[v]; if (h) return h(); return M.say(null, '...'); }
    return M.say(null, v);
  };
  Wd.interact = async () => {
    const p = Wd.p, m = Wd.map(), [dx, dy] = DIRS[p.dir], fx = p.x + dx, fy = p.y + dy;
    const n = npcAt(fx, fy); if (n) return Wd.talk(n);
    const v = m.inter[m.i(fx, fy)]; if (v) { M.audio.sfx('ok'); return runInter(v); }
    // balcão: NPC atrás do balcão (2 tiles)
    const n2 = npcAt(fx + dx, fy + dy); if (n2 && m.indoor && m.sol[m.i(fx, fy)]) return Wd.talk(n2);
  };

  // ---------- portas ----------
  async function useWarp(w, prev) {
    const G = M.G, p = Wd.p; let msg = null;
    if (w.need && !(G.flags[w.need] || M.hasItem(w.need))) msg = w.msg || 'Trancado.';
    else if (w.badges != null && (G.flags.badges || 0) < w.badges) msg = w.msg || `A porta está fechada. Só entra quem tem pelo menos ${w.badges} insígnia(s).`;
    else if (w.block) msg = w.msg || 'Não dá pra entrar.';
    else if (w.cond && !w.cond(G.flags, G)) msg = w.msg || 'Trancado.';
    if (msg) { M.audio.sfx('err'); p.dir = OPP[p.dir]; await M.say(null, msg); p.x = prev[0]; p.y = prev[1]; p.px = p.x; p.py = p.y; return; }
    M.audio.sfx('door'); await M.fadeOut(220); Wd.load(w.to, w.tx, w.ty, w.dir); await M.fadeIn(220); M.Save.save();
    if (M.story.onEnter) await M.story.onEnter(w.to);
  }

  // ---------- passo concluído ----------
  async function onStep(prev) {
    const G = M.G, p = Wd.p, m = Wd.map(); G.steps++; Wd.since++; markVisited(); Wd.zoneCheck();
    const w = m.warps[m.i(p.x, p.y)]; if (w) { await useWarp(w, prev); return; }
    for (const n of npcsHere()) {
      if (lineOfSight(n)) { await Wd.challenge(n, true); return; }
      if (n.auto && !G.flags['auto_' + n.id] && (!n.auto.when || n.auto.when(G.flags, G)) && Math.abs(n.x - p.x) + Math.abs(n.y - p.y) <= (n.auto.d || 3)) { G.flags['auto_' + n.id] = 1; if (n.auto.walk) { let g = 0; while (g++ < 8 && Math.abs(n.x - p.x) + Math.abs(n.y - p.y) > 1) { const dx = p.x - n.x, dy = p.y - n.y, dir = Math.abs(dx) >= Math.abs(dy) && dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); if (solidAt(n.x + DIRS[dir][0], n.y + DIRS[dir][1], 'n')) break; await walkNpc(n, dir); } } await M.story.handlers[n.auto.fn](n); return; }
    }
    if (m.g[m.i(p.x, p.y)] === 'tall' && G.party.some(d => d.hp > 0) && Wd.since > 2 && Math.random() < 0.15) { Wd.since = 0; M.audio.sfx('alert'); await Wd.encounter(); }
  }
  Wd.step = (dir) => {
    const p = Wd.p, [dx, dy] = DIRS[dir], tx = p.x + dx, ty = p.y + dy; p.dir = dir; const s = solidAt(tx, ty, 'p');
    if (s) { if (typeof s === 'object' && s.msg && Wd.bump <= 0) { Wd.bump = 1500; Wd.run(() => M.say(null, s.msg)); } else if (Wd.bump <= 0 && !s.msg) { Wd.bump = 250; M.audio.sfx('bump'); } return; }
    p.prev = [p.x, p.y]; p.mv = { fx: p.x, fy: p.y, tx, ty, t: 0 }; p.x = tx; p.y = ty;
  };
  Wd.run = async (fn) => { if (Wd.busy) return; Wd.busy = true; try { await fn(); } catch (e) { console.error(e); } finally { Wd.busy = false; if (M.G && M.Save) M.Save.save(); } };

  // ---------- cena ----------
  let autosaveClock = 0;
  window.addEventListener('pagehide', () => { if (M.G && M.Save) M.Save.save(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && M.G && M.Save) M.Save.save(); });
  Wd.scene = {
    key(a) {
      if (Wd.busy) return;
      if (a === 'ok') Wd.run(Wd.interact);
      else if (a === 'menu' || a === 'back') Wd.run(UI.mainMenu);
      else if (a === 'bag') Wd.run(() => UI.bag());
      else if (a === 'map') Wd.run(UI.map);
      else if (a === 'quest') Wd.run(UI.quests);
      else if (a === 'track') Wd.run(UI.trackMission);
    },
    update(dt, hasOv) {
      const G = M.G; if (!G || !Wd.p) return; G.time += dt; autosaveClock += dt; if (autosaveClock >= 8000) { autosaveClock = 0; M.Save.save(); } if (Wd.banner) { Wd.banner.t += dt; if (Wd.banner.t > 2600) Wd.banner = null; } Wd.bump -= dt;
      const p = Wd.p;
      // jogador
      if (p.mv) { p.mv.t += dt; p.fr = Math.floor(p.mv.t / (STEP_MS / 2)) % 2 + 1; if (p.mv.t >= STEP_MS) { const prev = p.prev; p.mv = null; p.fr = 0; p.px = p.x; p.py = p.y; Wd.run(async () => { await onStep(prev); }); if (!Wd.busy) { } } }
      else if (!Wd.busy && !hasOv) { for (const d of ['up', 'down', 'left', 'right']) if (M.held[d]) { Wd.step(d); break; } }
      // NPCs
      for (const n of npcsHere()) {
        if (n.excl > 0) n.excl -= dt;
        if (n.mv) { n.mv.t += dt; n.fr = Math.floor(n.mv.t / (STEP_MS / 2)) % 2 + 1; if (n.mv.t >= STEP_MS) { n.x = n.mv.tx; n.y = n.mv.ty; const r = n.mv.done; n.mv = null; n.fr = 0; if (r) r(); } }
        else if (n.wander && !Wd.busy && !hasOv) { n.wt -= dt; if (n.wt <= 0) { n.wt = 1200 + Math.random() * 2600; const dir = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)], tx = n.x + DIRS[dir][0], ty = n.y + DIRS[dir][1]; n.dir = dir; if (Math.abs(tx - n.hx) <= n.wander && Math.abs(ty - n.hy) <= n.wander && !solidAt(tx, ty, 'n')) n.mv = { fx: n.x, fy: n.y, tx, ty, t: 0 }; } }
      }
    },
    draw(ctx) {
      const m = Wd.map(), p = Wd.p; if (!m || !p) return; const G = M.G;
      const lerp = (o) => o.mv ? [o.mv.fx + (o.mv.tx - o.mv.fx) * Math.min(1, o.mv.t / STEP_MS), o.mv.fy + (o.mv.ty - o.mv.fy) * Math.min(1, o.mv.t / STEP_MS)] : [o.x, o.y];
      const [ppx, ppy] = p.mv ? lerp(p) : [p.x, p.y];
      const mw = m.w * T, mh = m.h * T, vw = VIEW_TILES_X * T, vh = VIEW_TILES_Y * T;
      let cx = mw > vw ? M.clamp(Math.round(ppx * T + 8 - vw / 2), 0, mw - vw) : -Math.round((vw - mw) / 2), cy = mh > vh ? M.clamp(Math.round(ppy * T + 8 - vh / 2), 0, mh - vh) : -Math.round((vh - mh) / 2);
      Wd.cam = [cx, cy];
      ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.scale(2, 2); ctx.translate(-cx, -cy); const bc = m.render();
      const sx = Math.max(0, cx), sy = Math.max(0, cy), sw = Math.min(mw - sx, vw + (cx < 0 ? cx : 0)), sh = Math.min(mh - sy, vh + (cy < 0 ? cy : 0)); ctx.drawImage(bc, sx*2, sy*2, sw*2, sh*2, sx, sy, sw, sh);
      for (const d of m.dyn) if (d.show && d.show(G.flags) && d.x * T + T > cx && d.x * T < cx + vw && d.y * T + T > cy && d.y * T < cy + vh) SP.drawArt(ctx,SP.objs[d.n].c, d.x * T, d.y * T);
      const list = []; for (const n of npcsHere()) { const [x, y] = lerp(n); list.push({ y, n, x }); } list.push({ y: ppx === undefined ? 0 : ppy, pl: 1, x: ppx });
      list.sort((a, b) => a.y - b.y);
      for (const e of list) {
        if (e.pl) { SP.drawArt(ctx,SP.person(SP.GABE, p.dir, p.fr), Math.round(e.x * T) - 8, Math.round(e.y * T) - 32); continue; }
        const n = e.n, ex = Math.round(e.x * T), ey = Math.round(e.y * T);
        if (n.dog) SP.drawArt(ctx,SP.dogSmall(D.SPECIES[D.SP[n.dog]], n.dir, n.fr || 0), ex - 8, ey - 32); else ctx.drawImage(SP.person(n.look, n.dir, n.fr || 0), ex - 8, ey - 32);
      }
      ctx.restore();
      for (const n of npcsHere()) if (n.excl > 0) { const [x, y] = lerp(n); M.text(ctx, '!', Math.round((x * T - cx) * 2) + 12, Math.round((y * T - cy - 20) * 2), '#e03030', 22, '#fff'); }
      if (Wd.banner) { const b = Wd.banner, a = b.t < 300 ? b.t / 300 : b.t > 2300 ? (2600 - b.t) / 300 : 1, w = M.tw(b.name, 15) + 28; ctx.save(); ctx.globalAlpha = Math.max(0, a); M.panel(ctx, 8, 8 - (1 - a) * 20, w, 30, 'dark'); M.text(ctx, b.name, 22, 14 - (1 - a) * 20, '#fff', 15, '#101820'); ctx.restore(); }
      const tracked = M.story.missions.find(q => q.id === G.flags.trackedMission && q.status(G) === 1);
      if (tracked) { M.panel(ctx, 8, 270, 464, 42, 'dark'); M.text(ctx, 'MISSÃO: ' + tracked.name, 18, 275, '#ffe58a', 13, '#101820'); M.wrap('Destino: ' + (tracked.where ? tracked.where(G) : 'Consulte o diário.'), 430, 12).slice(0, 1).forEach((t, i) => M.text(ctx, t, 18, 292 + i * 13, '#fff', 12, '#101820')); }
    },
  };
  Wd.enter = (mapId, x, y, dir) => { Wd.build && !Object.keys(Wd.npcs).length && Wd.build(); Wd.load(mapId, x, y, dir); M.scene = Wd.scene; };
})(window.MD);
