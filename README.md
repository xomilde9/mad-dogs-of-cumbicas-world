# MAD DOGS OF CUMBICA'S WORLD

RPG 2D top-down em pixel art (HTML5 Canvas + JavaScript puro, sem dependências externas e sem imagens), inspirado na exploração e nas batalhas por turnos de Pokémon FireRed. Ambientado em uma versão estilizada e compactada de **Cumbica, Guarulhos – SP**. Protagonista: **Gabe**. Diálogos em português do Brasil.

> Os ginásios e personagens são adaptações **fictícias**. Os lugares reais de Cumbica servem de inspiração para as áreas de exploração; não são arenas de verdade. Base Aérea e Aeroporto aparecem só como fachada restrita.

## Como jogar

Abra `index.html` no navegador (Chrome/Edge/Firefox). Funciona offline e direto do disco (`file://`). Opcionalmente: `python3 -m http.server` e abra `http://localhost:8000`.

| Tecla | Ação |
|---|---|
| WASD / Setas | mover / escolher |
| Z / Enter / Espaço | confirmar / interagir |
| X / Esc | voltar / abrir menu |
| I | mochila |
| M | mapa de Cumbica |
| Q | missões |
| Tab | menu principal |

O progresso é salvo no `localStorage` (menu → Salvar, camas, Tia Marlene e ao entrar em portas). Volume e velocidade do texto ficam em Configurações.

## O que já funciona

- Título, introdução, movimentação com animação, colisões, portas e transições.
- **Mapa único de Cumbica** (104x96) com 8 ginásios fictícios e áreas trancadas por insígnias (barreiras de cone).
- 8 ginásios: cada um com líder, 2 auxiliares (treinadores com linha de visão), desafio de quiz, recompensa e insígnia; 8 insígnias abrem o Salão do Campeão.
- Batalhas por turnos: ATACAR / EQUIPE / MOCHILA / RECRUTAR / FUGIR, dano com afinidade de tipos, crítico, prioridade e velocidade, estágios de ataque/defesa/velocidade, medo, recuo, XP, subir de nível e aprender golpes.
- **Recrutamento** (nada de captura): petiscos, brinquedo e coleira dão confiança; chance depende de HP, nível, personalidade e item, com animação.
- 37 espécies de cachorros (3 iniciais, 3 lendários), encontros no mato alto por zona, cachorros secretos.
- NPCs, rival Kauê (3 duelos), Coleira Negra (Galpão Abandonado), Campeão, missões principais e secundárias.
- Equipe (6) + Canil, mochila, loja, mapa com névoa de exploração, perfil, tabela de afinidades, configurações, save/load.
- Música e efeitos chiptune originais (WebAudio).

## Estrutura

```
index.html, style.css
js/core.js    loop, input, timers, texto pixelado, painéis
js/audio.js   música e SFX
js/sprites.js arte procedural (tiles, prédios, pessoas, cachorros)
js/data.js    tipos, golpes, 37 espécies, itens, recrutamento
js/maps.js    mapa único de Cumbica + interiores
js/ui.js      diálogos, menus, equipe, mochila, mapa, missões, loja
js/battle.js  batalha e recrutamento
js/world.js   mundo, NPCs, treinadores, portas, encontros, save
js/story.js   NPCs, ginásios, missões, encontros por zona
js/main.js    inicialização
```
