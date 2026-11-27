/* Grimoire de Vitrail — interface : écrans, main de cartes, déroulé des combats */
(function (G) {
  'use strict';

  const UI = {};
  G.UI = UI;
  const R = G.Run;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  // ------------------------------------------------------------------ icônes
  const ICON = {
    heart: 'M12 21s-7.5-4.6-9.6-9.2C.8 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 4.4 2.6.8-1.4 2.3-2.6 4.4-2.6 3.6 0 5.8 3.8 4.2 7.3C19.5 16.4 12 21 12 21z',
    coin: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 3.2l1.6 3.6 3.9.4-2.9 2.6.8 3.9-3.4-2-3.4 2 .8-3.9-2.9-2.6 3.9-.4z',
    deck: 'M7 3h11a2 2 0 012 2v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v13h11V5zM3 7h1v12a1 1 0 001 1h11v1H5a2 2 0 01-2-2z',
    sword: 'M19.5 2.5L21.5 4.5 11 15l1.5 1.5-1.5 1.5-1.8-1.8-3.4 3.4.9.9-1.4 1.4-3.8-3.8 1.4-1.4.9.9 3.4-3.4L5.4 12.5 7 11l1.5 1.5z',
    shield: 'M12 2l8 3v6c0 5.5-3.5 9.5-8 11-4.5-1.5-8-5.5-8-11V5z',
    up: 'M12 3l7 8h-4.5v10h-5V11H5z',
    crack: 'M12 2l2 6-3 3 4 4-2 7-1-6-4-3 3-4z',
    eye: 'M12 5C6.5 5 2.5 9.5 1.5 12c1 2.5 5 7 10.5 7s9.5-4.5 10.5-7C21.5 9.5 17.5 5 12 5zm0 3.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7z',
    drop: 'M12 2c3 4.5 7 8.6 7 12.5A7 7 0 015 14.5C5 10.6 9 6.5 12 2z',
    discard: 'M6 4h12l-1 17H7zM4 4h16v2H4zm5-2h6v2H9z',
    flame: 'M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 1.5-4.5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z',
    tower: 'M5 22V8h2V5h2v3h2V5h2v3h2V5h2v3h2v14h-5v-5a2 2 0 00-4 0v5z',
    thorns: 'M12 2l1.5 5 4-3-1.5 5 5 .5-4.5 2.5 4 3.5-5-.5 1 5-4-3-1 5-1.5-5-4 3 1.5-5-5-.5 4.5-2.5-4-3.5 5 .5-1-5z',
    candle: 'M10 9h4v13h-4zM12 1c1.5 2 2.5 3.5 2.5 5a2.5 2.5 0 01-5 0C9.5 4.5 10.5 3 12 1z',
    broken: 'M4 20l7-7-2-2 4-4 2 2 5-5v4l-3 3 2 2-6 6-2-2-5 5z',
    menu: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z',
  };
  const icon = (n, cls) => `<svg viewBox="0 0 24 24" class="${cls || ''}" aria-hidden="true"><path d="${ICON[n]}"/></svg>`;
  const ST_ICON = { force: 'up', faib: 'broken', fel: 'crack', epines: 'thorns', epinesP: 'thorns', rempart: 'tower', martyre: 'heart', veille: 'candle', rituel: 'flame' };
  const TYPE_NAME = { atk: 'Attaque', skl: 'Technique', pow: 'Pouvoir', curse: 'Malédiction' };
  const KEYWORDS = {
    Armure: 'Absorbe les dégâts. Disparaît au début de ton tour.',
    Fêlure: 'La cible subit 50 % de dégâts en plus.',
    Faiblesse: 'La cible inflige 25 % de dégâts en moins.',
    Épines: 'Renvoie des dégâts à chaque coup reçu.',
    Force: 'Ajoute des dégâts à chaque coup.',
    Encre: 'Ressource pour jouer les cartes. 3 par tour.',
    Épuise: 'La carte quitte le combat une fois jouée.',
    Injouable: 'Ne peut pas être jouée.',
  };

  // ------------------------------------------------------------------ écrans
  let current = null;
  function show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('show', s.id === id));
    current = id;
    hideTip();
  }
  async function go(id, render) {
    await G.FX.iris(() => {
      render();
      show(id);
    });
  }

  let toastTimer;
  UI.toast = function (msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  };

  // ------------------------------------------------------------------ infobulles
  function showTip(el, title, text) {
    const tip = $('#tip');
    tip.innerHTML = `<b>${title}</b>${text}`;
    tip.style.display = 'block';
    const r = el.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = r.left + r.width / 2 - tw / 2;
    x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
    let y = r.bottom + 8;
    if (y + th > window.innerHeight - 8) y = r.top - th - 8;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  }
  function hideTip() {
    $('#tip').style.display = 'none';
  }
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('[data-tip]')) hideTip();
  });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-tip]');
    if (!el) return;
    const [kind, id] = el.dataset.tip.split(':');
    if (kind === 'relic') {
      const r = G.RELICS[id];
      showTip(el, r.name, r.desc);
    } else if (kind === 'st') {
      const n = Number(el.dataset.n);
      const s = G.STATUS[id];
      showTip(el, s.name, s.desc.replace('{n}', n));
    } else if (kind === 'intent') {
      showTip(el, el.dataset.title, el.dataset.text);
    }
  });

  // ------------------------------------------------------------------ cartes
  function cardText(card, combat) {
    const def = G.CARDS[card.id];
    const v = G.cardVals(card);
    let txt = card.up && def.textUp ? def.textUp : def.text;
    txt = txt.replace('{D}', () => {
      if (!combat) return `<b>${v.d}</b>`;
      const d = combat.previewDamage(v.d);
      const cls = d > v.d ? 'buffed' : d < v.d ? 'nerfed' : '';
      return `<b class="${cls}">${d}</b>`;
    });
    txt = txt.replace(/\{(\w)\}/g, (m, k) => `<b>${v[k]}</b>`);
    txt = txt.replace(/(Armure|Fêlure|Faiblesse|Épines permanentes|Épines|Force|Encre|Épuise|Injouable)/g, '<b class="kw">$1</b>');
    return txt;
  }

  function cardEl(card, combat) {
    const def = G.CARDS[card.id];
    const el = document.createElement('div');
    el.className = `card lit t-${def.type}${card.up ? ' up' : ''}`;
    el.dataset.uid = card.uid;
    const cost = G.cardCost(card);
    const plain = (card.up && def.textUp ? def.textUp : def.text).replace(/\{\w\}/g, '00');
    if (plain.length > 62) el.classList.add('xlong');
    else if (plain.length > 44) el.classList.add('long');
    if (def.name.length > 15) el.classList.add('longname');
    el.innerHTML =
      `<div class="c-art"><img alt="" src="${G.Art.cardArt(card.id)}"><div class="c-light"></div></div>` +
      (cost >= 0 ? `<div class="c-cost">${cost}</div>` : '') +
      `<div class="c-name">${def.name}${card.up ? '+' : ''}</div>` +
      `<div class="c-type">${TYPE_NAME[def.type]}</div>` +
      `<div class="c-text"><span>${cardText(card, combat)}</span></div>` +
      `<div class="c-glint"></div>`;
    return el;
  }
  UI.cardEl = cardEl;

  function openCardView(card, extra) {
    const def = G.CARDS[card.id];
    const ov = $('#cardview');
    ov.innerHTML = '';
    ov.appendChild(cardEl(card, C && C.combat));
    const kws = Object.keys(KEYWORDS).filter((k) => (def.text + (def.textUp || '')).includes(k.split(' ')[0]));
    ov.insertAdjacentHTML(
      'beforeend',
      `<div class="quote">« ${def.quote || ''} »</div>` +
        (kws.length ? `<div class="kws">${kws.map((k) => `<b>${k}</b> : ${KEYWORDS[k]}`).join('<br>')}</div>` : '') +
        (extra || '') +
        '<div class="foot">Touchez pour fermer</div>'
    );
    ov.classList.add('show');
    ov.onclick = () => ov.classList.remove('show');
  }

  // ------------------------------------------------------------------ barre du haut
  function topbar(where) {
    const run = R.run;
    return (
      `<div class="topbar">` +
      `<div class="stat hp">${icon('heart')}<span class="v-hp">${run.hp}/${run.maxHp}</span></div>` +
      `<div class="stat gold">${icon('coin')}<span class="v-gold">${run.gold}</span></div>` +
      `<div class="where">${where || ''}</div>` +
      `<button class="icon-btn b-deck" aria-label="Voir le paquet">${icon('deck')}<span class="badge">${run.deck.length}</span></button>` +
      `</div>` +
      `<div class="relics">${run.relics.map((id) => `<div class="relic" data-tip="relic:${id}" data-relic="${id}"><img alt="${G.RELICS[id].name}" src="${G.Art.relic(id)}"></div>`).join('')}</div>`
    );
  }
  function bindTopbar(root) {
    const b = $('.b-deck', root);
    if (b) b.onclick = () => openDeck();
  }
  function refreshTopbar(root) {
    const run = R.run;
    const hp = $('.v-hp', root);
    if (hp) hp.textContent = `${run.hp}/${run.maxHp}`;
    const g = $('.v-gold', root);
    if (g) g.textContent = run.gold;
  }
  const ROMAN = ['', 'I', 'II', 'III'];
  const whereText = () => `Acte ${ROMAN[R.run.act]} · ${G.ACT_POOLS[R.run.act].name}`;

  // ------------------------------------------------------------------ titre
  function renderTitle() {
    const has = R.hasSave();
    const el = $('#title');
    el.innerHTML =
      `<div class="title-rose lit"><img alt="" src="${G.Art.rosace('title', 'rubis', 300)}"></div>` +
      `<div class="kicker">Un jeu de cartes et de verre</div>` +
      `<h1>Grimoire<small>de Vitrail</small></h1>` +
      `<div class="menu">` +
      (has ? `<button class="btn gold" id="b-continue">Reprendre l’ascension</button>` : '') +
      `<button class="btn" id="b-new">Nouvelle ascension</button>` +
      `</div>` +
      `<div class="foot">${R.meta.wins ? `Victoires : ${R.meta.wins}` : 'La rosace attend ton retour.'}</div>`;
    if (has) $('#b-continue').onclick = () => continueRun();
    let armed = false;
    $('#b-new').onclick = (e) => {
      if (has && !armed) {
        armed = true;
        e.currentTarget.textContent = 'Abandonner la partie en cours ?';
        setTimeout(() => {
          armed = false;
          const b = $('#b-new');
          if (b) b.textContent = 'Nouvelle ascension';
        }, 3500);
        return;
      }
      go('heroes', renderHeroes);
    };
  }

  // ------------------------------------------------------------------ héros
  let selHero = 'chevalier';
  function renderHeroes() {
    const el = $('#heroes');
    const h = G.HEROES[selHero];
    el.innerHTML =
      `<h2>Choisis ton porteur</h2>` +
      `<div class="hero-row">${Object.values(G.HEROES)
        .map(
          (x) =>
            `<button class="hero-pick ${x.id === selHero ? 'sel' : ''} ${x.locked ? 'locked' : ''}" data-h="${x.id}"><img alt="" src="${G.Art.hero(x.id)}">` +
            `<div class="nm">${x.name.replace(/^L[ea] /, '')}</div>${x.locked ? '<div class="lock">Bientôt</div>' : ''}</button>`
        )
        .join('')}</div>` +
      `<div class="hero-info"><h3>${h.name}</h3><div class="sub">${h.title}</div><p>${h.desc}</p>` +
      (h.locked ? '' : `<div class="facts"><span>${icon('heart')} ${h.hp} PV</span><span>Relique : ${G.RELICS[h.relic].name}</span></div>`) +
      `</div>` +
      `<div class="actions"><button class="btn ghost" id="b-back">Retour</button><button class="btn gold" id="b-start" ${h.locked ? 'disabled' : ''}>Commencer</button></div>`;
    $$('.hero-pick', el).forEach((b) => {
      b.onclick = () => {
        selHero = b.dataset.h;
        renderHeroes();
      };
    });
    $('.facts svg', el) && ($('.facts svg', el).style.cssText = 'width:16px;height:16px;fill:#c21f31;vertical-align:-2px');
    $('#b-back').onclick = () => go('title', renderTitle);
    $('#b-start').onclick = () => {
      if (G.HEROES[selHero].locked) return;
      R.newRun(selHero);
      go('map', renderMap).then(() => UI.toast('Acte I · ' + G.ACT_POOLS[1].name));
    };
  }

  function continueRun() {
    if (!R.load()) return;
    go('map', renderMap);
  }

  // ------------------------------------------------------------------ carte d'ascension
  const NODE_NAME = { combat: 'Combat', elite: 'Élite', merchant: 'Marchand', altar: 'Autel', event: 'Mystère', boss: 'Gardien' };
  function renderMap() {
    const run = R.run;
    const el = $('#map');
    const avail = R.availableNodes();
    const rows = run.map.rows;
    el.innerHTML =
      topbar(`Étage ${run.floor + 1}`) +
      `<div class="act-title"><div class="n">Acte ${ROMAN[run.act]}</div><h2>${G.ACT_POOLS[run.act].name}</h2></div>` +
      `<div class="map-wrap"><svg class="links"></svg></div>` +
      `<div class="map-hint">${avail.length ? 'Choisis ta prochaine salle.' : ''}</div>`;
    bindTopbar(el);
    const wrap = $('.map-wrap', el);
    const laneX = [18, 50, 82];
    const pos = (n) => ({ x: n.type === 'boss' ? 50 : laneX[n.lane], y: 92 - n.row * 20 });
    const svg = $('svg', wrap);
    const vw = wrap.clientWidth;
    const vh = wrap.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    let paths = '';
    rows.forEach((row) =>
      row.forEach((n) => {
        if (n.row >= rows.length - 1) return;
        const nextRow = rows[n.row + 1];
        const targets = nextRow.length === 1 ? nextRow : nextRow.filter((m) => n.next.includes(m.lane));
        targets.forEach((m) => {
          const a = pos(n);
          const b = pos(m);
          const x1 = (a.x / 100) * vw;
          const y1 = (a.y / 100) * vh;
          const x2 = (b.x / 100) * vw;
          const y2 = (b.y / 100) * vh;
          const d = `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
          const walked = run.pos && run.path && run.path.some((p, i) => i > 0 && run.path[i - 1].row === n.row && run.path[i - 1].lane === n.lane && p.row === m.row && p.lane === m.lane);
          paths += `<path d="${d}" stroke="#0f0c0b" stroke-width="7"/><path d="${d}" stroke="${walked ? '#f5dc96' : 'rgba(217,173,82,0.45)'}" stroke-width="${walked ? 3 : 2}" ${walked ? '' : 'stroke-dasharray="4 6"'}/>`;
        });
      })
    );
    svg.innerHTML = paths;
    rows.forEach((row) =>
      row.forEach((n) => {
        const p = pos(n);
        const isAvail = avail.includes(n);
        const isHere = run.pos && run.pos.row === n.row && run.pos.lane === n.lane;
        const past = run.pos && n.row <= run.pos.row && !isHere;
        const b = document.createElement('button');
        b.className = `map-node ${n.type === 'boss' ? 'boss' : ''} ${isAvail ? 'avail' : ''} ${isHere ? 'here done' : ''} ${past ? 'past' : ''}`;
        b.style.left = p.x + '%';
        b.style.top = p.y + '%';
        b.setAttribute('aria-label', NODE_NAME[n.type]);
        b.innerHTML = `<img alt="" src="${G.Art.node(n.type)}"><span class="lbl">${NODE_NAME[n.type]}</span>`;
        if (isAvail) b.onclick = () => enterNode(n);
        else b.disabled = !isAvail;
        wrap.appendChild(b);
      })
    );
    R.save();
  }

  function enterNode(n) {
    const run = R.run;
    run.pending = { row: n.row, lane: n.lane, type: n.type };
    if (n.type === 'combat' || n.type === 'elite' || n.type === 'boss') {
      const id = R.enemyFor(n.type);
      go('combat', () => startCombat(id, n.type));
    } else if (n.type === 'event') go('event', () => renderEvent(R.nextEvent()));
    else if (n.type === 'merchant') go('shop', () => renderShop(true));
    else if (n.type === 'altar') go('altar', renderAltar);
  }

  function completeNode() {
    const run = R.run;
    const p = run.pending;
    if (!p) return; // déjà terminé (double appui pendant la transition)
    run.pos = { row: p.row, lane: p.lane };
    run.path = (run.path || []).concat([{ row: p.row, lane: p.lane }]);
    run.pending = null;
    run.floor++;
    R.save();
    go('map', renderMap);
  }

  // ------------------------------------------------------------------ combat
  const C = { combat: null, busy: false, type: null };
  UI.C = C;

  function startCombat(enemyId, type) {
    C.type = type;
    C.busy = false;
    const el = $('#combat');
    const portrait = G.Art.enemy(enemyId);
    const def = G.ENEMIES[enemyId];
    el.innerHTML =
      topbar(whereText()) +
      `<div class="enemy-zone">` +
      `<div class="move-banner"></div>` +
      `<div class="intent" data-tip="intent:"></div>` +
      `<div class="window lit ${def.boss ? 'boss' : ''}" style="--mask:url(${portrait})"><img class="portrait" alt="" src="${portrait}"><div class="w-light"></div><div class="w-flash"></div></div>` +
      `<div class="e-name">${def.name}</div>` +
      `<div class="bar-wrap e-bar"><div class="block-badge"></div><div class="bar"><div class="lag"></div><div class="fill"></div><div class="txt"></div></div></div>` +
      `<div class="statuses e-st"></div>` +
      `</div>` +
      `<div class="controls">` +
      `<div class="ink" aria-label="Encre"></div>` +
      `<div class="player-zone">` +
      `<div class="p-head">${icon('heart')}<div class="bar-wrap p-bar"><div class="block-badge"></div><div class="bar"><div class="lag"></div><div class="fill"></div><div class="txt"></div></div></div></div>` +
      `<div class="statuses p-st"></div>` +
      `<div class="piles"><button class="pile b-draw">${icon('deck')}<b class="n-draw">0</b></button><button class="pile b-disc">${icon('discard')}<b class="n-disc">0</b></button></div>` +
      `</div>` +
      `<button class="btn blue end-turn">Fin du tour</button>` +
      `</div>` +
      `<div class="hand"></div><div class="drop-hint">Relâche pour jouer</div>`;
    bindTopbar(el);
    $('.end-turn', el).onclick = () => endTurn();
    $('.b-draw', el).onclick = () => openPile('Pioche', C.combat.pile, true);
    $('.b-disc', el).onclick = () => openPile('Défausse', C.combat.discard);
    C.combat = new G.Combat(enemyId, onEvent);
    C.combat.start();
    renderCombat(true);
    setTimeout(layoutHand, 620);
    if (def.boss) setTimeout(() => banner(def.name), 600);
  }

  function setCardWidth() {
    const w = Math.min(window.innerWidth, 520);
    const cw = Math.max(92, Math.min(120, Math.floor(w * 0.29)));
    document.documentElement.style.setProperty('--cw', cw + 'px');
  }

  function barUpdate(wrap, hp, max, block) {
    const pct = Math.max(0, (hp / max) * 100) + '%';
    $('.fill', wrap).style.width = pct;
    $('.lag', wrap).style.width = pct;
    $('.txt', wrap).textContent = `${hp} / ${max}`;
    wrap.classList.toggle('blk', block > 0);
    $('.bar', wrap).classList.toggle('has-block', block > 0);
    $('.block-badge', wrap).textContent = block;
  }
  function statusHTML(st) {
    return Object.keys(st)
      .filter((k) => st[k] > 0 && G.STATUS[k])
      .map((k) => {
        const s = G.STATUS[k];
        const val = ['rempart'].includes(k) ? '' : st[k];
        return `<div class="st ${s.good ? '' : 'bad'}" data-tip="st:${k}" data-n="${st[k]}">${icon(ST_ICON[k] || 'up')}${val}</div>`;
      })
      .join('');
  }

  function renderCombat(fresh) {
    const c = C.combat;
    const el = $('#combat');
    R.run.hp = c.p.hp;
    refreshTopbar(el);
    // intention
    const info = c.intentInfo();
    const it = $('.intent', el);
    if (info && !c.over) {
      const kinds = info.kinds;
      let html = '';
      if (kinds.includes('atk')) html += icon('sword', 'i-atk') + `<span>${info.dmg}${info.hits > 1 ? '×' + info.hits : ''}</span>`;
      if (kinds.includes('def')) html += icon('shield', 'i-def');
      if (kinds.includes('buff')) html += icon('up', 'i-buff');
      if (kinds.includes('debuff')) html += icon('crack', 'i-debuff');
      if (kinds.includes('curse')) html += icon('eye', 'i-curse');
      html += `<span class="nm">${info.name}</span>`;
      it.innerHTML = html;
      it.className = 'intent' + (kinds.includes('atk') ? ' atk' : '');
      it.style.visibility = '';
      it.dataset.title = info.name;
      it.dataset.text = intentText(c.e.intent, info);
    } else it.style.visibility = 'hidden';
    barUpdate($('.e-bar', el), c.e.hp, c.e.maxHp, c.e.block);
    $('.e-st', el).innerHTML = statusHTML(c.e.st);
    barUpdate($('.p-bar', el), c.p.hp, c.p.maxHp, c.p.block);
    $('.p-st', el).innerHTML = statusHTML(c.p.st);
    const ink = $('.ink', el);
    ink.innerHTML = `${c.ink}<small>/${R.energyPerTurn()}</small>`;
    ink.classList.toggle('empty', c.ink === 0);
    $('.n-draw', el).textContent = c.pile.length;
    $('.n-disc', el).textContent = c.discard.length;
    renderHand(fresh);
    const anyPlayable = c.hand.some((k) => c.canPlay(k));
    $('.end-turn', el).classList.toggle('glow', !anyPlayable && !C.busy);
    $('.end-turn', el).disabled = C.busy || c.over;
  }

  function intentText(m, info) {
    const parts = [];
    if (m.dmg) parts.push(`Attaque : ${info.dmg} dégâts${info.hits > 1 ? ` × ${info.hits}` : ''}.`);
    if (m.block) parts.push(`Se protège (${m.block} Armure).`);
    if (m.buff) parts.push('Se renforce : ' + Object.keys(m.buff).map((k) => `${G.STATUS[k].name} +${m.buff[k]}`).join(', ') + '.');
    if (m.debuff) parts.push('T’affaiblit : ' + Object.keys(m.debuff).map((k) => `${G.STATUS[k].name} ${m.debuff[k]}`).join(', ') + '.');
    if (m.curse) parts.push(`Ajoute ${m.n || 1} « ${G.CARDS[m.curse].name} » à ta défausse.`);
    return parts.join(' ');
  }

  // ---- main en éventail
  const handEls = new Map();
  function renderHand(fresh) {
    const c = C.combat;
    const hand = $('#combat .hand');
    if (!hand) return;
    const keep = new Set(c.hand.map((k) => k.uid));
    for (const [uid, el] of handEls) {
      if (!keep.has(uid)) {
        el.remove();
        handEls.delete(uid);
      }
    }
    let delay = 0;
    c.hand.forEach((card) => {
      let el = handEls.get(card.uid);
      if (!el) {
        el = cardEl(card, c);
        el.classList.add('drawn');
        el.style.animationDelay = delay + 'ms';
        delay += 70;
        bindDrag(el, card);
        hand.appendChild(el);
        handEls.set(card.uid, el);
        setTimeout(() => el.classList.remove('drawn'), 600 + delay);
      } else {
        $('.c-text span', el).innerHTML = cardText(card, c);
      }
      el.classList.toggle('unplayable', !c.canPlay(card));
      const cost = $('.c-cost', el);
      if (cost) cost.classList.toggle('dim', G.cardCost(card) > c.ink);
    });
    layoutHand();
    void fresh;
  }

  function layoutHand() {
    const c = C.combat;
    const hand = $('#combat .hand');
    if (!hand) return;
    const n = c.hand.length;
    const cw = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cw')) || 110;
    const width = (hand.clientWidth || Math.min(window.innerWidth, 520)) - 16;
    const spacing = n > 1 ? Math.min(cw * 0.82, (width - cw) / (n - 1)) : 0;
    c.hand.forEach((card, i) => {
      const el = handEls.get(card.uid);
      if (!el || el.classList.contains('dragging') || el.classList.contains('fly')) return;
      const off = i - (n - 1) / 2;
      const x = off * spacing;
      const rot = n > 1 ? off * Math.min(5, 22 / n) : 0;
      const y = Math.abs(off) ** 1.8 * 2.2;
      el.dataset.base = `translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rot}deg)`;
      el.style.transform = el.dataset.base;
      el.style.zIndex = 10 + i;
    });
  }

  let drag = null;
  function bindDrag(el, card) {
    el.addEventListener('pointerdown', (e) => {
      if (C.busy || C.combat.over || drag) return;
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (err) {
        /* ignoré */
      }
      drag = { el, card, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, ready: false };
      el.classList.add('dragging');
      el.style.transform = el.dataset.base + ' translateY(-26px) scale(1.12)';
      el.style.zIndex = 60;
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag || drag.el !== el || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      const playable = C.combat.canPlay(card);
      drag.ready = dy < -Math.min(110, window.innerHeight * 0.12) && playable;
      el.classList.toggle('ready', drag.ready);
      $('#combat .drop-hint').classList.toggle('show', drag.moved && playable);
      el.style.transform = `translateX(calc(-50% + ${dx + parseBaseX(el)}px)) translateY(${dy - 26}px) rotate(${dx * 0.04}deg) scale(1.12)`;
    });
    const up = (e) => {
      if (!drag || drag.el !== el || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      el.classList.remove('dragging', 'ready');
      $('#combat .drop-hint').classList.remove('show');
      if (!d.moved && performance.now() - d.t0 < 400) {
        layoutHand();
        openCardView(card);
        return;
      }
      if (d.ready) {
        playCard(card, el);
        return;
      }
      if (d.moved && e.clientY - d.y0 < -60 && !C.combat.canPlay(card)) {
        UI.toast(G.cardCost(card) < 0 ? 'Cette carte est injouable.' : 'Pas assez d’Encre.');
        $('#combat .ink').classList.remove('flash');
        void $('#combat .ink').offsetWidth;
        $('#combat .ink').classList.add('flash');
      }
      layoutHand();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }
  function parseBaseX(el) {
    const m = /calc\(-50% \+ (-?[\d.]+)px\)/.exec(el.dataset.base || '');
    return m ? parseFloat(m[1]) : 0;
  }

  async function playCard(card, el) {
    const c = C.combat;
    C.busy = true;
    const def = G.CARDS[card.id];
    const win = $('#combat .window').getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const tx = win.left + win.width / 2 - (r.left + r.width / 2);
    const ty = win.top + win.height * 0.55 - (r.top + r.height / 2);
    el.classList.add('fly');
    const cur = el.style.transform;
    el.style.transform = `${cur} translate(${tx * 0.55}px, ${ty * 0.55}px) scale(0.85)`;
    await wait(200);
    const rect = el.getBoundingClientRect();
    const snap = G.FX.cardSnapshot(el);
    el.remove();
    handEls.delete(card.uid);
    C.fxDelay = 0;
    c.play(card);
    if (def.type === 'pow') G.FX.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, '245,220,150', 30);
    else G.FX.shatter(snap, { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, { power: def.exhaust ? 0.9 : 0.55, count: def.exhaust ? 10 : 7 });
    renderCombat();
    if (c.over) return handleOver();
    C.busy = false;
    renderCombat();
  }

  async function endTurn() {
    const c = C.combat;
    if (C.busy || c.over) return;
    C.busy = true;
    renderCombat();
    // la main glisse vers la défausse
    const disc = $('#combat .b-disc').getBoundingClientRect();
    for (const [uid, el] of handEls) {
      const r = el.getBoundingClientRect();
      el.classList.add('fly');
      el.style.transform = `${el.dataset.base} translate(${disc.left - r.left}px, ${disc.top - r.top}px) scale(0.3)`;
      el.style.opacity = '0';
      void uid;
    }
    C.fxDelay = 0;
    c.endTurn();
    await wait(280);
    renderCombat();
    if (c.over) return handleOver();
    await wait(250);
    const intent = c.e.intent;
    const win = $('#combat .window');
    if (intent && intent.dmg) {
      win.classList.remove('lunge');
      void win.offsetWidth;
      win.classList.add('lunge');
      await wait(200);
    }
    C.fxDelay = 0;
    c.enemyTurn();
    renderCombat();
    await wait(450 + (intent && intent.hits ? intent.hits * 150 : 0));
    if (c.over) return handleOver();
    C.fxDelay = 0;
    c.startTurn();
    C.busy = false;
    renderCombat(true);
  }

  async function handleOver() {
    const c = C.combat;
    C.busy = true;
    renderCombat();
    if (c.won) {
      const win = $('#combat .window');
      const img = $('img.portrait', win);
      const rect = win.getBoundingClientRect();
      await wait(250);
      G.FX.shatter(img, { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, { power: 1.3, count: 16 });
      win.style.visibility = 'hidden';
      await wait(1300);
      onCombatWon();
    } else {
      document.body.classList.add('shake');
      await wait(1400);
      document.body.classList.remove('shake');
      endRun(false);
    }
  }

  // ---- réactions aux événements du moteur
  function center(sel) {
    const el = $(sel);
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function floatText(text, x, y, cls, delay) {
    setTimeout(() => {
      const f = document.createElement('div');
      f.className = 'float ' + (cls || '');
      f.textContent = text;
      f.style.left = x + (Math.random() - 0.5) * 30 + 'px';
      f.style.top = y + (Math.random() - 0.5) * 16 + 'px';
      document.body.appendChild(f);
      setTimeout(() => f.remove(), 1050);
    }, delay || 0);
  }
  function banner(text) {
    const b = $('#combat .move-banner');
    if (!b) return;
    b.textContent = text;
    b.classList.remove('show');
    void b.offsetWidth;
    b.classList.add('show');
  }
  function onEvent(ev) {
    const d = (C.fxDelay = (C.fxDelay || 0) + (ev.t === 'hit' ? 130 : 40));
    const delay = d - 130;
    const pe = center('#combat .window');
    const pp = center('#combat .p-bar');
    switch (ev.t) {
      case 'hit': {
        const at = ev.who === 'e' ? { x: pe.x, y: pe.y - 10 } : pp;
        if (ev.dmg > 0) floatText(ev.dmg, at.x, at.y, ev.dmg >= 15 ? 'big' : '', delay);
        else if (ev.blocked > 0) floatText('Bloqué', at.x, at.y, 'blocked', delay);
        setTimeout(() => {
          if (ev.who === 'e') {
            const w = $('#combat .window');
            if (w) {
              w.classList.remove('hit');
              void w.offsetWidth;
              w.classList.add('hit');
            }
            G.FX.burst(at.x, at.y, ev.kind === 'thorns' ? '200,255,200' : '255,225,170', ev.dmg > 0 ? 14 : 6);
          } else if (ev.dmg > 0) {
            const v = $('#vignette');
            v.classList.add('hurt');
            setTimeout(() => v.classList.remove('hurt'), 120);
            const scr = $('#combat');
            scr.classList.remove('shake');
            void scr.offsetWidth;
            scr.classList.add('shake');
          }
        }, Math.max(0, delay));
        break;
      }
      case 'block': {
        const at = ev.who === 'e' ? pe : pp;
        floatText('+' + ev.n, at.x - 40, at.y, 'block', delay);
        break;
      }
      case 'heal':
        if (ev.n > 0) floatText('+' + ev.n, pp.x, pp.y, 'heal', delay);
        break;
      case 'status': {
        const at = ev.who === 'e' ? pe : pp;
        const s = G.STATUS[ev.st];
        if (s) floatText(`${s.name} ${ev.st === 'rempart' ? '' : (ev.n > 0 ? '+' : '') + ev.n}`, at.x, at.y + 30, 'label ' + (s.good ? '' : 'bad'), delay);
        break;
      }
      case 'relic': {
        const el = $(`#combat .relic[data-relic="${ev.id}"]`);
        if (el) {
          el.classList.remove('pulse');
          void el.offsetWidth;
          el.classList.add('pulse');
        }
        break;
      }
      case 'curse':
        setTimeout(() => UI.toast(`${ev.n} « ${G.CARDS[ev.id].name} » ajouté${ev.n > 1 ? 's' : ''} à ta défausse`), 500);
        break;
      case 'enemyMove':
        banner(ev.move.name);
        break;
      case 'ink': {
        const ink = $('#combat .ink');
        if (ink) {
          ink.classList.remove('flash');
          void ink.offsetWidth;
          ink.classList.add('flash');
        }
        break;
      }
      default:
        break;
    }
  }

  function openPile(title, cards, shuffled) {
    const list = shuffled ? cards.slice().sort((a, b) => G.CARDS[a.id].name.localeCompare(G.CARDS[b.id].name)) : cards.slice().reverse();
    openDeck(title, list, shuffled ? 'Ordre de pioche caché' : '');
  }

  // ------------------------------------------------------------------ fin de combat et récompenses
  function onCombatWon() {
    const c = C.combat;
    c.finish();
    const run = R.run;
    run.stats.kills++;
    for (const id of run.relics) if (G.RELICS[id].combatEnd) G.RELICS[id].combatEnd(run);
    const type = C.type;
    const reward = { gold: 0, relic: null, bossRelics: null, cards: null };
    if (type === 'combat') reward.gold = R.gainGold(12 + Math.floor(Math.random() * 8));
    if (type === 'elite') {
      run.stats.elites++;
      reward.gold = R.gainGold(28 + Math.floor(Math.random() * 8));
      reward.relic = R.gainRandomRelicSilent();
    }
    if (type === 'boss') {
      run.stats.bosses++;
      reward.gold = R.gainGold(70);
      reward.bossRelics = G.shuffle(R.relicPool(['boss'])).slice(0, 3);
    }
    const n = R.has('reliquaire') ? 4 : 3;
    reward.cards = type === 'boss' ? R.cardChoices(n, 0, 'r') : R.cardChoices(n, type === 'elite' ? 0.12 : 0);
    R.save();
    go('reward', () => renderReward(reward));
  }
  R.gainRandomRelicSilent = function () {
    const id = R.randomRelic();
    if (id) R.gainRelic(id);
    return id;
  };

  function renderReward(rw) {
    const el = $('#reward');
    const boss = C.type === 'boss';
    el.innerHTML =
      topbar(whereText()) +
      `<div class="panel-head"><h2>${boss ? 'Le gardien tombe' : 'Victoire'}</h2><p>${boss ? 'La rosace frémit, une page se tourne.' : 'Le verre se tait. Ramasse ce qui brille.'}</p></div>` +
      `<div class="scroll">` +
      (rw.gold ? `<div class="loot">${icon('coin').replace('<svg', '<svg style="width:40px;height:40px;fill:#d9ad52"')}<div><div class="t">${rw.gold} or</div><div class="d">Ajouté à ta bourse.</div></div></div>` : '') +
      (rw.relic ? `<div class="loot"><img alt="" src="${G.Art.relic(rw.relic)}"><div><div class="t">${G.RELICS[rw.relic].name}</div><div class="d">${G.RELICS[rw.relic].desc}</div></div></div>` : '') +
      (rw.bossRelics && rw.bossRelics.length
        ? `<div class="shop-sec">Choisis une relique de gardien</div><div class="shop-relics">${rw.bossRelics
            .map((id) => `<button class="shop-relic b-boss" data-id="${id}"><img alt="" src="${G.Art.relic(id)}"><div class="t">${G.RELICS[id].name}</div><div class="d">${G.RELICS[id].desc}</div></button>`)
            .join('')}</div>`
        : '') +
      `<div class="shop-sec">Ajoute une carte à ton grimoire</div>` +
      `<div class="card-row"></div>` +
      `</div>` +
      `<div class="actions"><button class="btn ghost" id="b-skip">Ne rien prendre</button><button class="btn gold" id="b-take" disabled>Prendre</button></div>`;
    bindTopbar(el);
    const row = $('.card-row', el);
    let chosen = null;
    rw.cards.forEach((id) => {
      const card = G.newCard(id);
      const ce = cardEl(card);
      ce.onclick = () => {
        if (chosen === id) {
          openCardView(card);
          return;
        }
        chosen = id;
        $$('.card', row).forEach((x) => x.classList.toggle('chosen', x === ce));
        $('#b-take').disabled = false;
      };
      row.appendChild(ce);
    });
    let bossPicked = !rw.bossRelics || !rw.bossRelics.length;
    $$('.b-boss', el).forEach((b) => {
      b.onclick = () => {
        if (bossPicked) return;
        bossPicked = true;
        R.gainRelic(b.dataset.id);
        $$('.b-boss', el).forEach((x) => (x.style.opacity = x === b ? '1' : '0.25'));
        b.style.boxShadow = '0 0 0 2px #f5dc96, 0 0 24px rgba(245,220,150,.6)';
        refreshTopbar(el);
        el.querySelector('.relics').innerHTML = R.run.relics.map((id) => `<div class="relic" data-tip="relic:${id}"><img alt="" src="${G.Art.relic(id)}"></div>`).join('');
      };
    });
    let left = false;
    const leave = () => {
      if (left) return;
      if (!bossPicked) {
        UI.toast('Choisis d’abord une relique de gardien.');
        return;
      }
      left = true;
      if (C.type === 'boss') nextAct();
      else completeNode();
    };
    $('#b-skip').onclick = leave;
    $('#b-take').onclick = () => {
      if (!chosen || left) return;
      if (!bossPicked) {
        UI.toast('Choisis d’abord une relique de gardien.');
        return;
      }
      R.addCard(chosen);
      UI.toast(G.CARDS[chosen].name + ' rejoint ton grimoire');
      leave();
    };
  }

  function nextAct() {
    const run = R.run;
    if (run.act >= 3) {
      endRun(true);
      return;
    }
    run.act++;
    run.map = R.makeMap(run.act);
    run.pos = null;
    run.path = [];
    run.pending = null;
    run.floor++;
    run.hp = run.maxHp;
    R.save();
    go('map', renderMap).then(() => UI.toast(`Acte ${ROMAN[run.act]} · ${G.ACT_POOLS[run.act].name} — PV restaurés`));
  }

  // ------------------------------------------------------------------ autel
  function renderAltar() {
    const run = R.run;
    const el = $('#altar');
    const noHeal = R.has('ostensoir');
    const heal = Math.round(run.maxHp * 0.3) + (R.has('sceau') ? 15 : 0);
    el.innerHTML =
      topbar(whereText()) +
      `<div class="panel-head"><h2>L’Autel</h2><p>Les cierges brûlent sans fondre. Une seule grâce t’est accordée.</p></div>` +
      `<div class="event-art lit"><img alt="" src="${G.Art.event({ id: 'altar', art: 'candle', pal: 'ambre' })}"><div class="c-light" style="position:absolute;inset:0;background:radial-gradient(circle at var(--gx,50%) var(--gy,30%),rgba(255,240,200,.5),transparent 55%);mix-blend-mode:overlay"></div></div>` +
      `<div class="altar-opts">` +
      `<button class="choice" id="b-rest" ${noHeal ? 'disabled' : ''}><span class="t">Se recueillir</span><span class="d">${noHeal ? 'L’Ostensoir refuse tout repos.' : `Soigne ${heal} PV.`}</span></button>` +
      `<button class="choice" id="b-forge"><span class="t">Graver une rune</span><span class="d">Améliore une carte de ton grimoire.</span></button>` +
      `</div>`;
    bindTopbar(el);
    $('#b-rest').onclick = () => {
      R.heal(heal);
      UI.toast(`+${heal} PV`);
      completeNode();
    };
    $('#b-forge').onclick = async () => {
      const done = await R.chooseUpgrade(true);
      if (done) completeNode();
    };
  }

  // ------------------------------------------------------------------ marchand
  let stock = null;
  function makeStock() {
    const disc = R.has('cle') ? 0.75 : 1;
    const price = (base) => Math.round(base * (0.9 + Math.random() * 0.2) * disc);
    const cards = [];
    const want = ['c', 'c', 'c', 'u', Math.random() < 0.6 ? 'u' : 'r'];
    want.forEach((rar) => {
      let id;
      let guard = 0;
      do {
        id = G.pick(R.cardPool(rar));
      } while (cards.some((x) => x.id === id) && guard++ < 20);
      cards.push({ id, price: price({ c: 50, u: 78, r: 145 }[rar]), sold: false });
    });
    const relics = G.shuffle(R.relicPool(['c', 'u', 'r'])).slice(0, 2).map((id) => ({ id, price: price({ c: 140, u: 190, r: 250 }[G.RELICS[id].rarity]), sold: false }));
    return { cards, relics, remove: Math.round(R.run.removeCost * disc), removed: false };
  }
  function renderShop(fresh) {
    if (fresh || !stock) stock = makeStock();
    const run = R.run;
    const el = $('#shop');
    const pr = (p) => `<div class="price ${run.gold < p ? 'no' : ''}">${icon('coin')}${p}</div>`;
    el.innerHTML =
      topbar(whereText()) +
      `<div class="panel-head"><h2>Le Marchand</h2><p>« Tout se vend, même la lumière. Surtout la lumière. »</p></div>` +
      `<div class="scroll">` +
      `<div class="shop-sec">Cartes</div><div class="card-row shop-cards"></div>` +
      `<div class="shop-sec">Reliques</div><div class="shop-relics">${stock.relics
        .map((x, i) => `<button class="shop-relic ${x.sold ? 'sold' : ''}" data-i="${i}" style="${x.sold ? 'visibility:hidden' : ''}"><img alt="" src="${G.Art.relic(x.id)}"><div class="t">${G.RELICS[x.id].name}</div><div class="d">${G.RELICS[x.id].desc}</div>${pr(x.price)}</button>`)
        .join('')}</div>` +
      `<div class="shop-sec">Service</div><div class="choice-list"><button class="choice" id="b-remove" ${stock.removed || run.gold < stock.remove ? 'disabled' : ''}><span class="t">Effacer une page — ${stock.remove} or</span><span class="d">${stock.removed ? 'Déjà fait aujourd’hui.' : 'Retire une carte de ton grimoire.'}</span></button></div>` +
      `</div>` +
      `<div class="actions"><button class="btn gold" id="b-leave">Partir</button></div>`;
    bindTopbar(el);
    const row = $('.shop-cards', el);
    stock.cards.forEach((x) => {
      const card = G.newCard(x.id);
      const wrap = document.createElement('div');
      wrap.className = 'shop-item' + (x.sold ? ' sold' : '');
      const ce = cardEl(card);
      wrap.appendChild(ce);
      wrap.insertAdjacentHTML('beforeend', pr(x.price));
      ce.onclick = () => {
        if (x.sold) return;
        if (run.gold < x.price) {
          openCardView(card, `<div class="price no">${icon('coin')}${x.price} — pas assez d’or</div>`);
          return;
        }
        if (wrap.dataset.armed) {
          run.gold -= x.price;
          x.sold = true;
          R.addCard(x.id);
          UI.toast(`${G.CARDS[x.id].name} achetée`);
          renderShop(false);
          return;
        }
        $$('.shop-item', row).forEach((w) => {
          delete w.dataset.armed;
          $('.card', w).classList.remove('chosen');
        });
        wrap.dataset.armed = '1';
        ce.classList.add('chosen');
        UI.toast('Touche encore pour acheter');
      };
      row.appendChild(wrap);
    });
    $$('.shop-relic', el).forEach((b) => {
      b.onclick = () => {
        const x = stock.relics[Number(b.dataset.i)];
        if (x.sold) return;
        if (run.gold < x.price) {
          UI.toast('Pas assez d’or');
          return;
        }
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.style.boxShadow = '0 0 0 2px #f5dc96';
          UI.toast('Touche encore pour acheter');
          return;
        }
        run.gold -= x.price;
        x.sold = true;
        R.gainRelic(x.id);
        UI.toast(`${G.RELICS[x.id].name} acquise`);
        renderShop(false);
      };
    });
    $('#b-remove').onclick = async () => {
      if (stock.removed || run.gold < stock.remove) return;
      const done = await R.chooseRemove(true);
      if (done) {
        run.gold -= stock.remove;
        run.removeCost += 25;
        stock.removed = true;
        renderShop(false);
      }
    };
    $('#b-leave').onclick = () => completeNode();
  }

  // ------------------------------------------------------------------ événement
  function renderEvent(ev) {
    const el = $('#event');
    el.innerHTML =
      topbar(whereText()) +
      `<div class="panel-head"><h2>${ev.title}</h2></div>` +
      `<div class="scroll">` +
      `<div class="event-art lit"><img alt="" src="${G.Art.event(ev)}"><div style="position:absolute;inset:0;background:radial-gradient(circle at var(--gx,50%) var(--gy,30%),rgba(255,240,200,.5),transparent 55%);mix-blend-mode:overlay"></div></div>` +
      `<p class="event-text">${ev.text}</p>` +
      `<div class="choice-list">${ev.choices
        .map((ch, i) => `<button class="choice" data-i="${i}" ${ch.cond && !ch.cond(R) ? 'disabled' : ''}><span class="t">${ch.label}</span><span class="d">${ch.detail}</span></button>`)
        .join('')}</div>` +
      `</div>`;
    bindTopbar(el);
    $$('.choice', el).forEach((b) => {
      b.onclick = async () => {
        $$('.choice', el).forEach((x) => (x.disabled = true));
        let res = ev.choices[Number(b.dataset.i)].act(R);
        if (res && typeof res.then === 'function') res = await res;
        refreshTopbar(el);
        const list = $('.choice-list', el);
        list.innerHTML = `<p class="event-text result">${typeof res === 'string' ? res : 'C’est fait.'}</p><div class="actions"><button class="btn gold" id="b-ev-ok">Continuer</button></div>`;
        $('#b-ev-ok').onclick = () => completeNode();
      };
    });
  }

  // ------------------------------------------------------------------ paquet, choix de carte
  function openDeck(title, cards, sub) {
    const ov = $('#deck');
    const list = cards || R.run.deck.slice().sort((a, b) => {
      const order = { atk: 0, skl: 1, pow: 2, curse: 3 };
      const da = G.CARDS[a.id];
      const db = G.CARDS[b.id];
      return order[da.type] - order[db.type] || da.name.localeCompare(db.name);
    });
    ov.innerHTML =
      `<div class="inner"><div class="panel-head"><h2>${title || 'Ton grimoire'}</h2><p>${sub || list.length + ' cartes'}</p></div>` +
      `<div class="scroll"><div class="deck-grid"></div></div>` +
      `<div class="actions"><button class="btn gold" id="b-deck-close">Fermer</button></div></div>`;
    const grid = $('.deck-grid', ov);
    list.forEach((card) => {
      const ce = cardEl(card, C.combat && current === 'combat' ? C.combat : null);
      ce.onclick = () => openCardView(card);
      grid.appendChild(ce);
    });
    if (!list.length) grid.innerHTML = '<p class="foot">Vide.</p>';
    ov.classList.add('show');
    $('#b-deck-close').onclick = () => ov.classList.remove('show');
  }

  /** Choisir une carte du paquet. Renvoie une promesse : message, ou null si annulé. */
  UI.pickFromDeck = function (title, filter, apply, verb, cancelable) {
    return new Promise((resolve) => {
      const ov = $('#pick');
      const list = R.run.deck.filter(filter);
      ov.innerHTML =
        `<div class="inner"><div class="panel-head"><h2>${title}</h2><p>${list.length ? 'Touche une carte, puis confirme.' : 'Aucune carte possible.'}</p></div>` +
        `<div class="scroll"><div class="deck-grid"></div></div>` +
        `<div class="actions">${cancelable ? '<button class="btn ghost" id="b-pick-cancel">Annuler</button>' : ''}<button class="btn gold" id="b-pick-ok" ${list.length ? 'disabled' : ''}>${list.length ? 'Confirmer' : 'Continuer'}</button></div></div>`;
      const grid = $('.deck-grid', ov);
      let sel = null;
      const upgrading = verb === 'Améliorée';
      const draw = () => {
        grid.innerHTML = '';
        list.forEach((card) => {
          const shown = upgrading && sel === card ? Object.assign({}, card, { up: true }) : card;
          const ce = cardEl(shown);
          if (sel === card) ce.classList.add('chosen');
          ce.onclick = () => {
            sel = card;
            draw();
            const ok = $('#b-pick-ok');
            ok.disabled = false;
            ok.textContent = `${upgrading ? 'Améliorer' : 'Retirer'} : ${G.CARDS[card.id].name}`;
          };
          grid.appendChild(ce);
        });
      };
      draw();
      ov.classList.add('show');
      $('#b-pick-ok').onclick = () => {
        if (!list.length) {
          ov.classList.remove('show');
          resolve('Rien ne se passe.');
          return;
        }
        if (!sel) return;
        apply(sel);
        ov.classList.remove('show');
        const msg = `${verb} : ${G.CARDS[sel.id].name}.`;
        UI.toast(msg);
        resolve(msg);
      };
      if (cancelable) {
        $('#b-pick-cancel').onclick = () => {
          ov.classList.remove('show');
          resolve(null);
        };
      }
    });
  };
  R.chooseRemove = (cancelable) => UI.pickFromDeck('Effacer une page', () => true, (c) => R.removeCard(c.uid), 'Retirée', cancelable);
  R.chooseUpgrade = (cancelable) => UI.pickFromDeck('Graver une rune', (c) => !c.up && G.CARDS[c.id].type !== 'curse', (c) => R.upgradeCard(c.uid), 'Améliorée', cancelable);

  /** Choisir une carte parmi des propositions (événements). */
  UI.cardReward = function (ids, title) {
    return new Promise((resolve) => {
      const ov = $('#pick');
      ov.innerHTML =
        `<div class="inner"><div class="panel-head"><h2>${title}</h2><p>Touche une carte pour l’ajouter.</p></div>` +
        `<div class="scroll"><div class="card-row"></div></div>` +
        `<div class="actions"><button class="btn ghost" id="b-cr-skip">Ne rien prendre</button></div></div>`;
      const row = $('.card-row', ov);
      ids.forEach((id) => {
        const ce = cardEl(G.newCard(id));
        ce.onclick = () => {
          R.addCard(id);
          ov.classList.remove('show');
          resolve(`${G.CARDS[id].name} rejoint ton grimoire.`);
        };
        row.appendChild(ce);
      });
      ov.classList.add('show');
      $('#b-cr-skip').onclick = () => {
        ov.classList.remove('show');
        resolve('Tu refermes le livre.');
      };
    });
  };
  R.chooseCard = (n) => UI.cardReward(R.cardChoices(n, 0.08), 'Choisis une carte');

  // ------------------------------------------------------------------ fin de partie
  function endRun(won) {
    const run = R.run;
    const s = run.stats;
    if (won) R.meta.wins++;
    R.meta.best = Math.max(R.meta.best || 0, run.act);
    R.saveMeta();
    R.clear();
    const el = $('#end');
    go('end', () => {
      el.innerHTML =
        `<div class="title-rose lit" style="width:min(46vw,200px)"><img alt="" src="${G.Art.rosace(won ? 'win' : 'lose', won ? 'or' : 'nuit', 220)}"></div>` +
        `<h2>${won ? 'La rosace est sauve' : 'Ton vitrail s’est brisé'}</h2>` +
        `<p>${won ? 'Aldric s’effondre en mille éclats de lumière. Dans la nef, le jour revient, couleur de rubis et de saphir.' : `Tu es tombé à l’acte ${ROMAN[run.act]}, ${G.ACT_POOLS[run.act].name.toLowerCase()}. Le grimoire se referme, mais il se souviendra.`}</p>` +
        `<div class="end-stats"><div><b>${run.floor}</b><small>Étages</small></div><div><b>${s.kills}</b><small>Ennemis</small></div><div><b>${s.cards}</b><small>Cartes jouées</small></div></div>` +
        `<div class="menu"><button class="btn gold" id="b-again">Nouvelle ascension</button><button class="btn ghost" id="b-home">Titre</button></div>`;
      $('#b-again').onclick = () => go('heroes', renderHeroes);
      $('#b-home').onclick = () => go('title', renderTitle);
    });
  }

  // ------------------------------------------------------------------ démarrage
  UI.init = function () {
    R.loadMeta();
    setCardWidth();
    window.addEventListener('resize', () => {
      setCardWidth();
      if (current === 'combat') layoutHand();
      if (current === 'map') renderMap();
    });
    $('#backdrop .rose').src = G.Art.rosace('backdrop', 'rubis', 520);
    $('#iris img').src = G.Art.rosace('iris', 'saphir', 360);
    G.FX.init();
    renderTitle();
    show('title');
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && R.run && current === 'map') R.save();
    });
  };

  window.addEventListener('load', UI.init);
})(window.G = window.G || {});
