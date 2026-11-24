'use strict';
// ================= BATALHA POR TURNOS + RECRUTAMENTO =================
(function (M) {
  const SP = M.spr, D = M.D, W = M.W, H = M.H, UI = M.ui;
  const DARK = '#2a2a3a';

  // ---------- cenários ----------
  const BGS = {
    rua: { sky: ['#7ab8e8', '#cfe6f6'], gr: ['#6e727e', '#8a8e9a'], deco: 'city' },
    praca: { sky: ['#8cc8f0', '#e0f0fa'], gr: ['#5aa860', '#7cc47a'], deco: 'trees' },
    campo: { sky: ['#6ab0ec', '#d4ecfa'], gr: ['#4f9e52', '#6fbf6a'], deco: 'trees' },
    viela: { sky: ['#a08ac0', '#e8c8d8'], gr: ['#8a7a70', '#a89a8e'], deco: 'wall' },
    industrial: { sky: ['#a8a8b8', '#d8d8e0'], gr: ['#7a7a82', '#9a9aa2'], deco: 'factory' },
    base: { sky: ['#e8884a', '#f8d08a'], gr: ['#5a5e6a', '#7a7e8a'], deco: 'city' },
    ginasio: { sky: ['#3a3a58', '#52527a'], gr: ['#8a6a4a', '#a98a64'], deco: 'hall' },
    noite: { sky: ['#101830', '#2a3a68'], gr: ['#2e3a4e', '#3e4a60'], deco: 'city' },
  };
  const bgCache = {};
  function bgImg(key) {
    if (bgCache[key]) return bgCache[key];
    const b = BGS[key] || BGS.rua, c = M.mk(W, 222), x = M.cx(c), R = M.seed(key.length * 77 + 5);
    let g = x.createLinearGradient(0, 0, 0, 120); g.addColorStop(0, b.sky[0]); g.addColorStop(1, b.sky[1]); x.fillStyle = g; x.fillRect(0, 0, W, 130);
    if (b.deco === 'city' || b.deco === 'factory') for (let i = 0; i < 14; i++) { const w = 22 + R() * 24, h = 30 + R() * (b.deco === 'factory' ? 40 : 55), px = i * 36 - 6; x.fillStyle = M.shade(b.deco === 'factory' ? '#8a8a96' : '#9a8aa8', .8 + R() * .3); x.fillRect(px, 130 - h, w, h); x.fillStyle = 'rgba(255,240,170,.7)'; for (let j = 0; j < 6; j++) x.fillRect(px + 4 + (j % 2) * 9, 130 - h + 6 + Math.floor(j / 2) * 10, 4, 5); if (b.deco === 'factory' && i % 4 === 1) { x.fillStyle = '#6a6a74'; x.fillRect(px + 8, 130 - h - 22, 7, 24); } }
    if (b.deco === 'trees') for (let i = 0; i < 12; i++) { const px = i * 42 + R() * 10; x.fillStyle = '#5a3a24'; x.fillRect(px + 9, 100, 5, 30); x.fillStyle = M.shade('#3a9a4a', .8 + R() * .4); x.beginPath(); x.arc(px + 11, 94, 16, 0, 7); x.fill(); }
    if (b.deco === 'wall') { x.fillStyle = '#7a6a8a'; x.fillRect(0, 40, W, 90); const cols = ['#e84a8a', '#4ac8e8', '#f8d848', '#6ae86a']; for (let i = 0; i < 9; i++) { x.fillStyle = cols[i % 4]; x.fillRect(i * 56 + 6, 52 + R() * 20, 38, 22 + R() * 20); } }
    if (b.deco === 'hall') { x.fillStyle = '#44446a'; x.fillRect(0, 20, W, 110); for (let i = 0; i < 8; i++) { x.fillStyle = '#f8e0a0'; x.fillRect(i * 64 + 20, 36, 24, 14); x.fillStyle = '#34345a'; x.fillRect(i * 64 + 4, 20, 6, 110); } }
    g = x.createLinearGradient(0, 130, 0, 222); g.addColorStop(0, b.gr[0]); g.addColorStop(1, b.gr[1]); x.fillStyle = g; x.fillRect(0, 130, W, 92);
    x.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 30; i++) x.fillRect(R() * W, 134 + R() * 84, 14 + R() * 20, 2);
    x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.ellipse(372, 150, 64, 13, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(112, 205, 84, 16, 0, 0, 7); x.fill();
    return bgCache[key] = c;
  }

  // ---------- util ----------
  const nm = (d, foe, B) => (foe && B.wild ? d.name : d.name);
  const stageName = { atk: 'ATAQUE', def: 'DEFESA', spd: 'VELOCIDADE' };
  const effStat = (d, k) => D.stats(d)[k] * D.stageMul(d.stage[k]);
  const hasPP = (d) => d.moves.some(m => m.pp > 0);

  function calcDmg(a, d, mv, opts = {}) {
    const lv = a.lv, atk = effStat(a, 'atk'), def = effStat(d, 'def');
    let base = Math.floor(((2 * lv / 5 + 2) * mv.pow * atk / def) / 50) + 2;
    const stab = D.SPECIES[a.sp].type === mv.type ? 1.25 : 1, e = D.eff(mv.type, D.SPECIES[d.sp].type);
    const crit = opts.nocrit ? false : Math.random() < 1 / 16, rnd = 0.85 + Math.random() * 0.15;
    return { dmg: Math.max(1, Math.floor(base * stab * e * (crit ? 1.5 : 1) * rnd)), e, crit };
  }
  M.calcDmg = calcDmg;

  // ---------- batalha ----------
  M.battle = async function (o) {
    const G = M.G; let result = null;
    const B = {
      wild: !!o.wild, foes: o.foes.slice(), fi: 0, trainer: o.trainer || null, bg: o.bg || 'rua', prompt: '', fxs: [], escapes: 0,
      pl: { ox: -260, oy: 0, a: 1, sc: 1, hp: 0, blink: 0 }, fo: { ox: 260, oy: 0, a: 1, sc: 1, hp: 0, blink: 0 }, dogP: null, dogF: null, trainerShow: 0, part: new Set(), ball: null,
    };
    M.bs = B; G.party.forEach(d => { d.stage = { atk: 0, def: 0, spd: 0 }; d.stT = d.stT || 0; });
    const said = (t, ms = 700) => M.say(null, t, { auto: ms });
    const start = G.party.find(d => d.hp > 0);
    if (!start) return 'lose';
    const ov = {
      update(dt) { B.fxs.forEach(f => f.t += dt); B.fxs = B.fxs.filter(f => f.t < f.dur); },
      draw(ctx) { draw(ctx); },
    };
    function fxDraw(ctx, f) {
      const p = f.t / f.dur, col = f.col || '#fff'; ctx.save(); ctx.globalAlpha = 1 - p * p; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
      if (f.k === 'slash') for (let i = 0; i < 3; i++) { const o2 = i * 9; ctx.beginPath(); ctx.moveTo(f.x - 20 + o2, f.y - 24 + p * 10); ctx.lineTo(f.x + 6 + o2, f.y + 20 + p * 10); ctx.stroke(); }
      else if (f.k === 'fang') { const g = 26 - p * 22; ctx.beginPath(); ctx.moveTo(f.x - 18, f.y - g - 14); ctx.lineTo(f.x, f.y - g + 6); ctx.lineTo(f.x + 18, f.y - g - 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(f.x - 18, f.y + g + 14); ctx.lineTo(f.x, f.y + g - 6); ctx.lineTo(f.x + 18, f.y + g + 14); ctx.fill(); }
      else if (f.k === 'ring') { for (let i = 0; i < 3; i++) { ctx.globalAlpha = Math.max(0, (1 - p) * (1 - i * .25)); ctx.beginPath(); ctx.arc(f.x, f.y, 8 + p * 50 + i * 12, 0, 7); ctx.stroke(); } }
      else if (f.k === 'stars') for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + p * 2, r = 10 + p * 34; ctx.fillRect(f.x + Math.cos(a) * r - 3, f.y + Math.sin(a) * r - 3, 6, 6); }
      else if (f.k === 'shield') { ctx.globalAlpha = .6 * (1 - p); ctx.beginPath(); ctx.arc(f.x, f.y, 44, 0, 7); ctx.fill(); }
      else if (f.k === 'up' || f.k === 'down') for (let i = 0; i < 5; i++) { const yy = f.k === 'up' ? f.y + 30 - p * 60 - i * 8 : f.y - 30 + p * 60 + i * 8; ctx.fillRect(f.x - 24 + i * 12, yy, 4, 10); }
      else if (f.k === 'heart') for (let i = 0; i < 6; i++) { const xx = f.x - 30 + i * 12, yy = f.y - p * 50 - (i % 3) * 10; ctx.fillStyle = '#ff5a8a'; ctx.fillRect(xx, yy, 4, 3); ctx.fillRect(xx + 6, yy, 4, 3); ctx.fillRect(xx - 1, yy + 3, 12, 3); ctx.fillRect(xx + 2, yy + 6, 6, 3); ctx.fillRect(xx + 4, yy + 9, 2, 2); }
      else if (f.k === 'dust') for (let i = 0; i < 6; i++) { ctx.globalAlpha = .6 * (1 - p); ctx.beginPath(); ctx.arc(f.x - 20 + i * 8, f.y + 20 - p * 14, 5 + p * 8, 0, 7); ctx.fill(); }
      else if (f.k === 'swirl') for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28 + p * 8, r = 40 * (1 - p) + 6; ctx.fillRect(f.x + Math.cos(a) * r - 2, f.y + Math.sin(a) * r - 2, 4, 4); }
      ctx.restore();
    }
    function sprite(ctx, dog, S, x, y, sc, flip) {
      if (!dog) return; const img = SP.battleDog(D.SPECIES[dog.sp]); ctx.save(); ctx.globalAlpha = S.a * (S.blink && Math.floor(performance.now() / 70) % 2 ? .25 : 1);
      ctx.translate(x + S.ox, y + S.oy); ctx.scale((flip ? -1 : 1) * sc * S.sc, sc * S.sc); ctx.drawImage(img, -32, -64, 64, 64); ctx.restore();
    }
    function hud(ctx, d, S, x, y, mine) {
      if (!d) return; const mx = D.stats(d).hp; M.panel(ctx, x, y, 200, mine ? 70 : 58, 'light');
      M.text(ctx, d.name, x + 10, y + 5, DARK, M.tw(d.name, 14) > 130 ? 12 : 14); const lvT = 'Nv' + d.lv; M.text(ctx, lvT, x + 190 - M.tw(lvT, 13), y + 24 - 18, DARK, 13);
      M.text(ctx, 'HP', x + 10, y + 22, '#c04040', 12); M.hpBar(ctx, x + 32, y + 27, 150, 7, Math.max(0, S.hp) / mx);
      if (mine) { const t = `${Math.max(0, Math.ceil(S.hp))}/${mx}`; M.text(ctx, t, x + 190 - M.tw(t, 12), y + 35, DARK, 12); const cur = D.xpFor(d.lv), nx = D.xpFor(d.lv + 1); M.text(ctx, 'XP', x + 10, y + 52, '#3a70c0', 11); ctx.fillStyle = '#505060'; ctx.fillRect(x + 32, y + 60, 150, 3); ctx.fillStyle = '#48a8f0'; ctx.fillRect(x + 32, y + 60, d.lv >= 60 ? 150 : Math.round(150 * M.clamp((d.xp - cur) / (nx - cur), 0, 1)), 3); }
      if (d.st) M.text(ctx, 'MEDO', x + 120, y + 36, '#c04040', 11);
      M.typeChip(ctx, D.SPECIES[d.sp].type, x + 10, y + 36);
    }
    function draw(ctx) {
      ctx.drawImage(bgImg(B.bg), 0, 0);
      if (B.trainerShow > 0 && B.trainer && B.trainer.por) { ctx.save(); ctx.globalAlpha = Math.min(1, B.trainerShow); ctx.drawImage(SP.battlePortrait(B.trainer.por), 0, 0, 64, 64, 330 + (1 - Math.min(1, B.trainerShow)) * 80, 70, 96, 96); ctx.restore(); }
      sprite(ctx, B.dogF, B.fo, 372, 148, 1.4, false); sprite(ctx, B.dogP, B.pl, 112, 208, 2.1, true);
      B.fxs.forEach(f => fxDraw(ctx, f));
      if (B.ball) { const b = B.ball; ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, 7); ctx.fill(); ctx.strokeStyle = '#6a4a1a'; ctx.lineWidth = 2; ctx.stroke(); }
      if (B.dogF && B.fo.a > 0 && !B.hideHud) hud(ctx, B.dogF, B.fo, 12, 12, false);
      if (B.dogP && !B.hideHud) hud(ctx, B.dogP, B.pl, 268, 148, true);
      M.panel(ctx, 6, 222, 468, 94, 'dark'); if (B.prompt) M.text(ctx, B.prompt, 24, 238, '#fff', 15, '#0c1824');
    }
    M.openOv(ov);
    const addFx = (k, x, y, dur = 500, col) => { B.fxs.push({ k, x, y, t: 0, dur, col }); };
    const pos = (side) => side === 'pl' ? [112, 170] : [372, 120];
    const tweenHp = (side, to) => M.tween(B[side], 'hp', to, 450);
    const shake = async (side, n = 6) => { const S = B[side]; for (let i = 0; i < n; i++) { S.ox += (i % 2 ? 6 : -6); await M.wait(40); } S.ox = side === 'pl' ? 0 : 0; };

    // ---------- entradas ----------
    const sendFoe = async () => {
      B.dogF = B.foes[B.fi]; B.dogF.stage = { atk: 0, def: 0, spd: 0 }; B.fo.hp = B.dogF.hp; B.fo.a = 1; B.fo.oy = 0; B.fo.ox = 260; B.fo.sc = 1;
      if (G.dex) G.dex.seen[B.dogF.sp] = 1; M.audio.sfx('bark'); await M.tween(B.fo, 'ox', 0, 380);
    };
    const sendPlayer = async (d, first) => {
      B.dogP = d; d.stage = { atk: 0, def: 0, spd: 0 }; B.pl.hp = d.hp; B.pl.a = 1; B.pl.oy = 0; B.pl.sc = 1; B.pl.ox = -260; B.part.add(d.uid);
      await said(first ? `Vai, ${d.name}!` : `Vem, ${d.name}!`, 500); M.audio.sfx('bark'); await M.tween(B.pl, 'ox', 0, 380);
    };
    M.audio.sfx('battleStart'); for (let i = 0; i < 3; i++) { await M.tween(M.fx, 'flash', .8, 90); await M.tween(M.fx, 'flash', 0, 90); }
    M.audio.play(o.boss ? 'boss' : 'battle'); await M.fadeOut(200); M.fx.fade = 0; B.hideHud = true;
    if (B.trainer) {
      B.trainer.por = M.who(B.trainer.name).por; M.tween(B, 'trainerShow', 1, 500); await M.wait(500);
      await M.say(B.trainer.name, B.trainer.intro || `${B.trainer.name} quer disputar território com você!`);
      await said(`${B.trainer.name} mandou ${B.foes[0].name}!`, 600); B.trainerShow = 0;
    }
    B.hideHud = false; await sendFoe();
    if (!B.trainer) await said(`Um ${B.dogF.name} selvagem apareceu!`, 800);
    await sendPlayer(start, true);

    // ---------- efeitos de dano / golpes ----------
    const animMove = async (side, mv) => {
      const att = B[side], tgt = side === 'pl' ? 'fo' : 'pl', [tx, ty] = pos(tgt), [ax, ay] = pos(side), col = D.TCOL[mv.type], dir = side === 'pl' ? 1 : -1;
      const lunge = ['bite', 'charge', 'dash', 'claw', 'jump', 'trip', 'spin', 'ambush'].includes(mv.anim);
      if (mv.pow === 0) { const self = mv.fx && mv.fx.who === 'self'; const [sx, sy] = self ? [ax, ay] : [tx, ty]; M.audio.sfx('swoosh'); addFx(self ? 'shield' : 'ring', sx, sy, 600, col); await M.wait(520); return; }
      if (lunge) {
        if (mv.anim === 'ambush') { await M.tween(att, 'a', 0, 150); M.audio.sfx('swoosh'); att.ox = dir * 140; await M.tween(att, 'a', 1, 120); } else { M.audio.sfx('swoosh'); await M.tween(att, 'ox', dir * 130, 160); }
        addFx(mv.anim === 'bite' ? 'fang' : mv.anim === 'claw' ? 'slash' : mv.anim === 'trip' ? 'dust' : mv.anim === 'spin' ? 'swirl' : 'stars', tx, ty, 420, col);
      } else { M.audio.sfx(mv.anim === 'howl' ? 'bark' : 'bark'); addFx('ring', ax, ay, 500, col); await M.wait(260); addFx('ring', tx, ty, 450, col); }
    };
    const back = (side) => M.tween(B[side], 'ox', 0, 180);

    async function applyStat(side, dog, k, n) {
      const cur = dog.stage[k];
      if ((n < 0 && cur <= -6) || (n > 0 && cur >= 6)) { await said(`${dog.name} já está no limite de ${stageName[k]}!`); return; }
      dog.stage[k] = M.clamp(cur + n, -6, 6); const [x, y] = pos(side); addFx(n > 0 ? 'up' : 'down', x, y, 600, n > 0 ? '#58d858' : '#e85858'); M.audio.sfx(n > 0 ? 'heal' : 'err');
      await said(`${stageName[k]} de ${dog.name} ${n > 1 ? 'subiu muito' : n > 0 ? 'subiu' : n < -1 ? 'caiu muito' : 'caiu'}!`);
    }

    // retorna 'ok' | 'skip'
    async function useMove(side, mvSlot) {
      const att = side === 'pl' ? B.dogP : B.dogF, tgSide = side === 'pl' ? 'fo' : 'pl', tg = side === 'pl' ? B.dogF : B.dogP;
      if (att.st === 'medo') { att.stT--; if (att.stT <= 0) att.st = null; if (Math.random() < 0.4) { await said(`${att.name} está com medo demais para agir!`); return; } }
      let mv; if (mvSlot == null) { mv = { id: 'esforco', name: 'Esforço', type: 'rua', pow: 35, acc: 100, anim: 'charge', fx: { k: 'recoil', f: 0.25 }, prio: 0 }; } else { const slot = att.moves[mvSlot]; slot.pp--; mv = D.MOVES[slot.id]; }
      await said(`${att.name} usou ${mv.name}!`, 450);
      if (mv.acc < 100 && Math.random() * 100 >= mv.acc) { await said('Mas errou o alvo!'); return; }
      await animMove(side, mv);
      if (mv.pow > 0) {
        const r = calcDmg(att, tg, mv); M.audio.sfx(r.e > 1 ? 'weak' : r.crit ? 'crit' : 'hit'); B[tgSide].blink = 1; shake(tgSide, 6);
        const nhp = Math.max(0, tg.hp - r.dmg); tg.hp = nhp; await tweenHp(tgSide, nhp); B[tgSide].blink = 0; B[tgSide].ox = 0; if (mv.anim !== 'ambush' && ['bite', 'charge', 'dash', 'claw', 'jump', 'trip', 'spin'].includes(mv.anim)) await back(side);
        if (r.crit) await said('Golpe crítico!', 500); if (r.e > 1) await said('Foi super efetivo!', 600); else if (r.e < 1) await said('Não foi muito efetivo...', 600);
        if (mv.fx && mv.fx.k === 'recoil' && r.dmg > 0) { const rd = Math.max(1, Math.floor(r.dmg * mv.fx.f)); att.hp = Math.max(0, att.hp - rd); await tweenHp(side, att.hp); await said(`${att.name} se machucou com o impacto!`, 500); }
      } else if (['bite', 'charge', 'dash', 'claw', 'jump', 'trip', 'spin'].includes(mv.anim)) await back(side);
      if (tg.hp > 0 && mv.fx) {
        if (mv.fx.k === 'fear' && !tg.st && Math.random() * 100 < mv.fx.ch) { tg.st = 'medo'; tg.stT = 3; await said(`${tg.name} ficou com medo!`); }
        if (mv.fx.k === 'stat' && Math.random() * 100 < mv.fx.ch) { if (mv.fx.who === 'self') await applyStat(side, att, mv.fx.s, mv.fx.n); else await applyStat(tgSide, tg, mv.fx.s, mv.fx.n); }
      } else if (mv.fx && mv.fx.k === 'stat' && mv.fx.who === 'self' && att.hp > 0) { if (Math.random() * 100 < mv.fx.ch) await applyStat(side, att, mv.fx.s, mv.fx.n); }
    }

    // ---------- XP ----------
    async function awardXp(foe) {
      const share = G.party.filter(d => d.hp > 0 && B.part.has(d.uid)); if (!share.length) return;
      const total = Math.max(1, Math.floor(D.baseXp(D.SPECIES[foe.sp]) * foe.lv * (B.trainer ? 1.5 : 1) / 7)), each = Math.max(1, Math.floor(total / share.length));
      for (const d of share) {
        d.xp += each; await said(`${d.name} ganhou ${each} de EXP!`, 600);
        while (d.lv < 60 && d.xp >= D.xpFor(d.lv + 1)) {
          const before = D.stats(d); d.lv++; const after = D.stats(d); d.hp = Math.min(after.hp, d.hp + (after.hp - before.hp));
          if (B.dogP === d) { B.pl.hp = d.hp; }
          M.audio.sfx('level'); await said(`${d.name} subiu para o nível ${d.lv}!`, 800);
          await said(`HP +${after.hp - before.hp}  ATQ +${after.atk - before.atk}  DEF +${after.def - before.def}  VEL +${after.spd - before.spd}`, 1100);
          await learnMoves(d);
        }
      }
    }
    async function learnMoves(d) {
      const sp = D.SPECIES[d.sp];
      for (const [lv, id] of D.learnset(sp)) {
        if (lv !== d.lv || d.moves.some(m => m.id === id)) continue; const mv = D.MOVES[id];
        if (d.moves.length < 4) { d.moves.push({ id, pp: mv.pp }); M.audio.sfx('item'); await said(`${d.name} aprendeu ${mv.name}!`, 900); continue; }
        await M.say(null, `${d.name} quer aprender ${mv.name}, mas já sabe 4 golpes. Esquecer algum?`, { keep: true });
        const k = await M.choose({ items: d.moves.map(m => D.MOVES[m.id].name).concat(['Não aprender']), x: 250, y: 40, cancel: false }); M.closeDlg();
        if (k >= 0 && k < 4) { const old = D.MOVES[d.moves[k].id].name; d.moves[k] = { id, pp: mv.pp }; await said(`${d.name} esqueceu ${old} e aprendeu ${mv.name}!`, 1000); } else await said(`${d.name} não aprendeu ${mv.name}.`, 700);
      }
    }

    // ---------- faints ----------
    async function foeFainted() {
      M.audio.sfx('faint'); await Promise.all([M.tween(B.fo, 'oy', 40, 400), M.tween(B.fo, 'a', 0, 400)]);
      await said(B.wild ? `${B.dogF.name} se rendeu e fugiu correndo!` : `${B.dogF.name} não aguenta mais!`, 800);
      await awardXp(B.dogF); B.dogF.hp = 0;
      if (B.fi < B.foes.length - 1) { B.fi++; if (B.trainer) await said(`${B.trainer.name} mandou ${B.foes[B.fi].name}!`, 700); await sendFoe(); B.part = new Set([B.dogP.uid]); return 'next'; }
      return 'win';
    }
    async function playerFainted() {
      M.audio.sfx('faint'); await Promise.all([M.tween(B.pl, 'oy', 40, 400), M.tween(B.pl, 'a', 0, 400)]); await said(`${B.dogP.name} desmaiou de cansaço!`, 800);
      if (!G.party.some(d => d.hp > 0)) return 'lose';
      let i; do { i = await UI.party({ pick: true, title: 'Quem entra agora?', filter: d => d.hp > 0 }); } while (i < 0);
      await sendPlayer(G.party[i], false); return 'swapped';
    }
    // retorna null | 'win' | 'lose' | 'next' | 'swapped'
    async function settle() {
      let r = null;
      if (B.dogF.hp <= 0 && B.fo.a > 0) r = await foeFainted();
      if (B.dogP.hp <= 0 && B.pl.a > 0) { const q = await playerFainted(); r = r === 'win' ? 'win' : q; }
      return r;
    }

    // ---------- IA ----------
    function aiPick() {
      const d = B.dogF, usable = d.moves.map((m, i) => ({ m, i })).filter(x => x.m.pp > 0); if (!usable.length) return null;
      const sc = usable.map(x => { const mv = D.MOVES[x.m.id]; let s; if (mv.pow > 0) { s = mv.pow * D.eff(mv.type, D.SPECIES[B.dogP.sp].type) * (D.SPECIES[d.sp].type === mv.type ? 1.25 : 1) * mv.acc / 100; } else { const k = mv.fx && mv.fx.s, tgt = mv.fx && mv.fx.who === 'self' ? d : B.dogP; s = (k && Math.abs(tgt.stage[k]) < 2 && Math.random() < .5) ? 45 : 5; } return { i: x.i, s: s * (0.8 + Math.random() * .4) }; });
      if (B.trainer && Math.random() < .75) return sc.sort((a, b) => b.s - a.s)[0].i;
      const tot = sc.reduce((a, b) => a + b.s, 0); let r = Math.random() * tot; for (const s of sc) { r -= s.s; if (r <= 0) return s.i; } return sc[0].i;
    }

    // ---------- menus ----------
    async function playerChoice() {
      for (; ;) {
        B.prompt = `O que ${B.dogP.name} vai fazer?`;
        const c = await M.choose({ items: ['ATACAR', 'EQUIPE', 'MOCHILA', 'RECRUTAR', 'FUGIR'], cols: 2, x: 236, y: 226, rh: 24, cw: 112, cancel: false });
        if (c === 0) {
          B.prompt = '';
          const items = B.dogP.moves.map(m => ({ label: D.MOVES[m.id].name, sub: `${m.pp}/${D.MOVES[m.id].pp}`, disabled: m.pp <= 0 })), noPP = !hasPP(B.dogP);
          if (noPP) return { t: 'move', i: null };
          let hover = 0;
          const k = await M.choose({ items, x: 6, y: 226, w: 280, cw: 270, rh: 20, onMove: (i) => hover = i, draw: (ctx, i) => { const mv = D.MOVES[B.dogP.moves[i].id]; M.panel(ctx, 292, 222, 182, 94, 'light'); M.typeChip(ctx, mv.type, 302, 230); M.text(ctx, mv.pow ? `Poder ${mv.pow}  Prec ${mv.acc}` : `Status  Prec ${mv.acc}`, 302, 250, DARK, 12); M.wrap(mv.desc, 162, 11).slice(0, 3).forEach((t, n) => M.text(ctx, t, 302, 268 + n * 14, '#4a4a5a', 11)); } });
          if (k >= 0) return { t: 'move', i: k };
        } else if (c === 1) {
          B.prompt = ''; const i = await UI.party({ pick: true, title: 'Trocar por quem?', filter: d => d.hp > 0 && d !== B.dogP }); if (i >= 0) return { t: 'switch', i };
        } else if (c === 2) {
          B.prompt = ''; const id = await UI.bag({ only: 'Cura', pick: true }); if (id) { const i = await UI.party({ pick: true, title: 'Usar em quem?' }); if (i >= 0) return { t: 'item', id, i }; }
        } else if (c === 3) {
          if (!B.wild) { B.prompt = ''; await M.say(null, 'Cachorro de treinador não aceita petisco de estranho! Vença a disputa.'); continue; }
          if (o.noRecruit) { B.prompt = ''; await M.say(null, 'Esse cachorro não quer saber de você agora.'); continue; }
          B.prompt = ''; const id = await UI.bag({ only: 'Recrutar', pick: true }); if (id) return { t: 'recruit', id };
        } else if (c === 4) return { t: 'flee' };
      }
    }

    // ---------- recrutamento ----------
    async function tryRecruit(id) {
      const it = D.ITEMS[id], f = B.dogF; M.delItem(id); await said(`Gabe ofereceu ${it.name} para ${f.name}...`, 700);
      f.trust = Math.min(100, (f.trust || 0) + it.trust); const p = D.recruitChance(f, id);
      const [x0, y0] = [112, 150], [x1, y1] = pos('fo'); M.audio.sfx('throw'); const ball = B.ball = { x: x0, y: y0 }; const t = { v: 0 };
      await new Promise(res => { const st = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - st) / 500); ball.x = x0 + (x1 - x0) * k; ball.y = y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * 60; k < 1 ? requestAnimationFrame(step) : res(); }; step(); });
      B.ball = null; addFx('stars', x1, y1, 400, '#f8d848'); const per = Math.pow(p, 1 / 3);
      for (let i = 1; i <= 3; i++) {
        M.audio.sfx('shake'); await M.tween(B.fo, 'ox', -8, 90); await M.tween(B.fo, 'ox', 8, 160); await M.tween(B.fo, 'ox', 0, 90); await M.wait(350);
        if (Math.random() > per) {
          M.audio.sfx('recruitFail'); const msgs = ['Quase! Ele ainda está desconfiado.', 'Ihh, ele se soltou e voltou a rosnar!', 'Ele hesitou, mas não confiou em você ainda.', 'Quase foi! Tenta de novo.'];
          await said(i === 1 ? 'Ele nem quis cheirar...' : msgs[Math.min(3, i)], 900); if (f.trust >= 30) await said(`${f.name} confia mais em você (${f.trust}%).`, 700); return false;
        }
      }
      // sucesso
      M.audio.sfx('recruitOk'); addFx('heart', x1, y1 - 20, 1200); await M.tween(B.fo, 'sc', 0.9, 200); await M.tween(B.fo, 'sc', 1.05, 200); await M.wait(500);
      f.hp = Math.max(1, f.hp); f.st = null; f.stage = { atk: 0, def: 0, spd: 0 };
      if (G.dex) { G.dex.own[f.sp] = 1; G.dex.seen[f.sp] = 1; }
      M.audio.jingle('victory', false);
      await said(`${f.name} confiou em Gabe e entrou pra matilha!`, 1200);
      if (G.party.length < 6) G.party.push(f); else { G.kennel.push(f); await said(`${f.name} foi para o canil.`, 900); }
      return true;
    }

    // ---------- loop de turnos ----------
    let guard = 0;
    for (; ;) {
      if (++guard > 400) { result = 'flee'; break; }
      const act = await playerChoice(); B.prompt = '';
      const pDog = B.dogP, fDog = B.dogF, turn = [];
      let fMove = aiPick(); const fMv = fMove == null ? null : D.MOVES[fDog.moves[fMove].id];
      if (act.t === 'flee') {
        if (!B.wild) { await said('Não dá pra fugir de uma disputa de território!'); continue; }
        B.escapes++; const f = (D.stats(pDog).spd * 128 / Math.max(1, D.stats(fDog).spd) + 30 * B.escapes) % 256;
        if (f > Math.random() * 256 || D.stats(pDog).spd >= D.stats(fDog).spd * 1.3) { M.audio.sfx('swoosh'); await said('Gabe saiu correndo! Escapou!'); result = 'flee'; break; }
        await said('Não conseguiu escapar!');
      } else if (act.t === 'switch') {
        await said(`Valeu, ${B.dogP.name}!`, 500); await M.tween(B.pl, 'a', 0, 200); await sendPlayer(G.party[act.i], false);
      } else if (act.t === 'item') {
        const dog = G.party[act.i], msg = M.useHeal(act.id, dog);
        if (!msg) { await said('Não vai ter efeito.'); continue; }
        M.delItem(act.id); M.audio.sfx('heal'); if (dog === B.dogP) { await tweenHp('pl', dog.hp); } await said(msg, 800);
      } else if (act.t === 'recruit') {
        if (await tryRecruit(act.id)) { result = 'recruit'; break; }
      } else {
        // ordem por prioridade/velocidade
        const pMv = act.i == null ? { prio: 0 } : D.MOVES[pDog.moves[act.i].id];
        const ps = effStat(pDog, 'spd'), fs = effStat(fDog, 'spd');
        const pFirst = (pMv.prio || 0) !== ((fMv && fMv.prio) || 0) ? (pMv.prio || 0) > ((fMv && fMv.prio) || 0) : ps === fs ? Math.random() < .5 : ps > fs;
        turn.push(pFirst ? 'pl' : 'fo', pFirst ? 'fo' : 'pl');
        let r = null;
        for (const side of turn) {
          const dog = side === 'pl' ? pDog : fDog; if (dog.hp <= 0 || (side === 'pl' ? B.dogP !== pDog : B.dogF !== fDog)) continue;
          if (side === 'pl') await useMove('pl', act.i); else await useMove('fo', fMove);
          r = await settle(); if (r) break;
        }
        if (r === 'win') { result = 'win'; break; } if (r === 'lose') { result = 'lose'; break; }
      }
      // resposta do inimigo quando a ação do jogador não foi golpe
      if (act.t !== 'move' && !result) {
        if (B.dogF.hp > 0) { await useMove('fo', fMove); const r = await settle(); if (r === 'lose') { result = 'lose'; break; } if (r === 'win') { result = 'win'; break; } }
      }
      // fim de turno
      if (result) break;
    }

    // ---------- fim ----------
    G.party.forEach(d => { d.stage = { atk: 0, def: 0, spd: 0 }; d.st = null; d.stT = 0; });
    B.hideHud = true;
    if (result === 'win') {
      M.audio.jingle('victory', false);
      if (B.trainer) {
        B.trainer.por = B.trainer.por || M.who(B.trainer.name).por; B.trainerShow = 1; await M.wait(300);
        await M.say(B.trainer.name, B.trainer.win || 'Perdi... mas foi uma boa disputa!'); B.trainerShow = 0;
        const money = B.trainer.money || 0; if (money) { G.money += money; await said(`Gabe ganhou R$ ${money}!`, 1100); }
      } else await said('Gabe venceu a disputa!', 700);
    } else if (result === 'lose') { M.audio.jingle('defeat', false); await M.say(null, 'Todos os cachorros da equipe estão exaustos... Gabe foi levado de volta para casa.'); }
    await M.fadeOut(250); M.closeOv(ov); M.closeDlg(); M.bs = null;
    return result;
  };
})(window.MD);
