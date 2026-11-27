/* Grimoire de Vitrail — moteur : partie en cours et règles de combat */
(function (G) {
  'use strict';

  const SAVE_KEY = 'grimoire-vitrail.run.v1';
  const META_KEY = 'grimoire-vitrail.meta.v1';

  G.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const rand = Math.random;
  const pick = (arr, r) => arr[Math.floor((r || rand)() * arr.length)];
  const shuffle = (arr, r) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor((r || rand)() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  G.shuffle = shuffle;
  G.pick = pick;

  let uidCounter = 1;
  const newCard = (id, up) => ({ id, up: !!up, uid: 'c' + Date.now().toString(36) + (uidCounter++) });
  G.newCard = newCard;

  // ================================================================== partie
  const R = {
    run: null,
    meta: { wins: 0, runs: 0, best: 0, guardians: 0, palier: {}, winsBy: {} },
  };
  G.Run = R;

  R.loadMeta = function () {
    try {
      const m = JSON.parse(localStorage.getItem(META_KEY) || 'null');
      if (m) R.meta = Object.assign(R.meta, m);
    } catch (e) {
      /* stockage indisponible */
    }
  };
  R.saveMeta = function () {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(R.meta));
    } catch (e) {
      /* ignoré */
    }
  };
  R.save = function () {
    if (!R.run) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(R.run));
    } catch (e) {
      /* ignoré */
    }
  };
  R.hasSave = function () {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return false;
    }
  };
  R.load = function () {
    try {
      R.run = JSON.parse(localStorage.getItem(SAVE_KEY));
      return !!R.run;
    } catch (e) {
      return false;
    }
  };
  R.clear = function () {
    R.run = null;
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      /* ignoré */
    }
  };

  // ---------------------------------------------------------------- progression entre les parties
  R.PALIERS = [
    'Ascension ordinaire.',
    'Les ennemis ont 10 % de PV en plus.',
    'Les élites commencent enragées (+2 Force).',
    'Tu commences avec un Doute dans ton paquet.',
    'Les autels soignent moitié moins, et tu pars sans fiole.',
    'Les gardiens ont 20 % de PV en plus et 1 Force.',
  ];
  R.heroUnlocked = (id) => !G.HEROES[id].unlock || (R.meta.guardians || 0) >= G.HEROES[id].unlock;
  R.maxPalier = (id) => Math.min(R.PALIERS.length - 1, (R.meta.palier && R.meta.palier[id]) || 0);
  /** Enregistre un gardien vaincu ; renvoie les héros nouvellement débloqués. */
  R.recordGuardian = function () {
    const before = Object.keys(G.HEROES).filter(R.heroUnlocked);
    R.meta.guardians = (R.meta.guardians || 0) + 1;
    R.saveMeta();
    return Object.keys(G.HEROES).filter((id) => R.heroUnlocked(id) && !before.includes(id));
  };
  /** Victoire : débloque le palier suivant pour ce héros. Renvoie le nouveau palier ou null. */
  R.recordWin = function () {
    const run = R.run;
    R.meta.palier = R.meta.palier || {};
    R.meta.winsBy = R.meta.winsBy || {};
    R.meta.winsBy[run.hero] = (R.meta.winsBy[run.hero] || 0) + 1;
    let unlocked = null;
    if ((run.palier || 0) >= R.maxPalier(run.hero) && R.maxPalier(run.hero) < R.PALIERS.length - 1) {
      R.meta.palier[run.hero] = (run.palier || 0) + 1;
      unlocked = R.meta.palier[run.hero];
    }
    R.saveMeta();
    return unlocked;
  };

  R.newRun = function (heroId, palier) {
    const h = G.HEROES[heroId];
    palier = palier || 0;
    R.run = {
      palier,
      hero: heroId,
      hp: h.hp,
      maxHp: h.hp,
      gold: 60,
      deck: h.deck.map((id) => newCard(id)),
      relics: [h.relic],
      act: 1,
      step: 0,
      doors: null,
      history: [],
      actSeen: {},
      potions: ['larme'],
      floor: 0,
      stats: { kills: 0, elites: 0, bosses: 0, cards: 0, time: 0 },
      removeCost: 75,
      seenEvents: [],
      seed: Math.floor(Math.random() * 1e9),
    };
    if (palier >= 3) R.run.deck.push(newCard('doute'));
    if (palier >= 4) R.run.potions = [];
    R.run.doors = R.makeDoors();
    R.meta.runs++;
    R.saveMeta();
    R.save();
  };

  R.has = (relicId) => R.run && R.run.relics.includes(relicId);

  R.heal = function (n) {
    const run = R.run;
    const before = run.hp;
    run.hp = Math.min(run.maxHp, run.hp + n);
    return run.hp - before >= 0;
  };
  R.hurt = function (n) {
    R.run.hp = Math.max(1, R.run.hp - n);
  };
  R.addMaxHp = function (n) {
    R.run.maxHp += n;
    R.run.hp += n;
  };
  R.gainGold = function (n) {
    if (n > 0 && R.has('bourse')) n = Math.round(n * 1.5);
    R.run.gold = Math.max(0, R.run.gold + n);
    return n;
  };
  R.addCard = function (id, up, count) {
    for (let i = 0; i < (count || 1); i++) R.run.deck.push(newCard(id, up));
  };
  R.removeCard = function (uid) {
    R.run.deck = R.run.deck.filter((c) => c.uid !== uid);
  };
  R.upgradeCard = function (uid) {
    const c = R.run.deck.find((x) => x.uid === uid);
    if (c) c.up = true;
  };
  R.upgradeRandom = function (n) {
    const pool = shuffle(R.run.deck.filter((c) => !c.up && G.CARDS[c.id].type !== 'curse'));
    const done = pool.slice(0, n);
    done.forEach((c) => (c.up = true));
    return done.length ? 'Améliorées : ' + done.map((c) => G.CARDS[c.id].name).join(', ') + '.' : 'Aucune carte à améliorer.';
  };
  R.gainRelic = function (id) {
    if (R.has(id)) return;
    R.run.relics.push(id);
    const r = G.RELICS[id];
    if (r.onGain) r.onGain();
  };
  R.relicPool = function (rarities) {
    return Object.keys(G.RELICS).filter((id) => rarities.includes(G.RELICS[id].rarity) && !R.has(id));
  };
  R.randomRelic = function () {
    const roll = rand();
    const rar = roll < 0.5 ? ['c'] : roll < 0.85 ? ['u'] : ['r'];
    let pool = R.relicPool(rar);
    if (!pool.length) pool = R.relicPool(['c', 'u', 'r']);
    return pool.length ? pick(pool) : null;
  };
  R.gainRandomRelic = function () {
    const id = R.randomRelic();
    if (id) {
      R.gainRelic(id);
      if (G.UI) G.UI.toast('Relique : ' + G.RELICS[id].name);
    }
    return id;
  };

  R.cardPool = function (rarity) {
    return Object.keys(G.CARDS).filter((id) => G.CARDS[id].hero === R.run.hero && G.CARDS[id].rarity === rarity);
  };
  R.rollRarity = function (boost) {
    const r = rand();
    const rare = 0.06 + (boost || 0);
    if (r < rare) return 'r';
    if (r < rare + 0.34) return 'u';
    return 'c';
  };
  R.cardChoices = function (n, boost, forceRarity) {
    const out = [];
    let guard = 0;
    while (out.length < n && guard++ < 100) {
      const rar = forceRarity || R.rollRarity(boost);
      const id = pick(R.cardPool(rar));
      if (!out.includes(id)) out.push(id);
    }
    return out;
  };
  R.gainRandomCard = function (rarity) {
    const id = pick(R.cardPool(rarity));
    R.addCard(id);
    return 'Nouvelle carte : ' + G.CARDS[id].name + '.';
  };
  // choix délégués à l'interface : renvoient une promesse
  R.chooseRemove = () => G.UI.pickFromDeck('Retirer une carte', (c) => true, (c) => R.removeCard(c.uid), 'Retirée');
  R.chooseUpgrade = () => G.UI.pickFromDeck('Améliorer une carte', (c) => !c.up && G.CARDS[c.id].type !== 'curse', (c) => R.upgradeCard(c.uid), 'Améliorée');
  R.chooseCard = (n) => G.UI.cardReward(R.cardChoices(n, 0.08), 'Choisis une carte');

  // ---------------------------------------------------------------- carrefours
  // Chaque acte : 5 étages où l'on choisit librement une porte parmi 3, puis le gardien.
  R.FLOORS = 5;
  const MODS = {
    fervent: { name: 'Enragé', desc: 'L’ennemi commence avec 2 Force.', reward: '+50 % d’or, cartes plus rares', gold: 1.5, rare: 0.15 },
    cuirasse: { name: 'Cuirassé', desc: 'L’ennemi a plus de PV et commence avec 10 Armure.', reward: 'Or doublé', gold: 2 },
    brume: { name: 'Dans la brume', desc: 'Ses intentions sont cachées.', reward: 'Une fiole garantie', potion: true },
  };
  G.MODS = MODS;

  function weighted(list, r) {
    const total = list.reduce((s, x) => s + x[1], 0);
    let v = (r || rand)() * total;
    for (const [k, w] of list) {
      v -= w;
      if (v <= 0) return k;
    }
    return list[list.length - 1][0];
  }

  R.makeDoors = function () {
    const run = R.run;
    const step = run.step;
    const pool = G.ACT_POOLS[run.act];
    if (step >= R.FLOORS) return [{ type: 'boss', enemy: pool.boss }];
    const types = [];
    if (step === 0) types.push('combat', 'combat', rand() < 0.5 ? 'event' : 'combat');
    else if (step === R.FLOORS - 1) {
      types.push('altar');
      types.push(run.actSeen.merchant ? 'event' : 'merchant');
      types.push(rand() < 0.5 ? 'elite' : 'combat');
    } else {
      types.push(rand() < 0.75 ? 'combat' : 'elite');
      const opts = [
        ['combat', 3],
        ['elite', step >= 1 ? 1.4 : 0],
        ['event', 2.2],
        ['merchant', run.actSeen.merchant ? 0.2 : 1.2],
        ['altar', step >= 2 ? 1 : 0.2],
        ['treasure', step >= 2 && !run.actSeen.treasure ? 0.8 : 0],
      ];
      let guard = 0;
      while (types.length < 3 && guard++ < 40) {
        const t = weighted(opts);
        if (t !== 'combat' && types.includes(t)) continue;
        if (t === 'combat' && types.filter((x) => x === 'combat').length >= 2) continue;
        types.push(t);
      }
    }
    // ennemis distincts et variantes
    const used = [];
    return shuffle(types).map((type) => {
      const d = { type };
      if (type === 'combat' || type === 'elite') {
        const list = type === 'elite' ? pool.elite : pool.normal;
        let id;
        let g = 0;
        do {
          id = pick(list);
        } while ((used.includes(id) || id === run.lastEnemy) && g++ < 12);
        used.push(id);
        d.enemy = id;
        if (type === 'combat' && step > 0 && rand() < 0.45) d.mod = pick(Object.keys(MODS));
      }
      return d;
    });
  };

  R.chooseDoor = function (i) {
    const run = R.run;
    const d = run.doors[i];
    run.pending = d;
    if (d.enemy) run.lastEnemy = d.enemy;
    if (d.type === 'merchant' || d.type === 'treasure') run.actSeen[d.type] = true;
    R.save();
    return d;
  };

  R.finishStep = function () {
    const run = R.run;
    if (!run.pending) return false;
    run.history.push(run.pending.type);
    run.pending = null;
    run.step++;
    run.floor++;
    run.doors = R.makeDoors();
    R.save();
    return true;
  };

  R.startNextAct = function () {
    const run = R.run;
    run.act++;
    run.step = 0;
    run.history = [];
    run.actSeen = {};
    run.pending = null;
    run.floor++;
    run.hp = run.maxHp;
    run.doors = R.makeDoors();
    R.save();
  };

  // ---------------------------------------------------------------- fioles
  R.addPotion = function (id) {
    if (R.run.potions.length >= 3) return false;
    R.run.potions.push(id || pick(Object.keys(G.POTIONS)));
    return true;
  };
  R.removePotion = function (idx) {
    R.run.potions.splice(idx, 1);
  };

  R.enemyFor = function (type) {
    const pool = G.ACT_POOLS[R.run.act];
    if (type === 'boss') return pool.boss;
    if (type === 'elite') return pick(pool.elite);
    const last = R.run.lastEnemy;
    let id;
    let guard = 0;
    do {
      id = pick(pool.normal);
    } while (id === last && guard++ < 10);
    R.run.lastEnemy = id;
    return id;
  };

  R.nextEvent = function () {
    const run = R.run;
    let pool = G.EVENTS.filter((e) => !run.seenEvents.includes(e.id));
    if (!pool.length) {
      run.seenEvents = [];
      pool = G.EVENTS.slice();
    }
    const ev = pick(pool);
    run.seenEvents.push(ev.id);
    return ev;
  };

  R.energyPerTurn = () => 3 + R.run.relics.reduce((s, id) => s + (G.RELICS[id].energy || 0), 0);
  R.drawPerTurn = () => 5 + R.run.relics.reduce((s, id) => s + (G.RELICS[id].drawMod || 0), 0);

  // ================================================================== combat
  class Combat {
    constructor(enemyId, emit, mod) {
      const run = R.run;
      const def = G.ENEMIES[enemyId];
      this.emit = emit || (() => {});
      this.enemyId = enemyId;
      this.mod = mod || null;
      this.rng = rand;
      let hp = Math.round(def.hp[0] + rand() * (def.hp[1] - def.hp[0]));
      if (mod === 'cuirasse') hp = Math.round(hp * 1.15);
      const pal = run.palier || 0;
      if (pal >= 1) hp = Math.round(hp * 1.1);
      if (pal >= 5 && def.boss) hp = Math.round(hp * 1.2);
      this.p = { hp: run.hp, maxHp: run.maxHp, block: 0, st: {} };
      this.e = { id: enemyId, def, name: def.name, hp, maxHp: hp, block: 0, st: Object.assign({}, def.start || {}), intent: null, turn: 0, moveKey: null };
      this.pile = shuffle(run.deck.map((c) => Object.assign({}, c)));
      this.hand = [];
      this.discard = [];
      this.exhausted = [];
      this.ink = 0;
      this.turn = 0;
      this.stats = { played: 0, dealt: 0, atkTurn: 0 };
      this.hidden = mod === 'brume';
      this.stolen = 0;
      if (mod === 'fervent') this.e.st.force = (this.e.st.force || 0) + 2;
      if (pal >= 2 && def.elite) this.e.st.force = (this.e.st.force || 0) + 2;
      if (pal >= 5 && def.boss) this.e.st.force = (this.e.st.force || 0) + 1;
      if (mod === 'cuirasse') this.e.block = 10;
      this.over = false;
      this.won = false;
      this.hpLowUsed = false;
    }

    start() {
      this.relicHook('combatStart');
      this.startTurn();
    }

    relicHook(name, ...args) {
      for (const id of R.run.relics) {
        const r = G.RELICS[id];
        if (r[name]) {
          const before = JSON.stringify([this.p.block, this.p.st, this.e.st, this.ink, this.hand.length]);
          r[name](this, ...args);
          if (JSON.stringify([this.p.block, this.p.st, this.e.st, this.ink, this.hand.length]) !== before) this.emit({ t: 'relic', id });
        }
      }
    }

    // ----- API utilisée par les cartes et reliques
    attack(base, hits, drain) {
      // renvoie les dégâts réellement infligés (hors Armure) ; drain = part rendue en PV
      const before = this.stats.dealt;
      for (let i = 0; i < (hits || 1); i++) {
        if (this.e.hp <= 0) break;
        this.damage(this.p, this.e, base, true, i);
      }
      const dealt = this.stats.dealt - before;
      if (drain && dealt > 0 && this.p.hp > 0) this.heal(Math.floor(dealt * drain));
      return dealt;
    }
    /** Paie des PV (cartes du Saigneur) : ignore l'Armure. */
    payHp(n) {
      if (n <= 0) return;
      this.p.hp = Math.max(0, this.p.hp - n);
      this.stats.paid = (this.stats.paid || 0) + n;
      this.emit({ t: 'pay', n });
      if (this.p.st.soif) this.self('force', this.p.st.soif);
      this.checkEnd();
    }
    /** Ajoute une carte (générée) dans la main. */
    addToHand(id, n) {
      for (let i = 0; i < (n || 1); i++) {
        if (this.hand.length >= 10) break;
        const c = newCard(id);
        c.temp = true;
        this.hand.push(c);
        this.emit({ t: 'draw', card: c });
      }
    }
    burn() {
      return this.e.st.brulure || 0;
    }
    pierce(n) {
      this.hit(this.e, n, false, 'pierce');
    }
    block(n) {
      if (n <= 0) return;
      this.p.block += n;
      this.emit({ t: 'block', who: 'p', n });
      if (this.p.st.banniere && this.e.hp > 0) this.hit(this.e, this.p.st.banniere, false, 'banner');
    }
    apply(st, n) {
      this.e.st[st] = (this.e.st[st] || 0) + n;
      this.emit({ t: 'status', who: 'e', st, n });
    }
    self(st, n) {
      this.p.st[st] = (this.p.st[st] || 0) + n;
      this.emit({ t: 'status', who: 'p', st, n });
    }
    draw(n) {
      for (let i = 0; i < n; i++) {
        if (this.hand.length >= 10) break;
        if (!this.pile.length) {
          if (!this.discard.length) break;
          this.pile = shuffle(this.discard);
          this.discard = [];
          this.emit({ t: 'reshuffle' });
        }
        const c = this.pile.pop();
        this.hand.push(c);
        this.emit({ t: 'draw', card: c });
      }
    }
    gainInk(n) {
      this.ink += n;
      this.emit({ t: 'ink', n });
      return true;
    }
    heal(n) {
      const before = this.p.hp;
      this.p.hp = Math.min(this.p.maxHp, this.p.hp + n);
      this.emit({ t: 'heal', who: 'p', n: this.p.hp - before });
    }
    enemyAttacks() {
      return !!(this.e.intent && this.e.intent.dmg);
    }

    // ----- calculs de dégâts
    calcDamage(src, tgt, base, isAttack) {
      let d = base + (isAttack ? src.st.force || 0 : 0);
      if (isAttack && src.st.faib) d = Math.floor(d * 0.75);
      if (tgt.st.fel) d = Math.floor(d * 1.5);
      return Math.max(0, d);
    }
    damage(src, tgt, base, isAttack, idx) {
      const d = this.calcDamage(src, tgt, base, isAttack);
      this.hit(tgt, d, isAttack, null, idx);
      if (isAttack) {
        const th = (tgt.st.epines || 0) + (tgt.st.epinesP || 0);
        if (th > 0 && src.hp > 0) this.hit(src, th, false, 'thorns', idx);
      }
    }
    hit(tgt, d, isAttack, kind, idx) {
      const blocked = Math.min(tgt.block, d);
      tgt.block -= blocked;
      const dmg = d - blocked;
      tgt.hp = Math.max(0, tgt.hp - dmg);
      const who = tgt === this.p ? 'p' : 'e';
      if (who === 'e') this.stats.dealt += dmg;
      this.emit({ t: 'hit', who, dmg, blocked, kind, idx: idx || 0 });
      // Grand calice : chaque coup qui touche rend des PV
      if (who === 'e' && dmg > 0 && this.p.st.calice && this.p.hp > 0 && kind !== 'burn') {
        this.p.hp = Math.min(this.p.maxHp, this.p.hp + this.p.st.calice);
      }
      if (who === 'p' && !this.hpLowUsed && tgt.hp > 0 && tgt.hp * 2 < tgt.maxHp) {
        this.hpLowUsed = true;
        this.relicHook('hpLow');
      }
      this.checkEnd();
    }
    checkEnd() {
      if (this.over) return;
      if (this.e.hp <= 0) {
        this.over = true;
        this.won = true;
        this.emit({ t: 'enemyDeath' });
      } else if (this.p.hp <= 0) {
        this.over = true;
        this.won = false;
        this.emit({ t: 'playerDeath' });
      }
    }

    // ----- aperçu des valeurs pour l'affichage des cartes
    previewDamage(base) {
      return this.calcDamage(this.p, this.e, base, true);
    }

    // ----- tours
    startTurn() {
      this.turn++;
      const p = this.p;
      if (!p.st.rempart) p.block = 0;
      p.st.epines = 0;
      this.ink = R.energyPerTurn();
      if (p.st.veille) {
        this.ink += p.st.veille;
        p.st.veille = 0;
      }
      this.stats.atkTurn = 0;
      this.stats.playedTurn = 0;
      if (p.st.martyre) this.block(p.st.martyre);
      if (p.st.brasier) this.apply('brulure', p.st.brasier);
      if (p.st.pacte) {
        this.payHp(p.st.pacte);
        this.gainInk(1);
      }
      if (this.over) return;
      this.draw(R.drawPerTurn() + (p.st.vigilance || 0));
      this.relicHook('turnStart');
      this.chooseIntent();
      this.emit({ t: 'turnStart', turn: this.turn });
    }

    chooseIntent() {
      const e = this.e;
      const key = e.def.ai(e, e.turn, this.rng);
      e.moveKey = key;
      e.intent = e.def.moves[key];
    }

    canPlay(card) {
      const cost = G.cardCost(card);
      const hp = G.cardHp(card);
      return !this.over && cost >= 0 && cost <= this.ink && (!hp || this.p.hp > hp);
    }

    play(card) {
      if (!this.canPlay(card)) return false;
      const def = G.CARDS[card.id];
      const cost = G.cardCost(card);
      this.ink -= cost;
      this.hand = this.hand.filter((c) => c !== card);
      this.stats.played++;
      R.run.stats.cards++;
      if (def.type === 'atk') this.stats.atkTurn++;
      const hp = G.cardHp(card);
      if (hp) this.payHp(hp);
      const vals = G.cardVals(card);
      def.play(this, vals);
      // Écho : la première carte de chaque tour est jouée deux fois
      if (this.p.st.echo && this.stats.playedTurn === 0 && def.type !== 'pow' && !this.over) {
        this.emit({ t: 'echo', card });
        def.play(this, vals);
      }
      this.stats.playedTurn = (this.stats.playedTurn || 0) + 1;
      // Page ardente : chaque Technique enflamme l'ennemi
      if (def.type === 'skl' && this.p.st.braise && !this.over) this.apply('brulure', this.p.st.braise);
      if (def.type === 'pow') this.emit({ t: 'power', card });
      else if (def.exhaust || card.temp) {
        this.exhausted.push(card);
        this.emit({ t: 'exhaust', card });
      } else this.discard.push(card);
      if (!this.over) this.relicHook('cardPlayed', card);
      return true;
    }

    endTurn() {
      // malédictions en main
      for (const c of this.hand) {
        if (c.id === 'blessure') this.hit(this.p, 2, false, 'curse');
      }
      this.discard.push(...this.hand);
      this.hand = [];
      this.decay(this.p);
    }

    decay(who) {
      for (const k of ['faib', 'fel']) {
        if (who.st[k]) who.st[k] = Math.max(0, who.st[k] - 1);
      }
    }

    enemyTurn() {
      const e = this.e;
      if (this.over) return;
      e.block = 0;
      // Brûlure : dégâts qui ignorent l'Armure, puis s'atténue d'un point
      if (e.st.brulure > 0) {
        const b = e.st.brulure;
        e.hp = Math.max(0, e.hp - b);
        this.stats.dealt += b;
        this.emit({ t: 'hit', who: 'e', dmg: b, blocked: 0, kind: 'burn', idx: 0 });
        e.st.brulure = b - 1;
        this.checkEnd();
        if (this.over) return;
      }
      const m = e.intent;
      this.emit({ t: 'enemyMove', move: m });
      if (m.selfDmg) this.hit(e, m.selfDmg, false, 'self');
      if (this.over) return;
      if (m.block) {
        e.block += m.block;
        this.emit({ t: 'block', who: 'e', n: m.block });
      }
      if (m.buff) for (const k in m.buff) {
        e.st[k] = (e.st[k] || 0) + m.buff[k];
        this.emit({ t: 'status', who: 'e', st: k, n: m.buff[k] });
      }
      if (m.dmg) {
        for (let i = 0; i < (m.hits || 1); i++) {
          if (this.over) break;
          this.damage(e, this.p, m.dmg, true, i);
        }
      }
      if (this.over) return;
      if (m.debuff) for (const k in m.debuff) {
        this.p.st[k] = (this.p.st[k] || 0) + m.debuff[k];
        this.emit({ t: 'status', who: 'p', st: k, n: m.debuff[k] });
      }
      if (m.steal && R.run.gold > 0) {
        const n = Math.min(R.run.gold, m.steal);
        R.run.gold -= n;
        this.stolen += n;
        this.emit({ t: 'steal', n });
      }
      if (m.curse) {
        for (let i = 0; i < (m.n || 1); i++) this.discard.push(newCard(m.curse));
        this.emit({ t: 'curse', id: m.curse, n: m.n || 1 });
      }
      if (e.st.rituel) e.st.force = (e.st.force || 0) + e.st.rituel;
      this.decay(e);
      e.turn++;
    }

    /** Joue la carte sur une copie du combat, sans effet réel : sert à l'aperçu. */
    simulate(card) {
      const s = Object.create(Combat.prototype);
      Object.assign(s, this);
      s.emit = () => {};
      s.p = Object.assign({}, this.p, { st: Object.assign({}, this.p.st) });
      s.e = Object.assign({}, this.e, { st: Object.assign({}, this.e.st) });
      s.pile = this.pile.slice();
      s.hand = this.hand.slice();
      s.discard = this.discard.slice();
      s.exhausted = this.exhausted.slice();
      s.stats = Object.assign({}, this.stats);
      const run = R.run;
      const saved = { gold: run.gold, cards: run.stats.cards, hp: run.hp };
      const inst = s.hand.find((k) => k.uid === card.uid);
      if (inst) s.play(inst);
      run.gold = saved.gold;
      run.stats.cards = saved.cards;
      run.hp = saved.hp;
      return { eHp: s.e.hp, eBlock: s.e.block, pBlock: s.p.block, pHp: s.p.hp };
    }

    usePotion(idx) {
      const id = R.run.potions[idx];
      const pot = G.POTIONS[id];
      if (!pot || this.over) return false;
      R.removePotion(idx);
      this.emit({ t: 'potion', id });
      pot.use(this);
      return true;
    }

    incoming() {
      const m = this.e.intent;
      if (!m || !m.dmg || this.hidden) return 0;
      const per = this.calcDamage(this.e, this.p, m.dmg, true);
      return Math.max(0, per * (m.hits || 1) - this.p.block);
    }

    intentInfo() {
      const m = this.e.intent;
      if (!m) return null;
      if (this.hidden) return { name: 'Intention voilée', kinds: ['hidden'] };
      const out = { name: m.name, kinds: [] };
      if (m.dmg) {
        out.kinds.push('atk');
        out.dmg = this.calcDamage(this.e, this.p, m.dmg, true);
        out.hits = m.hits || 1;
      }
      if (m.block) out.kinds.push('def');
      if (m.buff) out.kinds.push('buff');
      if (m.debuff) out.kinds.push('debuff');
      if (m.curse) out.kinds.push('curse');
      return out;
    }

    finish() {
      // reporte les PV dans la partie
      R.run.hp = Math.max(this.won ? 1 : 0, this.p.hp);
      R.run.maxHp = this.p.maxHp;
    }
  }
  G.Combat = Combat;
})(typeof window !== 'undefined' ? (window.G = window.G || {}) : module.exports);
