#!/usr/bin/env node
/* Équilibrage : un bot simple joue des parties complètes (3 actes) et mesure
 * le taux de victoire et l'acte où il meurt. Usage : node tools/balance.js [parties] */
'use strict';
const HERO = process.argv[3] || 'chevalier';
const GROUPS = process.env.NOGROUPS ? 0 : 1;
const path = require('path');
const vm = require('vm');
const fs = require('fs');

function load() {
  const window = {};
  const store = {};
  const ctx = {
    window, Math, JSON, console, Date, Object,
    localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => (store[k] = v), removeItem: (k) => delete store[k] },
  };
  vm.createContext(ctx);
  for (const f of ['data.js', 'engine.js', 'meta.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx);
  const G = window.G;
  G.UI = { toast() {} };
  return G;
}

/** Joue un tour : couvre l'attaque annoncée, puis frappe. */
function playTurn(G, c) {
  let guard = 0;
  while (!c.over && guard++ < 30) {
    // comme un joueur : on abat d'abord l'ennemi le plus fragile
    const weakest = c.alive().reduce((a, b) => (b.hp + b.block < a.hp + a.block ? b : a), c.alive()[0]);
    if (weakest) c.setTarget(weakest.uid);
    const playable = c.hand.filter((k) => c.canPlay(k));
    if (!playable.length) break;
    const incoming = c.incomingRaw();
    const need = Math.max(0, incoming - c.p.block);
    const score = (k) => {
      const d = G.CARDS[k.id];
      const v = G.cardVals(k);
      const cost = Math.max(0.5, G.cardCost(k));
      let s = 0;
      if (d.type === 'pow') s += 30;
      if (v.d) s += (c.previewDamage(v.d) * (k.id === 'doubleTaille' ? 2 : 1)) / cost;
      if (v.b) s += (need > 0 ? Math.min(v.b, need) * 1.4 : v.b * 0.2) / cost;
      if (v.n || k.id === 'lameVitrail' || k.id === 'bastion') s += 4;
      if (k.id === 'ferContreFer') s += c.previewDamage(c.p.block) / cost;
      if (k.id === 'echoCloche') s += need > 0 ? c.p.block : 0;
      if (k.id === 'lumiereChoeur') s += c.p.hp < c.p.maxHp * 0.6 ? 8 : 0;
      if (v.u) s += (v.u * 1.6) / cost;
      if (v.h) s += c.p.hp < c.p.maxHp * 0.7 ? v.h / cost : 0;
      const hpCost = G.cardHp(k);
      if (hpCost) s -= c.p.hp < c.p.maxHp * 0.35 ? 50 : hpCost * 0.6;
      // achever l'ennemi
      if (v.d && c.previewDamage(v.d) >= c.e.hp + c.e.block) s += 100;
      return s;
    };
    playable.sort((a, b) => score(b) - score(a));
    c.play(playable[0]);
  }
}

function fight(G, enemyId) {
  const c = new G.Combat(enemyId);
  c.start();
  let turns = 0;
  while (!c.over && turns++ < 60) {
    playTurn(G, c);
    if (c.over) break;
    c.endTurn();
    c.enemyTurn();
    if (c.over) break;
    c.startTurn();
  }
  c.finish();
  return c.won;
}

function reward(G, boost) {
  const R = G.Run;
  const ch = R.cardChoices(3, boost || 0);
  // préférence simple : rares, puis peu communes, puis attaques fortes
  const rank = (id) => ({ r: 3, u: 2, c: 1 }[G.CARDS[id].rarity] || 0);
  ch.sort((a, b) => rank(b) - rank(a));
  if (Math.random() < 0.85) R.addCard(ch[0]);
}

function runOnce(G) {
  const R = G.Run;
  R.newRun(HERO);
  for (let act = 1; act <= 3; act++) {
    R.run.act = act;
    const pool = G.ACT_POOLS[act];
    const plan = ['combat', 'combat', Math.random() < 0.5 ? 'event' : 'combat', 'elite', 'altar', 'boss'];
    for (const step of plan) {
      if (step === 'combat' || step === 'elite' || step === 'boss') {
        const only = process.env.ONLY; // ONLY=id : force cet ennemi (ou ce gardien) quand il appartient à l'acte
        const loners = pool.normal.filter((x) => !G.ENEMIES[x].pack);
        let id = step === 'boss' ? R.bossOf(act) : step === 'elite' ? G.pick(pool.elite) : G.pick(pool.normal);
        if (only && G.ENEMIES[only] && G.ENEMIES[only].act === act) {
          const d = G.ENEMIES[only];
          if ((step === 'boss' && d.boss) || (step === 'elite' && d.elite) || (step === 'combat' && !d.boss && !d.elite)) id = only;
        }
        // meutes et escortes, comme dans le jeu
        if (step === 'combat' && G.ENEMIES[id].pack) {
          id = [0, 1, 2].map(() => ({ id, minion: 'pack3' }));
        } else if (step === 'combat' && Math.random() < GROUPS * 0.3) {
          const n = Math.random() < 0.5 ? 2 : 3;
          id = Array.from({ length: n }, () => ({ id: G.pick(loners), minion: 'pack' + n }));
        } else if (step === 'elite' && Math.random() < GROUPS * 0.45) {
          id = [{ id }].concat(Array.from({ length: Math.random() < 0.8 ? 1 : 2 }, () => ({ id: G.pick(loners), minion: 'escort' })));
        }
        if (!fight(G, id)) return { won: false, act, step };
        R.gainGold(step === 'elite' ? 30 : step === 'boss' ? 60 : 15);
        for (const fx of R.effects()) if (fx.combatEnd) fx.combatEnd(R.run);
        reward(G, step === 'elite' ? 0.1 : step === 'boss' ? 1 : 0);
        if (step === 'elite') R.gainRandomRelic();
        if (step === 'boss') {
          R.gainRelic(G.pick(R.relicPool(['boss'])));
          R.heal(R.run.maxHp);
        }
      } else if (step === 'altar') {
        if (R.run.hp < R.run.maxHp * 0.7 && !R.has('ostensoir')) R.heal(Math.round(R.run.maxHp * 0.3) + (R.has('sceau') ? 15 : 0));
        else R.upgradeRandom(1);
      } else if (step === 'event') {
        R.heal(10);
      }
      // marchand implicite : une amélioration de temps en temps
      if (Math.random() < 0.15) R.upgradeRandom(1);
    }
  }
  return { won: true, hp: R.run.hp };
}

module.exports = { load, playTurn, fight, runOnce };
if (require.main === module) main();

function main() {
const N = Number(process.argv[2]) || 400;
console.log('Héros :', HERO);
const G = load();
let wins = 0;
const deaths = {};
for (let i = 0; i < N; i++) {
  const r = runOnce(G);
  if (r.won) wins++;
  else {
    const k = `acte ${r.act} (${r.step})`;
    deaths[k] = (deaths[k] || 0) + 1;
  }
}
console.log(`Victoires : ${wins}/${N} (${((wins / N) * 100).toFixed(1)} %)`);
Object.keys(deaths)
  .sort()
  .forEach((k) => console.log(`  morts en ${k} : ${deaths[k]}`));
}
