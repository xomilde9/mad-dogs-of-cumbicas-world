'use strict';
// ================= INÍCIO: título, introdução, novo jogo / continuar =================
(function (M) {
  const UI = M.ui, Wd = M.world;
  try { const s = JSON.parse(localStorage.getItem('mdcw_settings') || 'null'); if (s) Object.assign(M.settings, s); } catch (e) { }

  const INTRO = [
    'Cumbica, Guarulhos. Entre o barulho dos aviões e o cheiro de pão quente, uma ameaça sobrenatural tomou as ruas: os Demônios Zombeteiros.',
    'Há anos, a matilha dos Mad Dogs protegia as praças. Mas criaturas demoníacas surgiram das sombras, espalhando medo, confusão e risadas sinistras pelos bairros.',
    'Gabe precisa reunir os cachorros aliados dos Mad Dogs e caçar os Demônios Zombeteiros antes que eles dominem Cumbica por completo.',
    'Oito ginásios. Oito insígnias. E um demônio misterioso que comanda a invasão por trás de uma coleira negra...',
  ];

  async function begin(mode) {
    if (mode === 'settings') { await UI.settings(); return; }
    M.audio.stop();
    if (mode === 'new') {
      M.newGame(); M.audio.play('story'); await UI.card(INTRO); Wd.build(); Wd.enter('cumbica', 38, 36, 'down');
      await M.fadeIn(400); await UI.card(['TUTORIAL — MOVIMENTAÇÃO: Use WASD ou as setas para caminhar. Explore ruas, praças e vielas de Cumbica.', 'TUTORIAL — INTERAÇÃO: Aperte Z, Enter ou Espaço para conversar com pessoas, ler placas e examinar objetos. Fique de frente para o que deseja investigar.', 'TUTORIAL — MAPA E MISSÕES: Aperte M para abrir o mapa e Q para consultar o diário. O mapa mostra lojas, NPCs, ginásios e pontos de interesse. O diário explica seu próximo destino.', 'TUTORIAL — SUA MATILHA: Os cachorros são seus parceiros. Recrute com petiscos e confiança, cuide do HP e escolha a equipe antes das batalhas. Os inimigos são os Demônios Zombeteiros. Aperte E a qualquer momento para rastrear sua missão e descobrir o destino. Boa caçada, Gabe!'], { bg: '#17233a' }); M.G.flags.tutorialSeen = 1; M.Save.save();
    } else { if (!M.Save.load()) { M.newGame(); } Wd.build(); const G = M.G; M.fx.fade = 1; Wd.enter(G.map, G.x, G.y, G.dir); await M.fadeIn(400); }
    // auto-eventos iniciais (Zé)
    Wd.run(async () => { await M.wait(300); const ze = (Wd.npcs.cumbica || []).find(n => n.id === 'ze'); if (ze && !M.G.flags.starter && Wd.mapId === 'cumbica') { M.G.flags.auto_ze = 1; await M.story.handlers['@ze_intro'](ze); } });
  }
  function title() {
    M.scene = UI.title(M.Save.has(), async (mode) => { await begin(mode); if (mode === 'settings') title(); });
    M.audio.play('title');
  }
  window.addEventListener('load', () => { M.start(); title(); });
})(window.MD);
