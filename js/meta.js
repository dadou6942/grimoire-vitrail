/* Grimoire de Vitrail — progression entre les parties :
 * pactes, expérience et arbres de compétences, succès (et leurs déblocages),
 * collection (découvertes), statistiques et historique des parties. */
(function (G) {
  'use strict';

  const R = G.Run;
  const M = {};
  G.Meta = M;

  // ================================================================== pactes
  // Choisis avant la partie : un malus pour toute l'ascension, contre un bonus d'expérience.
  const PACTS = {
    fer: { name: 'Pacte de fer', desc: 'Tous les ennemis commencent avec 1 Force.', xp: 0.2, enemySpawn: (c, e) => (e.st.force = (e.st.force || 0) + 1) },
    misere: { name: 'Pacte de misère', desc: 'Tu gagnes moitié moins d’or.', xp: 0.15, goldMul: -0.5 },
    sang: { name: 'Pacte du sang', desc: 'Tes PV maximum sont réduits d’un quart.', xp: 0.2, runStart: (run) => { run.maxHp = Math.round(run.maxHp * 0.75); run.hp = run.maxHp; } },
    doute: { name: 'Pacte du doute', desc: 'Ton paquet commence avec 2 Doutes.', xp: 0.15, runStart: (run) => R.addCard('doute', false, 2) },
    hate: { name: 'Pacte de hâte', desc: 'Tu pioches 4 cartes par tour au lieu de 5.', xp: 0.25, drawMod: -1 },
    cierges: { name: 'Pacte des cierges éteints', desc: 'Les autels ne soignent plus.', xp: 0.2, noAltarHeal: true },
    brume: { name: 'Pacte de la brume', desc: 'Les intentions des élites et des gardiens sont cachées.', xp: 0.2, combatStart: (c) => { if (c.enemies.some((e) => e.def.elite || e.def.boss)) c.hidden = true; } },
    nuee: { name: 'Pacte de la nuée', desc: 'Les combats ordinaires opposent toujours une meute.', xp: 0.15, packAlways: true, lock: 'victoire' },
    verre: { name: 'Pacte de verre', desc: 'Tu commences sans relique de départ.', xp: 0.25, lock: 'pacte1', runStart: (run) => { run.relics = []; } },
  };
  G.PACTS = PACTS;
  M.pactAvailable = (id) => !PACTS[id].lock || !!(R.meta.ach && R.meta.ach[PACTS[id].lock]);
  M.pactXp = (ids) => (ids || []).reduce((s, id) => s + (PACTS[id] ? PACTS[id].xp : 0), 0);

  // ================================================================== arbres de compétences
  // 3 branches de 4 nœuds par héros ; on débloque les nœuds dans l'ordre de la branche.
  const N = {};
  const node = (id, name, desc, fx) => (N[id] = Object.assign({ id, name, desc }, fx));
  // branche commune : le pèlerin (ressources de départ)
  const pilgrim = (h) => [
    node(h + '_c1', 'Bourse de pèlerin', 'Commence chaque ascension avec 40 or de plus.', { runStart: (run) => (run.gold += 40) }),
    node(h + '_c2', 'Herboriste', 'Commence chaque ascension avec une fiole de plus.', { runStart: () => R.addPotion() }),
    node(h + '_c3', 'Prière fervente', 'Les autels soignent 10 PV de plus.', { altarHeal: 10 }),
    node(h + '_c4', 'Reliquaire de voyage', 'Commence chaque ascension avec une relique commune.', { runStart: () => { const p = R.relicPool(['c']); if (p.length) R.gainRelic(G.pick(p)); } }),
  ];
  const TREES = {
    chevalier: [
      { name: 'Rempart', nodes: [
        node('ch_a1', 'Écu renforcé', 'Gagne 4 Armure au début de chaque combat.', { combatStart: (c) => c.block(4) }),
        node('ch_a2', 'Cuir épais', '+6 PV maximum.', { runStart: (run) => { run.maxHp += 6; run.hp += 6; } }),
        node('ch_a3', 'Riposte innée', 'Commence chaque combat avec 2 Épines permanentes.', { combatStart: (c) => c.self('epinesP', 2) }),
        node('ch_a4', 'Bastion vivant', 'Au début de ton tour, si tu n’as pas d’Armure, gagne 3 Armure.', { turnStart: (c) => c.p.block === 0 && c.block(3) }),
      ] },
      { name: 'Lame', nodes: [
        node('ch_b1', 'Fil aiguisé', 'Commence chaque combat avec 1 Force.', { combatStart: (c) => c.self('force', 1) }),
        node('ch_b2', 'Élan', '+1 Encre au premier tour de chaque combat.', { turnStart: (c) => c.turn === 1 && c.gainInk(1) }),
        node('ch_b3', 'Coup de grâce', 'Quand un ennemi tombe, gagne 1 Encre.', { enemyKilled: (c) => !c.over && c.gainInk(1) }),
        node('ch_b4', 'Maître d’armes', 'Les récompenses proposent 1 carte de plus.', { rewardChoices: 1 }),
      ] },
      { name: 'Pèlerin', nodes: pilgrim('ch') },
    ],
    sorciere: [
      { name: 'Cendre', nodes: [
        node('so_a1', 'Étincelles errantes', 'Au début de chaque combat, applique 2 Brûlure à tous les ennemis.', { combatStart: (c) => c.enemies.forEach((e) => c.apply('brulure', 2, e)) }),
        node('so_a2', 'Combustible', 'Au début de ton tour, applique 1 Brûlure à la cible.', { turnStart: (c) => c.apply('brulure', 1) }),
        node('so_a3', 'Page familière', 'Commence chaque combat avec Page ardente (1).', { combatStart: (c) => c.self('braise', 1) }),
        node('so_a4', 'Incendie', 'Quand un ennemi tombe, applique 3 Brûlure aux autres.', { enemyKilled: (c) => c.alive().forEach((e) => c.apply('brulure', 3, e)) }),
      ] },
      { name: 'Verbe', nodes: [
        node('so_b1', 'Mémoire vive', 'Pioche 1 carte de plus au premier tour.', { turnStart: (c) => c.turn === 1 && c.draw(1) }),
        node('so_b2', 'Élan', '+1 Encre au premier tour de chaque combat.', { turnStart: (c) => c.turn === 1 && c.gainInk(1) }),
        node('so_b3', 'Réminiscence', 'Les récompenses proposent 1 carte de plus.', { rewardChoices: 1 }),
        node('so_b4', 'Litanie sans fin', 'Gagne 1 Encre quand tu joues ta 4e carte d’un tour.', { cardPlayed: (c) => c.stats.playedTurn === 4 && c.gainInk(1) }),
      ] },
      { name: 'Pèlerine', nodes: pilgrim('so') },
    ],
    saigneur: [
      { name: 'Sang', nodes: [
        node('sa_a1', 'Veines larges', '+8 PV maximum.', { runStart: (run) => { run.maxHp += 8; run.hp += 8; } }),
        node('sa_a2', 'Cicatrisation', 'Soigne 3 PV après chaque combat.', { combatEnd: () => R.heal(3) }),
        node('sa_a3', 'Soif innée', 'Commence chaque combat avec Soif (1).', { combatStart: (c) => c.self('soif', 1) }),
        node('sa_a4', 'Vampire', 'Quand un ennemi tombe, soigne 5 PV.', { enemyKilled: (c) => c.heal(5) }),
      ] },
      { name: 'Fureur', nodes: [
        node('sa_b1', 'Rage froide', 'Commence chaque combat avec 1 Force.', { combatStart: (c) => c.self('force', 1) }),
        node('sa_b2', 'Élan', '+1 Encre au premier tour de chaque combat.', { turnStart: (c) => c.turn === 1 && c.gainInk(1) }),
        node('sa_b3', 'Frénésie', 'Sous la moitié de tes PV, +1 Encre à chaque tour.', { turnStart: (c) => c.p.hp * 2 < c.p.maxHp && c.gainInk(1) }),
        node('sa_b4', 'Goût du sang', 'Les récompenses proposent 1 carte de plus.', { rewardChoices: 1 }),
      ] },
      { name: 'Pèlerin', nodes: pilgrim('sa') },
    ],
  };
  G.TREES = TREES;
  G.SKILL_NODES = N;

  // ================================================================== expérience
  M.MAX_LEVEL = 15;
  M.need = (level) => 60 + level * 40; // expérience pour passer au niveau suivant
  M.hero = function (h) {
    const all = (R.meta.heroes = R.meta.heroes || {});
    all[h] = all[h] || { xp: 0, alloc: [] };
    return all[h];
  };
  M.levelOf = function (xp) {
    let lvl = 0;
    let rest = xp;
    while (lvl < M.MAX_LEVEL && rest >= M.need(lvl)) {
      rest -= M.need(lvl);
      lvl++;
    }
    return { level: lvl, into: rest, next: lvl < M.MAX_LEVEL ? M.need(lvl) : 0 };
  };
  M.points = (h) => M.levelOf(M.hero(h).xp).level - M.hero(h).alloc.length;
  M.canLearn = function (h, id) {
    const st = M.hero(h);
    if (st.alloc.includes(id) || M.points(h) <= 0) return false;
    for (const br of TREES[h]) {
      const i = br.nodes.findIndex((n) => n.id === id);
      if (i >= 0) return i === 0 || st.alloc.includes(br.nodes[i - 1].id);
    }
    return false;
  };
  M.learn = function (h, id) {
    if (!M.canLearn(h, id)) return false;
    M.hero(h).alloc.push(id);
    R.saveMeta();
    return true;
  };
  M.resetTree = function (h) {
    M.hero(h).alloc = [];
    R.saveMeta();
  };
  /** Expérience gagnée par une partie. */
  M.runXp = function (run, won) {
    const s = run.stats;
    const base = (run.floor || 0) * 8 + (s.kills || 0) * 4 + (s.elites || 0) * 12 + (s.bosses || 0) * 35 + (won ? 80 : 0);
    const mul = 1 + M.pactXp(run.pacts) + (run.palier || 0) * 0.1;
    return Math.round(base * mul);
  };

  // ================================================================== succès
  // check(e) reçoit un événement { k: 'combat' | 'run' | 'tick', ... } ; unlock = contenu débloqué.
  const ACH = [
    { id: 'premier', name: 'Premier sang', desc: 'Remporter un combat.', check: (e) => e.k === 'combat' },
    { id: 'gardien', name: 'Briseur de gardien', desc: 'Vaincre un gardien.', check: (e) => e.k === 'combat' && e.type === 'boss', unlock: { relic: 'vitrailSaint' } },
    { id: 'victoire', name: 'La rosace est sauve', desc: 'Remporter une ascension.', check: (e) => e.k === 'run' && e.won, unlock: { pact: 'nuee' } },
    { id: 'pacte1', name: 'Signé à l’encre', desc: 'Remporter une ascension avec au moins un pacte.', check: (e) => e.k === 'run' && e.won && (e.run.pacts || []).length >= 1, unlock: { pact: 'verre' } },
    { id: 'pactes3', name: 'Trois fois parjure', desc: 'Remporter une ascension avec trois pactes.', check: (e) => e.k === 'run' && e.won && (e.run.pacts || []).length >= 3 },
    { id: 'meute', name: 'Dresseur de meutes', desc: 'Vaincre une meute de trois ennemis.', check: (e) => e.k === 'combat' && e.type === 'combat' && e.c.enemies.length >= 3, unlock: { card: 'tourbillon' } },
    { id: 'escorte', name: 'Sans témoin', desc: 'Vaincre une élite et toute son escorte.', check: (e) => e.k === 'combat' && e.type === 'elite' && e.c.enemies.length >= 2, unlock: { card: 'nova' } },
    { id: 'rempart50', name: 'Cathédrale vivante', desc: 'Avoir 50 Armure en même temps.', check: (e) => e.k === 'combat' && e.c.stats.maxBlock >= 50, unlock: { card: 'forteresse' } },
    { id: 'pyromane', name: 'Pyromane', desc: 'Infliger 40 dégâts de Brûlure en un seul combat.', check: (e) => e.k === 'combat' && e.c.stats.burn >= 40, unlock: { card: 'immolation' } },
    { id: 'hemophile', name: 'Hémophile', desc: 'Payer 25 PV en un seul combat.', check: (e) => e.k === 'combat' && e.c.stats.paid >= 25, unlock: { card: 'pluieSang' } },
    { id: 'intouchable', name: 'Intouchable', desc: 'Vaincre un gardien sans perdre de PV pendant le combat.', check: (e) => e.k === 'combat' && e.type === 'boss' && e.c.stats.hpLost === 0, unlock: { relic: 'aureole' } },
    { id: 'eclair', name: 'Éclair', desc: 'Remporter un combat dès le premier tour.', check: (e) => e.k === 'combat' && e.c.turn === 1 },
    { id: 'cent', name: 'Moissonneur', desc: 'Vaincre 100 ennemis au total.', check: () => (R.meta.stats.kills || 0) >= 100, unlock: { card: 'festin' } },
    { id: 'trio', name: 'Trinité', desc: 'Remporter une ascension avec chacun des trois héros.', check: () => ['chevalier', 'sorciere', 'saigneur'].every((h) => R.meta.stats.heroes[h] && R.meta.stats.heroes[h].wins > 0), unlock: { relic: 'trinite' } },
    { id: 'palier3', name: 'Ascension sévère', desc: 'Remporter une ascension au palier 3 ou plus.', check: (e) => e.k === 'run' && e.won && (e.run.palier || 0) >= 3 },
    { id: 'riche', name: 'Trésorier', desc: 'Posséder 300 or en même temps.', check: () => R.run && R.run.gold >= 300 },
    { id: 'alchimiste', name: 'Alchimiste', desc: 'Boire 10 fioles au total.', check: () => (R.meta.stats.potions || 0) >= 10 },
    { id: 'verrier', name: 'Maître verrier', desc: 'Transformer 5 cartes au total.', check: () => (R.meta.stats.ench || 0) >= 5 },
    { id: 'niveau5', name: 'Vétéran', desc: 'Monter un héros au niveau 5.', check: () => Object.values(R.meta.heroes || {}).some((h) => M.levelOf(h.xp).level >= 5) },
  ];
  G.ACH = ACH;
  M.hasAch = (id) => !!(R.meta.ach && R.meta.ach[id]);
  M.unlockText = function (u) {
    if (!u) return '';
    if (u.card) return 'Débloque la carte « ' + G.CARDS[u.card].name + ' »';
    if (u.relic) return 'Débloque la relique « ' + G.RELICS[u.relic].name + ' »';
    if (u.pact) return 'Débloque le « ' + PACTS[u.pact].name + ' »';
    return '';
  };
  /** Vérifie les succès après un événement ; renvoie ceux qui viennent d'être obtenus. */
  M.check = function (ev) {
    R.meta.ach = R.meta.ach || {};
    const got = [];
    for (const a of ACH) {
      if (R.meta.ach[a.id]) continue;
      let ok = false;
      try {
        ok = a.check(ev || { k: 'tick' });
      } catch {
        ok = false;
      }
      if (ok) {
        R.meta.ach[a.id] = Date.now();
        got.push(a);
      }
    }
    if (got.length) {
      R.saveMeta();
      if (G.UI && G.UI.onAchievements) G.UI.onAchievements(got);
    }
    return got;
  };
  /** Contenu verrouillé par un succès non obtenu ? */
  M.locked = (lock) => !!lock && !M.hasAch(lock);

  // ================================================================== collection
  M.see = function (kind, id) {
    const seen = (R.meta.seen = R.meta.seen || { c: {}, r: {}, e: {}, p: {} });
    seen[kind] = seen[kind] || {};
    if (!id || seen[kind][id]) return;
    seen[kind][id] = 1;
    M.dirty = true;
  };
  M.seeAll = (kind, ids) => (ids || []).forEach((id) => M.see(kind, id));
  M.flush = function () {
    if (M.dirty) {
      M.dirty = false;
      R.saveMeta();
    }
  };
  M.collection = function () {
    const seen = R.meta.seen || { c: {}, r: {}, e: {}, p: {} };
    const cards = Object.keys(G.CARDS).filter((id) => G.CARDS[id].hero);
    const relics = Object.keys(G.RELICS);
    const enemies = Object.keys(G.ENEMIES);
    const pots = Object.keys(G.POTIONS);
    const count = (ids, k) => ids.filter((id) => seen[k] && seen[k][id]).length;
    const total = cards.length + relics.length + enemies.length + pots.length;
    const found = count(cards, 'c') + count(relics, 'r') + count(enemies, 'e') + count(pots, 'p');
    return { cards, relics, enemies, pots, seen, total, found, pct: Math.round((found / total) * 100) };
  };

  // ================================================================== statistiques
  M.stats = function () {
    const s = (R.meta.stats = R.meta.stats || {});
    const d = { runs: 0, wins: 0, time: 0, streak: 0, bestStreak: 0, bestPalier: -1, kills: 0, elites: 0, guardians: 0, potions: 0, ench: 0, cards: {}, enemies: {}, killers: {}, heroes: {}, history: [] };
    for (const k in d) if (s[k] === undefined) s[k] = d[k];
    return s;
  };
  /** Un combat gagné : ennemis vaincus, cartes jouées, succès. */
  M.recordCombat = function (c, type) {
    const s = M.stats();
    for (const e of c.enemies) {
      if (e.away && e.spawnedBy) continue; // éclats ressoudés : pas vaincus
      s.enemies[e.id] = (s.enemies[e.id] || 0) + 1;
      s.kills++;
    }
    if (type === 'elite') s.elites++;
    if (type === 'boss') s.guardians++;
    for (const id in c.stats.cards) s.cards[id] = (s.cards[id] || 0) + c.stats.cards[id];
    R.saveMeta();
    M.check({ k: 'combat', c, type });
  };
  /** Fin d'une ascension : historique, séries, expérience. Renvoie le détail de l'expérience. */
  M.recordRun = function (run, won, killer) {
    const s = M.stats();
    s.runs++;
    if (won) {
      s.wins++;
      s.streak++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      s.bestPalier = Math.max(s.bestPalier, run.palier || 0);
    } else s.streak = 0;
    if (killer) s.killers[killer] = (s.killers[killer] || 0) + 1;
    s.time += run.stats.time || 0;
    const hs = (s.heroes[run.hero] = s.heroes[run.hero] || { runs: 0, wins: 0, bestAct: 0 });
    hs.runs++;
    if (won) hs.wins++;
    hs.bestAct = Math.max(hs.bestAct, won ? 4 : run.act);
    // expérience et niveaux
    const st = M.hero(run.hero);
    const before = M.levelOf(st.xp).level;
    const xp = M.runXp(run, won);
    st.xp += xp;
    const after = M.levelOf(st.xp).level;
    s.history.unshift({
      date: Date.now(), hero: run.hero, palier: run.palier || 0, pacts: run.pacts || [], act: run.act, floor: run.floor,
      won, killer: killer || null, xp, kills: run.stats.kills || 0, time: run.stats.time || 0,
    });
    s.history = s.history.slice(0, 20);
    R.saveMeta();
    M.check({ k: 'run', run, won });
    return { xp, before, after };
  };

  /** Fusion des progressions (synchronisation entre appareils). */
  M.merge = function (a, b) {
    if (!b) return a;
    const out = a;
    out.ach = Object.assign({}, b.ach || {}, a.ach || {});
    const seenA = a.seen || {};
    const seenB = b.seen || {};
    out.seen = {};
    for (const k of ['c', 'r', 'e', 'p']) out.seen[k] = Object.assign({}, seenB[k] || {}, seenA[k] || {});
    // héros : on garde le plus d'expérience ; les compétences de la version la plus récente
    out.heroes = Object.assign({}, a.heroes || {});
    const newer = (b.updatedAt || 0) > (a.updatedAt || 0);
    for (const h in b.heroes || {}) {
      const x = out.heroes[h] || { xp: 0, alloc: [] };
      const y = b.heroes[h];
      out.heroes[h] = { xp: Math.max(x.xp || 0, y.xp || 0), alloc: newer ? (y.alloc || []).slice() : (x.alloc || []).slice() };
    }
    // statistiques : maximum de chaque compteur, historique fusionné
    const sa = a.stats || {};
    const sb = b.stats || {};
    const st = Object.assign({}, sa);
    for (const k of ['runs', 'wins', 'time', 'bestStreak', 'bestPalier', 'kills', 'elites', 'guardians', 'potions', 'ench']) st[k] = Math.max(sa[k] || 0, sb[k] || 0);
    st.streak = newer ? sb.streak || 0 : sa.streak || 0;
    for (const k of ['cards', 'enemies', 'killers']) {
      st[k] = Object.assign({}, sa[k] || {});
      for (const id in sb[k] || {}) st[k][id] = Math.max(st[k][id] || 0, sb[k][id]);
    }
    st.heroes = Object.assign({}, sa.heroes || {});
    for (const h in sb.heroes || {}) {
      const x = st.heroes[h] || { runs: 0, wins: 0, bestAct: 0 };
      const y = sb.heroes[h];
      st.heroes[h] = { runs: Math.max(x.runs, y.runs), wins: Math.max(x.wins, y.wins), bestAct: Math.max(x.bestAct, y.bestAct) };
    }
    const hist = (sa.history || []).concat(sb.history || []);
    const uniq = {};
    st.history = hist.filter((r) => (uniq[r.date] ? false : (uniq[r.date] = true))).sort((x, y) => y.date - x.date).slice(0, 20);
    out.stats = st;
    return out;
  };
})(window.G = window.G || {});
