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
    meta: { wins: 0, runs: 0, best: 0 },
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

  R.newRun = function (heroId) {
    const h = G.HEROES[heroId];
    R.run = {
      hero: heroId,
      hp: h.hp,
      maxHp: h.hp,
      gold: 60,
      deck: h.deck.map((id) => newCard(id)),
      relics: [h.relic],
      act: 1,
      map: null,
      pos: null,
      floor: 0,
      stats: { kills: 0, elites: 0, bosses: 0, cards: 0, time: 0 },
      removeCost: 75,
      seenEvents: [],
      seed: Math.floor(Math.random() * 1e9),
    };
    R.run.map = R.makeMap(1);
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

  // ---------------------------------------------------------------- carte d'ascension
  // 5 rangées par acte : 4 rangées de choix puis le boss
  R.makeMap = function (act) {
    const r = G.rng(R.run.seed + act * 977);
    const rows = [];
    const typesFor = (row) => {
      if (row === 0) return ['combat', 'combat', 'combat'];
      if (row === 1) return shuffle(['combat', 'event', pick(['combat', 'event', 'merchant'], r)], r);
      if (row === 2) return shuffle(['elite', pick(['combat', 'event'], r), pick(['merchant', 'event', 'combat'], r)], r);
      return shuffle(['altar', 'altar', pick(['merchant', 'altar', 'event'], r)], r);
    };
    for (let row = 0; row < 4; row++) {
      const types = typesFor(row);
      rows.push(types.map((type, lane) => ({ type, lane, row, next: [] })));
    }
    rows.push([{ type: 'boss', lane: 1, row: 4, next: [] }]);
    // liaisons : chaque nœud vers la même voie et parfois une voisine
    for (let row = 0; row < 3; row++) {
      for (const n of rows[row]) {
        n.next.push(n.lane);
        const side = n.lane === 0 ? 1 : n.lane === 2 ? 1 : r() < 0.5 ? 0 : 2;
        if (r() < 0.55) n.next.push(side);
      }
      // chaque nœud suivant doit être atteignable
      for (const m of rows[row + 1]) {
        if (!rows[row].some((n) => n.next.includes(m.lane))) {
          const from = rows[row].reduce((best, n) => (Math.abs(n.lane - m.lane) < Math.abs(best.lane - m.lane) ? n : best));
          from.next.push(m.lane);
        }
      }
    }
    for (const n of rows[3]) n.next = [1];
    return { act, rows };
  };

  R.availableNodes = function () {
    const run = R.run;
    const rows = run.map.rows;
    if (!run.pos) return rows[0];
    const cur = rows[run.pos.row].find((n) => n.lane === run.pos.lane);
    if (run.pos.row >= rows.length - 1) return [];
    const nextRow = rows[run.pos.row + 1];
    return nextRow.filter((n) => cur.next.includes(n.lane) || nextRow.length === 1);
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
    constructor(enemyId, emit) {
      const run = R.run;
      const def = G.ENEMIES[enemyId];
      this.emit = emit || (() => {});
      this.enemyId = enemyId;
      this.rng = rand;
      const hp = Math.round(def.hp[0] + rand() * (def.hp[1] - def.hp[0]));
      this.p = { hp: run.hp, maxHp: run.maxHp, block: 0, st: {} };
      this.e = { id: enemyId, def, name: def.name, hp, maxHp: hp, block: 0, st: Object.assign({}, def.start || {}), intent: null, turn: 0, moveKey: null };
      this.pile = shuffle(run.deck.map((c) => Object.assign({}, c)));
      this.hand = [];
      this.discard = [];
      this.exhausted = [];
      this.ink = 0;
      this.turn = 0;
      this.stats = { played: 0, dealt: 0 };
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
    attack(base, hits) {
      for (let i = 0; i < (hits || 1); i++) {
        if (this.e.hp <= 0) break;
        this.damage(this.p, this.e, base, true, i);
      }
    }
    pierce(n) {
      this.hit(this.e, n, false, 'pierce');
    }
    block(n, raw) {
      const amt = raw ? n : n;
      if (amt <= 0) return;
      this.p.block += amt;
      this.emit({ t: 'block', who: 'p', n: amt });
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
      if (p.st.martyre) this.block(p.st.martyre);
      this.draw(R.drawPerTurn());
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
      return !this.over && cost >= 0 && cost <= this.ink;
    }

    play(card) {
      if (!this.canPlay(card)) return false;
      const def = G.CARDS[card.id];
      const cost = G.cardCost(card);
      this.ink -= cost;
      this.hand = this.hand.filter((c) => c !== card);
      this.stats.played++;
      R.run.stats.cards++;
      def.play(this, G.cardVals(card));
      if (def.type === 'pow') this.emit({ t: 'power', card });
      else if (def.exhaust) {
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
      if (m.curse) {
        for (let i = 0; i < (m.n || 1); i++) this.discard.push(newCard(m.curse));
        this.emit({ t: 'curse', id: m.curse, n: m.n || 1 });
      }
      if (e.st.rituel) e.st.force = (e.st.force || 0) + e.st.rituel;
      this.decay(e);
      e.turn++;
    }

    intentInfo() {
      const m = this.e.intent;
      if (!m) return null;
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
