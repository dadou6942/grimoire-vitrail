#!/usr/bin/env node
/* Vérifie que les sauvegardes survivent aux mises à jour : migration des anciennes versions,
 * copie de secours, contenu disparu, code de transfert et fusion de progressions.
 * Usage : node tools/test-saves.js */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function boot(store) {
  const window = {};
  const ctx = {
    window, Math, JSON, console, Date, Object, btoa, atob, escape, unescape, navigator: {},
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => (store[k] = String(v)),
      removeItem: (k) => delete store[k],
    },
  };
  vm.createContext(ctx);
  for (const f of ['data.js', 'engine.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx);
  window.G.UI = { toast() {} };
  return window.G;
}

let fails = 0;
const ok = (name, cond, info) => {
  if (!cond) fails++;
  console.log(`${cond ? '✓' : '✗'} ${name}${info ? '  — ' + info : ''}`);
};
const RUN = 'grimoire-vitrail.run.v1';
const META = 'grimoire-vitrail.meta.v1';

// 1. sauvegarde de la version 1.0 (carte à embranchements, sans fioles ni palier)
{
  const old = {
    hero: 'chevalier', hp: 52, maxHp: 80, gold: 120, act: 2,
    deck: [{ id: 'taille', up: false, uid: 'a1' }, { id: 'egide', up: true, uid: 'a2' }, { id: 'carteDisparue', uid: 'a3' }],
    relics: ['ecuSaphir', 'reliqueDisparue'], map: { act: 2, rows: [] }, pos: { row: 2, lane: 1 }, floor: 7,
    stats: { kills: 6 }, seenEvents: ['pacte'],
  };
  const store = { [RUN]: JSON.stringify(old), [META]: JSON.stringify({ wins: 1, runs: 4 }) };
  const G = boot(store);
  G.Run.loadMeta();
  const okLoad = G.Run.load();
  const r = G.Run.run;
  ok('une sauvegarde 1.0 se charge', okLoad && r.hero === 'chevalier' && r.hp === 52 && r.gold === 120);
  ok('… au bon étage, avec des portes neuves', r.step === 3 && Array.isArray(r.doors) && r.doors.length > 0, `étage ${r.step}`);
  ok('… sans la carte ni la relique disparues', r.deck.length === 2 && !r.relics.includes('reliqueDisparue'));
  ok('… et gagne les nouveaux champs', Array.isArray(r.potions) && r.palier === 0);
  ok('les acquis : une victoire ancienne éveille les héros', G.Run.meta.guardians >= 3 && G.Run.heroUnlocked('saigneur'));
}

// 2. sauvegarde abîmée : on se rabat sur la copie de secours, rien n'est effacé
{
  const store = {};
  const G = boot(store);
  G.Run.loadMeta();
  G.Run.newRun('chevalier');
  const gold = G.Run.run.gold;
  store[RUN] = '{"hero":"chev'; // écriture interrompue
  const G2 = boot(store);
  G2.Run.loadMeta();
  ok('sauvegarde abîmée : la copie de secours prend le relais', G2.Run.load() && G2.Run.run.gold === gold);
  ok('la sauvegarde abîmée n’a pas été effacée', store[RUN] === '{"hero":"chev');
}

// 3. reprise de combat dont l'ennemi n'existe plus : on garde la partie, on oublie le combat
{
  const store = {};
  const G = boot(store);
  G.Run.loadMeta();
  G.Run.newRun('chevalier');
  G.Run.run.resume = { screen: 'combat', snap: { enemyId: 'ennemiDisparu', hand: [], pile: [], discard: [] } };
  G.Run.save();
  const G2 = boot(store);
  G2.Run.loadMeta();
  ok('un combat impossible à reprendre est oublié, la partie reste', G2.Run.load() && G2.Run.run.resume === null);
}

// 4. code de transfert : aller-retour vers un autre appareil
{
  const a = {};
  const G = boot(a);
  G.Run.loadMeta();
  G.Run.meta.guardians = 2;
  G.Run.meta.palier = { chevalier: 2 };
  G.Run.saveMeta();
  G.Run.newRun('sorciere');
  G.Run.run.gold = 333;
  G.Run.save();
  const code = G.Run.exportCode();
  const b = {};
  const H = boot(b);
  H.Run.loadMeta();
  const err = H.Run.importCode(code);
  H.Run.loadMeta();
  ok('code de transfert : importé sans erreur', err === null, err || `${code.length} caractères`);
  ok('… la progression suit', H.Run.meta.guardians === 2 && H.Run.meta.palier.chevalier === 2);
  ok('… et la partie en cours aussi', H.Run.load() && H.Run.run.hero === 'sorciere' && H.Run.run.gold === 333);
  ok('un code tronqué est refusé proprement', typeof H.Run.importCode(code.slice(0, code.length - 20)) === 'string');
}

// 5. fusion : on garde le meilleur des deux côtés
{
  const G = boot({});
  G.Run.loadMeta();
  G.Run.meta.palier = { chevalier: 1, sorciere: 3 };
  G.Run.meta.wins = 4;
  G.Run.applyRemote({ wins: 2, guardians: 9, palier: { chevalier: 4 } }, null);
  const m = G.Run.meta;
  ok('fusion des acquis : le meilleur de chaque côté', m.wins === 4 && m.guardians === 12 && m.palier.chevalier === 4 && m.palier.sorciere === 3, JSON.stringify(m.palier));
}

console.log(fails ? `\n${fails} échec(s)` : '\nToutes les sauvegardes sont préservées.');
process.exit(fails ? 1 : 0);
