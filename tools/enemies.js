#!/usr/bin/env node
/* PV perdus et durée moyenne de chaque combat avec le paquet de départ. */
'use strict';
const { load, playTurn } = require('./balance.js');
const G = load();
const R = G.Run;
for (const id of Object.keys(G.ENEMIES)) {
  let lost = 0;
  let turns = 0;
  const n = 200;
  for (let i = 0; i < n; i++) {
    R.newRun('chevalier');
    R.run.hp = 999;
    R.run.maxHp = 999;
    const c = new G.Combat(G.ENEMIES[id].pack ? [0, 1, 2].map(() => ({ id, minion: 'pack3' })) : id);
    c.start();
    let t = 0;
    while (!c.over && t++ < 60) {
      playTurn(G, c);
      if (c.over) break;
      c.endTurn();
      c.enemyTurn();
      if (c.over) break;
      c.startTurn();
    }
    lost += 999 - c.p.hp;
    turns += c.turn;
  }
  console.log(id.padEnd(16), 'PV perdus', (lost / n).toFixed(1).padStart(6), '  tours', (turns / n).toFixed(1));
}
