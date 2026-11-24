'use strict';
// ================= DADOS: afinidades, golpes, cachorros, itens, bairros =================
(function (M) {
  const D = M.D = {};
  D.TYPES = ['rua', 'bruto', 'veloz', 'noturno', 'selvagem', 'inteligente', 'guardiao', 'caotico'];
  D.TNAME = { rua: 'RUA', bruto: 'BRUTO', veloz: 'VELOZ', noturno: 'NOTURNO', selvagem: 'SELVAGEM', inteligente: 'INTELIGENTE', guardiao: 'GUARDIÃO', caotico: 'CAÓTICO' };
  D.TCOL = { rua: '#d89a3a', bruto: '#b8453a', veloz: '#4ab0e8', noturno: '#5a4a9a', selvagem: '#4a9a4a', inteligente: '#3ac0b0', guardiao: '#8a94a8', caotico: '#d84a9a' };
  const STRONG = { rua: ['inteligente', 'selvagem'], bruto: ['rua', 'veloz'], veloz: ['guardiao', 'caotico'], noturno: ['bruto', 'rua'], selvagem: ['noturno', 'veloz'], inteligente: ['bruto', 'noturno'], guardiao: ['rua', 'selvagem'], caotico: ['guardiao', 'noturno'] };
  D.eff = (a, d) => STRONG[a].includes(d) ? 2 : STRONG[d].includes(a) ? 0.5 : 1;

  // ---------- golpes ----------
  D.MOVES = {};
  const mv = (id, name, type, pow, acc, pp, anim, fx, desc, prio) => D.MOVES[id] = { id, name, type, pow, acc, pp, anim, fx: fx || null, desc: desc || '', prio: prio || 0 };
  mv('mordida', 'Mordida', 'rua', 40, 100, 25, 'bite', null, 'Uma mordida firme (e educada).');
  mv('investida', 'Investida', 'bruto', 40, 100, 30, 'charge', null, 'Corre de cabeça em cima do rival.');
  mv('latido', 'Latido Ensurdecedor', 'caotico', 45, 100, 20, 'sound', { k: 'stat', s: 'def', n: -1, who: 'foe', ch: 25 }, 'Alto o bastante pra acordar o bairro.');
  mv('corrida', 'Corrida Desesperada', 'veloz', 55, 95, 15, 'dash', { k: 'recoil', f: 0.2 }, 'Velocidade total. Freio? Que freio?');
  mv('rosnado', 'Rosnado', 'selvagem', 0, 100, 30, 'growl', { k: 'stat', s: 'atk', n: -1, who: 'foe', ch: 100 }, 'Reduz o ATAQUE do rival.');
  mv('surpresa', 'Ataque Surpresa', 'noturno', 60, 90, 15, 'ambush', null, 'Sai da sombra do poste.');
  mv('defesa', 'Defesa Territorial', 'guardiao', 0, 100, 20, 'guard', { k: 'stat', s: 'def', n: 2, who: 'self', ch: 100 }, 'Aumenta bastante a DEFESA.');
  mv('derrubada', 'Derrubada', 'bruto', 55, 90, 15, 'charge', null, 'Joga o rival no chão.');
  mv('uivo', 'Uivo Noturno', 'noturno', 40, 100, 20, 'howl', { k: 'fear', ch: 30 }, 'Arrepia até poste. Pode assustar.');
  mv('faro', 'Faro Aguçado', 'inteligente', 0, 100, 20, 'sniff', { k: 'stat', s: 'atk', n: 1, who: 'self', ch: 100 }, 'Aumenta o ATAQUE.');
  mv('truque', 'Truque Esperto', 'inteligente', 50, 100, 15, 'sparkle', null, 'Nunca erra.', 0);
  mv('garrada', 'Garrada', 'selvagem', 50, 100, 20, 'claw', null, 'Três arranhões rápidos.');
  mv('pulo', 'Pulo Ágil', 'veloz', 40, 100, 25, 'jump', null, 'Sempre age primeiro.', 1);
  mv('cabecada', 'Cabeçada', 'bruto', 70, 85, 10, 'charge', null, 'Cabeça dura, dano alto.');
  mv('rasteira', 'Rasteira', 'rua', 40, 100, 20, 'trip', { k: 'stat', s: 'spd', n: -1, who: 'foe', ch: 100 }, 'Reduz a VELOCIDADE.');
  mv('feroz', 'Mordida Feroz', 'selvagem', 75, 90, 10, 'bite', { k: 'fear', ch: 20 }, 'Mordida selvagem. Pode assustar.');
  mv('fuga', 'Fuga Maluca', 'caotico', 60, 85, 15, 'chaos', { k: 'fear', ch: 25 }, 'Ninguém entende o que acontece.');
  mv('sentinela', 'Sentinela', 'guardiao', 45, 100, 20, 'guard', { k: 'stat', s: 'def', n: 1, who: 'self', ch: 40 }, 'Ataca e pode subir a DEFESA.');
  mv('raiz', 'Vira-Lata Raiz', 'rua', 65, 100, 10, 'bite', null, 'Raça? Só garra de rua.');
  mv('furacao', 'Furacão de Pelos', 'veloz', 60, 100, 15, 'spin', null, 'Gira tão rápido que solta pelo.');
  mv('olhar', 'Olhar Penetrante', 'inteligente', 0, 100, 20, 'stare', { k: 'stat', s: 'def', n: -1, who: 'foe', ch: 100 }, 'Reduz a DEFESA.');
  mv('bote', 'Bote Sombrio', 'noturno', 70, 90, 10, 'ambush', null, 'Bote certeiro vindo do escuro.');
  mv('barraco', 'Barraco Total', 'caotico', 80, 80, 5, 'chaos', { k: 'recoil', f: 0.25 }, 'Ninguém sai ileso.');
  D.LEARN = {
    rua: [[1, 'mordida'], [1, 'rasteira'], [6, 'rosnado'], [11, 'raiz'], [18, 'derrubada'], [26, 'barraco']],
    bruto: [[1, 'investida'], [1, 'rosnado'], [6, 'derrubada'], [12, 'mordida'], [18, 'cabecada'], [26, 'feroz']],
    veloz: [[1, 'investida'], [1, 'pulo'], [6, 'mordida'], [11, 'corrida'], [18, 'furacao'], [26, 'surpresa']],
    noturno: [[1, 'mordida'], [1, 'uivo'], [6, 'rosnado'], [11, 'surpresa'], [18, 'bote'], [26, 'feroz']],
    selvagem: [[1, 'garrada'], [1, 'rosnado'], [6, 'mordida'], [11, 'feroz'], [18, 'derrubada'], [26, 'bote']],
    inteligente: [[1, 'mordida'], [1, 'truque'], [6, 'faro'], [11, 'olhar'], [18, 'furacao'], [26, 'bote']],
    guardiao: [[1, 'investida'], [1, 'defesa'], [6, 'sentinela'], [11, 'mordida'], [18, 'cabecada'], [26, 'derrubada']],
    caotico: [[1, 'mordida'], [1, 'latido'], [6, 'fuga'], [11, 'rosnado'], [18, 'barraco'], [26, 'surpresa']],
  };

  // ---------- cachorros ----------
  D.RAR = ['Comum', 'Incomum', 'Raro', 'Lendário'];
  D.PERS = {
    Brincalhão: 'Ama brinquedos. Aceita Brinquedo Favorito com muito mais facilidade.',
    Guloso: 'Vive de barriga cheia. Petiscos funcionam muito bem.',
    Orgulhoso: 'Não se entrega fácil. Só a Coleira de Confiança resolve.',
    Medroso: 'Desconfiado, mas muda de ideia quando confia em você.',
    Leal: 'Fiel por natureza. Recruta com facilidade.',
    Arisco: 'Escorregadio. Meio difícil de recrutar.',
    Preguiçoso: 'Se cansa rápido. Fica dócil com pouco HP.',
    Curioso: 'Fareja tudo. Neutro com qualquer item.',
  };
  D.SPECIES = [null];
  const S = (name, breed, type, st, rar, reg, pers, desc, rec, look) => { const id = D.SPECIES.length; D.SPECIES.push({ id, name, breed, type, base: { hp: st[0], atk: st[1], def: st[2], spd: st[3] }, rar, reg, pers, desc, rec, look }); return id; };
  D.SP = {};
  const add = (key, ...a) => { D.SP[key] = S(...a); };
  add('pipoca', 'Pipoca', 'Vira-lata Caramelo', 'rua', [48, 50, 45, 50], 0, 'Cumbica', 'Brincalhão', 'O caramelo clássico de Cumbica. Late pra tudo, foge de nada.', 70, { c: '#d9a05b', c2: '#f2d9a8', ear: 'flop', ec: '#b27a38', tail: 'curl', tongue: true });
  add('trovao', 'Trovão', 'Rottweiler (filhote)', 'bruto', [55, 60, 55, 40], 1, 'Cumbica', 'Leal', 'Filhote parrudo. Quando cresce vira um muro.', 55, { c: '#25252d', patch: 'tan', pc: '#c0793a', snc: '#c0793a', ear: 'flop', ec: '#17171d', tail: 'stub', len: 20, h: 11, hr: 6, sn: 4, socks: true });
  add('esperta', 'Esperta', 'Border Collie', 'inteligente', [48, 48, 50, 62], 1, 'Cumbica', 'Curioso', 'Percebe tudo antes de você. Tem cara de quem fez faculdade.', 50, { c: '#26262e', c2: '#f4f4f4', patch: 'bw', pc: '#f4f4f4', ear: 'flop', ec: '#1a1a22', tail: 'fluff', hr: 6, sn: 5 });
  add('caramelo', 'Caramelo de Esquina', 'SRD Caramelo', 'rua', [44, 46, 42, 48], 0, 'Cumbica', 'Guloso', 'Mora na esquina e conhece todo mundo. Todo mundo dá comida.', 75, { c: '#e0a860', c2: '#f6e4bc', ear: 'point', ec: '#b88040', tail: 'curl', tongue: true });
  add('pretinho', 'Pretinho', 'SRD Preto', 'noturno', [42, 48, 40, 55], 0, 'Viela', 'Medroso', 'Vira sombra no beco. Só os olhos entregam.', 70, { c: '#2b2b36', c2: '#3a3a48', ear: 'flop', ec: '#1c1c26', tail: 'curl' });
  add('fagulha', 'Fagulha', 'Pinscher', 'veloz', [36, 46, 32, 72], 0, 'Cumbica', 'Arisco', 'Pequeno, nervoso e rápido como fio desencapado.', 65, { c: '#3a2a24', c2: '#b8602a', patch: 'tan', pc: '#b8602a', snc: '#b8602a', ear: 'big', tail: 'stub', legs: 'long', len: 16, h: 8, hr: 5, sn: 4, col: '#4a8ad8' });
  add('fifi', 'Dona Fifi', 'Poodle', 'inteligente', [38, 36, 40, 56], 0, 'Praça', 'Orgulhoso', 'Tosa em dia, nariz empinado. Só confia em quem merece.', 55, { c: '#f4f0e6', ear: 'fluff', tail: 'fluff', hr: 6, sn: 5, col: '#e870b0' });
  add('salsicha', 'Salsicha Turbo', 'Dachshund', 'veloz', [38, 48, 34, 66], 0, 'Cumbica', 'Brincalhão', 'Comprido que só. Passa por qualquer buraco da cerca.', 65, { c: '#8a4a2a', c2: '#a8643a', ear: 'flop', ec: '#6a3418', tail: 'down', legs: 'tiny', len: 26, h: 7, hr: 5, sn: 8 });
  add('bolota', 'Bolota', 'Bulldog', 'guardiao', [60, 55, 62, 28], 1, 'Cumbica', 'Preguiçoso', 'Ronca mais alto que o aeroporto. Dorme em pé.', 50, { c: '#e8d6b8', c2: '#fff4e0', patch: 'spots', pc: '#a8683a', ear: 'round', ec: '#c89a68', tail: 'stub', legs: 'short', len: 20, h: 12, hr: 8, sn: 2 });
  add('mimi', 'Mimi', 'Shih-tzu', 'caotico', [40, 38, 40, 50], 1, 'Praça', 'Arisco', 'Pequena, fofa e completamente imprevisível.', 55, { c: '#f4ecde', patch: 'spots', pc: '#b8884a', ear: 'fluff', tail: 'fluff', legs: 'short', hr: 6, sn: 3, col: '#e870b0' });
  add('leao', 'Leão do Portão', 'Chow-chow', 'selvagem', [58, 60, 50, 38], 1, 'Campo', 'Orgulhoso', 'Juba de rei, humor de síndico.', 40, { c: '#d8812c', mane: true, mc: '#f2a447', ear: 'round', ec: '#b86a1c', tail: 'curl', legs: 'short', hr: 6, sn: 3 });
  add('tyson', 'Tyson', 'Pitbull', 'bruto', [60, 68, 54, 48], 1, 'Campo', 'Leal', 'Músculo e coração mole. O terror dos gatos, mas só de mentirinha.', 35, { c: '#8a8f9c', c2: '#e8e8ec', ear: 'round', ec: '#6a6f7c', tail: 'whip', len: 20, h: 11, hr: 6, sn: 3 });
  add('sargento', 'Sargento', 'Pastor Alemão', 'guardiao', [64, 62, 66, 48], 2, 'Campo', 'Leal', 'Disciplina militar. Não abandona o posto nem pra comer.', 28, { c: '#c0793a', patch: 'saddle', pc: '#26262e', snc: '#26262e', ear: 'point', ec: '#a86428', tail: 'fluff', len: 22, h: 11, hr: 6, sn: 6 });
  add('neve', 'Neve', 'Husky Siberiano', 'selvagem', [60, 58, 52, 64], 2, 'Campo', 'Arisco', 'Ninguém sabe o que ela faz em Guarulhos com esse calor.', 25, { c: '#7a828e', c2: '#f4f4f6', patch: 'mask', eye: '#4ac8f0', ear: 'point', ec: '#5a626e', tail: 'curl', len: 21, h: 10, hr: 6, sn: 5 });
  add('capeta', 'Capeta', 'Pinscher', 'caotico', [38, 54, 34, 70], 1, 'Industrial', 'Arisco', 'Do tamanho de um sapato e com a fúria de um pitbull.', 45, { c: '#2a2024', patch: 'tan', pc: '#a85a28', snc: '#a85a28', ear: 'big', tail: 'stub', legs: 'long', len: 16, h: 8, hr: 5, sn: 4, col: '#c0212a', stud: true });
  add('sombra', 'Sombra', 'Pastor Preto', 'noturno', [58, 58, 56, 58], 2, 'Viela', 'Medroso', 'Aparece quando você pisca. Já estava lá.', 30, { c: '#202028', c2: '#3a3a46', ear: 'point', ec: '#16161c', tail: 'fluff', len: 22, h: 11, hr: 6, sn: 6, snc: '#4a4a58' });
  add('pelucia', 'Doutor Pelúcia', 'Poodle Toy', 'inteligente', [34, 42, 36, 70], 1, 'Praça', 'Curioso', 'Pequeno gênio de apartamento. Resolve quebra-cabeça com o focinho.', 50, { c: '#e0b080', ear: 'fluff', tail: 'fluff', hr: 5, sn: 4 });
  add('carvao', 'Carvão', 'Rottweiler', 'noturno', [66, 70, 60, 40], 2, 'Industrial', 'Orgulhoso', 'Guarda galpão de madrugada. Nunca perdeu o turno.', 25, { c: '#1e1e26', patch: 'tan', pc: '#c0793a', snc: '#c0793a', ear: 'flop', ec: '#14141a', tail: 'stub', len: 22, h: 12, hr: 7, sn: 4, socks: true });
  add('tornado', 'Tornado', 'Border Collie', 'veloz', [50, 52, 46, 80], 2, 'Campo', 'Brincalhão', 'Persegue bola, pombo, ônibus e o próprio rabo.', 30, { c: '#26262e', c2: '#f4f4f4', patch: 'bw', pc: '#f4f4f4', ear: 'point', ec: '#1a1a22', tail: 'fluff', legs: 'long', hr: 6, sn: 5 });
  add('churrasco', 'Churrasquinho', 'Vira-lata Tigrado', 'rua', [48, 50, 44, 52], 0, 'Praça', 'Guloso', 'Aparece em todo churrasco da vizinhança. Ninguém convidou.', 60, { c: '#a85a2a', c2: '#e0b078', patch: 'stripe', pc: '#6a3818', ear: 'flop', ec: '#7a4220', tail: 'curl', tongue: true });
  add('zeppelin', 'Zeppelin', 'Dachshund', 'caotico', [44, 52, 36, 62], 1, 'Industrial', 'Curioso', 'Late quando avião passa. Ou quando não passa.', 45, { c: '#2a2a30', c2: '#8a5a30', ear: 'flop', ec: '#1a1a20', tail: 'down', legs: 'tiny', len: 26, h: 7, hr: 5, sn: 8 });
  add('fumaca', 'Fumaça', 'Husky Cinza', 'veloz', [56, 54, 50, 78], 2, 'Campo', 'Arisco', 'Corre tão rápido que parece que vira fumaça.', 22, { c: '#5a6068', c2: '#f0f0f4', patch: 'mask', eye: '#8ac8f8', ear: 'point', ec: '#454a52', tail: 'curl', len: 21, h: 10, hr: 6, sn: 5 });
  add('mortadela', 'Mortadela', 'Bulldog', 'bruto', [72, 62, 66, 22], 1, 'Viela', 'Preguiçoso', 'Bloqueia viela inteira. Só sai por petisco.', 45, { c: '#dba58a', c2: '#fff0e0', ear: 'round', ec: '#b88060', tail: 'stub', legs: 'short', len: 20, h: 13, hr: 8, sn: 2 });
  add('laje', 'Rainha da Laje', 'Shih-tzu', 'rua', [44, 44, 42, 54], 1, 'Viela', 'Orgulhoso', 'Assiste o bairro lá de cima. Julga tudo.', 40, { c: '#f0e0d0', patch: 'spots', pc: '#6a4a3a', ear: 'fluff', tail: 'fluff', legs: 'short', hr: 6, sn: 3, col: '#e870b0' });
  add('guardiao', 'Guardião do Galpão', 'Pastor Alemão', 'guardiao', [74, 64, 74, 46], 2, 'Industrial', 'Leal', 'Treinado pela Coleira Negra. Mas ainda gosta de carinho.', 18, { c: '#8a6a3a', patch: 'saddle', pc: '#18181e', snc: '#18181e', ear: 'point', ec: '#6a4a22', tail: 'fluff', len: 22, h: 11, hr: 6, sn: 6, col: '#222', stud: true });
  add('biscoito', 'Biscoito', 'SRD Branco', 'rua', [46, 44, 42, 50], 0, 'Praça', 'Guloso', 'Branco como pão de forma. Vive de pedir.', 72, { c: '#f0ece4', c2: '#fff', ear: 'flop', ec: '#d8c8a8', tail: 'curl', tongue: true });
  add('faisca', 'Faísca', 'Pinscher', 'noturno', [38, 52, 32, 74], 1, 'Viela', 'Medroso', 'Brilha só o olho. O resto é pura sombra.', 45, { c: '#1e1a28', patch: 'tan', pc: '#8a4a2a', snc: '#8a4a2a', ear: 'big', tail: 'stub', legs: 'long', len: 16, h: 8, hr: 5, sn: 4 });
  add('cacau', 'Cacau', 'Labrador Chocolate', 'inteligente', [60, 52, 54, 48], 1, 'Campo', 'Guloso', 'Amigo de todo mundo, inclusive de quem não é amigo dele.', 45, { c: '#6a4028', c2: '#8a5a3a', ear: 'flop', ec: '#4a2a18', tail: 'whip', len: 22, h: 11, hr: 6, sn: 5, tongue: true });
  add('gelo', 'Capitão Gelo', 'Husky Branco', 'selvagem', [66, 64, 58, 66], 3, 'Campo', 'Orgulhoso', 'Dizem que nasceu num freezer do Mercado Cumbica.', 8, { c: '#e8ecf4', c2: '#fff', patch: 'mask', eye: '#4ac8f0', ear: 'point', ec: '#c8d0dc', tail: 'curl', col: '#4a8ad8', len: 21, h: 10, hr: 6, sn: 5 });
  add('rei', 'Rei Caramelo Dourado', 'Caramelo Lendário', 'selvagem', [80, 78, 70, 72], 3, 'Praça', 'Orgulhoso', 'A lenda diz que todo caramelo de Cumbica é neto dele.', 6, { c: '#f0b83c', c2: '#ffe8a0', mane: true, mc: '#ffd870', ear: 'point', ec: '#d8982a', tail: 'fluff', col: '#e8c030', hr: 6, sn: 5 });
  add('fantasma', 'Fantasma de Cumbica', 'SRD Branco Lendário', 'noturno', [70, 70, 60, 90], 3, 'Viela', 'Medroso', 'Ninguém viu de dia. Dizem que acompanha os aviões.', 6, { c: '#dfe6f2', c2: '#fff', eye: '#7ab0ff', ear: 'point', ec: '#b8c4da', tail: 'whip', col: '#8a8ad8', len: 22, h: 10, sn: 6 });
  add('navalha', 'Navalha', 'Dobermann', 'veloz', [64, 72, 56, 86], 2, 'Coleira Negra', 'Orgulhoso', 'Elegante, rápido e sem senso de humor.', 0, { c: '#1e1e26', patch: 'tan', pc: '#b8602a', snc: '#b8602a', ear: 'big', tail: 'stub', legs: 'long', len: 22, h: 10, hr: 6, sn: 7, col: '#c0212a', stud: true });
  add('cerbero', 'Cérbero', 'Rottweiler Gigante', 'bruto', [84, 86, 74, 52], 2, 'Coleira Negra', 'Leal', 'O cão de guarda do Galpão. Muda de humor com um assobio.', 0, { c: '#16161c', patch: 'tan', pc: '#a85a28', snc: '#a85a28', ear: 'flop', ec: '#0e0e12', tail: 'stub', len: 22, h: 13, hr: 7, sn: 4, col: '#c0212a', stud: true, socks: true });
  add('marreta', 'Marreta', 'Pitbull Cinza', 'rua', [56, 62, 50, 50], 1, 'Campo', 'Brincalhão', 'Só pensa em bola. Quando perde a bola, o bairro inteiro sabe.', 40, { c: '#a8a4a0', c2: '#f0ece8', ear: 'round', ec: '#7a7672', tail: 'whip', len: 20, h: 11, hr: 6, sn: 3 });
  add('bolinha', 'Bolinha', 'SRD Preto e Branco', 'rua', [30, 30, 30, 40], 0, 'Viela', 'Medroso', 'Fugiu de casa pra ver o mundo. Voltou com saudade.', 0, { c: '#2b2b36', c2: '#f4f4f4', patch: 'spots', pc: '#f4f4f4', ear: 'flop', ec: '#1c1c26', tail: 'curl', len: 16, h: 8, hr: 5, sn: 4 });
  D.PLAYABLE_WILD = D.SPECIES.filter(s => s && s.rec > 0);

  // ---------- itens ----------
  D.ITEMS = {
    petisco: { name: 'Petisco Simples', cat: 'Recrutar', price: 25, mult: 1, trust: 12, desc: 'Biscoitinho básico. Ganha um pouco de confiança.' },
    racao: { name: 'Ração Premium', cat: 'Recrutar', price: 80, mult: 1.4, trust: 22, desc: 'Ração cara. Cachorro respeita.' },
    biscoito: { name: 'Biscoito Especial', cat: 'Recrutar', price: 150, mult: 1.8, trust: 30, desc: 'Receita secreta da Dona Nena.' },
    brinquedo: { name: 'Brinquedo Favorito', cat: 'Recrutar', price: 100, mult: 1.4, trust: 22, desc: 'Bolinha que apita. Brincalhões adoram.' },
    coleira: { name: 'Coleira de Confiança', cat: 'Recrutar', price: 400, mult: 2.8, trust: 40, desc: 'A melhor chance de recrutar. Cara, mas vale.' },
    agua: { name: 'Água Fresca', cat: 'Cura', price: 40, heal: 25, desc: 'Recupera 25 de HP.' },
    racaoR: { name: 'Ração Reforçada', cat: 'Cura', price: 100, heal: 70, desc: 'Recupera 70 de HP.' },
    osso: { name: 'Osso Revivedor', cat: 'Cura', price: 220, revive: 0.5, desc: 'Reanima um cachorro com metade do HP.' },
    chave: { name: 'Chave do Galpão', cat: 'Chave', key: true, desc: 'Abre a porta do Galpão Abandonado.' },
    coleiraNegra: { name: 'Coleira Negra', cat: 'Chave', key: true, desc: 'Coleira preta com tachas vermelhas. Símbolo de uma gangue.' },
    peca: { name: 'Peça da Moto', cat: 'Chave', key: true, desc: 'Um carburador. O Zé está atrás disso.' },
    foto: { name: 'Foto Antiga', cat: 'Chave', key: true, desc: 'Foto da Praça dos Cachorros nos anos 90.' },
  };
  D.SHOPS = { mercado: ['agua', 'racaoR', 'osso', 'petisco'], petisco: ['petisco', 'racao', 'biscoito', 'brinquedo', 'coleira'] };

  // ---------- criação / stats ----------
  let uid = 1;
  D.learnset = (sp) => D.LEARN[sp.type];
  D.xpFor = (lv) => lv * lv * lv;
  D.makeDog = (spId, lv, o = {}) => {
    const sp = D.SPECIES[spId], d = { uid: (o.uid || (Date.now() % 100000) * 100 + (uid++)), sp: spId, name: o.name || sp.name, lv, xp: D.xpFor(lv), hp: 1, st: null, stT: 0, moves: [], trust: 0, stage: { atk: 0, def: 0, spd: 0 } };
    const known = D.learnset(sp).filter(m => m[0] <= lv).map(m => m[1]); const uniq = []; known.forEach(m => { const i = uniq.indexOf(m); if (i >= 0) uniq.splice(i, 1); uniq.push(m); });
    d.moves = uniq.slice(-4).map(id => ({ id, pp: D.MOVES[id].pp }));
    d.hp = D.stats(d).hp; return d;
  };
  D.stats = (d) => {
    const b = D.SPECIES[d.sp].base, lv = d.lv, f = (v) => Math.floor(2 * v * lv / 100) + 5;
    return { hp: Math.floor(2 * b.hp * lv / 100) + lv + 10, atk: f(b.atk), def: f(b.def), spd: f(b.spd) };
  };
  D.stageMul = (n) => n >= 0 ? (2 + n) / 2 : 2 / (2 - n);
  D.baseXp = (sp) => Math.floor((sp.base.hp + sp.base.atk + sp.base.def + sp.base.spd) / 3.2);
  D.heal = (d) => { d.hp = D.stats(d).hp; d.st = null; d.stT = 0; d.moves.forEach(m => m.pp = D.MOVES[m.id].pp); };

  // ---------- recrutamento ----------
  D.recruitChance = (d, itemId) => {
    const sp = D.SPECIES[d.sp], it = D.ITEMS[itemId], mx = D.stats(d).hp;
    const hpF = 1 - 0.65 * (d.hp / mx), lvF = M.clamp(1.2 - d.lv / 50, 0.45, 1.1), trF = 1 + (d.trust || 0) / 100;
    let pm = 1; const p = sp.pers;
    if (p === 'Guloso' && ['petisco', 'racao', 'biscoito'].includes(itemId)) pm = 1.5;
    if (p === 'Brincalhão') pm = itemId === 'brinquedo' ? 2 : 1;
    if (p === 'Orgulhoso') pm = itemId === 'coleira' ? 1.2 : 0.6;
    if (p === 'Medroso') pm = (d.trust || 0) >= 50 ? 1.4 : 0.9;
    if (p === 'Arisco') pm = 0.8; if (p === 'Leal') pm = 1.25; if (p === 'Preguiçoso') pm = d.hp / mx < 0.5 ? 1.4 : 1;
    return M.clamp((sp.rec / 100) * hpF * lvF * trF * it.mult * pm, 0.02, 0.98);
  };

})(window.MD);
