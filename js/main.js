'use strict';
// ================= INÍCIO: título, introdução, novo jogo / continuar =================
(function (M) {
  const UI = M.ui, Wd = M.world;
  try { const s = JSON.parse(localStorage.getItem('mdcw_settings') || 'null'); if (s) Object.assign(M.settings, s); } catch (e) { }

  const INTRO = [
    'Cumbica, Guarulhos. Entre o barulho dos aviões e o cheiro de pão quente, o bairro guarda uma história que quase ninguém conta: a dos cachorros.',
    'Há anos, a matilha dos Mad Dogs cuidava das praças. Mas o cuidador se foi, e agora grupos de cães disputam território, de esquina em esquina.',
    'Gabe é a única que ainda entende o que eles dizem. Com petiscos, paciência e confiança, ela vai juntar uma nova matilha.',
    'Oito ginásios. Oito insígnias. E uma sombra de coleira preta que ninguém ousa nomear...',
  ];

  async function begin(mode) {
    if (mode === 'settings') { await UI.settings(); return; }
    M.audio.stop();
    if (mode === 'new') {
      M.newGame(); M.audio.play('story'); await UI.card(INTRO); Wd.build(); Wd.enter('cumbica', 38, 36, 'down');
      await M.fadeIn(400);
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
