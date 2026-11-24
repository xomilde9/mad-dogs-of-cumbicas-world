'use strict';
// ================= UI: diálogos, menus, equipe, mochila, mapa, missões, perfil, loja, título =================
(function (M) {
  const SP = M.spr, D = M.D, W = M.W, H = M.H;
  const UI = M.ui = {};
  M.portraits = {};
  const DARK = '#2a2a3a';

  M.hpBar = (ctx, x, y, w, h, r) => {
    ctx.fillStyle = '#303040'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2); ctx.fillStyle = '#6a6a7a'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = r > .5 ? '#38c040' : r > .2 ? '#e8c020' : '#e03030'; ctx.fillRect(x, y, r > 0 ? Math.max(1, Math.round(w * r)) : 0, h);
  };
  const chip = (ctx, t, x, y) => { const w = M.tw(D.TNAME[t], 10) + 8; M.rr(ctx, x, y, w, 13, D.TCOL[t]); M.text(ctx, D.TNAME[t], x + 4, y + 1, '#fff', 10); return w; };
  M.typeChip = chip;
  const tri = (ctx, x, y, col = '#d03030') => { ctx.fillStyle = col; for (let i = 0; i < 5; i++) ctx.fillRect(x + i, y + i, 1, 9 - i * 2); };
  const bg = (ctx, c1 = '#2a3e62', c2 = '#223250') => { ctx.fillStyle = c1; ctx.fillRect(0, 0, W, H); ctx.fillStyle = c2; for (let y = 0; y < H; y += 16) for (let x = (y / 16 % 2) * 16; x < W; x += 32) ctx.fillRect(x, y, 16, 16); };
  const head = (ctx, t) => { M.rr(ctx, 0, 0, W, 26, '#1a2640'); M.text(ctx, t, 12, 5, '#f8e8a0', 16); };
  const foot = (ctx, t) => { M.rr(ctx, 0, H - 22, W, 22, '#1a2640'); M.text(ctx, t, 10, H - 19, '#c8d4f0', 12); };

  // ---------- diálogo ----------
  M.who = (n) => {
    if (!n) return null; if (typeof n === 'object') return n;
    if (n === 'Gabe') return { name: 'Gabe', por: SP.portrait(SP.GABE, true) };
    const p = M.portraits[n]; return { name: n, por: p ? SP.portrait(p) : null };
  };
  let dlg = null;
  M.say = (who, text, o = {}) => new Promise(res => {
    const info = M.who(who), lines = M.wrap(String(text), 430, 15), pages = []; for (let i = 0; i < lines.length; i += 3) pages.push(lines.slice(i, i + 3));
    let pi = 0, shown = 0, wait = 0; const cps = { 1: 26, 2: 58, 3: 140 }[M.settings.speed] || 58;
    const ov = {
      keep: !!o.keep, fin: false,
      update(dt) { const len = pages[pi].join('').length; if (shown < len) shown += dt * cps / 1000; else if (o.auto) { wait += dt; if (wait > o.auto) this.adv(); } },
      adv() { const len = pages[pi].join('').length; if (shown < len) { shown = len; return; } if (pi < pages.length - 1) { pi++; shown = 0; wait = 0; M.audio.sfx('menu'); } else { this.fin = true; if (!this.keep) M.closeOv(this); res(); } },
      key(a) { if (this.fin) return; if (a === 'ok' || a === 'back') this.adv(); },
      draw(ctx) {
        if (info && info.por) { M.rr(ctx, 10, 148, 72, 72, '#e8c660'); ctx.drawImage(info.por, 0, 0, 32, 32, 13, 151, 66, 66); }
        if (info && info.name) { const w = M.tw(info.name, 14) + 20; M.rr(ctx, info.por ? 86 : 10, 198, w, 22, '#e8c660'); M.rr(ctx, (info.por ? 86 : 10) + 2, 200, w - 4, 18, '#27445a'); M.text(ctx, info.name, (info.por ? 86 : 10) + 10, 201, '#fff', 14); }
        M.panel(ctx, 6, 222, 468, 94, 'dark');
        let left = Math.floor(shown);
        pages[pi].forEach((l, i) => { const t = l.slice(0, Math.max(0, left)); left -= l.length; M.text(ctx, t, 24, 236 + i * 25, '#fff', 15, '#0c1824'); });
        if (!this.fin && shown >= pages[pi].join('').length && Math.floor(performance.now() / 350) % 2) { ctx.fillStyle = '#e8c660'; for (let i = 0; i < 5; i++) ctx.fillRect(448 + i, 292 + i, 9 - i * 2, 1); }
      },
    };
    dlg = ov; M.openOv(ov);
  });
  M.closeDlg = () => { if (dlg) { M.closeOv(dlg); dlg = null; } };
  M.narr = (t, o) => M.say(null, t, o);

  // ---------- menu de escolha ----------
  M.choose = (o) => new Promise(res => {
    const items = o.items.map(it => typeof it === 'string' ? { label: it } : it), cols = o.cols || 1, rows = Math.ceil(items.length / cols), rh = o.rh || 24;
    const cw = o.cw || Math.max(...items.map(i => M.tw(i.label, 15))) + 38, w = o.w || cw * cols + 12, h = rows * rh + 14;
    const x = o.x != null ? o.x : W - w - 10, y = o.y != null ? o.y : 220 - h - 4; let c = o.start || 0;
    const ov = {
      key(a) {
        if (a === 'up') c = (c - cols + items.length) % items.length; else if (a === 'down') c = (c + cols) % items.length;
        else if (a === 'left' && cols > 1) c = (c - 1 + items.length) % items.length; else if (a === 'right' && cols > 1) c = (c + 1) % items.length;
        else if (a === 'ok') { if (items[c].disabled) { M.audio.sfx('err'); return; } M.audio.sfx('ok'); M.closeOv(ov); res(c); return; }
        else if (a === 'back' && o.cancel !== false) { M.audio.sfx('back'); M.closeOv(ov); res(-1); return; }
        else return; if (a !== 'ok') M.audio.sfx('menu'); if (o.onMove) o.onMove(c);
      },
      draw(ctx) {
        if (o.draw) o.draw(ctx, c);
        M.panel(ctx, x, y, w, h);
        items.forEach((it, i) => { const cx = x + 10 + (i % cols) * cw, cy = y + 8 + Math.floor(i / cols) * rh; if (i === c) tri(ctx, cx, cy + 4); M.text(ctx, it.label, cx + 14, cy + 1, it.disabled ? '#9a9aa4' : DARK, 15); if (it.sub) M.text(ctx, it.sub, cx + cw - 12 - M.tw(it.sub, 12), cy + 3, '#6a6a7a', 12); });
      },
    };
    M.openOv(ov);
  });
  M.ask = async (who, text, choices, o = {}) => { await M.say(who, text, { keep: true }); const i = await M.choose(Object.assign({ items: choices }, o)); M.closeDlg(); return i; };
  M.toast = (t, ms = 1600) => new Promise(res => { let k = 0; const ov = { update(dt) { k += dt; if (k > ms) { M.closeOv(ov); res(); } }, key(a) { if (k > 300 && (a === 'ok' || a === 'back')) k = ms; }, draw(ctx) { const w = M.tw(t, 15) + 28; M.panel(ctx, (W - w) / 2, 40, w, 34, 'dark'); M.text(ctx, t, (W - w) / 2 + 14, 49, '#fff', 15); } }; M.openOv(ov); });

  // ---------- cura / itens fora e dentro da batalha ----------
  M.useHeal = (id, dog) => {
    const it = D.ITEMS[id], mx = D.stats(dog).hp;
    if (it.revive) { if (dog.hp > 0) return null; dog.hp = Math.max(1, Math.floor(mx * it.revive)); dog.st = null; return `${dog.name} voltou a abanar o rabo!`; }
    if (dog.hp <= 0 || dog.hp >= mx) return null;
    const before = dog.hp; dog.hp = Math.min(mx, dog.hp + it.heal); return `${dog.name} recuperou ${dog.hp - before} de HP.`;
  };
  M.addItem = (id, n = 1) => { const b = M.G.bag; b[id] = (b[id] || 0) + n; };
  M.hasItem = (id) => (M.G.bag[id] || 0) > 0;
  M.delItem = (id, n = 1) => { const b = M.G.bag; b[id] = (b[id] || 0) - n; if (b[id] <= 0) delete b[id]; };

  // ---------- equipe ----------
  function dogRow(ctx, d, x, y, w, sel) {
    M.rr(ctx, x, y, w, 42, sel ? '#e8c660' : '#1a2640'); M.rr(ctx, x + 2, y + 2, w - 4, 38, d.hp <= 0 ? '#6a4a52' : '#f2ecd0');
    ctx.drawImage(SP.dogBig(D.SPECIES[d.sp]), x + 6, y + 5, 40, 32);
    M.text(ctx, d.name, x + 52, y + 4, DARK, 15); M.text(ctx, 'Nv' + d.lv, x + 52, y + 22, '#4a4a5a', 12);
    const mx = D.stats(d).hp; M.text(ctx, 'HP', x + w - 190, y + 6, '#c04040', 12); M.hpBar(ctx, x + w - 170, y + 9, 120, 7, d.hp / mx);
    M.text(ctx, `${d.hp}/${mx}`, x + w - 170, y + 22, DARK, 13); if (d.st) M.text(ctx, d.st.toUpperCase(), x + w - 90, y + 22, '#c04040', 12);
    chip(ctx, D.SPECIES[d.sp].type, x + 112, y + 24);
  }
  UI.party = (o = {}) => new Promise(res => {
    let c = o.start || 0; const G = M.G;
    const ov = {
      async key(a) {
        const n = G.party.length;
        if (a === 'up') c = (c + n - 1) % n; else if (a === 'down') c = (c + 1) % n; else if (a === 'back') { M.audio.sfx('back'); M.closeOv(ov); res(-1); return; }
        else if (a === 'ok') {
          if (o.pick) { if (o.filter && !o.filter(G.party[c])) { M.audio.sfx('err'); return; } M.audio.sfx('ok'); M.closeOv(ov); res(c); return; }
          M.audio.sfx('ok'); const k = await M.choose({ items: ['Resumo', 'Colocar na frente', 'Enviar ao canil', 'Voltar'], x: 330, y: 150 });
          if (k === 0) await UI.summary(G.party[c]);
          else if (k === 1 && c > 0) { const d = G.party.splice(c, 1)[0]; G.party.unshift(d); c = 0; }
          else if (k === 2) { if (G.party.length > 1) { G.kennel.push(G.party.splice(c, 1)[0]); c = Math.min(c, G.party.length - 1); } else await M.say(null, 'Você precisa de pelo menos um cachorro na equipe.'); }
          return;
        } else if (a === 'right' && !o.pick) { UI.kennel(); return; } else return; M.audio.sfx('menu');
      },
      draw(ctx) { bg(ctx); head(ctx, o.title || 'EQUIPE'); G.party.forEach((d, i) => dogRow(ctx, d, 10, 32 + i * 46, 460, i === c)); foot(ctx, o.pick ? 'Escolha um cachorro.  X: voltar' : 'Z: opções   Dir: Canil   X: voltar'); },
    };
    M.openOv(ov);
  });
  UI.kennel = () => new Promise(res => {
    const G = M.G; let c = 0, top = 0;
    const ov = {
      async key(a) {
        const n = G.kennel.length;
        if (a === 'back') { M.audio.sfx('back'); M.closeOv(ov); res(); return; }
        if (!n) return;
        if (a === 'up') c = (c + n - 1) % n; else if (a === 'down') c = (c + 1) % n;
        else if (a === 'ok') {
          const k = await M.choose({ items: ['Resumo', 'Chamar pra equipe', 'Voltar'], x: 330, y: 150 });
          if (k === 0) await UI.summary(G.kennel[c]);
          else if (k === 1) { if (G.party.length >= 6) await M.say(null, 'A equipe já está cheia (6).'); else { G.party.push(G.kennel.splice(c, 1)[0]); c = Math.max(0, Math.min(c, G.kennel.length - 1)); } }
          return;
        } else return; M.audio.sfx('menu'); top = Math.max(0, Math.min(c - 4, n - 6));
      },
      draw(ctx) { bg(ctx, '#3a2e5a', '#2e2450'); head(ctx, 'CANIL — ' + G.kennel.length + ' cachorros'); if (!G.kennel.length) M.text(ctx, 'O canil está vazio.', 150, 140, '#fff', 16); G.kennel.slice(top, top + 6).forEach((d, i) => dogRow(ctx, d, 10, 32 + i * 46, 460, top + i === c)); foot(ctx, 'Z: opções   X: voltar'); },
    };
    M.openOv(ov);
  });
  UI.summary = (d) => new Promise(res => {
    const sp = D.SPECIES[d.sp], st = D.stats(d);
    const ov = {
      key(a) { if (a === 'ok' || a === 'back') { M.audio.sfx('back'); M.closeOv(ov); res(); } },
      draw(ctx) {
        bg(ctx, '#2a4a5a', '#223e4e'); head(ctx, 'RESUMO');
        M.panel(ctx, 8, 32, 176, 150, 'hud'); ctx.drawImage(SP.dogBig(sp), 24, 46, 144, 112);
        M.text(ctx, d.name, 20, 164, DARK, 15); M.text(ctx, 'Nv' + d.lv, 140, 164, DARK, 15);
        chip(ctx, sp.type, 14, 190); M.text(ctx, sp.breed, 14, 208, '#e8f0ff', 13); M.text(ctx, `Raridade: ${D.RAR[sp.rar]}`, 14, 224, '#e8f0ff', 13); M.text(ctx, `Origem: ${sp.reg}`, 14, 240, '#e8f0ff', 13);
        M.text(ctx, `Personalidade: ${sp.pers}`, 14, 256, '#f8e8a0', 13);
        M.panel(ctx, 192, 32, 280, 112, 'light'); const rows = [['HP', `${d.hp}/${st.hp}`], ['ATAQUE', st.atk], ['DEFESA', st.def], ['VELOCIDADE', st.spd]];
        rows.forEach((r, i) => { M.text(ctx, r[0], 206, 42 + i * 20, DARK, 14); M.text(ctx, String(r[1]), 440 - M.tw(String(r[1]), 14), 42 + i * 20, DARK, 14); });
        const nx = D.xpFor(d.lv + 1), cur = D.xpFor(d.lv); M.text(ctx, 'EXP p/ próximo', 206, 124, '#4a4a5a', 11); M.hpBar(ctx, 306, 126, 150, 6, d.lv >= 60 ? 1 : (d.xp - cur) / (nx - cur));
        M.panel(ctx, 192, 150, 280, 100, 'light');
        d.moves.forEach((m, i) => { const mv = D.MOVES[m.id], col = i % 2, row = Math.floor(i / 2); M.text(ctx, mv.name, 204 + col * 138, 158 + row * 44, DARK, 13); chip(ctx, mv.type, 204 + col * 138, 175 + row * 44); M.text(ctx, `PP ${m.pp}/${mv.pp}`, 262 + col * 138, 176 + row * 44, '#4a4a5a', 11); });
        M.panel(ctx, 8, 266, 464, 46, 'dark'); M.wrap(sp.desc, 440, 13).slice(0, 2).forEach((l, i) => M.text(ctx, l, 20, 272 + i * 18, '#fff', 13));
      },
    };
    M.openOv(ov);
  });

  // ---------- mochila ----------
  UI.bag = (o = {}) => new Promise(res => {
    const G = M.G, cats = o.only ? [o.only] : ['Recrutar', 'Cura', 'Chave']; let tab = 0, c = 0;
    const list = () => Object.keys(G.bag).filter(id => D.ITEMS[id].cat === cats[tab]);
    const ov = {
      async key(a) {
        const l = list();
        if (a === 'back') { M.audio.sfx('back'); M.closeOv(ov); res(null); return; }
        if (a === 'left' && cats.length > 1) { tab = (tab + cats.length - 1) % cats.length; c = 0; } else if (a === 'right' && cats.length > 1) { tab = (tab + 1) % cats.length; c = 0; }
        else if (a === 'up' && l.length) c = (c + l.length - 1) % l.length; else if (a === 'down' && l.length) c = (c + 1) % l.length;
        else if (a === 'ok' && l.length) {
          const id = l[c], it = D.ITEMS[id];
          if (o.pick) { M.audio.sfx('ok'); M.closeOv(ov); res(id); return; }
          if (it.heal || it.revive) {
            const i = await UI.party({ pick: true, title: 'Usar em quem?' }); if (i < 0) return; const msg = M.useHeal(id, G.party[i]);
            if (msg) { M.delItem(id); M.audio.sfx('heal'); await M.say(null, msg); } else { M.audio.sfx('err'); await M.say(null, 'Não vai ter efeito.'); }
          } else if (it.cat === 'Recrutar') await M.say(null, 'Esse item só pode ser usado em batalha, pelo menu RECRUTAR.'); else await M.say(null, it.desc);
          return;
        } else return; M.audio.sfx('menu');
      },
      draw(ctx) {
        bg(ctx, '#5a3a2a', '#4e3024'); head(ctx, 'MOCHILA'); const l = list(); if (c >= l.length) c = Math.max(0, l.length - 1);
        cats.forEach((t, i) => { M.rr(ctx, 12 + i * 100, 32, 94, 24, i === tab ? '#e8c660' : '#2a1a14'); M.text(ctx, t, 22 + i * 100, 36, i === tab ? DARK : '#c8a888', 14); });
        M.panel(ctx, 10, 60, 300, 196, 'light');
        if (!l.length) M.text(ctx, 'Vazio.', 24, 74, '#6a6a7a', 15);
        l.slice(Math.max(0, c - 7), Math.max(0, c - 7) + 8).forEach((id, i) => { const idx = Math.max(0, c - 7) + i, it = D.ITEMS[id]; if (idx === c) tri(ctx, 20, 70 + i * 23); M.text(ctx, it.name, 36, 66 + i * 23, DARK, 14); if (!it.key) M.text(ctx, 'x' + G.bag[id], 276, 67 + i * 23, '#4a4a5a', 13); });
        M.panel(ctx, 318, 60, 152, 196, 'hud'); if (l[c]) { const it = D.ITEMS[l[c]]; M.text(ctx, it.name, 328, 68, DARK, 13); M.wrap(it.desc, 130, 12).forEach((t, i) => M.text(ctx, t, 328, 92 + i * 16, '#3a3a4a', 12)); if (it.price) M.text(ctx, 'R$ ' + it.price, 328, 232, '#6a4a1a', 12); }
        M.rr(ctx, 10, 262, 460, 24, '#1a2640'); M.text(ctx, 'Dinheiro: R$ ' + G.money, 20, 266, '#f8e8a0', 14); foot(ctx, o.pick ? 'Z: escolher   X: voltar' : 'Esq/Dir: categoria   Z: usar   X: voltar');
      },
    };
    M.openOv(ov);
  });

  // ---------- mapa de Cumbica ----------
  UI.map = () => new Promise(res => {
    const G = M.G, world = M.maps.cumbica, S = 3, cvs = M.mk(world.w, world.h), cx = M.cx(cvs);
    const COL = { grass: '#7ac47a', tall: '#4a9a55', road: '#4a4e5a', roadH: '#4a4e5a', roadV: '#4a4e5a', walk: '#cfc9ba', dirt: '#c9a56f', flowers: '#8ad080', water: '#4a90e0', concrete: '#9a9ea8', gravel: '#a39a8c', court: '#3a8a7a', pitch: '#4fae5a', runway: '#3a3e4a', fence: '#8a5a30', chain: '#5a5e6a', cliff: '#b89870' };
    for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) { cx.fillStyle = COL[world.g[y * world.w + x]] || '#7ac47a'; cx.fillRect(x, y, 1, 1); }
    world.items.forEach(it => { if (it.b || it.n === 'tree') { cx.fillStyle = it.b ? '#b8603a' : '#2f8a4c'; cx.fillRect(it.x, it.y, it.w, it.h); } });
    const ox = 8, oy = 16;
    const ov = {
      key(a) { if (a === 'ok' || a === 'back' || a === 'map') { M.audio.sfx('back'); M.closeOv(ov); res(); } },
      draw(ctx) {
        bg(ctx, '#1e2a40', '#1a2438');
        ctx.fillStyle = '#0c0c14'; ctx.fillRect(ox - 2, oy - 2, world.w * S + 4, world.h * S + 4); ctx.imageSmoothingEnabled = false; ctx.drawImage(cvs, ox, oy, world.w * S, world.h * S);
        // névoa: células 4x4 ainda não visitadas
        ctx.fillStyle = 'rgba(8,10,20,.78)'; const v = G.visited || {};
        for (let cy = 0; cy < world.h / 4; cy++) for (let cxx = 0; cxx < world.w / 4; cxx++) if (!v[cxx + ',' + cy]) ctx.fillRect(ox + cxx * 4 * S, oy + cy * 4 * S, 4 * S, 4 * S);
        world.dyn.forEach(d => { if (d.show && d.show(G.flags)) { ctx.fillStyle = '#e03030'; ctx.fillRect(ox + d.x * S, oy + d.y * S, S, S); } });
        // Marcadores de lojas, serviços, NPCs e pontos examináveis.
        const marker = (x, y, color, shape = 'square') => {
          if (x == null || y == null) return;
          const mx = ox + x * S, my = oy + y * S;
          ctx.fillStyle = '#101018'; ctx.fillRect(mx - 2, my - 2, 8, 8); ctx.fillStyle = color;
          if (shape === 'diamond') { ctx.fillRect(mx + 1, my - 2, 2, 2); ctx.fillRect(mx - 1, my, 6, 2); }
          else if (shape === 'circle') { ctx.beginPath(); ctx.arc(mx + 1, my + 1, 2.5, 0, Math.PI * 2); ctx.fill(); }
          else ctx.fillRect(mx, my, 4, 4);
        };
        const doorMark = (p, color, shape) => { if (p) marker(p[0], p[1], color, shape); };
        doorMark(M.places.mercado, '#f8cf35', 'diamond'); doorMark(M.places.oficina, '#e89b43'); doorMark(M.places.casa, '#75c7f0'); doorMark(M.places.base, '#78d28a'); doorMark(M.places.galpao, '#d85a75');
        for (let i = 1; i <= 8; i++) if (M.places.gyms[i]) doorMark(M.places.gyms[i].door, '#f8e070', 'diamond');
        (M.story.npcs.cumbica || []).forEach(n => marker(n.x, n.y, '#6de0a0', 'circle'));
        Object.keys(world.inter).forEach(k => { const idx = Number(k); marker(idx % world.w, Math.floor(idx / world.w), '#74b9ef'); });
        const seenZ = new Set();
        world.zones.forEach(z => { if (!z.name || seenZ.has(z.name) || z.w < 6) return; seenZ.add(z.name); const key = Math.floor((z.x + z.w / 2) / 4) + ',' + Math.floor((z.y + z.h / 2) / 4); if (!v[key]) return; ctx.strokeStyle = 'rgba(255,240,160,.6)'; ctx.strokeRect(ox + z.x * S + .5, oy + z.y * S + .5, z.w * S - 1, z.h * S - 1); });
        M.places.labels.forEach(([t, x, y]) => M.text(ctx, t, ox + x * S, oy + y * S, '#ffffff', 9, '#101018'));
        for (let i = 1; i <= 8; i++) { const gy = M.places.gyms[i]; if (!gy) continue; const done = G.flags['badge' + i]; ctx.fillStyle = done ? '#f8d848' : '#fff'; ctx.fillRect(ox + gy.door[0] * S - 2, oy + gy.door[1] * S - 2, 7, 7); ctx.fillStyle = '#101018'; ctx.fillRect(ox + gy.door[0] * S - 1, oy + gy.door[1] * S - 1, 5, 5); M.text(ctx, String(i), ox + gy.door[0] * S, oy + gy.door[1] * S - 4, done ? '#f8d848' : '#fff', 10, '#000'); }
        if (G.map === 'cumbica' && Math.floor(performance.now() / 300) % 2) { ctx.fillStyle = '#ff3a8a'; ctx.fillRect(ox + G.x * S - 2, oy + G.y * S - 2, 7, 7); }
        const px = 8 + world.w * S + 10; M.panel(ctx, px, 8, W - px - 8, 304, 'light'); M.text(ctx, 'CUMBICA', px + 8, 14, DARK, 14); M.text(ctx, 'Guarulhos/SP', px + 8, 30, '#6a6a7a', 11);
        const lg = [['#f8cf35', 'Loja / ginásio'], ['#e89b43', 'Oficina'], ['#6de0a0', 'Pessoa / NPC'], ['#74b9ef', 'Interação'], ['#ff3a8a', 'Você']]; lg.forEach((l, i) => { ctx.fillStyle = l[0]; ctx.fillRect(px + 8, 56 + i * 16, 8, 8); ctx.strokeStyle = '#2a2a3a'; ctx.strokeRect(px + 7.5, 55.5 + i * 16, 9, 9); M.text(ctx, l[1], px + 22, 52 + i * 16, DARK, 10); });
        M.text(ctx, 'Insígnias: ' + (G.flags.badges || 0) + '/8', px + 8, 126, DARK, 13);
        for (let i = 1; i <= 8; i++) M.text(ctx, (G.flags['badge' + i] ? '★ ' : '· ') + (M.places.gyms[i] ? M.places.gyms[i].name.slice(0, 17) : ''), px + 8, 144 + (i - 1) * 13, G.flags['badge' + i] ? '#a07a10' : '#7a7a8a', 10);
        const vis = Object.keys(v).length, tot = (world.w / 4) * (world.h / 4); M.text(ctx, `Explorado: ${Math.min(100, Math.floor(vis * 100 / tot))}%`, px + 8, 270, DARK, 12); M.text(ctx, 'Z/X/M: fechar', px + 8, 290, '#6a6a7a', 11);
      },
    };
    M.openOv(ov);
  });

  // ---------- missões ----------
  UI.quests = () => new Promise(res => {
    const G = M.G; let c = 0;
    const all = () => M.story.missions.map(q => ({ q, s: q.status(G) })).filter(x => x.s > 0).sort((a, b) => (a.s === 2) - (b.s === 2) || (b.q.main ? 1 : 0) - (a.q.main ? 1 : 0));
    const ov = {
      key(a) { const l = all(); if (a === 'back' || a === 'quest') { M.audio.sfx('back'); M.closeOv(ov); res(); } else if (a === 'up' && l.length) { c = (c + l.length - 1) % l.length; M.audio.sfx('menu'); } else if (a === 'down' && l.length) { c = (c + 1) % l.length; M.audio.sfx('menu'); } },
      draw(ctx) {
        bg(ctx, '#3a4a2a', '#304022'); head(ctx, 'MISSÕES'); const l = all(); if (c >= l.length) c = Math.max(0, l.length - 1);
        M.panel(ctx, 8, 32, 214, 256, 'light'); const top = Math.max(0, c - 8);
        l.slice(top, top + 9).forEach((x, i) => { if (top + i === c) tri(ctx, 14, 44 + i * 27); M.text(ctx, (x.q.main ? '* ' : '') + x.q.name, 28, 40 + i * 27, x.s === 2 ? '#7a8a7a' : DARK, 11); M.text(ctx, x.s === 2 ? 'Concluída' : 'Ativa', 28, 53 + i * 27, x.s === 2 ? '#4a9a4a' : '#c07a20', 10); });
        M.panel(ctx, 228, 32, 244, 256, 'hud');
        if (l[c]) { const q = l[c].q; M.text(ctx, q.name, 238, 40, DARK, M.tw(q.name, 14) > 224 ? 11 : 14); M.wrap(q.desc, 224, 11).slice(0, 4).forEach((t, i) => M.text(ctx, t, 238, 62 + i * 13, '#3a3a4a', 11)); M.text(ctx, 'OBJETIVO', 238, 119, '#a05010', 11); M.wrap(q.obj(G), 224, 10).slice(0, 3).forEach((t, i) => M.text(ctx, t, 238, 133 + i * 12, DARK, 10)); const dest = q.where ? q.where(G) : 'Consulte o mapa para localizar o objetivo.'; M.text(ctx, 'PARA ONDE IR', 238, 174, '#276b9a', 11); M.wrap(dest, 224, 10).slice(0, 3).forEach((t, i) => M.text(ctx, t, 238, 188 + i * 12, DARK, 10)); const pr = q.prog ? q.prog(G) : ''; if (pr) M.text(ctx, 'Progresso: ' + pr, 238, 235, '#2a6a2a', 10); M.wrap('Recompensa: ' + q.reward, 224, 10).slice(0, 2).forEach((t, i) => M.text(ctx, t, 238, 254 + i * 11, '#6a4a1a', 10)); }
        else M.text(ctx, 'Nenhuma missão ainda.', 250, 60, DARK, 14);
        foot(ctx, 'Cima/Baixo: escolher   X/Q: voltar');
      },
    };
    M.openOv(ov);
  });

  // ---------- perfil / insígnias / efetividade ----------
  UI.profile = () => new Promise(res => {
    const G = M.G; let tab = 0;
    const ov = {
      key(a) { if (a === 'back') { M.audio.sfx('back'); M.closeOv(ov); res(); } else if (a === 'left' || a === 'right' || a === 'ok') { tab = 1 - tab; M.audio.sfx('menu'); } },
      draw(ctx) {
        bg(ctx, '#3a2a4a', '#301e40'); head(ctx, tab ? 'TABELA DE AFINIDADES' : 'PERFIL');
        if (!tab) {
          M.panel(ctx, 8, 32, 150, 150, 'hud'); ctx.drawImage(SP.portrait(SP.GABE, true), 0, 0, 32, 32, 18, 40, 130, 130);
          M.panel(ctx, 166, 32, 306, 150, 'light'); const t = Math.floor(G.time / 1000), hh = Math.floor(t / 3600), mm = Math.floor(t / 60) % 60, owned = new Set(G.party.concat(G.kennel).map(d => d.sp)).size, tot = D.SPECIES.length - 1;
          [['Nome', 'GABE'], ['Dinheiro', 'R$ ' + G.money], ['Tempo de jogo', `${hh}h ${String(mm).padStart(2, '0')}min`], ['Equipe / Canil', `${G.party.length} / ${G.kennel.length}`], ['Espécies recrutadas', `${owned}/${tot}`], ['Insígnias', `${G.flags.badges || 0}/8`], ['Patente', (G.flags.badges || 0) >= 8 ? 'Campeã de Cumbica' : (G.flags.badges || 0) >= 4 ? 'Mad Dog Veterana' : 'Mad Dog Novata']].forEach((r, i) => { M.text(ctx, r[0], 180, 40 + i * 20, '#4a4a5a', 13); M.text(ctx, r[1], 462 - M.tw(r[1], 13), 40 + i * 20, DARK, 13); });
          M.panel(ctx, 8, 190, 464, 98, 'light'); M.text(ctx, 'INSÍGNIAS DE CUMBICA', 20, 196, DARK, 13);
          for (let i = 1; i <= 8; i++) { const x = 20 + ((i - 1) % 4) * 114, y = 216 + Math.floor((i - 1) / 4) * 36, got = G.flags['badge' + i], st = M.story.gyms[i]; ctx.fillStyle = got ? st.color : '#8a8a96'; ctx.beginPath(); ctx.arc(x + 14, y + 12, 12, 0, 7); ctx.fill(); ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 2; ctx.stroke(); M.text(ctx, String(i), x + 10, y + 3, got ? '#fff' : '#555', 14); M.text(ctx, got ? st.badge.replace('Insígnia ', '') : '???', x + 32, y + 4, got ? DARK : '#8a8a96', 10); }
        } else {
          M.panel(ctx, 8, 32, 464, 256, 'light'); const T = D.TYPES, cw = 46, x0 = 92, y0 = 60;
          M.text(ctx, 'Atacante ↓  /  Defensor →', 14, 38, DARK, 11);
          T.forEach((t, i) => { M.text(ctx, D.TNAME[t].slice(0, 4), x0 + i * cw + 6, y0 - 16, D.TCOL[t], 11); M.text(ctx, D.TNAME[t], 14, y0 + i * 26 + 5, D.TCOL[t], 11); });
          T.forEach((a, i) => T.forEach((d, j) => { const e = D.eff(a, d); ctx.fillStyle = e > 1 ? '#7ad07a' : e < 1 ? '#e08080' : '#ebe6d4'; ctx.fillRect(x0 + j * cw, y0 + i * 26, cw - 2, 24); if (e !== 1) M.text(ctx, e > 1 ? 'x2' : '1/2', x0 + j * cw + 14, y0 + i * 26 + 4, '#fff', 14, '#000'); }));
        }
        foot(ctx, 'Esq/Dir ou Z: alternar Perfil/Afinidades   X: voltar');
      },
    };
    M.openOv(ov);
  });

  // ---------- configurações ----------
  UI.settings = () => new Promise(res => {
    let c = 0; const S = M.settings, names = ['Volume da música', 'Volume dos efeitos', 'Velocidade do texto'];
    const ov = {
      key(a) {
        if (a === 'back' || (a === 'ok' && c === 3)) { M.saveSettings(); M.audio.sfx('back'); M.closeOv(ov); res(); return; }
        if (a === 'up') c = (c + 3) % 4; else if (a === 'down') c = (c + 1) % 4;
        else if (a === 'left' || a === 'right') { const d = a === 'left' ? -1 : 1; if (c === 0) S.music = M.clamp(Math.round((S.music + d * .1) * 10) / 10, 0, 1); else if (c === 1) S.sfx = M.clamp(Math.round((S.sfx + d * .1) * 10) / 10, 0, 1); else if (c === 2) S.speed = M.clamp(S.speed + d, 1, 3); M.audio.vol(); M.audio.sfx('menu'); }
        else return; M.audio.sfx('menu');
      },
      draw(ctx) {
        bg(ctx, '#2a3a4a', '#223040'); head(ctx, 'CONFIGURAÇÕES'); M.panel(ctx, 40, 50, 400, 200, 'light');
        names.forEach((n, i) => { const y = 72 + i * 42; if (c === i) tri(ctx, 54, y + 4); M.text(ctx, n, 72, y, DARK, 15); const v = i === 0 ? S.music : i === 1 ? S.sfx : (S.speed - 1) / 2; ctx.fillStyle = '#6a6a7a'; ctx.fillRect(260, y + 5, 150, 8); ctx.fillStyle = '#e8a030'; ctx.fillRect(260, y + 5, Math.round(150 * v), 8); if (i === 2) M.text(ctx, ['Lento', 'Normal', 'Rápido'][S.speed - 1], 260, y + 16, '#4a4a5a', 11); });
        if (c === 3) tri(ctx, 54, 202); M.text(ctx, 'Voltar', 72, 198, DARK, 15); foot(ctx, 'Cima/Baixo: escolher   Esq/Dir: ajustar');
      },
    };
    M.openOv(ov);
  });

  // ---------- loja ----------
  UI.shop = (ids, title = 'LOJA') => new Promise(res => {
    const G = M.G; let c = 0, qty = 1;
    const ov = {
      async key(a) {
        if (a === 'back') { M.audio.sfx('back'); M.closeOv(ov); res(); return; }
        if (a === 'up') { c = (c + ids.length - 1) % ids.length; qty = 1; } else if (a === 'down') { c = (c + 1) % ids.length; qty = 1; }
        else if (a === 'left') qty = Math.max(1, qty - 1); else if (a === 'right') qty = Math.min(20, qty + 1);
        else if (a === 'ok') { const it = D.ITEMS[ids[c]], cost = it.price * qty; if (G.money < cost) { M.audio.sfx('err'); await M.say(null, 'Dinheiro insuficiente.'); return; } G.money -= cost; M.addItem(ids[c], qty); M.audio.sfx('buy'); await M.say(null, `Comprou ${qty}x ${it.name}.`, { auto: 900 }); qty = 1; return; }
        else return; M.audio.sfx('menu');
      },
      draw(ctx) {
        bg(ctx, '#2a4a3a', '#223e30'); head(ctx, title); M.panel(ctx, 10, 34, 290, 220, 'light');
        ids.forEach((id, i) => { const it = D.ITEMS[id]; if (i === c) tri(ctx, 18, 48 + i * 30); M.text(ctx, it.name, 34, 44 + i * 30, DARK, 14); M.text(ctx, 'R$' + it.price, 240, 46 + i * 30, '#6a4a1a', 13); });
        M.panel(ctx, 308, 34, 162, 150, 'hud'); const it = D.ITEMS[ids[c]]; M.wrap(it.desc, 142, 12).forEach((t, i) => M.text(ctx, t, 318, 44 + i * 16, '#3a3a4a', 12)); M.text(ctx, 'Você tem: ' + (G.bag[ids[c]] || 0), 318, 150, DARK, 12);
        M.panel(ctx, 308, 190, 162, 64, 'light'); M.text(ctx, `Qtd: < ${qty} >`, 320, 198, DARK, 14); M.text(ctx, 'Total: R$' + it.price * qty, 320, 220, '#6a4a1a', 13);
        M.rr(ctx, 10, 262, 460, 24, '#1a2640'); M.text(ctx, 'Dinheiro: R$ ' + G.money, 20, 266, '#f8e8a0', 14); foot(ctx, 'Cima/Baixo: item   Esq/Dir: qtd   Z: comprar   X: sair');
      },
    };
    M.openOv(ov);
  });

  // ---------- menu principal ----------
  UI.mainMenu = async () => {
    for (; ;) {
      const i = await M.choose({ items: ['Equipe', 'Mochila', 'Mapa', 'Missões', 'Perfil', 'Salvar', 'Opções', 'Fechar'], x: 340, y: 8, above: false });
      if (i === 0) await UI.party(); else if (i === 1) await UI.bag(); else if (i === 2) await UI.map(); else if (i === 3) await UI.quests(); else if (i === 4) await UI.profile();
      else if (i === 5) { const k = await M.choose({ items: ['Salvar', 'Cancelar'], x: 340, y: 8, cw: 90 }); if (k === 0) { M.Save.save(); M.audio.sfx('save'); await M.say(null, 'Progresso salvo!', { auto: 900 }); } }
      else if (i === 6) await UI.settings(); else return;
    }
  };

  // ---------- cartão de história (tela cheia) ----------
  UI.card = (pages, o = {}) => new Promise(res => {
    let pi = 0, t = 0;
    const ov = {
      update(dt) { t += dt; },
      key(a) { if (a === 'ok' || a === 'back') { if (t < 400) return; t = 0; pi++; M.audio.sfx('menu'); if (pi >= pages.length) { M.closeOv(ov); res(); } } },
      draw(ctx) { ctx.fillStyle = o.bg || '#05060c'; ctx.fillRect(0, 0, W, H); if (o.art) o.art(ctx, t); const a = Math.min(1, t / 600); ctx.globalAlpha = a; M.wrap(pages[pi], 400, 17).forEach((l, i) => M.text(ctx, l, 40, 110 + i * 28, '#f2ecd0', 17)); ctx.globalAlpha = 1; if (Math.floor(performance.now() / 400) % 2) M.text(ctx, 'v', 440, 290, '#e8c660', 14); },
    };
    M.openOv(ov);
  });

  // ---------- tela inicial ----------
  UI.title = (hasSave, onChoice) => {
    let t = 0, state = 'press', c = 0;
    const gabe = SP.person(SP.GABE, 'right', 0), dogs = ['pipoca', 'trovao', 'neve', 'esperta'].map(k => D.SPECIES[D.SP[k]]);
    const sky = (ctx) => { const g = ctx.createLinearGradient(0, 0, 0, 220); g.addColorStop(0, '#1b2a5a'); g.addColorStop(.6, '#e8884a'); g.addColorStop(1, '#f6c46a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 220); };
    const scene = {
      update(dt) { t += dt; },
      key(a) {
        if (state === 'press') { if (a === 'ok') { state = 'menu'; M.audio.sfx('ok'); } return; }
        const n = 3; if (a === 'up') c = (c + n - 1) % n; else if (a === 'down') c = (c + 1) % n; else if (a === 'ok') { if (c === 1 && !hasSave) { M.audio.sfx('err'); return; } M.audio.sfx('ok'); onChoice(['new', 'continue', 'settings'][c]); return; } else return; M.audio.sfx('menu');
      },
      draw(ctx) {
        sky(ctx); ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97 + 13) % W, (i * 53) % 90, 1, 1);
        const px = ((t / 18) % 700) - 120; ctx.fillStyle = '#20243a'; ctx.fillRect(px, 40, 44, 5); ctx.fillRect(px + 14, 34, 10, 17); ctx.fillRect(px + 38, 30, 5, 10);
        ctx.fillStyle = '#7a4a6a'; for (let i = 0; i < 16; i++) { const h = 30 + (i * 37) % 60; ctx.fillRect(i * 32, 190 - h, 28, h + 30); } ctx.fillStyle = '#4a3a58'; for (let i = 0; i < 12; i++) { const h = 20 + (i * 53) % 50; ctx.fillRect(i * 42 + 8, 200 - h, 36, h + 30); }
        ctx.fillStyle = '#ffe9a0'; for (let i = 0; i < 40; i++) ctx.fillRect(((i * 41) % 480) | 0, 150 + (i * 17) % 50, 2, 2);
        ctx.fillStyle = '#4a4e5a'; ctx.fillRect(0, 214, W, 106); ctx.fillStyle = '#5a5e6a'; ctx.fillRect(0, 214, W, 8); ctx.fillStyle = '#e8c840'; for (let x = 0; x < W; x += 40) ctx.fillRect((x - (t / 10) % 40), 270, 24, 4);
        const bob = Math.floor(t / 150) % 2, gx = 190;
        ctx.drawImage(SP.person(SP.GABE, 'right', 1 + bob), gx, 236, 48, 72); dogs.forEach((d, i) => ctx.drawImage(SP.dogSmall(d, 'right', 1 + (Math.floor(t / 120 + i) % 2)), gx - 44 - i * 36, 268 + (i % 2) * 8, 32, 32));
        for (const [txt, y, s, col] of [['MAD DOGS', 22, 54, '#f8e070'], ["OF CUMBICA'S", 82, 26, '#ffffff'], ['W O R L D', 112, 22, '#ff9ac0']]) { const w = M.tw(txt, s); for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [2, 2]]) M.text(ctx, txt, (W - w) / 2 + dx, y + dy, '#2a1030', s); M.text(ctx, txt, (W - w) / 2, y, col, s); }
        if (state === 'press') { if (Math.floor(t / 500) % 2) { const s = 'PRESSIONE ENTER'; M.text(ctx, s, (W - M.tw(s, 16)) / 2, 190, '#fff', 16, '#000'); } }
        else { M.panel(ctx, 150, 140, 180, 82); ['NOVO JOGO', 'CONTINUAR', 'CONFIGURAÇÕES'].forEach((s, i) => { if (i === c) tri(ctx, 160, 154 + i * 22); M.text(ctx, s, 176, 150 + i * 22, i === 1 && !hasSave ? '#9a9aa4' : DARK, 14); }); }
        M.text(ctx, 'Ginásios e personagens: adaptações fictícias. Jogo original.', 10, 304, '#d8d0e8', 10);
      },
    };
    return scene;
  };
})(window.MD);
