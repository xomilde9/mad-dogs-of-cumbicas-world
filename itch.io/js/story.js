'use strict';
// ================= HISTÓRIA: NPCs, 8 ginásios fictícios, missões, encontros, handlers =================
(function (M) {
  const D = M.D, SP = M.spr, MAPS = M.maps, P = M.places, Wd = M.world, UI = M.ui;
  const S = M.story = { npcs: {}, gyms: [null], missions: [], enc: {}, handlers: {} };
  const H = S.handlers;
  const own = () => new Set(M.G.party.concat(M.G.kennel).map(d => d.sp));
  const owns = (k) => own().has(D.SP[k]);
  const fl = (k) => !!M.G.flags[k];
  const setf = (k) => { M.G.flags[k] = 1; };
  const healAll = () => { M.G.party.forEach(D.heal); M.G.kennel.forEach(D.heal); };
  const once = async (key, fn) => { if (fl(key)) return false; setf(key); await fn(); return true; };

  // ---------- helpers de NPC ----------
  const free = (m, x, y) => m.inb(x, y) && !m.sol[m.i(x, y)] && !m.warps[m.i(x, y)] && !m.dyn.some(d => d.x === x && d.y === y);
  const snap = (mapId, x, y) => { const m = MAPS[mapId]; if (free(m, x, y)) return [x, y]; for (let r = 1; r < 8; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (Math.max(Math.abs(i), Math.abs(j)) === r && free(m, x + i, y + j)) return [x + i, y + j]; return [x, y]; };
  const addNpc = (mapId, id, name, x, y, dir, look, o = {}) => { const [sx, sy] = snap(mapId, x, y); if (look) M.portraits[name] = look; (S.npcs[mapId] = S.npcs[mapId] || []).push(Object.assign({ id, name, x: sx, y: sy, dir, look }, o)); };
  const dogNpc = (mapId, id, key, x, y, text) => { const [sx, sy] = snap(mapId, x, y); (S.npcs[mapId] = S.npcs[mapId] || []).push({ id, name: D.SPECIES[D.SP[key]].name, x: sx, y: sy, dir: 'down', dog: key, wander: 2, hx: sx, hy: sy, t: text }); };
  const L = (skin, hair, style, shirt, pants, o) => Object.assign({ skin, hair, style, shirt, pants, shoes: '#eeeeee' }, o || {});

  // ---------- encontros selvagens por zona (espécie, nvMin, nvMax, peso) ----------
  S.enc = {
    praca: [['caramelo', 3, 5, 28], ['churrasco', 3, 5, 25], ['biscoito', 3, 5, 25], ['bolinha', 3, 4, 10], ['fifi', 4, 6, 9], ['rei', 5, 6, 1]],
    terreno: [['caramelo', 3, 6, 25], ['pretinho', 4, 7, 20], ['fagulha', 4, 7, 20], ['salsicha', 4, 7, 15], ['bolinha', 3, 5, 12], ['mimi', 5, 7, 8]],
    praca2: [['fifi', 6, 9, 22], ['pelucia', 7, 10, 18], ['mimi', 6, 9, 18], ['churrasco', 6, 8, 14], ['biscoito', 6, 8, 14], ['salsicha', 7, 10, 13], ['fantasma', 9, 10, 1]],
    cidade: [['capeta', 6, 9, 20], ['zeppelin', 7, 10, 18], ['salsicha', 6, 9, 18], ['caramelo', 6, 8, 16], ['fagulha', 7, 10, 14], ['bolota', 8, 10, 14]],
    ceu: [['tornado', 10, 13, 14], ['salsicha', 10, 12, 18], ['bolota', 10, 13, 16], ['cacau', 10, 13, 18], ['esperta', 10, 13, 12], ['fagulha', 10, 12, 12], ['trovao', 11, 14, 10]],
    bosque: [['leao', 9, 12, 20], ['pretinho', 9, 12, 20], ['cacau', 9, 12, 20], ['marreta', 10, 13, 20], ['sombra', 11, 13, 9], ['neve', 11, 13, 10], ['gelo', 12, 13, 1]],
    arena: [['tyson', 14, 17, 20], ['marreta', 14, 17, 20], ['trovao', 14, 18, 16], ['tornado', 15, 18, 12], ['bolota', 14, 17, 12], ['leao', 15, 18, 10], ['mortadela', 16, 18, 10]],
    amarildo: [['sargento', 15, 19, 22], ['bolota', 15, 18, 20], ['cacau', 15, 18, 20], ['tyson', 16, 19, 18], ['neve', 17, 19, 20]],
    praca4: [['bolota', 17, 20, 22], ['sargento', 18, 21, 20], ['mortadela', 18, 21, 20], ['pelucia', 17, 20, 20], ['cacau', 17, 20, 18]],
    grafites: [['faisca', 22, 25, 18], ['pretinho', 22, 25, 18], ['sombra', 23, 26, 12], ['laje', 22, 25, 20], ['mimi', 22, 25, 12], ['capeta', 23, 26, 12], ['mortadela', 23, 26, 6], ['fantasma', 25, 26, 1]],
    industrial: [['zeppelin', 26, 29, 20], ['capeta', 26, 29, 18], ['carvao', 28, 31, 14], ['mortadela', 27, 30, 18], ['marreta', 26, 29, 18], ['guardiao', 29, 31, 8]],
    vila: [['fumaca', 31, 34, 20], ['neve', 31, 34, 18], ['tornado', 32, 35, 18], ['carvao', 32, 35, 14], ['sargento', 32, 35, 14], ['laje', 31, 34, 14], ['gelo', 34, 35, 1]],
    base: [['fumaca', 36, 39, 20], ['tornado', 36, 39, 18], ['neve', 36, 39, 18], ['sombra', 36, 39, 16], ['carvao', 37, 40, 14], ['sargento', 37, 40, 14], ['gelo', 38, 40, 2]],
  };

  // ---------- ginásios fictícios (8) ----------
  const GY = [null,
    { color: '#f8d848', badge: 'Insígnia Zigue-Zague', leader: { name: 'Rafa Zigue-Zague', look: L('#e8b890', '#2a1a10', 'short', '#f08020', '#2a3a6a', { cap: '#f08020' }), team: [['fagulha', 8], ['salsicha', 9], ['tornado', 10]], money: 400, intro: 'Eaí, Gabe! Aqui na Praça Cummins ninguém vence a gente na velocidade. Zigue-zague é o meu sobrenome, parça!', win: 'Pô, me driblou! Toma a Insígnia Zigue-Zague, tá ligado?', reward: ['agua', 3] }, subs: [{ id: 'g1a', name: 'Moleque Beto', look: L('#d8a070', '#222', 'short', '#40a0e0', '#555', { cap: '#e04040' }), team: [['caramelo', 6], ['churrasco', 6]], money: 120, pos: [6, 8], dir: 'right' }, { id: 'g1b', name: 'Dona Cida da Praça', look: L('#e8c0a0', '#bbb', 'bun', '#c060a0', '#444'), team: [['fifi', 7], ['biscoito', 7]], money: 140, pos: [8, 5], dir: 'left' }], quiz: { q: 'Qual tipo é forte contra o tipo VELOZ?', o: ['Guardião', 'Caótico', 'Selvagem'], a: 0 } },
    { color: '#58b8f0', badge: 'Insígnia Lousa Esperta', leader: { name: 'Profª Ludmila', look: L('#e8c0a0', '#3a2a20', 'long', '#7a50b0', '#2a2a3a', { extra: 'glasses' }), team: [['esperta', 13], ['pelucia', 14], ['cacau', 15], ['fifi', 16]], money: 700, intro: 'Boa tarde, turma! Hoje a aula é: estratégia. Quem não estudou os tipos... reprova no CEU!', win: 'Nota dez! Pode levar a Insígnia Lousa Esperta.', reward: ['racaoR', 3] }, subs: [{ id: 'g2a', name: 'Estagiário Vini', look: L('#d8a070', '#222', 'short', '#4a80d0', '#333', { extra: 'glasses' }), team: [['pelucia', 11], ['fifi', 11]], money: 200, pos: [6, 8], dir: 'right' }, { id: 'g2b', name: 'Merendeira Rose', look: L('#c89070', '#222', 'bun', '#f0f0f0', '#555', { extra: 'apron' }), team: [['cacau', 12], ['biscoito', 11]], money: 220, pos: [8, 5], dir: 'left' }], quiz: { q: 'Quanto é 2 + 2 × 3, segundo a Profª?', o: ['12', '8', '10'], a: 1 } },
    { color: '#e86040', badge: 'Insígnia Pitbull de Aço', leader: { name: 'Tonho Pitbull', look: L('#c89070', '#222', 'bald', '#c02020', '#222', { extra: 'beard', beard: '#222' }), team: [['tyson', 17], ['marreta', 18], ['trovao', 19], ['mortadela', 20]], money: 1000, intro: 'Na Arena Farias, quem manda é a força! Se aguentar o tranco, a Insígnia é sua, magrão!', win: 'Caramba... aguentou o tranco! Pega a Insígnia Pitbull de Aço.', reward: ['biscoito', 2] }, subs: [{ id: 'g3a', name: 'Zagueiro Naldo', look: L('#a06848', '#222', 'short', '#30a040', '#fff'), team: [['marreta', 15], ['bolota', 15]], money: 300, pos: [6, 8], dir: 'right' }, { id: 'g3b', name: 'Goleiro Edu', look: L('#e8b890', '#a04020', 'short', '#e8e820', '#222'), team: [['tyson', 16], ['trovao', 15]], money: 320, pos: [8, 5], dir: 'left' }], quiz: { q: 'Quantos jogadores tem um time de futebol em campo?', o: ['9', '11', '13'], a: 1 } },
    { color: '#58c070', badge: 'Insígnia Muralha Verde', leader: { name: 'Seu Osvaldo', look: L('#e8c0a0', '#ccc', 'short', '#3a6a3a', '#4a4a3a', { extra: 'glasses', cap: '#3a6a3a' }), team: [['sargento', 21], ['bolota', 22], ['mortadela', 23], ['sargento', 24]], money: 1300, intro: 'Tô nessa praça desde os anos 90, meu filho. Defender o território é a minha especialidade.', win: 'Hmpf... a juventude tá forte. Leva a Insígnia Muralha Verde.', reward: ['foto', 1] }, subs: [{ id: 'g4a', name: 'Vigia Tião', look: L('#b88060', '#222', 'short', '#3a4a8a', '#222', { cap: '#222' }), team: [['bolota', 19], ['sargento', 19]], money: 380, pos: [6, 8], dir: 'right' }, { id: 'g4b', name: 'Seu Anselmo', look: L('#e8c0a0', '#bbb', 'bald', '#b08030', '#555'), team: [['cacau', 19], ['mortadela', 19]], money: 400, pos: [8, 5], dir: 'left' }], quiz: { q: 'Em que ano a Praça dos Cachorros era o ponto de encontro, segundo Seu Osvaldo?', o: ['Anos 90', 'Anos 2020', 'Nunca foi'], a: 0 } },
    { color: '#e060c0', badge: 'Insígnia Spray Maluco', leader: { name: 'MC Spray', look: L('#d8a070', '#e02080', 'short', '#20c0c0', '#2a2a3a', { bandana: '#e02080' }), team: [['capeta', 25], ['zeppelin', 26], ['mimi', 27], ['faisca', 28]], money: 1600, intro: 'Aê, aê, aê! Aqui no Caminho dos Grafites a arte é caos, mano! Bora ver se cê tem estilo!', win: 'Que rima foi essa! Leva a Insígnia Spray Maluco!', reward: ['coleira', 1] }, subs: [{ id: 'g5a', name: 'Grafiteiro Zeca', look: L('#c89070', '#222', 'short', '#f08020', '#334', { bandana: '#222' }), team: [['laje', 22], ['pretinho', 22]], money: 450, pos: [6, 8], dir: 'right' }, { id: 'g5b', name: 'Skatista Dani', look: L('#e8c0a0', '#40a0e0', 'long', '#a030a0', '#333', { cap: '#222' }), team: [['zeppelin', 23], ['faisca', 23]], money: 470, pos: [8, 5], dir: 'left' }], quiz: { q: 'Qual cor NÃO é primária (tinta)?', o: ['Azul', 'Verde', 'Amarelo'], a: 1 } },
    { color: '#c08030', badge: 'Insígnia Concreto Armado', leader: { name: 'Mestre Betoneira', look: L('#b88060', '#222', 'short', '#e8a020', '#3a3a4a', { helmet: '#e8c020', extra: 'beard', beard: '#222' }), team: [['carvao', 29], ['mortadela', 30], ['marreta', 31], ['guardiao', 32]], money: 1900, intro: 'Cidade Industrial é trampo pesado, jovem. Aqui só passa quem é duro na queda!', win: 'Tu é de concreto armado! Pega a Insígnia. E olha: achei essa chave num galpão... leva.', reward: ['chave', 1] }, subs: [{ id: 'g6a', name: 'Soldador Jão', look: L('#a06848', '#222', 'short', '#888', '#333', { helmet: '#555' }), team: [['carvao', 26], ['marreta', 26]], money: 520, pos: [6, 8], dir: 'right' }, { id: 'g6b', name: 'Operadora Kátia', look: L('#e8b890', '#a04020', 'bun', '#e8c020', '#334', { helmet: '#e8c020' }), team: [['zeppelin', 27], ['mortadela', 27], ['capeta', 27]], money: 540, pos: [8, 5], dir: 'left' }], quiz: { q: 'Que equipamento o peão usa na cabeça na obra?', o: ['Boné', 'Capacete', 'Touca'], a: 1 } },
    { color: '#f0f0f0', badge: 'Insígnia Faixa Dupla', leader: { name: 'Cap. Tânia Turbo', look: L('#e8c0a0', '#222', 'long', '#e03030', '#222', { helmet: '#fff' }), team: [['tornado', 33], ['fumaca', 34], ['salsicha', 35], ['navalha', 36]], money: 2300, intro: 'Av. Santos Dumont, pista livre! Quem pisa fundo aqui, ou ganha, ou é multado!', win: 'Você me ultrapassou! Toma a Insígnia Faixa Dupla.', reward: ['osso', 3] }, subs: [{ id: 'g7a', name: 'Piloto Rick', look: L('#d8a070', '#222', 'short', '#4040c0', '#333', { helmet: '#4040c0' }), team: [['fumaca', 31], ['tornado', 31]], money: 600, pos: [6, 8], dir: 'right' }, { id: 'g7b', name: 'Fiscal Léo', look: L('#e8c0a0', '#a06020', 'short', '#40a0a0', '#333', { cap: '#40a0a0' }), team: [['faisca', 30], ['capeta', 30], ['salsicha', 31]], money: 620, pos: [8, 5], dir: 'left' }], quiz: { q: 'O que significa a luz vermelha do semáforo?', o: ['Pare', 'Siga', 'Buzine'], a: 0 } },
    { color: '#8080f0', badge: 'Insígnia Asa de Aço', leader: { name: 'Cmte. Aurora', look: L('#e8c0a0', '#3a2a20', 'bun', '#3a4a7a', '#2a2a3a', { cap: '#3a4a7a' }), team: [['sargento', 38], ['neve', 39], ['fumaca', 40], ['sombra', 40], ['carvao', 41], ['tornado', 42]], money: 3000, intro: 'Fora da área militar, mas dentro das regras: Arena Aeronáutica. Eu sou o último degrau antes do Salão do Campeão.', win: 'Decolou! Insígnia Asa de Aço é sua. O Salão do Campeão te espera.', reward: ['coleira', 2] }, subs: [{ id: 'g8a', name: 'Cabo Ramos', look: L('#a06848', '#222', 'short', '#4a5a3a', '#3a4a2a', { cap: '#4a5a3a' }), team: [['sargento', 35], ['carvao', 35]], money: 800, pos: [6, 8], dir: 'right' }, { id: 'g8b', name: 'Sgt. Helena', look: L('#e8b890', '#222', 'bun', '#4a5a3a', '#3a4a2a'), team: [['neve', 36], ['sombra', 36], ['fumaca', 36]], money: 850, pos: [8, 5], dir: 'left' }], quiz: { q: 'Como se chama o aeroporto internacional de Guarulhos?', o: ['Cumbica', 'Congonhas', 'Viracopos'], a: 0 } },
  ];
  S.gyms = GY;

  // ---------- criação dos NPCs dos ginásios ----------
  for (let i = 1; i <= 8; i++) {
    const g = GY[i], gm = 'gym' + i, ld = g.leader;
    addNpc(gm, 'leader' + i, ld.name, 7, 3, 'down', ld.look, { fixed: true, tr: { team: ld.team, money: ld.money, intro: ld.intro, win: ld.win, boss: true, bg: 'ginasio' }, onWin: '@leader_win', gi: i, t: (n) => M.say(n.name, `Aquele papo de ${g.badge}? Já é seu, Gabe. Segue o rolê!`) });
    g.subs.forEach(s => addNpc(gm, s.id, s.name, s.pos[0], s.pos[1], s.dir, s.look, { fixed: true, tr: { team: s.team, money: s.money, sight: 3, bg: 'ginasio', intro: `Quer falar com o líder? Passa por mim primeiro, ${'Gabe'}!`, win: 'Ok, ok... pode seguir.' }, t: (n) => M.say(n.name, 'Já perdi. Vai lá enfrentar o líder!') }));
    addNpc(gm, 'quiz' + i, 'Desafio do Ginásio', 11, 10, 'left', L('#e8c0a0', '#444', 'short', '#888', '#444', { cap: '#888' }), { fixed: true, t: '@quiz' });
    S.npcs[gm][S.npcs[gm].length - 1].gi = i;
  }
  // líder só aceita batalha depois dos dois auxiliares
  for (let i = 1; i <= 8; i++) { const ld = S.npcs['gym' + i][0], g = GY[i]; const orig = ld.t; ld.guard = () => g.subs.every(s => fl('d_' + s.id)); }
  const talkOrig = Wd.talk;
  Wd.talk = async (n) => { if (n.guard && !n.noGuard && !fl('d_' + n.id) && !n.guard()) { n.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[Wd.p.dir]; await M.say(n.name, 'Calma lá! Antes de falar comigo, derrote meus dois auxiliares no corredor.'); return; } return talkOrig(n); };

  H['@leader_win'] = async (n) => {
    const i = n.gi, g = GY[i], G = M.G;
    setf('badge' + i); G.flags.badges = [1, 2, 3, 4, 5, 6, 7, 8].filter(k => fl('badge' + k)).length;
    M.audio.jingle('victory', false); await M.say(null, `Gabe recebeu a ${g.badge}! (${G.flags.badges}/8)`);
    const [it, q] = g.leader.reward; M.addItem(it, q); if (it === 'chave') setf('chave'); M.audio.sfx('item'); await M.say(null, `Gabe recebeu ${q}x ${D.ITEMS[it].name}.`);
    const extra = { 1: 'Rafa: "Dica: a Praça Benjamim e a Cidade Jardim ficam depois da barreira da Av. Santos Dumont, cê já pode passar!"', 2: 'Profª: "Tonho Pitbull te espera na Arena Farias, a leste. A barreira da Santos Dumont já abriu pra você."', 3: 'Tonho: "Seu Osvaldo guarda a Praça Vicente Ferreira Campos, lá no sul da Papa João Paulo I."', 4: 'Seu Osvaldo: "O Caminho dos Grafites, a oeste, agora tá liberado. Cuidado com os caóticos."', 5: 'MC Spray: "A Cidade Industrial, lá embaixo, também abriu pra você. Pega leve na poeira."', 6: 'Betoneira: "Aquela chave abre o Galpão Abandonado. Tem uns caras de coleira negra rondando lá..."', 7: 'Tânia: "A Base Aérea tem uma arena fora da área militar. Cmte. Aurora te espera. Mas só a Arena, hein!"', 8: 'Aurora: "O Salão do Campeão fica ao lado. Quem quer que esteja lá... não é o que parece."' }[i];
    await M.say(null, extra);
    if (i === 8) await M.say('Gabe', 'Oito insígnias! O Salão do Campeão deve ter aberto...');
    healAll(); M.Save.save();
  };

  H['@quiz'] = async (n) => {
    const g = GY[n.gi], q = g.quiz, k = 'quiz' + n.gi;
    if (fl(k)) { await M.say(n.name, 'Já acertou meu desafio! Vai com Deus.'); return; }
    const r = await M.ask(n.name, `Desafio do ginásio! ${q.q}`, q.o, { x: 200, y: 140, w: 270 });
    if (r === q.a) { setf(k); M.addItem('petisco', 3); M.G.money += 150; M.audio.sfx('item'); await M.say(n.name, 'Acertou! Toma R$ 150 e 3 petiscos.'); } else if (r >= 0) await M.say(n.name, 'Errou! Mas pode tentar de novo quando quiser.');
  };

  // ---------- Casa ----------
  addNpc('casa_gabe', 'mae', 'Dona Télia', 7, 4, 'down', L('#f6d4c0', '#e5c45b', 'short', '#e87090', '#445'), { t: (n) => { const G = M.G; if (!fl('starter')) return M.say(n.name, 'Filha, o Zé te chamou lá na oficina! Disse que tem uma surpresa de quatro patas. Vai lá!'); healAll(); M.Save.save(); return M.say(n.name, 'Voltou, minha filha! Deixa eu cuidar dos bichinhos... Pronto, todo mundo descansado. E come alguma coisa, hein? Não vive só de pão de queijo!'); } });
  H['@cama'] = async () => { healAll(); M.Save.save(); M.audio.sfx('heal'); await M.say(null, 'Gabe tirou um cochilo na cama. A equipe foi curada e o jogo foi salvo.'); };
  // cama e TV na casa
  { const m = MAPS.casa_gabe; for (const [x, y] of [[2, 2], [3, 2]]) m.say(x, y, '@cama'); m.say(2, 6, 'A TV passa o jornal: "Criaturas sorridentes e de aparência demoníaca foram vistas nas ruas de Cumbica. Moradores relatam risadas durante a madrugada."'); m.say(3, 6, 'A TV passa o jornal da hora: "Disputa por território entre grupos de cães assusta moradores de Cumbica." Hmm...'); }

  // ---------- Zé (mecânico) e o início ----------
  addNpc('cumbica', 'ze', 'Zé do Alicate', 40, 37, 'down', L('#c89070', '#222', 'bald', '#2a5a9a', '#3a3a4a', { extra: 'beard', beard: '#444', cap: '#2a5a9a' }), { auto: { d: 4, walk: true, fn: '@ze_intro', when: (f) => !f.starter }, t: '@ze_talk', fixed: true });
  H['@ze_intro'] = async (n) => {
    const Gbe = 'Gabe';
    await M.say(n.name, 'Ô Gabe! Acordou cedo, hein? Vem cá, menina, tenho um bagulho importante pra te falar.');
    await M.say(n.name, 'Cumbica tá numa treta sobrenatural: Demônios Zombeteiros estão aparecendo de praça em praça, assustando moradores e corrompendo tudo por onde passam. A Base dos Mad Dogs, que protegia o bairro, tá abandonada desde que o último cuidador saiu.');
    await M.say(n.name, 'Esses demônios são fortes demais pra enfrentar sozinho. A gente precisa reerguer os Mad Dogs! Tu consegue ouvir os cachorros e criar laços com eles. Escolhe teu primeiro parceiro: ele vai te ajudar a caçar essas criaturas.');
    for (; ;) {
      const k = await M.ask(n.name, 'Quem vai ser seu primeiro parceiro?', ['Pipoca (Rua)', 'Trovão (Bruto)', 'Esperta (Inteligente)'], { x: 190, y: 120, w: 280 });
      if (k < 0) continue; const key = ['pipoca', 'trovao', 'esperta'][k], sp = D.SPECIES[D.SP[key]];
      const j = await M.ask(n.name, `${sp.name}, ${sp.breed}. ${sp.desc} Fechou com esse?`, ['Fechou!', 'Deixa eu ver os outros'], { x: 250, y: 140 });
      if (j !== 0) continue;
      const dog = D.makeDog(D.SP[key], 5); M.G.party.push(dog); M.G.dex.own[D.SP[key]] = 1; M.G.dex.seen[D.SP[key]] = 1; setf('starter'); setf('starter_' + key);
      M.audio.jingle('victory', false); await M.say(null, `${dog.name} entrou pra equipe de Gabe!`); break;
    }
    M.addItem('petisco', 5); M.addItem('agua', 3);
    await M.say(n.name, 'Toma uns petiscos e umas águas. REGRA DE OURO: os cachorros são teus aliados, nunca inimigos. Recruta cada um com carinho, petisco e confiança. Quem a gente caça são os Demônios Zombeteiros. Machucou? Descansa em casa ou na Base.');
    await M.say(n.name, 'Conversa com o povo, explora Cumbica e enfrenta os ginásios. Cada insígnia te deixa mais perto da origem da invasão demoníaca. Boa caçada, Gabe!');
    await M.say('Gabe', 'Bora, matilha! (I: Mochila | M: Mapa | Q: Missões | E: Rastrear missão.)');
    M.Save.save();
  };
  H['@ze_talk'] = async (n) => {
    const G = M.G;
    if (!fl('starter')) return H['@ze_intro'](n);
    if (fl('peca') && !fl('peca_given')) { setf('peca_given'); M.delItem('peca'); M.addItem('coleira', 2); G.money += 500; M.audio.sfx('item'); await M.say(n.name, 'É O CARBURADOR! Gabe, tu é uma lenda! Minha moto volta a rodar. Toma R$ 500 e duas Coleiras de Confiança!'); return; }
    if (!fl('peca_given') && (G.flags.badges || 0) >= 5) return M.say(n.name, 'Se tu passar pela Cidade Industrial, procura o carburador da minha moto. Deve ter caído perto do Galpão Abandonado, no pallet.');
    if (fl('champ')) return M.say(n.name, 'Campeã de Cumbica! Eu sabia, desde que te vi dando petisco pro Pipoca!');
    return M.say(n.name, `Tá com ${G.flags.badges || 0} insígnia(s). ${(G.flags.badges || 0) < 8 ? 'Continua firme! Fala com o povo, eles dão dica.' : 'O Salão do Campeão te espera!'}`);
  };

  // ---------- NPCs do bairro ----------
  addNpc('cumbica', 'zefa', 'Vovó Zefa', 36, 38, 'down', L('#f0d0b8', '#ddd', 'bun', '#a070c0', '#555'), { wander: 1, t: ['Ai, minha filha, esses cachorros tão mais espertos que muito político, viu?', 'As barreiras de cone aí pelo bairro? São da prefeitura... ou do Zé, não sei. Só abrem quando cê mostra insígnias pro guarda.'] });
  addNpc('cumbica', 'pedrinho', 'Pedrinho', 42, 41, 'left', L('#c89070', '#222', 'short', '#e0c030', '#33a'), { wander: 2, t: ['Dica de ouro, Gabe: cachorro com HP baixo aceita petisco mais fácil. Mas se machucar demais, ele foge!', 'E Brincalhão ama Brinquedo Favorito. Orgulhoso só vai de Coleira de Confiança. Anota aí!'] });
  addNpc('cumbica', 'guarda1', 'Guarda Cabral', 53, 41, 'down', L('#b88060', '#222', 'short', '#2a4a8a', '#2a2a4a', { cap: '#2a4a8a' }), { fixed: true, t: (n) => M.say(n.name, `Tô controlando as barreiras de Cumbica. Pra cada trecho novo, tem que ter insígnias: ${fl('badge1') ? 'a oeste e a Santos Dumont abriram' : 'tá fechadão'}. Já tem ${M.G.flags.badges || 0}. Volta quando tiver mais.`) });
  addNpc('cumbica', 'nena', 'Dona Nena', 38, 53, 'right', L('#e8c0a0', '#bbb', 'bun', '#f0a0c0', '#664', { extra: 'apron' }), { fixed: true, t: async (n) => { await M.say(n.name, 'Petisco fresquinho, filha! Biscoito Especial é receita secreta minha. Quer ver o cardápio?'); await UI.shop(D.SHOPS.petisco, 'PETISCOS DA DONA NENA'); await M.say(n.name, 'Volta sempre! E trata bem esses bichos.'); } });
  const johnnyLook = L('#dcae8b', '#e5c66f', 'short', '#83c9e8', '#b8d9e8', { extra: 'johnny', shoes: '#26384a', bandana: '#72c8e8', pattern: 'stars', emblem: 'horseshoe' });
  const gyroLook = L('#d6a078', '#e6d5a8', 'long', '#542b82', '#392454', { extra: 'glasses', shoes: '#302044', cap: '#302b28', helmet: '#3a3028', pattern: 'green-orbs' });
  addNpc('cumbica', 'johnny_lasanha', 'Johnny', 18, 64, 'right', johnnyLook, { fixed: true, when: () => !fl('rica_scene_done'), t: (n) => ricaScene(sceneNpc('rica_games') || n) });
  addNpc('cumbica', 'gyro_lasanha', 'Gyro', 19, 64, 'left', gyroLook, { fixed: true, when: () => !fl('rica_scene_done'), t: (n) => ricaScene(sceneNpc('rica_games') || n) });
  const sceneNpc = (id) => (Wd.npcs.cumbica || []).find(x => x.id === id);
  const sceneWalk = (n, dir, steps, delay = 150) => async () => {
    for (let i = 0; i < steps; i++) {
      const [dx, dy] = ({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] })[dir];
      if (Wd.solidAt && Wd.solidAt(n.x + dx, n.y + dy, 'n')) break;
      await new Promise(resolve => { n.dir = dir; n.mv = { fx: n.x, fy: n.y, tx: n.x + dx, ty: n.y + dy, t: 0, done: resolve }; });
      if (delay > 150) await M.wait(delay - 125);
    }
  };
  const ricaScene = async (n) => {
    const johnny = sceneNpc('johnny_lasanha'), gyro = sceneNpc('gyro_lasanha'), seller = sceneNpc('rica_games') || n;
    await M.say(seller.name, 'Ô RAPÁ! Duas Lasanhas Pif Paf? Pensei que ia ficar rico nessa porra rapá.');
    await M.say('Johnny', 'Duas, Rica. Uma pra mim e outra pro Gyro. A gente precisa de energia pra corrida.');
    await M.say('Gyro', 'Energia, não. Precisamos de um milagre embalado em plástico.');
    await M.say(seller.name, 'LEVANTA DAI RAPAZ! LEVANTA! A lasanha tá gelada e o micro-ondas tá trabalhando no limite!');
    await M.say('Gabe', 'Oi! Vocês tão falando de corrida?');
    await M.say('Johnny', 'A pista perto do viaduto tá um inferno. Um Demônio Zombeteiro espalhou cones, óleo e umas placas que mudam de lugar.');
    await M.say('Gyro', 'O pior é o Cone Supremo. Você tenta passar pela esquerda, ele aparece na direita. Tenta pela direita, ele cobra pedágio.');
    await M.say('Gabe', 'E como vocês pretendem passar?');
    await M.say('Gyro', 'Primeiro: não corre em linha reta atrás do cone. Observa o padrão e procura o espaço livre. Segundo: leva um cachorro veloz pra abrir distância. Se virar batalha, reduz a velocidade do inimigo e fortalece o ataque antes de gastar os golpes mais fortes.');
    await M.say('Johnny', 'E terceiro: não confia em placa escrito “DESVIO”. Foi assim que a gente entrou num estacionamento de casamento.');
    await M.say('Gabe', 'Posso ir com vocês. E, Johnny... eu posso te levar pra sair qualquer hora?');
    await M.say('Johnny', 'Acho que nesse momento temos preocupações mais sérias.');
    await M.say('Gabe', 'Poxa. Eu prometo empurrar sua cadeira de rodas.');
    await M.say('Johnny', 'Não fode, porra.');
    await M.say('Gyro', 'Johnny, cuidado com a rampa.');
    await M.say('Johnny', 'EU SEI USAR UMA RAMPA—');
    if (johnny) {
      johnny.look = Object.assign({}, johnny.look, { extra: 'crawl' });
      await M.say(null, 'A cadeira prende numa rachadura. Johnny cai de lado, levanta o polegar por meio segundo e começa a se arrastar lentamente para fora da cena.');
      await sceneWalk(johnny, 'left', 6, 650)();
      await M.say('Gabe', '...Ele foi mesmo embora. Eu só queria um encontro... *snif*');
      await M.say('Gabe', 'Mãe... Dona Télia tinha razão. Eu devia ter levado um casaquinho e menos expectativa.');
    }
    // Gyro permanece ao lado do local onde Johnny estava, visível após a cena.
    setf('rica_scene_done');
    await M.say(n.name, '...Quem é esse daí, Tico Loko? Ah, é você, Gabe. Vai querer a lasanha ou vai ficar só assistindo o drama?');
    await UI.shop(D.SHOPS.ricaGames, 'RICA GAMES — LASANHA PIF PAF');
    await M.say(n.name, 'Volta sempre, rapá! E cuidado com os cones, que eles tão tudo de golpe.');
  };
  addNpc('cumbica', 'rica_games', 'Rica Games', 20, 64, 'down', L('#b97855', '#30252a', 'bald', '#b97855', '#8a6038', { extra: 'sunglasses', shirtless: true, shoulderCloth: '#a66b32', shoes: '#493322' }), { fixed: true, t: async (n) => { if (!fl('rica_scene_done')) return ricaScene(n); await M.say(n.name, 'Ô RAPÁ! Lasanha Pif Paf! Pensei que ia ficar rico nessa porra rapá.'); await M.say(n.name, 'LEVANTA DAI RAPAZ! LEVANTA!'); await UI.shop(D.SHOPS.ricaGames, 'RICA GAMES — LASANHA PIF PAF'); await M.say(n.name, 'Quem é esse dai Tico Loko? ...Ah, é você de novo! Volta sempre, rapá.'); } });
  const mikuStreetLook = L('#f4d0b8', '#35c9d0', 'long', '#d5f2ee', '#344b78', { extra: 'miku', shoes: '#222b48' });
  addNpc('cumbica', 'miku_cameo_praca', 'Hatsune Miku', 33, 50, 'down', mikuStreetLook, { fixed: true, when: () => !fl('john_revealed'), t: () => M.narr('A garota de cabelo azul está cantarolando baixinho, distraída demais para notar Gabe.') });
  addNpc('cumbica', 'miku_cameo_comercio', 'Hatsune Miku', 28, 61, 'left', mikuStreetLook, { fixed: true, when: () => !fl('john_revealed'), t: () => M.narr('Gabe reconhece a garota de cabelo azul ao longe, mas ela entra numa loja antes que dê para alcançá-la.') });
  const karaokeHostLook = L('#d7a17d', '#24202a', 'short', '#f0f0e8', '#333344', { extra: 'stout' });
  const goromiLook = L('#f0c8a8', '#24202a', 'long', '#d84b82', '#402038', { extra: 'goromi', shoes: '#33202d' });
  const mikuLook = L('#f4d0b8', '#35c9d0', 'long', '#d5f2ee', '#344b78', { extra: 'miku', shoes: '#222b48' });
  const johnLook = L('#d8a77f', '#30252b', 'short', '#242331', '#292a36', { extra: 'john', shoes: '#1b1b25' });
  addNpc('cumbica', 'karaoke_host', 'Atendente do Karaokê', 6, 69, 'down', karaokeHostLook, { fixed: true, t: async (n) => { await M.say(n.name, 'Boa noite! Bem-vinda ao Karaokê Cumbica. Sala livre, microfone chiando e refrigerante quente. É tradição.'); await M.say(n.name, 'Lá dentro a Goromi cuida do bar. Só não pergunta por que ela conhece tanta gente importante.'); Wd.enter('karaoke'); } });
  const ricaBarLook = L('#b97855', '#30252a', 'bald', '#b97855', '#8a6038', { extra: 'sunglasses', shirtless: true, shoulderCloth: '#a66b32', shoes: '#493322' });
  addNpc('karaoke', 'karaoke_bar_host', 'Atendente do Bar', 6, 5, 'down', karaokeHostLook, { fixed: true, t: async (n) => { await M.say(n.name, 'Opa, boa noite! Pode ficar à vontade. A Goromi tá ali no balcão e o Rica Games montou um esquema de comida por aqui.'); await M.say('Gabe', 'Então tá todo mundo trabalhando hoje?'); await M.say(n.name, 'Pelo visto. Eu só tento manter o karaokê funcionando e impedir que levem o microfone pra casa.'); } });
  addNpc('karaoke', 'rica_games_bar', 'Rica Games', 7, 5, 'down', ricaBarLook, { fixed: true, t: async (n) => { await M.say('Gabe', 'Rica Games?! Que que você tá fazendo aqui?'); await M.say(n.name, 'UÉ, RAPÁ! Eu também tenho vida social. Quer dizer... tô trabalhando, né.'); await M.say('Gabe', 'Você trabalha em todo lugar?'); await M.say(n.name, 'Onde tiver uma tomada, uma geladeira e alguém com fome, eu tô no esquema.'); await M.say(n.name, 'A Goromi cuida dos drinks. Eu fico com a parte importante: comida de verdade. Lasanha Pif Paf, quer dar uma olhada?'); await UI.shop(D.SHOPS.ricaGames, 'RICA GAMES — LASANHA PIF PAF'); await M.say(n.name, 'E ó, não comenta com a Goromi que eu trouxe comida de fora. Ela tem uns contatos que resolvem problema... rápido demais.'); } });
  addNpc('karaoke', 'goromi', 'Goromi', 10, 3, 'down', goromiLook, { fixed: true, t: async (n) => { await M.say(n.name, 'Oi, querida. Vai querer alguma coisa ou veio só observar o movimento?'); await M.say('Gabe', 'Ainda tô decidindo. Você trabalha aqui faz tempo?'); await M.say(n.name, 'Tempo suficiente pra saber quem entra pela porta... e quem não deveria entrar.'); await M.say(n.name, 'Tem gente que chama isso de bar. Eu prefiro chamar de ponto de encontro. Cada um tem seus negócios, seus acordos... e sua música favorita.'); await M.say('Gabe', 'Você fala como se fosse dona de metade do bairro.'); await M.say(n.name, 'Dona? Não, querida. Eu só conheço as pessoas certas.'); await M.say(n.name, 'Agora, se quiser algo pra beber, tenho um especial que dá até coragem pra encarar uma batalha.'); await UI.shop(D.SHOPS.goromi, 'BAR DA GOROMI — BEBIDAS ESPECIAIS'); await M.say(n.name, 'Aproveita a noite. E se alguém perguntar, você veio só cantar.'); } });
  addNpc('karaoke', 'miku_cameo', 'Hatsune Miku', 4, 5, 'down', mikuLook, { fixed: true, when: () => !fl('john_revealed'), t: async (n) => { if (fl('john_revealed')) return M.say('John', 'A peruca já foi. Segue o baile.'); await M.say('Gabe', 'Hatsune Miku?! Você tá aqui mesmo?'); await M.say(null, 'A figura de cabelo azul vira devagar. Antes que consiga responder, um pombo entra voando pela janela e agarra a peruca turquesa.'); n.name = 'John'; n.look = johnLook; M.portraits.John = johnLook; setf('john_revealed'); await M.say('John', 'EI! MINHA PERUCA! EU PAGUEI CARO NESSA—'); await M.say(null, 'O pombo volta num rasante e dá uma bicada bem no meio da testa de John.'); await M.say('John', 'AI, DESGRAÇA! Tá bom, tá bom, já entendi: hoje não é meu dia.'); await M.say('John', 'Se quer uma dica, pede o Óleo Elétrico pra Goromi. Dá um gás absurdo na próxima batalha. Só não deixa perto de tomada.'); await M.say('Gabe', 'Então você não era a Hatsune Miku?'); await M.say('John', 'Eu era a Hatsune Miku até cinco segundos atrás. Respeita meu trabalho artístico.'); } });
  addNpc('karaoke', 'pombo_karaoke', 'Pombo Suspeito', 5, 6, 'left', L('#aeb7c2', '#555', 'short', '#737d88', '#59616b', { extra: 'pigeon' }), { fixed: true, when: () => fl('john_revealed'), t: ['GRU-GRU. A peruca agora é propriedade do sindicato dos pombos.'] });

  addNpc('cumbica', 'picole', 'Seu Raimundo', 43, 52, 'down', L('#a06848', '#222', 'short', '#fff', '#44a', { cap: '#e04040' }), { wander: 1, t: ['Picolé de limão, 2 reais! ...ah, não vendo pra cachorro. Pergunta pro Pipoca se ele reclama.', 'Dizem que um caramelo dourado aparece na Praça Cummins uma vez na vida. Eu nunca vi, mas meu primo jura que sim.'] });
  addNpc('cumbica', 'helena', 'Dra. Helena', 41, 66, 'down', L('#f0d0b8', '#3a2a20', 'long', '#fff', '#3a8a8a', { extra: 'glasses' }), { fixed: true, t: ['Sou veterinária. Dica de laboratório: cada tipo tem seus pontos fracos. Mais ou menos assim: Veloz bate Selvagem e perde pra Guardião...', 'Abre o Perfil no menu (Esc/Tab → Perfil) e vai na aba Afinidades: tem a tabelinha completa.'] });
  addNpc('cumbica', 'tiozinho', 'Tiozinho do Bar', 30, 63, 'down', L('#c89070', '#444', 'bald', '#885', '#444', { extra: 'beard', beard: '#aaa' }), { wander: 1, t: ['Tem uns caras de coleira preta rondando a Cidade Industrial. Coleira Negra, chamam. Ninguém sabe quem manda neles. "O Dono", dizem.', 'Eu não me meto. Só vendo pão com mortadela.'] });
  addNpc('cumbica', 'sapo', 'Zé do Sapo', 36, 14, 'down', L('#b88060', '#2a2', 'short', '#2a8a4a', '#443', { cap: '#2a8a4a' }), { wander: 1, t: ['Respeita o sapo, Gabe! O Bosque dos Sapos é sagrado. Mexe nas moitas com carinho, que às vezes sai bicho raro de lá.', 'Dizem que um husky branquinho, lindo, aparece no meio do mato. Orgulhoso feito um rei.'] });
  addNpc('cumbica', 'codajas', 'Codajas', 10, 67, 'right', L('#c89070', '#222', 'short', '#222', '#555', { bandana: '#e02080' }), { wander: 1, t: ['Os grafites aqui contam a história do bairro. O da esquerda é o Fantasma de Cumbica: um cachorro branco que ninguém pega.', 'Ele só aparece de noite... ou quando alguém mexe onde não deve.'] });
  addNpc('cumbica', 'sergio', 'Capitão Sérgio', 62, 32, 'down', L('#e8c0a0', '#bbb', 'short', '#4a5a3a', '#3a4a2a', { cap: '#4a5a3a' }), { fixed: true, t: ['Sargento Amarildo, esse da homenagem, cuidava de cachorros de rua em Cumbica. Dizem que a Base dos Mad Dogs era dele.', 'Cumbica não esquece quem cuida dela, Gabe. Lembra disso.'] });
  addNpc('cumbica', 'marcao', 'Peão Marcão', 58, 76, 'down', L('#a06848', '#222', 'short', '#e8a020', '#333', { helmet: '#e8c020' }), { wander: 1, t: ['A Cidade Industrial tá sempre rodando. Mas faz dias que o Galpão ali embaixo tá trancado e com uns moleques estranhos de coleira.', 'Se cê tiver a chave, cuidado.'] });
  addNpc('cumbica', 'vila1', 'Dona Cleide', 86, 60, 'left', L('#c89070', '#333', 'bun', '#e0c030', '#665'), { wander: 1, t: ['Vila Nova Cumbica tem os melhores campinhos da região. E os cachorros mais rápidos também!', 'Se vir um husky correndo, corre atrás! Eles adoram brincar.'] });
  dogNpc('cumbica', 'd1', 'caramelo', 37, 40, '*Au au!* O caramelo balança o rabo e te cheira.');
  dogNpc('cumbica', 'd2', 'churrasco', 42, 56, '*Wof!* Parece que quer petisco, mas tá de boa.');
  dogNpc('cumbica', 'd3', 'biscoito', 38, 69, '*Ronc...* Dormindo? Nem liga pra você.');
  dogNpc('cumbica', 'd4', 'bolinha', 8, 62, '*Au!* Pequeno, mas cheio de personalidade.');
  dogNpc('cumbica', 'd5', 'pretinho', 66, 37, '*Rrrr...* Só olha de canto. Esse aí é arisco.');

  // Rival Kauê — 3 encontros
  const kaue = L('#d8a070', '#3a2a20', 'short', '#2a8a6a', '#2a2a3a', { cap: '#e04040' });
  addNpc('cumbica', 'kaue1', 'Kauê', 41, 52, 'down', kaue, { fixed: true, tr: { team: [['fagulha', 7], ['caramelo', 7]], money: 250, sight: 5, intro: 'Ô Gabe! Tá achando que só você pode virar campeã? Vou te mostrar quem é o dono da Praça Cummins!', win: 'Hmpf! Sorte de principiante. Mas eu volto mais forte!' }, t: ['Vou treinar mais. Cê não perde por esperar!'] });
  addNpc('cumbica', 'kaue2', 'Kauê', 41, 24, 'down', kaue, { fixed: true, tr: { team: [['tornado', 15], ['cacau', 15], ['pretinho', 14]], money: 800, sight: 5, intro: 'Gabe! Passei três noites no Bosque treinando. Bora ver quem aprendeu mais!', win: 'Tá bom, tá bom... cê tá evoluindo rápido. Mas ainda vou te ganhar!' }, when: (f) => (f.badges || 0) >= 1, t: ['Hmm. Na próxima, cê não escapa.'] });
  addNpc('cumbica', 'kaue3', 'Kauê', 60, 77, 'right', kaue, { fixed: true, tr: { team: [['fumaca', 30], ['carvao', 30], ['guardiao', 31], ['navalha', 31]], money: 1800, sight: 5, intro: 'Gabe. Esses caras da Coleira Negra me ofereceram um lugar na gangue... eu recusei. Mas meus cães ficaram mais fortes. Prova que cê aguenta!', win: 'Cê é boa mesmo. Vai atrás da Bia no Galpão. Eu te cubro!' }, when: (f) => (f.badges || 0) >= 5, t: ['Cuidado no Galpão, Gabe.'] });

  // ---------- Mercado e Base ----------
  addNpc('mercado', 'jorge', 'Seu Jorge', 8, 3, 'down', L('#c89070', '#333', 'bald', '#2a8a4a', '#444', { extra: 'apron' }), { fixed: true, t: '@loja_mercado' });
  H['@loja_mercado'] = async () => { await M.say('Seu Jorge', 'Boa tarde! Água, ração, osso... o que vai ser?'); await UI.shop(D.SHOPS.mercado, 'MERCADO CUMBICA'); };
  addNpc('base', 'marlene', 'Tia Marlene', 5, 4, 'right', L('#e8c0a0', '#a06020', 'bun', '#f0f0f0', '#a04060', { extra: 'apron' }), { fixed: true, t: async (n) => { await M.say(n.name, 'Chegou a matilha! Deixa eu dar um jeito nesses bichinhos...'); healAll(); M.audio.sfx('heal'); await M.say(null, 'Toda a equipe e o canil foram curados!'); M.Save.save(); await M.say(n.name, 'Se quiser trocar a equipe, abre o menu e vai em Equipe → seta pra direita (Canil).'); } });
  addNpc('base', 'sargbase', 'Cão-Mascote', 10, 4, 'down', null, { dog: 'sargento', wander: 0, t: '*Wof!* Parece um guarda... Era o mascote do Sargento Amarildo.' });
  addNpc('base', 'quadro', 'Quadro de Missões', 2, 4, 'down', L('#888', '#888', 'bald', '#888', '#888'), { fixed: true, when: () => false });
  { const m = MAPS.base; m.say(1, 6, 'Uma TV velha com a foto da matilha original dos Mad Dogs de Cumbica. Hmm... falta alguém.'); }

  // ---------- achados e segredos ----------
  const find = async (flag, text, item, qty = 1) => { if (fl(flag)) return M.say(null, 'Já mexeu aqui. Só tem poeira.'); setf(flag); M.addItem(item, qty); M.audio.sfx('item'); await M.say(null, text); await M.say(null, `Gabe encontrou ${qty}x ${D.ITEMS[item].name}!`); };
  H['@moita_benjamim'] = async () => {
    if (!fl('f_benj')) return find('f_benj', 'Uma moita estranha na Praça Benjamim. Gabe mexeu... e achou um embrulho.', 'biscoito', 1);
    if ((M.G.flags.badges || 0) >= 2 && !owns('rei') && Math.random() < 0.3) { await M.say(null, 'A moita brilha dourada... Algo grande se mexe!'); return Wd.wild('rei', 20, 'praca'); }
    return M.say(null, 'Só mato. Uma folha caiu na sua cabeça.');
  };
  H['@buraco_sapo'] = async () => once('f_sapo', async () => { await M.say(null, 'Um buraco no chão. De dentro, sai um sapo gordo e coaxa: "CROAAA!"'); M.G.money += 100; await M.say(null, 'Ele deixou cair R$ 100. Gabe agradeceu o sapo.'); }) || M.say(null, 'O sapo dorme. Não perturbe.');
  H['@moita_bosque'] = async () => {
    if (!owns('gelo') && Math.random() < 0.6) { await M.say(null, 'A moita se mexe... Um vulto branco pula: é um husky enorme!'); return Wd.wild('gelo', 14, 'campo'); }
    return M.say(null, 'Só mato e uma pena de pássaro.');
  };
  H['@achado_bosque'] = () => find('f_bosque', 'Uma caixa perdida ao pé da árvore.', 'racao', 2);
  H['@achado_grafite'] = () => find('f_grafite', 'Uma lixeira cheia de sobras de tinta... e um pacote de petiscos esquecido.', 'racaoR', 2);
  H['@grafite_codajas'] = async () => {
    await M.say(null, 'Um mural gigante: um cachorro branco, quase transparente, uivando pra lua. Assinado: Codajas.');
    if ((M.G.flags.badges || 0) >= 5 && !owns('fantasma') && Math.random() < 0.35) { await M.say(null, 'O mural parece se mexer... Um vulto branco salta do muro!'); return Wd.wild('fantasma', 26, 'viela'); }
  };
  H['@achado_amarildo'] = () => find('f_amar', 'Uma caixa embaixo do monumento. Dentro: biscoito e uma plaquinha: "Pra quem cuida."', 'biscoito', 2);
  H['@achado_peca'] = async () => { if (fl('peca')) return M.say(null, 'Só o pallet vazio.'); setf('peca'); M.addItem('peca'); M.audio.sfx('item'); await M.say(null, 'No pallet, um carburador todo sujo de graxa. É a Peça da Moto do Zé!'); };
  H['@achado_vila'] = () => find('f_vila', 'Uma caixa de papelão esquecida no campinho.', 'brinquedo', 2);

  // ---------- Galpão (Coleira Negra) ----------
  const col = (o) => Object.assign({ extra: 'coleira' }, o);
  addNpc('galpao', 'capanga1', 'Capanga Dudu', 4, 6, 'right', L('#c89070', '#222', 'short', '#222', '#222', col({ bandana: '#c0212a' })), { fixed: true, tr: { team: [['capeta', 33], ['faisca', 33]], money: 700, sight: 4, bg: 'industrial', intro: 'Ei! Aqui é área da Coleira Negra! Quem te deu a chave?!', win: 'Ai... o chefe vai ficar bravo.' }, t: ['Já perdi... passa logo.'] });
  addNpc('galpao', 'capanga2', 'Capanga Tigrão', 11, 6, 'left', L('#a06848', '#222', 'bald', '#222', '#222', col({})), { fixed: true, tr: { team: [['tyson', 34], ['carvao', 34]], money: 750, sight: 4, bg: 'industrial', intro: 'Mais uma intrusa! A Capitã não vai gostar disso!', win: 'Tá... entra.' }, t: ['Já era. Fala com a Capitã.'] });
  addNpc('galpao', 'bia', 'Capitã Bia', 7, 3, 'down', L('#e8c0a0', '#c0212a', 'long', '#222', '#222', col({ cap: '#222' })), { fixed: true, tr: { team: [['navalha', 37], ['cerbero', 38], ['sombra', 38]], money: 2000, boss: true, bg: 'industrial', intro: 'Então cê é a Gabe, a que tá juntando a matilha. Eu sou a Bia, capitã da Coleira Negra. Aqui nós "protegemos" cães de rua. Do nosso jeito.' , win: 'Perdi... Ouve: o chefe, "O Dono", tá no Salão do Campeão. Ele comanda tudo. Os cães dele não obedecem por amor, obedecem por medo. Acaba com isso, Gabe.' }, onWin: '@bia_win', t: ['Vai atrás d\'O Dono. Eu não vou mais atrapalhar.'] });
  H['@bia_win'] = async (n) => { setf('bia'); M.addItem('coleiraNegra'); M.audio.sfx('item'); await M.say(null, 'Bia largou uma Coleira Negra no chão. Tachas vermelhas, bem apertada. Os cães da gangue usavam isso pra obedecer por medo.'); await M.say('Gabe', 'Os cães não têm culpa. Vamos libertar todos eles do Dono!'); healAll(); M.Save.save(); };

  // ---------- Campeão ----------
  addNpc('campeao', 'champ', 'Comandante Valdemar', 7, 3, 'down', L('#d8b090', '#222', 'short', '#222', '#222', col({ extra: 'beard', beard: '#555', cap: '#222' })), { fixed: true, tr: { team: [['navalha', 46], ['sombra', 46], ['carvao', 47], ['cerbero', 48], ['gelo', 49], ['rei', 50]], money: 5000, boss: true, bg: 'ginasio', intro: 'Então vieram as oito insígnias. Eu sou o Comandante Valdemar... o Dono, pros mais chegados. A Coleira Negra é minha. Cumbica inteira será minha matilha!', win: 'Impossível... meus cães lutaram com medo; os seus, com amor. Perdi.' }, onWin: '@champ_win', t: (n) => M.say(n.name, 'Você é a Campeã de Cumbica. Cuida bem do bairro.') });
  H['@champ_win'] = async () => {
    setf('champ'); healAll(); M.Save.save(); M.audio.play('story');
    await M.say('Comandante Valdemar', 'Os Demônios Zombeteiros me enganaram... A coleira negra era o elo que mantinha a invasão sob meu controle. Destrói esse poder, Gabe. Liberta Cumbica!');
    await UI.card(['A fonte da invasão foi destruída. Os Demônios Zombeteiros desapareceram nas sombras, e Cumbica voltou a respirar em paz.', 'A Base dos Mad Dogs reabriu, cheia de patas, latidos e petiscos. O Sargento Amarildo, onde estiver, deve estar sorrindo.', 'Gabe virou a Campeã de Cumbica: a caçadora que enfrentou os Demônios Zombeteiros com coragem e a força de sua matilha.', 'FIM DA PRIMEIRA CAMPANHA — Obrigado por jogar MAD DOGS OF CUMBICA\'S WORLD!  Você pode continuar explorando, recrutando todos os cães e completando as missões.'], { bg: '#10142a' });
  };

  // ---------- missões ----------
  const owned = () => own().size, nb = () => M.G.flags.badges || 0;
  const mission = (id, name, main, desc, obj, stat, prog, reward, where) => S.missions.push({ id, name, main, desc, obj, status: stat, prog, reward, where });
  const gymRoute = ['Praça Cummins (centro-sul de Cumbica)', 'CEU Jardim Cumbica (noroeste)', 'Arena Farias (leste)', 'Praça Vicente Ferreira Campos (leste/sul)', 'Caminho dos Grafites Codajas (sudoeste)', 'Cidade Industrial Satélite (sudeste)', 'Av. Santos Dumont (nordeste)', 'Região da Base Aérea — arena fictícia (norte)'];
  mission('m1', 'Parceiro de Quatro Patas', true, 'O Zé quer que você escolha seu primeiro cachorro para reerguer a matilha Mad Dogs.', () => fl('starter') ? 'Concluída.' : 'Fale com o Zé do Alicate, perto da Casa da Gabe.', (G) => G.flags.starter ? 2 : 1, null, 'Seu 1º cachorro + petiscos', () => 'Oficina do Zé, ao lado da Casa da Gabe.');
  mission('m2', 'As 8 Insígnias', true, 'Enfrente os oito ginásios fictícios espalhados por Cumbica. Cada vitória libera novas áreas.', () => nb() >= 8 ? 'Conquistadas.' : `Próximo ginásio: ${(GY[nb() + 1] ? P.gyms[nb() + 1].name : '')}. Abra novas áreas com insígnias.`, (G) => G.flags.starter ? (nb() >= 8 ? 2 : 1) : 0, () => `${nb()}/8`, 'Acesso ao Salão do Campeão', () => nb() >= 8 ? 'Salão do Campeão, na Região da Base Aérea.' : gymRoute[nb()]);
  mission('m3', 'A Peça do Zé', false, 'O Zé perdeu o carburador da moto perto do Galpão Abandonado, na Cidade Industrial.', () => fl('peca_given') ? 'Entregue.' : fl('peca') ? 'Leve a Peça da Moto ao Zé.' : 'Procure o carburador num pallet perto do Galpão (Cidade Industrial).', (G) => G.flags.peca_given ? 2 : (nb() >= 4 ? 1 : 0), null, '2 Coleiras + R$ 500', () => fl('peca_given') ? 'Oficina do Zé, perto da Casa da Gabe.' : 'Pallet ao sul do Galpão Abandonado, Cidade Industrial.');
  mission('m4', 'A Coleira Negra', true, 'Demônios Zombeteiros estão usando a Cidade Industrial como esconderijo. Invada o Galpão Abandonado e descubra quem está por trás da invasão.', () => fl('bia') ? 'A Capitã Bia caiu.' : fl('chave') ? 'Entre no Galpão (Cidade Industrial) e enfrente a Capitã Bia.' : 'Vença o Mestre Betoneira para conseguir a chave.', (G) => G.flags.bia ? 2 : (nb() >= 5 ? 1 : 0), null, 'Coleira Negra (pista)', () => fl('bia') ? 'Missão concluída.' : fl('chave') ? 'Galpão Abandonado, sudeste da Cidade Industrial.' : 'Encontre o Mestre Betoneira na Cidade Industrial para obter a chave.');
  mission('m5', 'O Dono da Coleira', true, 'O líder dos Demônios Zombeteiros espera no Salão do Campeão, ao lado da Arena Aeronáutica.', () => fl('champ') ? 'Derrotado!' : nb() >= 8 ? 'Entre no Salão do Campeão (norte da Av. Papa João Paulo I).' : 'Consiga as 8 insígnias.', (G) => G.flags.champ ? 2 : (G.flags.bia || nb() >= 8 ? 1 : 0), null, 'Título de Campeã de Cumbica', () => 'Salão do Campeão, ao norte da Av. Papa João Paulo I (após 8 insígnias).');
  mission('s1', 'Matilha Grande', false, 'Recrute cães de espécies diferentes: 10 no total.', () => owned() >= 10 ? 'Feito!' : 'Recrute mais espécies por Cumbica.', (G) => G.flags.starter ? (owned() >= 10 ? 2 : 1) : 0, () => `${owned()}/10`, 'Bragagem', () => 'Explore as áreas de grama alta e converse com moradores para encontrar cães.');
  mission('s2', 'Achados e Perdidos', false, 'Há caixas e moitas escondidas pelos bairros com itens úteis.', () => ['f_benj', 'f_bosque', 'f_grafite', 'f_amar', 'f_vila'].every(fl) ? 'Tudo achado!' : 'Procure caixas e moitas nos bairros.', (G) => G.flags.starter ? (['f_benj', 'f_bosque', 'f_grafite', 'f_amar', 'f_vila'].every(fl) ? 2 : 1) : 0, () => `${['f_benj', 'f_bosque', 'f_grafite', 'f_amar', 'f_vila'].filter(fl).length}/5`, 'Itens variados', () => 'Praça Benjamim, Bosque dos Sapos, Caminho dos Grafites, região do Amarildo e Vila Nova Cumbica.');
  mission('s3', 'Lendas de Cumbica', false, 'Rumores falam do Rei Caramelo Dourado, do Capitão Gelo e do Fantasma de Cumbica.', () => ['rei', 'gelo', 'fantasma'].every(owns) ? 'Recrutados!' : 'Explore moitas e murais: Praça Benjamim, Bosque dos Sapos, Grafites.', (G) => G.flags.starter ? (['rei', 'gelo', 'fantasma'].every(owns) ? 2 : 1) : 0, () => `${['rei', 'gelo', 'fantasma'].filter(owns).length}/3`, 'Orgulho', () => 'Procure pistas na Praça Benjamim, Bosque dos Sapos e Caminho dos Grafites.');
  // ---------- ao entrar num mapa ----------
  S.onEnter = async (mapId) => { if (mapId === 'galpao' && !fl('galpao_intro')) { setf('galpao_intro'); await M.say('Gabe', 'Esse galpão... tá tomado por uma energia horrível. Os Demônios Zombeteiros estão usando esse lugar como ninho.'); } };
})(window.MD);
