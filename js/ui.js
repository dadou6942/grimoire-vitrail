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
  const ST_ICON = { force: 'up', faib: 'broken', fel: 'crack', epines: 'thorns', epinesP: 'thorns', rempart: 'tower', martyre: 'heart', veille: 'candle', rituel: 'flame', banniere: 'up', vigilance: 'eye', brulure: 'flame', braise: 'flame', brasier: 'flame', echo: 'eye', soif: 'drop', pacte: 'drop', calice: 'heart' };
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

  // ------------------------------------------------------------------ conseils de première partie
  const TUTO = {
    doors: [{ sel: '#map .doors', text: 'À chaque étage, trois portes. <b>Touche une porte</b> pour voir ce qu’elle cache, puis <b>Franchir</b>. Le chemin, c’est toi qui le choisis.' }],
    combat: [
      { sel: '#combat .intent', text: 'Voici ce que l’ennemi fera à son tour. Ici, l’épée indique une <b>attaque</b> et ses dégâts.' },
      { sel: '#combat .hand', text: '<b>Touche une carte</b> pour la choisir, puis <b>touche-la encore</b> pour la jouer. Tu peux aussi la glisser vers le haut. Un appui long l’affiche en grand.', finger: true },
      { sel: '#combat .ink', text: 'Chaque carte coûte de l’<b>Encre</b> (le chiffre bleu). Tu en as 3 par tour.' },
      { sel: '#combat .p-head', text: 'La partie claire de ta jauge : les PV que tu vas perdre si tu termines ton tour. L’<b>Armure</b> la réduit.' },
      { sel: '#combat .end-turn', text: 'Quand tu as fini, <b>termine ton tour</b>. L’ennemi agit, puis tu pioches 5 nouvelles cartes.' },
    ],
  };
  function tutorial(key) {
    const steps = TUTO[key];
    if (!steps || UI.settings.tuto[key]) return;
    UI.settings.tuto[key] = true;
    saveSettings();
    const coach = $('#coach');
    let i = 0;
    const next = () => {
      if (i >= steps.length) {
        coach.className = '';
        coach.innerHTML = '';
        return;
      }
      const st = steps[i++];
      const target = $(st.sel);
      if (!target) return next();
      const r = target.getBoundingClientRect();
      const pad = 6;
      const below = r.top < window.innerHeight * 0.45;
      coach.className = 'show';
      coach.innerHTML =
        `<div class="coach-ring" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>` +
        `<div class="coach-bubble" style="${below ? `top:${r.bottom + 14}px` : `bottom:${window.innerHeight - r.top + 14}px`}">${st.text}<div class="coach-next">${i < steps.length ? 'Toucher pour continuer' : 'Compris'} · ${i}/${steps.length}</div></div>` +
        (st.finger ? `<div class="coach-finger" style="left:${r.left + r.width / 2}px;top:${r.top + r.height * 0.55}px"></div>` : '');
    };
    coach.onclick = next;
    next();
  }

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
    if (!e.target.closest('[data-tip], #tip')) hideTip();
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
    const ench = card.ench && G.ENCH[card.ench];
    if (ench) el.classList.add('ench', 'ench-' + ench.kind);
    el.innerHTML =
      `<div class="c-art"><img alt="" src="${G.Art.cardArt(card.id)}"><div class="c-light"></div></div>` +
      (cost >= 0 ? `<div class="c-cost">${cost}</div>` : '') +
      (ench ? `<div class="c-ench" title="${ench.desc}">${ench.name}</div>` : '') +
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
    const ench = card.ench && G.ENCH[card.ench];
    ov.insertAdjacentHTML(
      'beforeend',
      (ench ? `<div class="kws ench-desc"><b>${ench.kind === 'bless' ? 'Bénie' : 'Maudite'} : ${ench.name}</b> — ${ench.desc}</div>` : '') +
      `<div class="quote">« ${def.quote || ''} »</div>` +
        (kws.length ? `<div class="kws">${kws.map((k) => `<b>${k}</b> : ${KEYWORDS[k]}`).join('<br>')}</div>` : '') +
        (extra || '') +
        '<div class="foot">Touchez pour fermer</div>'
    );
    ov.classList.add('show');
    // ignore le « clic fantôme » qui suit le toucher ayant ouvert la vue
    const opened = performance.now();
    ov.onclick = () => {
      if (performance.now() - opened > 350) ov.classList.toggle('show', false);
    };
  }

  // ------------------------------------------------------------------ barre du haut
  function relicsHTML() {
    return R.run.relics.map((id) => `<div class="relic" data-tip="relic:${id}" data-relic="${id}"><img alt="${G.RELICS[id].name}" src="${G.Art.relic(id)}"></div>`).join('');
  }
  function potionsHTML() {
    let h = '';
    for (let i = 0; i < 3; i++) {
      const id = R.run.potions[i];
      h += id
        ? `<button class="potion" data-pot="${i}" aria-label="${G.POTIONS[id].name}"><img alt="" src="${G.Art.potion(id)}"></button>`
        : `<div class="potion empty" aria-hidden="true"></div>`;
    }
    return h;
  }
  function topbar(where) {
    const run = R.run;
    return (
      `<div class="topbar">` +
      `<div class="stat hp">${icon('heart')}<span class="v-hp">${run.hp}/${run.maxHp}</span></div>` +
      `<div class="stat gold">${icon('coin')}<span class="v-gold">${run.gold}</span></div>` +
      `<div class="where">${where || ''}</div>` +
      `<button class="icon-btn b-deck" aria-label="Voir le paquet">${icon('deck')}<span class="badge">${run.deck.length}</span></button>` +
      `<button class="icon-btn b-menu" aria-label="Menu">${icon('menu')}</button>` +
      `</div>` +
      `<div class="belt"><div class="relics">${relicsHTML()}</div><div class="potions" data-key="${run.potions.join(',')}">${potionsHTML()}</div></div>`
    );
  }
  function bindTopbar(root) {
    const b = $('.b-deck', root);
    if (b) b.onclick = () => openDeck();
    const m = $('.b-menu', root);
    if (m) m.onclick = () => openMenu();
    bindPotions(root);
  }
  function bindPotions(root) {
    $$('.potion[data-pot]', root).forEach((el) => {
      el.onclick = (e) => {
        e.stopPropagation();
        potionMenu(el, Number(el.dataset.pot), root);
      };
    });
  }
  function refreshTopbar(root) {
    const run = R.run;
    const hp = $('.v-hp', root);
    if (hp) hp.textContent = `${run.hp}/${run.maxHp}`;
    const g = $('.v-gold', root);
    if (g) g.textContent = run.gold;
    const badge = $('.b-deck .badge', root);
    if (badge) badge.textContent = run.deck.length;
    const rel = $('.relics', root);
    if (rel && rel.children.length !== run.relics.length) rel.innerHTML = relicsHTML();
    const pots = $('.potions', root);
    if (pots && pots.dataset.key !== run.potions.join(',')) {
      pots.dataset.key = run.potions.join(',');
      pots.innerHTML = potionsHTML();
      bindPotions(root);
    }
  }

  function potionMenu(el, idx, root) {
    const id = R.run.potions[idx];
    const pot = G.POTIONS[id];
    if (!pot) return;
    const inCombat = current === 'combat' && C.combat && !C.combat.over && !C.busy;
    const canUse = inCombat || pot.anywhere;
    showTip(
      el,
      pot.name,
      `${pot.desc}<div class="tip-actions">` +
        (canUse ? `<button class="btn gold sm" data-act="use">Boire</button>` : `<span class="tip-note">Utilisable en combat.</span>`) +
        `<button class="btn ghost sm" data-act="drop">Jeter</button></div>`
    );
    const tip = $('#tip');
    tip.onclick = (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      hideTip();
      if (act === 'drop') {
        R.removePotion(idx);
        refreshTopbar(root);
        R.save();
        return;
      }
      if (inCombat) {
        C.fxDelay = 0;
        C.combat.usePotion(idx);
        saveCombat('player');
        refreshTopbar(root);
        renderCombat();
        if (C.combat.over) handleOver();
      } else {
        R.removePotion(idx);
        pot.use(null);
        UI.toast(pot.name + ' bue');
        refreshTopbar(root);
        R.save();
      }
    };
  }

  // ---- menu de pause
  function openMenu() {
    const ov = $('#menu');
    ov.innerHTML =
      `<div class="inner menu-inner"><div class="panel-head"><h2>Pause</h2><p>${R.run ? whereText() + ` · étage ${Math.min(R.run.step + 1, R.FLOORS + 1)}` : ''}</p></div>` +
      `<div class="menu">` +
      `<button class="btn gold" id="m-resume">Reprendre</button>` +
      `<button class="btn" id="m-speed">Animations : ${UI.settings.fast ? 'rapides' : 'normales'}</button>` +
      `<button class="btn" id="m-tuto">Revoir les conseils</button>` +
      `<button class="btn" id="m-account">Compte et sauvegarde</button>` +
      `<button class="btn ghost" id="m-title">Sauvegarder et quitter</button>` +
      `<button class="btn ghost" id="m-abandon">Abandonner la partie</button>` +
      `</div></div>`;
    ov.classList.add('show');
    const close = () => ov.classList.toggle('show', false);
    $('#m-resume').onclick = close;
    $('#m-speed').onclick = () => {
      UI.settings.fast = !UI.settings.fast;
      saveSettings();
      openMenu();
    };
    $('#m-account').onclick = () => {
      close();
      openAccount();
    };
    $('#m-tuto').onclick = () => {
      UI.settings.tuto = {};
      saveSettings();
      close();
      UI.toast('Les conseils réapparaîtront.');
    };
    $('#m-title').onclick = () => {
      if (current === 'combat' && C.busy) {
        UI.toast('Impossible de quitter pendant le tour de l’ennemi. Réessaie dans un instant.');
        return;
      }
      close();
      if (current === 'combat') saveCombat('player');
      else R.save();
      go('title', renderTitle);
    };
    let armed = false;
    $('#m-abandon').onclick = (e) => {
      if (!armed) {
        armed = true;
        e.currentTarget.textContent = 'Toucher encore pour abandonner';
        return;
      }
      close();
      R.clear();
      go('title', renderTitle);
    };
  }

  // ---- compte en ligne et transfert de progression
  UI.inGame = () => !['title', 'heroes', 'end', null].includes(current);
  UI.onCloudPulled = () => {
    if (current === 'title') renderTitle();
  };
  function cloudLine() {
    const Cl = G.Cloud;
    if (!Cl || !Cl.enabled()) return '';
    if (!Cl.loggedIn()) return 'Non connecté';
    const st = { syncing: 'synchronisation…', ok: 'synchronisé', offline: 'hors ligne : sera synchronisé plus tard', error: Cl.message || 'erreur', idle: '' }[Cl.status] || '';
    return `Connecté : ${Cl.session.pseudo}${st ? ' · ' + st : ''}`;
  }
  function openAccount(tab) {
    const ov = $('#account');
    const Cl = G.Cloud;
    tab = tab || 'login';
    let cloud = '';
    if (!Cl || !Cl.enabled()) {
      cloud = `<p class="acc-note">Les comptes en ligne ne sont pas encore activés pour ce jeu. En attendant, utilise le code de transfert ci-dessous pour passer d’un appareil à l’autre.</p>`;
    } else if (Cl.loggedIn()) {
      cloud =
        `<p class="acc-status">${cloudLine()}</p><p class="acc-note">${Cl.session.user.email} · ta progression est enregistrée en ligne et te suit sur tous tes appareils.</p>` +
        `<div class="actions"><button class="btn blue sm" id="acc-sync">Synchroniser maintenant</button><button class="btn ghost sm" id="acc-out">Se déconnecter</button></div>`;
    } else {
      const sign = tab === 'signup';
      cloud =
        `<div class="acc-tabs"><button class="${sign ? '' : 'on'}" id="acc-t-login">Se connecter</button><button class="${sign ? 'on' : ''}" id="acc-t-signup">Créer un compte</button></div>` +
        `<form class="acc-form" id="acc-form" novalidate>` +
        (sign ? `<label>Pseudo<input id="acc-pseudo" autocomplete="nickname" maxlength="20" required></label>` : '') +
        `<label>E-mail<input id="acc-email" type="email" autocomplete="email" inputmode="email" required></label>` +
        `<label>Mot de passe<input id="acc-pass" type="password" autocomplete="${sign ? 'new-password' : 'current-password'}" minlength="6" required></label>` +
        `<p class="acc-msg" id="acc-msg"></p>` +
        `<button class="btn gold" type="submit">${sign ? 'Créer mon compte' : 'Me connecter'}</button>` +
        `</form>`;
    }
    ov.innerHTML =
      `<div class="inner"><div class="panel-head"><h2>Compte</h2><p>Garde ta progression, et retrouve-la sur un autre appareil.</p></div>` +
      `<div class="scroll">` +
      `<div class="shop-sec">Compte en ligne</div>${cloud}` +
      `<div class="shop-sec">Transférer ma progression</div>` +
      `<p class="acc-note">Un code contient tes héros éveillés, tes paliers et ta partie en cours. Copie-le ici, colle-le sur l’autre appareil.</p>` +
      `<div class="actions"><button class="btn sm" id="acc-export">Afficher mon code</button><button class="btn sm" id="acc-import">Coller un code</button></div>` +
      `<div id="acc-code"></div>` +
      `</div>` +
      `<div class="actions"><button class="btn gold" id="acc-close">Fermer</button></div></div>`;
    ov.classList.add('show');
    const close = () => {
      ov.classList.toggle('show', false);
      if (current === 'title') renderTitle();
    };
    $('#acc-close').onclick = close;
    if (Cl && Cl.enabled()) {
      Cl.onChange = () => {
        const s = $('#account .acc-status');
        if (s) s.textContent = cloudLine();
        const t = $('#title .acc-line');
        if (t) t.textContent = cloudLine();
      };
      if (Cl.loggedIn()) {
        $('#acc-sync').onclick = () => Cl.sync(true);
        $('#acc-out').onclick = async () => {
          await Cl.signOut();
          openAccount();
        };
      } else {
        $('#acc-t-login').onclick = () => openAccount('login');
        $('#acc-t-signup').onclick = () => openAccount('signup');
        $('#acc-form').onsubmit = async (e) => {
          e.preventDefault();
          const email = $('#acc-email').value.trim();
          const pass = $('#acc-pass').value;
          const msg = $('#acc-msg');
          const pseudoEl = $('#acc-pseudo');
          if (!email || pass.length < 6 || (pseudoEl && !pseudoEl.value.trim())) {
            msg.textContent = pseudoEl ? 'Pseudo, e-mail et mot de passe (6 caractères au moins) sont nécessaires.' : 'E-mail et mot de passe (6 caractères au moins) sont nécessaires.';
            return;
          }
          msg.textContent = 'Un instant…';
          const err = pseudoEl ? await Cl.signUp(email, pass, pseudoEl.value.trim()) : await Cl.signIn(email, pass);
          if (err) {
            msg.textContent = err;
            return;
          }
          UI.toast('Bienvenue, ' + Cl.session.pseudo + ' !');
          openAccount();
        };
      }
    }
    $('#acc-export').onclick = () => {
      const code = R.exportCode();
      $('#acc-code').innerHTML =
        `<textarea id="acc-code-txt" readonly rows="4" aria-label="Ton code de transfert">${code}</textarea>` +
        `<div class="actions"><button class="btn gold sm" id="acc-copy">Copier</button></div>`;
      const ta = $('#acc-code-txt');
      $('#acc-copy').onclick = async () => {
        try {
          await navigator.clipboard.writeText(code);
          UI.toast('Code copié');
        } catch (e) {
          ta.focus();
          ta.select();
          UI.toast('Sélectionné : copie-le avec le menu de ton téléphone');
        }
      };
    };
    $('#acc-import').onclick = () => {
      $('#acc-code').innerHTML =
        `<textarea id="acc-in" rows="4" placeholder="Colle ici le code (il commence par GV2-)" aria-label="Code à importer"></textarea>` +
        `<p class="acc-msg" id="acc-in-msg"></p>` +
        `<div class="actions"><button class="btn gold sm" id="acc-apply">Importer</button></div>`;
      let armed = false;
      $('#acc-apply').onclick = (e) => {
        const code = $('#acc-in').value;
        if (!code.trim()) return;
        if (R.hasSave() && !armed) {
          armed = true;
          e.currentTarget.textContent = 'Remplacer ma partie en cours ?';
          return;
        }
        const err = R.importCode(code);
        if (err) {
          $('#acc-in-msg').textContent = err;
          return;
        }
        R.save && R.run && (R.run = null);
        R.saveMeta();
        UI.toast('Progression importée');
        close();
      };
    };
  }
  UI.openAccount = openAccount;

  UI.settings = { fast: false, tuto: {} };
  function loadSettings() {
    try {
      Object.assign(UI.settings, JSON.parse(localStorage.getItem('grimoire-vitrail.settings') || '{}'));
    } catch (e) {
      /* ignoré */
    }
  }
  function saveSettings() {
    try {
      localStorage.setItem('grimoire-vitrail.settings', JSON.stringify(UI.settings));
    } catch (e) {
      /* ignoré */
    }
  }
  // durées raccourcies en mode rapide
  const T = (ms) => (UI.settings.fast ? Math.round(ms * 0.55) : ms);
  const ROMAN = ['', 'I', 'II', 'III'];
  const whereText = () => `Acte ${ROMAN[R.run.act]} · ${G.ACT_POOLS[R.run.act].name}`;

  // ------------------------------------------------------------------ titre
  // une nouvelle version est installée : on recharge à l'écran titre (jamais en pleine partie)
  UI.onUpdateReady = function () {
    if (current === 'title') location.reload();
    else UI.toast('Mise à jour prête : elle s’appliquera au retour à l’écran titre.');
  };
  function renderTitle() {
    if (window.GRIMOIRE_UPDATE && current && current !== 'title') {
      location.reload();
      return;
    }
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
      `<div class="title-row"><button class="btn sm" id="b-hub">Grimoire${anyPoints() ? ' <i class="dot"></i>' : ''}</button><button class="btn ghost sm" id="b-account">Compte</button></div>` +
      (G.Cloud && G.Cloud.enabled() ? `<div class="foot acc-line">${cloudLine()}</div>` : '') +
      `<div class="foot">${R.meta.wins ? `Victoires : ${R.meta.wins}` : 'La rosace attend ton retour.'}</div>` +
      `<div class="version">Version ${window.GRIMOIRE_VERSION || 'locale'}</div>`;
    if (has) $('#b-continue').onclick = () => continueRun();
    $('#b-account').onclick = () => openAccount();
    $('#b-hub').onclick = () => openHub();
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
  let selPalier = null;
  function renderHeroes() {
    const el = $('#heroes');
    const h = G.HEROES[selHero];
    const open = R.heroUnlocked(selHero);
    const maxP = R.maxPalier(selHero);
    if (selPalier === null || selPalier > maxP) selPalier = maxP;
    const g = R.meta.guardians || 0;
    const lockText = (x) => `Bats ${x.unlock} gardien${x.unlock > 1 ? 's' : ''} (${Math.min(g, x.unlock)}/${x.unlock})`;
    const wins = (R.meta.winsBy && R.meta.winsBy[selHero]) || 0;
    el.innerHTML =
      `<h2>Choisis ton porteur</h2>` +
      `<div class="hero-row">${Object.values(G.HEROES)
        .map((x) => {
          const ok = R.heroUnlocked(x.id);
          return (
            `<button class="hero-pick ${x.id === selHero ? 'sel' : ''} ${ok ? '' : 'locked'}" data-h="${x.id}"><img alt="" src="${G.Art.hero(x.id)}">` +
            `<div class="nm">${x.name.replace(/^L[ea] /, '')}</div>${ok ? '' : `<div class="lock">${lockText(x)}</div>`}</button>`
          );
        })
        .join('')}</div>` +
      `<div class="hero-info"><h3>${h.name}</h3><div class="sub">${h.title}</div><p>${h.desc}</p>` +
      (open
        ? `<div class="facts"><span>${icon('heart')} ${h.hp} PV</span><span>Relique : ${G.RELICS[h.relic].name}</span>${wins ? `<span>Victoires : ${wins}</span>` : ''}</div>` +
          `<div class="palier"><button class="icon-btn" id="p-minus" ${selPalier <= 0 ? 'disabled' : ''} aria-label="Palier inférieur">−</button>` +
          `<div class="p-txt"><b>Palier ${selPalier}</b><span>${R.PALIERS[selPalier]}</span>${maxP === 0 ? '<span class="p-hint">Gagne une partie pour débloquer le palier 1.</span>' : selPalier > 0 ? '<span class="p-hint">Les paliers s’additionnent.</span>' : ''}</div>` +
          `<button class="icon-btn" id="p-plus" ${selPalier >= maxP ? 'disabled' : ''} aria-label="Palier supérieur">+</button></div>` +
          `<div class="hero-extra"><button class="btn sm" id="b-pacts">Pactes : ${selPacts.length ? selPacts.length + ' · +' + Math.round(G.Meta.pactXp(selPacts) * 100) + ' % exp.' : 'aucun'}</button>` +
          `<button class="btn ghost sm" id="b-hero-skills">Niveau ${G.Meta.levelOf(G.Meta.hero(selHero).xp).level}${G.Meta.points(selHero) > 0 ? ' <i class="dot"></i>' : ''}</button></div>`
        : `<div class="facts"><span>${lockText(h)} pour l’éveiller.</span></div>`) +
      `</div>` +
      `<div class="actions"><button class="btn ghost" id="b-back">Retour</button><button class="btn gold" id="b-start" ${open ? '' : 'disabled'}>Commencer</button></div>`;
    $$('.hero-pick', el).forEach((b) => {
      b.onclick = () => {
        selHero = b.dataset.h;
        selPalier = null;
        renderHeroes();
      };
    });
    $$('.facts svg', el).forEach((s) => (s.style.cssText = 'width:16px;height:16px;fill:#c21f31;vertical-align:-2px'));
    if (open) {
      $('#b-pacts').onclick = () => openPacts();
      $('#b-hero-skills').onclick = () => openHub('skills', selHero);
      $('#p-minus').onclick = () => {
        selPalier = Math.max(0, selPalier - 1);
        renderHeroes();
      };
      $('#p-plus').onclick = () => {
        selPalier = Math.min(maxP, selPalier + 1);
        renderHeroes();
      };
    }
    $('#b-back').onclick = () => go('title', renderTitle);
    $('#b-start').onclick = () => {
      if (!R.heroUnlocked(selHero)) return;
      R.newRun(selHero, selPalier, selPacts.filter((id) => G.Meta.pactAvailable(id)));
      go('map', renderMap).then(() => UI.toast('Acte I · ' + G.ACT_POOLS[1].name));
    };
  }

  /** Reprend la partie exactement où on l'avait laissée. */
  function continueRun() {
    if (!R.load()) return;
    const run = R.run;
    const st = run.resume;
    const d = run.pending;
    if (st && st.screen === 'combat' && st.snap) return go('combat', () => startCombat(null, st.type, st.mod, st));
    if (st && st.screen === 'reward') {
      C.type = st.type;
      return go('reward', () => renderReward(st.rw));
    }
    if (st && st.screen === 'shop') {
      stock = st.stock;
      return go('shop', () => renderShop(false));
    }
    if (st && st.screen === 'event') {
      const ev = G.EVENTS.find((x) => x.id === st.id);
      if (ev) return go('event', () => renderEvent(ev, st.result));
    }
    if (st && st.screen === 'altar') return go('altar', renderAltar);
    if (st && st.screen === 'treasure') return go('reward', () => renderTreasure(st.pool));
    // une porte franchie juste avant de quitter : on y retourne
    if (d && !st) {
      if (d.type === 'combat' || d.type === 'elite' || d.type === 'boss') return go('combat', () => startCombat(doorSpec(d), d.type, d.mod));
      if (d.type === 'event') return go('event', () => renderEvent(R.nextEvent()));
      if (d.type === 'merchant') return go('shop', () => renderShop(true));
      if (d.type === 'altar') return go('altar', renderAltar);
      if (d.type === 'treasure') return go('reward', () => renderTreasure());
    }
    go('map', renderMap);
  }

  // ------------------------------------------------------------------ carrefour : choisir sa porte
  const NODE_NAME = { combat: 'Combat', elite: 'Élite', merchant: 'Marchand', altar: 'Autel', event: 'Mystère', boss: 'Gardien', treasure: 'Trésor' };
  function doorInfo(d) {
    const run = R.run;
    if (d.type === 'combat' || d.type === 'elite' || d.type === 'boss') {
      const e = G.ENEMIES[d.enemy];
      const mod = d.mod ? G.MODS[d.mod] : null;
      const reward = d.type === 'boss' ? 'Relique de gardien · carte rare · PV restaurés' : d.type === 'elite' ? 'Relique · beaucoup d’or · carte' : 'Or · carte · peut-être une fiole';
      const others = (d.group || []).slice(1).map((id) => G.ENEMIES[id].name);
      const groupTxt = !d.group ? '' : d.minion === 'escort' ? `Escorté par : ${others.join(', ')}. ` : `Une meute : ${d.group.map((id) => G.ENEMIES[id].name).join(', ')}. Chacun est plus faible, mais ils frappent ensemble. `;
      return {
        kicker: d.type === 'boss' ? 'Gardien de l’acte' : d.type === 'elite' ? (d.group ? 'Élite escortée' : 'Élite') : d.group ? `Meute ×${d.group.length}` : 'Combat',
        group: d.group ? d.group.length : 0,
        title: d.group && d.minion !== 'escort' ? 'Meute' : e.name,
        art: G.Art.enemy(d.enemy),
        portrait: true,
        desc: (mod ? `<b class="mod">${mod.name}</b> ${mod.desc} ` : '') + (groupTxt || `${e.hp[0]} PV.`),
        reward: (mod ? `${reward} · <b>${mod.reward}</b>` : reward) + (d.group ? ' · <b>butin plus riche</b>' : ''),
      };
    }
    const T = {
      event: ['Mystère', 'Une rencontre inattendue : un choix, un risque, une chance.', 'Imprévisible'],
      merchant: ['Le Marchand', `Cartes, reliques et fioles. Ta bourse : ${run.gold} or.`, 'Achats · effacer une carte'],
      altar: ['L’Autel', 'Repose-toi ou grave une rune sur une carte.', R.altarHeal() > 0 ? `Soin de ${R.altarHeal()} PV, amélioration ou bénédiction` : 'Amélioration ou bénédiction (pas de soin)'],
      treasure: ['Le Trésor', 'Un reliquaire oublié, sans gardien.', 'Une relique au choix parmi deux'],
    }[d.type];
    return { kicker: NODE_NAME[d.type], title: T[0], art: G.Art.node(d.type), desc: T[1], reward: T[2] };
  }

  function renderMap() {
    const run = R.run;
    const el = $('#map');
    const boss = run.step >= R.FLOORS;
    // piste de progression
    let track = '';
    for (let i = 0; i <= R.FLOORS; i++) {
      const isBoss = i === R.FLOORS;
      const done = i < run.step;
      const cls = done ? 'done' : i === run.step ? 'now' : '';
      const t = isBoss ? 'boss' : done ? run.history[i] : null;
      track += `<div class="tk ${cls} ${isBoss ? 'boss' : ''}">${t ? `<img alt="" src="${G.Art.node(t)}">` : `<span>${i + 1}</span>`}</div>`;
      if (i < R.FLOORS) track += `<div class="tk-line ${done ? 'done' : ''}"></div>`;
    }
    el.innerHTML =
      topbar(whereText()) +
      `<div class="act-title"><div class="n">Acte ${ROMAN[run.act]} · ${boss ? 'Le gardien' : `Étage ${run.step + 1} sur ${R.FLOORS}`}</div><h2>${G.ACT_POOLS[run.act].name}</h2></div>` +
      `<div class="track">${track}</div>` +
      `<p class="cross-hint">${boss ? 'Le gardien t’attend derrière la dernière porte.' : 'Choisis la porte à franchir.'}</p>` +
      `<div class="doors n${run.doors.length}"></div>` +
      `<div class="door-detail"></div>`;
    bindTopbar(el);
    const wrap = $('.doors', el);
    const detail = $('.door-detail', el);
    let sel = -1;
    const select = (i) => {
      sel = i;
      $$('.door', wrap).forEach((x, j) => {
        x.classList.toggle('sel', j === i);
        x.classList.toggle('dim', i >= 0 && j !== i);
      });
      const info = doorInfo(run.doors[i]);
      detail.innerHTML =
        `<div class="dd-text"><div class="dd-kicker">${info.kicker}</div><div class="dd-title">${info.title}</div><div class="dd-desc">${info.desc}</div><div class="dd-reward">${icon('coin')}${info.reward}</div></div>` +
        `<button class="btn gold" id="b-door">Franchir</button>`;
      detail.classList.add('show');
      $('#b-door').onclick = () => enterDoor(i);
    };
    run.doors.forEach((d, i) => {
      const info = doorInfo(d);
      const b = document.createElement('button');
      b.className = `door lit t-${d.type}${info.portrait ? ' portrait' : ''}`;
      b.style.animationDelay = i * 90 + 'ms';
      b.innerHTML =
        `<div class="door-glass"><img alt="" src="${info.art}"><div class="c-light"></div></div>` +
        (d.mod ? `<div class="door-mod">${G.MODS[d.mod].name}</div>` : '') +
        (info.group ? `<div class="door-count">×${info.group}</div>` : '') +
        `<div class="door-kicker">${info.kicker}</div><div class="door-title">${info.title}</div>`;
      b.onclick = () => (sel === i ? enterDoor(i) : select(i));
      wrap.appendChild(b);
    });
    if (run.doors.length === 1) select(0);
    R.save();
    tutorial('doors');
  }

  let entering = false;
  function enterDoor(i) {
    if (entering) return;
    entering = true;
    setTimeout(() => (entering = false), 1500);
    const d = R.chooseDoor(i);
    if (d.type === 'combat' || d.type === 'elite' || d.type === 'boss') go('combat', () => startCombat(doorSpec(d), d.type, d.mod));
    else if (d.type === 'event') go('event', () => renderEvent(R.nextEvent()));
    else if (d.type === 'merchant') go('shop', () => renderShop(true));
    else if (d.type === 'altar') go('altar', renderAltar);
    else if (d.type === 'treasure') go('reward', renderTreasure);
  }

  function completeNode() {
    if (!R.finishStep()) return; // déjà terminé (double appui pendant la transition)
    go('map', renderMap);
  }

  function renderTreasure(savedPool) {
    const el = $('#reward');
    const pool = savedPool || G.shuffle(R.relicPool(['c', 'u', 'r'])).slice(0, 2);
    R.saveResume({ screen: 'treasure', pool });
    el.innerHTML =
      topbar(whereText()) +
      `<div class="panel-head"><h2>Le Trésor</h2><p>Deux reliques dorment sous la poussière. Tu ne pourras en emporter qu’une.</p></div>` +
      `<div class="scroll"><div class="shop-relics treasure">${pool
        .map((id) => `<button class="shop-relic big" data-id="${id}"><img alt="" src="${G.Art.relic(id)}"><div class="t">${G.RELICS[id].name}</div><div class="d">${G.RELICS[id].desc}</div></button>`)
        .join('')}</div></div>` +
      `<div class="actions"><button class="btn ghost" id="b-skip">Partir les mains vides</button></div>`;
    bindTopbar(el);
    $$('.shop-relic', el).forEach((b) => {
      b.onclick = () => {
        R.gainRelic(b.dataset.id);
        UI.toast(G.RELICS[b.dataset.id].name + ' acquise');
        completeNode();
      };
    });
    if (!pool.length) R.gainGold(60);
    $('#b-skip').onclick = () => completeNode();
  }

  // ------------------------------------------------------------------ combat
  const C = { combat: null, busy: false, type: null };
  UI.C = C;
  // redessine l'écran de combat (utilisé aussi par les tests)
  UI.refresh = () => current === 'combat' && C.combat && renderCombat();

  /** Mémorise le combat en cours. phase : 'player' (à toi de jouer), 'ended' (tour terminé), 'enemy' (l'ennemi a joué). */
  function saveCombat(phase) {
    const c = C.combat;
    if (!c || c.over || !R.run) return;
    R.run.hp = c.p.hp;
    R.saveResume({ screen: 'combat', type: C.type, mod: C.mod, phase, snap: c.snapshot() });
  }

  /** Liste d'ennemis d'une porte (meute, élite escortée) ou identifiant seul. */
  function doorSpec(d) {
    if (!d.group) return d.enemy;
    return d.group.map((id, i) => (d.minion === 'escort' && i === 0 ? { id } : { id, minion: d.minion }));
  }
  UI.doorSpec = doorSpec;

  const foeSel = (uid) => `#combat .foe[data-uid="${uid}"]`;
  function foeHTML(e, i, n, mod) {
    const portrait = G.Art.enemy(e.id);
    return (
      `<div class="foe${e.minion ? ' minion' : ''}${e.def.boss ? ' boss' : ''}" data-uid="${e.uid}">` +
      `<div class="intent" data-tip="intent:"></div>` +
      `<div class="window"><img class="portrait" alt="${e.name}" src="${portrait}" style="animation-delay:-${i * 1.3}s"><div class="w-flash" style="--mask:url(${portrait})"></div><div class="aim-ring"></div></div>` +
      `<div class="e-name">${n > 1 ? e.name.replace(/^(L[ae] |L’)/, '') : e.name}${mod && i === 0 && n === 1 ? ` <span class="e-mod" data-tip="intent:" data-title="${G.MODS[mod].name}" data-text="${G.MODS[mod].desc}">${G.MODS[mod].name}</span>` : ''}</div>` +
      `<div class="bar-wrap e-bar"><div class="block-badge"></div><div class="bar"><div class="lag"></div><div class="fill"></div><div class="preview"></div><div class="txt"></div></div></div>` +
      `<div class="statuses e-st"></div>` +
      `</div>`
    );
  }

  function startCombat(spec, type, mod, resume) {
    C.type = type;
    C.mod = mod || null;
    C.busy = false;
    const el = $('#combat');
    // les éléments de cartes du combat précédent ne doivent pas être réutilisés
    handEls.clear();
    selectedUid = null;
    drag = null;
    if (resume && resume.snap) {
      C.combat = G.Combat.restore(resume.snap, onEvent);
    } else {
      C.combat = new G.Combat(spec, onEvent, mod);
    }
    const c = C.combat;
    const n = c.enemies.length;
    if (G.Meta) c.enemies.forEach((e) => G.Meta.see('e', e.id));
    el.innerHTML =
      topbar(whereText()) +
      `<div class="enemy-zone">` +
      `<div class="move-banner"></div>` +
      (n > 1 && mod ? `<div class="group-mod"><span class="e-mod" data-tip="intent:" data-title="${G.MODS[mod].name}" data-text="${G.MODS[mod].desc}">${G.MODS[mod].name}</span></div>` : '') +
      `<div class="foes n${n}">${c.enemies.map((e, i) => foeHTML(e, i, n, mod)).join('')}</div>` +
      `</div>` +
      `<div class="controls">` +
      `<div class="ink" aria-label="Encre"></div>` +
      `<div class="player-zone">` +
      `<div class="p-head">${icon('heart')}<div class="bar-wrap p-bar"><div class="block-badge"></div><div class="bar"><div class="lag"></div><div class="fill"></div><div class="preview"></div><div class="txt"></div></div></div></div>` +
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
    // toucher un ennemi le prend pour cible
    $$('.foe', el).forEach((f) => {
      f.addEventListener('click', (ev) => {
        if (ev.target.closest('[data-tip]') || C.combat.enemies.length < 2) return;
        C.combat.setTarget(f.dataset.uid);
        renderCombat();
        if (selectedUid) {
          const card = C.combat.hand.find((k) => k.uid === selectedUid);
          if (card) showPlayPreview(card);
        }
      });
    });
    // ennemis déjà tombés (reprise d'un combat)
    c.killed.forEach((e) => {
      const f = $(foeSel(e.uid));
      if (f) f.classList.add('dead');
    });
    if (resume && resume.snap) {
      if (resume.phase === 'ended') c.enemyTurn();
      if ((resume.phase === 'ended' || resume.phase === 'enemy') && !c.over) c.startTurn();
      renderCombat(true);
      setTimeout(layoutHand, 620);
      setTimeout(() => UI.toast('Combat repris là où tu l’avais laissé'), 700);
      if (c.over) setTimeout(handleOver, 800);
      else saveCombat('player');
      return;
    }
    c.start();
    renderCombat(true);
    saveCombat('player');
    setTimeout(layoutHand, 620);
    const boss = c.enemies.find((e) => e.def.boss);
    if (boss) setTimeout(() => banner(boss.name), 600);
    else if (n > 1) setTimeout(() => banner(c.enemies.some((e) => e.def.elite) ? 'Une élite et son escorte' : 'Une meute'), 500);
    setTimeout(() => tutorial(n > 1 ? 'groups' : 'combat'), 900);
  }

  /** Aperçu de dégâts sur une barre : `amount` PV en surbrillance au bout de la jauge. */
  function barPreview(wrap, hp, max, block, amount) {
    const pv = wrap && $('.preview', wrap);
    if (!pv) return;
    const lost = Math.max(0, Math.min(hp, amount - block));
    if (lost <= 0) {
      pv.style.width = '0';
      return;
    }
    pv.style.left = ((hp - lost) / max) * 100 + '%';
    pv.style.width = (lost / max) * 100 + '%';
  }

  function setCardWidth() {
    const w = Math.min(window.innerWidth, 520);
    const cw = Math.max(92, Math.min(120, Math.floor(w * 0.29)));
    document.documentElement.style.setProperty('--cw', cw + 'px');
  }

  function barUpdate(wrap, hp, max, block) {
    if (!wrap) return;
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

  function intentHTML(info) {
    const kinds = info.kinds;
    let html = '';
    if (kinds.includes('hidden')) html += icon('eye', 'i-curse') + '<span>?</span>';
    if (kinds.includes('atk')) html += icon('sword', 'i-atk') + `<span>${info.dmg}${info.hits > 1 ? '×' + info.hits : ''}</span>`;
    if (kinds.includes('def')) html += icon('shield', 'i-def');
    if (kinds.includes('buff')) html += icon('up', 'i-buff');
    if (kinds.includes('debuff')) html += icon('crack', 'i-debuff');
    if (kinds.includes('curse')) html += icon('eye', 'i-curse');
    return html + `<span class="nm">${info.name}</span>`;
  }

  function renderCombat(fresh) {
    const c = C.combat;
    const el = $('#combat');
    R.run.hp = c.p.hp;
    refreshTopbar(el);
    const multi = c.enemies.length > 1;
    const target = c.e;
    for (const e of c.enemies) {
      const f = $(foeSel(e.uid));
      if (!f) continue;
      f.classList.toggle('target', multi && e === target && e.hp > 0 && !c.over);
      const it = $('.intent', f);
      const info = c.intentInfo(e);
      if (info && !c.over) {
        it.innerHTML = intentHTML(info);
        it.className = 'intent' + (info.kinds.includes('atk') ? ' atk' : '');
        it.style.visibility = '';
        it.dataset.title = info.name;
        it.dataset.text = info.kinds.includes('hidden') ? 'La brume cache ce que prépare l’ennemi.' : intentText(e.intent, info);
      } else it.style.visibility = 'hidden';
      barUpdate($('.e-bar', f), e.hp, e.maxHp, e.block);
      barPreview($('.e-bar', f), e.hp, e.maxHp, e.block, 0);
      $('.e-st', f).innerHTML = statusHTML(e.st);
    }
    barUpdate($('.p-bar', el), c.p.hp, c.p.maxHp, c.p.block);
    // dégâts que tu vas subir si tu finis ton tour maintenant
    barPreview($('.p-bar', el), c.p.hp, c.p.maxHp, 0, c.over ? 0 : c.incoming());
    $('.p-bar', el).dataset.incoming = c.over ? 0 : c.incoming();
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
    if (selectedUid && !keep.has(selectedUid)) selectedUid = null;
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
      el.style.transform = card.uid === selectedUid ? el.dataset.base + ' translateY(-34px) scale(1.12)' : el.dataset.base;
      if (card.uid === selectedUid) {
        el.style.zIndex = 60;
        return;
      }
      el.style.zIndex = 10 + i;
    });
  }

  // ---- gestes sur les cartes
  // toucher = sélectionner (aperçu), toucher à nouveau = jouer, glisser vers le haut = jouer,
  // appui long = lire en grand. Le suivi du doigt se fait sur la fenêtre, sans capture de
  // pointeur (la capture peut rester bloquée sur iOS, surtout dans une page intégrée).
  let drag = null;
  let selectedUid = null;
  const LONG_PRESS = 450;

  function bindDrag(el, card) {
    el.addEventListener('pointerdown', (e) => {
      if (C.busy || C.combat.over) return;
      if (drag) cancelDrag();
      e.preventDefault();
      drag = { el, card, id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: performance.now(), moved: false, ready: false, long: false };
      drag.timer = setTimeout(() => {
        if (drag && drag.el === el && !drag.moved) {
          drag.long = true;
          const c = card;
          cancelDrag();
          openCardView(c);
        }
      }, LONG_PRESS);
      el.classList.add('dragging');
      el.style.transform = el.dataset.base + ' translateY(-30px) scale(1.12)';
      el.style.zIndex = 60;
      showPlayPreview(card);
    });
  }

  function onDragMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { el, card } = drag;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (Math.hypot(dx, dy) > 10) drag.moved = true;
    if (!drag.moved) return;
    const playable = C.combat.canPlay(card);
    // visée : la carte glissée au-dessus d'un ennemi le prend pour cible
    const aim = playable ? foeAt(e.clientX, e.clientY) : null;
    if (aim !== drag.aim) {
      drag.aim = aim;
      $$('#combat .foe').forEach((f) => f.classList.toggle('aim', f.dataset.uid === aim));
      if (aim && C.combat.enemies.length > 1) {
        C.combat.setTarget(aim);
        showPlayPreview(card);
      }
    }
    drag.ready = playable && (!!aim || dy < -Math.min(100, window.innerHeight * 0.11));
    el.classList.toggle('ready', drag.ready);
    const hint = $('#combat .drop-hint');
    const aimed = aim && C.combat.enemies.length > 1 ? C.combat.enemies.find((x) => x.uid === aim) : null;
    hint.textContent = aimed ? 'Relâche pour viser : ' + aimed.name : 'Relâche pour jouer';
    hint.classList.toggle('show', playable);
    el.style.transform = `translateX(calc(-50% + ${dx + parseBaseX(el)}px)) translateY(${dy - 30}px) rotate(${dx * 0.04}deg) scale(1.12)`;
  }
  /** Ennemi vivant sous le point (x, y), avec une marge généreuse pour le doigt. */
  function foeAt(x, y) {
    const c = C.combat;
    if (!c) return null;
    for (const f of $$('#combat .foe')) {
      const en = c.enemies.find((q) => q.uid === f.dataset.uid);
      if (!en || en.hp <= 0) continue;
      const r = $('.window', f).getBoundingClientRect();
      if (x >= r.left - 14 && x <= r.right + 14 && y >= r.top - 30 && y <= r.bottom + 40) return f.dataset.uid;
    }
    return null;
  }

  function onDragEnd(e) {
    if (!drag || (e && e.pointerId !== undefined && e.pointerId !== drag.id)) return;
    const d = drag;
    clearTimeout(d.timer);
    drag = null;
    d.el.classList.toggle('dragging', false);
    d.el.classList.toggle('ready', false);
    $$('#combat .foe.aim').forEach((f) => f.classList.toggle('aim', false));
    const hint = $('#combat .drop-hint');
    if (hint) hint.classList.toggle('show', false);
    if (d.aim) C.combat.setTarget(d.aim);
    if (d.long || (e && e.type === 'pointercancel')) {
      deselect();
      return;
    }
    if (!d.moved) {
      // simple toucher
      if (selectedUid === d.card.uid) return tryPlay(d.card, d.el);
      return select(d.card, d.el);
    }
    if (d.ready) {
      selectedUid = null;
      return playCard(d.card, d.el);
    }
    if (e && e.clientY - d.y0 < -60 && !C.combat.canPlay(d.card)) noInk(d.card);
    deselect();
  }

  function cancelDrag() {
    if (!drag) return;
    clearTimeout(drag.timer);
    drag.el.classList.toggle('dragging', false);
    drag.el.classList.toggle('ready', false);
    drag = null;
    const hint = $('#combat .drop-hint');
    if (hint) hint.classList.toggle('show', false);
    deselect();
  }

  function select(card, el) {
    selectedUid = card.uid;
    handEls.forEach((x) => x.classList.toggle('selected', x === el));
    el.style.transform = el.dataset.base + ' translateY(-34px) scale(1.12)';
    el.style.zIndex = 60;
    showPlayPreview(card);
    const hint = $('#combat .drop-hint');
    if (hint) {
      hint.textContent = C.combat.canPlay(card) ? 'Touche encore pour jouer' : G.cardCost(card) < 0 ? 'Carte injouable' : 'Pas assez d’Encre';
      hint.classList.add('show');
    }
    tutorial('select');
  }

  function deselect() {
    selectedUid = null;
    handEls.forEach((x) => x.classList.toggle('selected', false));
    const hint = $('#combat .drop-hint');
    if (hint) {
      hint.classList.toggle('show', false);
      hint.textContent = 'Relâche pour jouer';
    }
    clearPlayPreview();
    layoutHand();
  }

  function tryPlay(card, el) {
    if (!C.combat.canPlay(card)) {
      noInk(card);
      return deselect();
    }
    selectedUid = null;
    const hint = $('#combat .drop-hint');
    if (hint) hint.classList.toggle('show', false);
    playCard(card, el);
  }

  function noInk(card) {
    UI.toast(G.cardCost(card) < 0 ? 'Cette carte est injouable.' : 'Pas assez d’Encre.');
    const ink = $('#combat .ink');
    if (ink) {
      ink.classList.toggle('flash', false);
      void ink.offsetWidth;
      ink.classList.add('flash');
    }
  }

  window.addEventListener('pointermove', onDragMove, { passive: true });
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);
  window.addEventListener('blur', cancelDrag);
  document.addEventListener('visibilitychange', cancelDrag);
  // toucher hors de la main : annule la sélection ; un autre doigt annule un geste resté coincé
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (drag && e.pointerId !== drag.id) cancelDrag();
      if (selectedUid && current === 'combat' && !e.target.closest('.hand .card') && !e.target.closest('.potion, #tip')) deselect();
    },
    true
  );
  // aperçu de l'effet d'une carte sur les jauges pendant qu'on la tient
  function showPlayPreview(card) {
    const c = C.combat;
    if (!c.canPlay(card)) return;
    const sim = c.simulate(card);
    const el = $('#combat');
    // chaque ennemi : PV qu'il va perdre, et coup fatal
    for (const after of sim.enemies) {
      const e = c.enemies.find((x) => x.uid === after.uid);
      const f = $(foeSel(after.uid));
      if (!e || !f || e.hp <= 0) continue;
      const eb = $('.e-bar', f);
      barPreview(eb, e.hp, e.maxHp, 0, e.hp - after.hp);
      eb.classList.toggle('previewing', e.hp + e.block > after.hp + after.block);
      eb.classList.toggle('lethal', after.hp <= 0);
    }
    // armure gagnée : la menace annoncée diminue
    const pb = $('.p-bar', el);
    barPreview(pb, c.p.hp, c.p.maxHp, sim.pBlock, c.hidden ? 0 : c.incomingRaw());
    if (sim.pBlock > c.p.block) {
      pb.classList.add('blk', 'gain');
      $('.block-badge', pb).textContent = sim.pBlock;
    }
  }
  function clearPlayPreview() {
    const el = $('#combat');
    if (!el || !C.combat) return;
    $$('.e-bar', el).forEach((eb) => {
      eb.classList.toggle('previewing', false);
      eb.classList.toggle('lethal', false);
    });
    $('.p-bar', el).classList.toggle('gain', false);
    renderCombat();
  }

  function parseBaseX(el) {
    const m = /calc\(-50% \+ (-?[\d.]+)px\)/.exec(el.dataset.base || '');
    return m ? parseFloat(m[1]) : 0;
  }

  async function playCard(card, el) {
    const c = C.combat;
    C.busy = true;
    const def = G.CARDS[card.id];
    const win = ($(foeSel(c.e.uid) + ' .window') || $('#combat .window')).getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const tx = win.left + win.width / 2 - (r.left + r.width / 2);
    const ty = win.top + win.height * 0.55 - (r.top + r.height / 2);
    // la carte s'envole vers sa cible et se dissout en lumière (animation légère : transform + opacité)
    const toEnemy = def.type === 'atk';
    el.classList.add('fly', 'played');
    const cur = el.style.transform;
    el.style.transform = toEnemy
      ? `${cur} translate(${tx * 0.8}px, ${ty * 0.8}px) scale(0.55) rotate(8deg)`
      : `${cur} translate(${tx * 0.25}px, ${ty * 0.35}px) scale(0.9)`;
    el.style.opacity = '0';
    handEls.delete(card.uid);
    await wait(T(170));
    const r2 = el.getBoundingClientRect();
    el.remove();
    C.fxDelay = 0;
    c.play(card);
    const col = def.type === 'atk' ? '255,214,170' : def.type === 'skl' ? '170,205,255' : '245,220,150';
    G.FX.burst(r2.left + r2.width / 2, r2.top + r2.height / 2, col, def.type === 'pow' ? 26 : 12);
    renderCombat();
    if (c.over) return handleOver();
    C.busy = false;
    renderCombat();
    saveCombat('player');
    tutorial('played');
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
    saveCombat('ended');
    await wait(T(240));
    handEls.forEach((el) => el.remove());
    handEls.clear();
    renderCombat();
    if (c.over) return handleOver();
    await wait(T(150));
    // les ennemis qui attaquent prennent leur élan
    let hits = 0;
    for (const en of c.alive()) {
      if (!en.intent || !en.intent.dmg) continue;
      hits += en.intent.hits || 1;
      const w = $(foeSel(en.uid) + ' .window');
      if (w) {
        w.classList.toggle('lunge', false);
        void w.offsetWidth;
        w.classList.add('lunge');
      }
    }
    if (hits) await wait(T(180));
    C.fxDelay = 0;
    c.enemyTurn();
    saveCombat('enemy');
    renderCombat();
    await wait(T(380 + hits * 130 + (c.enemies.length - 1) * 120));
    if (c.over) return handleOver();
    C.fxDelay = 0;
    c.startTurn();
    saveCombat('player');
    C.busy = false;
    renderCombat(true);
  }

  async function handleOver() {
    const c = C.combat;
    C.busy = true;
    renderCombat();
    if (c.won) {
      await wait(T(200));
      // les vitraux encore debout se brisent (normalement déjà fait à chaque mort)
      c.enemies.forEach((en) => shatterFoe(en.uid));
      await wait(T(1000));
      onCombatWon();
    } else {
      document.body.classList.add('shake');
      await wait(1400);
      document.body.classList.remove('shake');
      const killer = c.alive()[0];
      endRun(false, killer ? killer.id : null);
    }
  }

  /** Le vitrail d'un ennemi tombé se brise : le seul vrai bris de verre du jeu. */
  function shatterFoe(uid) {
    const f = $(foeSel(uid));
    if (!f || f.dataset.shattered) return;
    f.dataset.shattered = '1';
    const win = $('.window', f);
    const img = $('img.portrait', win);
    const rect = win.getBoundingClientRect();
    if (rect.width) G.FX.shatter(img, { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, { power: 1.1, count: C.combat.enemies.length > 1 ? 7 : 9 });
    f.classList.add('dead');
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
    // position de l'ennemi concerné (ou de la cible)
    const euid = ev.uid || (C.combat && C.combat.e.uid);
    const pe = center(foeSel(euid) + ' .window');
    const pp = center('#combat .p-bar');
    switch (ev.t) {
      case 'enemyDeath':
        setTimeout(() => shatterFoe(ev.uid), Math.max(0, delay) + 120);
        break;
      case 'hit': {
        const at = ev.who === 'e' ? { x: pe.x, y: pe.y - 10 } : pp;
        if (ev.dmg > 0) floatText(ev.dmg, at.x, at.y, (ev.dmg >= 15 ? 'big ' : '') + (ev.kind === 'burn' ? 'burn' : ''), delay);
        else if (ev.blocked > 0) floatText('Bloqué', at.x, at.y, 'blocked', delay);
        setTimeout(() => {
          if (ev.who === 'e') {
            const w = $(foeSel(euid) + ' .window');
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
      case 'pay':
        floatText(`−${ev.n} PV`, pp.x, pp.y - 10, 'label bad', delay);
        break;
      case 'echo':
        banner('Écho !');
        break;
      case 'steal':
        floatText(`−${ev.n} or`, pp.x, pp.y - 20, 'label bad', delay);
        setTimeout(() => UI.toast(`Il t’a volé ${ev.n} or. Abats-le pour le récupérer !`), 300);
        refreshTopbar($('#combat'));
        break;
      case 'potion': {
        const pot = G.POTIONS[ev.id];
        floatText(pot.name, pp.x, pp.y - 30, 'label', 0);
        G.FX.burst(pp.x, pp.y, '200,230,255', 18);
        break;
      }
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
    run.stats.kills += c.enemies.length;
    for (const fx of R.effects()) if (fx.combatEnd) fx.combatEnd(run);
    const type = C.type;
    // statistiques et succès du combat
    if (G.Meta) G.Meta.recordCombat(c, type);
    const group = c.enemies.length > 1;
    const mod = C.mod ? G.MODS[C.mod] : null;
    const reward = { gold: 0, relic: null, bossRelics: null, cards: null, potion: null, stolen: c.stolen };
    if (c.stolen) run.gold += c.stolen;
    const gm = mod && mod.gold ? mod.gold : 1;
    if (type === 'combat') reward.gold = R.gainGold(Math.round((14 + Math.floor(Math.random() * 8)) * gm * (group ? 1.3 : 1)));
    if (type === 'elite') {
      run.stats.elites++;
      reward.gold = R.gainGold(30 + Math.floor(Math.random() * 8) + (group ? 15 : 0));
      reward.relic = R.gainRandomRelicSilent();
    }
    if (type === 'boss') {
      run.stats.bosses++;
      const woke = R.recordGuardian();
      if (woke.length) {
        run.unlocks = (run.unlocks || []).concat(woke);
        setTimeout(() => UI.toast(`${G.HEROES[woke[0]].name} s’éveille : un nouveau porteur t’attend !`), 1600);
      }
      reward.gold = R.gainGold(70);
      reward.bossRelics = G.shuffle(R.relicPool(['boss'])).slice(0, 3);
    }
    // fioles : souvent après un combat, toujours dans la brume
    const potChance = type === 'boss' ? 0 : mod && mod.potion ? 1 : type === 'elite' ? 0.6 : 0.4;
    if (Math.random() < potChance) {
      const id = G.pick(Object.keys(G.POTIONS));
      if (R.addPotion(id)) reward.potion = id;
    }
    const n = R.rewardCount();
    const boost = (type === 'elite' ? 0.12 : 0) + (mod && mod.rare ? mod.rare : 0) + (group ? 0.05 : 0);
    reward.cards = type === 'boss' ? R.cardChoices(n, 0, 'r') : R.cardChoices(n, boost);
    // parfois une carte proposée est déjà améliorée
    reward.upgraded = reward.cards.map(() => Math.random() < (type === 'elite' ? 0.35 : 0.15));
    if (G.Meta) {
      G.Meta.seeAll('c', reward.cards);
      if (reward.bossRelics) G.Meta.seeAll('r', reward.bossRelics);
      G.Meta.flush();
      G.Meta.check({ k: 'tick' });
    }
    R.save();
    R.saveResume({ screen: 'reward', rw: reward, type });
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
      (rw.stolen ? `<div class="loot"><div class="loot-ico">↩</div><div><div class="t">${rw.stolen} or récupérés</div><div class="d">Le voleur rend ce qu’il t’a pris.</div></div></div>` : '') +
      (rw.relic ? `<div class="loot"><img alt="" src="${G.Art.relic(rw.relic)}"><div><div class="t">${G.RELICS[rw.relic].name}</div><div class="d">${G.RELICS[rw.relic].desc}</div></div></div>` : '') +
      (rw.potion ? `<div class="loot"><img alt="" src="${G.Art.potion(rw.potion)}"><div><div class="t">${G.POTIONS[rw.potion].name}</div><div class="d">${G.POTIONS[rw.potion].desc} Touche-la dans ta ceinture pour la boire.</div></div></div>` : '') +
      (rw.bossRelics && rw.bossRelics.length
        ? `<div class="shop-sec">Choisis une relique de gardien</div><div class="shop-relics">${rw.bossRelics
            .map((id) => `<button class="shop-relic b-boss" data-id="${id}"><img alt="" src="${G.Art.relic(id)}"><div class="t">${G.RELICS[id].name}</div><div class="d">${G.RELICS[id].desc}</div></button>`)
            .join('')}</div><div class="actions"><button class="btn ghost sm" id="b-noboss">N’en prendre aucune</button></div>`
        : '') +
      `<div class="shop-sec">Ajoute une carte à ton grimoire</div>` +
      `<div class="card-row"></div>` +
      `</div>` +
      `<div class="actions"><button class="btn ghost" id="b-skip">Ne rien prendre</button><button class="btn gold" id="b-take" disabled>Prendre</button></div>`;
    bindTopbar(el);
    const row = $('.card-row', el);
    let chosen = null;
    let chosenUp = false;
    rw.cards.forEach((id, i) => {
      const up = !!(rw.upgraded && rw.upgraded[i]);
      const card = G.newCard(id, up);
      const ce = cardEl(card);
      ce.onclick = () => {
        if (chosen === id) {
          openCardView(card);
          return;
        }
        chosen = id;
        chosenUp = up;
        $$('.card', row).forEach((x) => x.classList.toggle('chosen', x === ce));
        const b = $('#b-take');
        b.disabled = false;
        b.textContent = 'Prendre ' + G.CARDS[id].name + (up ? '+' : '');
      };
      row.appendChild(ce);
    });
    // relique de gardien : facultative, et on peut changer d'avis jusqu'au départ
    const hasBoss = rw.bossRelics && rw.bossRelics.length;
    const markBoss = () => {
      $$('.b-boss', el).forEach((x) => {
        const on = x.dataset.id === rw.bossChoice;
        x.style.opacity = rw.bossChoice === undefined || on ? '1' : '0.35';
        x.style.boxShadow = on ? '0 0 0 2px #f5dc96, 0 0 24px rgba(245,220,150,.6)' : '';
      });
      const none = $('#b-noboss');
      if (none) none.classList.toggle('chosen', rw.bossChoice === null);
    };
    $$('.b-boss', el).forEach((b) => {
      b.onclick = () => {
        rw.bossChoice = b.dataset.id;
        markBoss();
        R.saveResume({ screen: 'reward', rw, type: C.type });
      };
    });
    const noBoss = $('#b-noboss');
    if (noBoss) {
      noBoss.onclick = () => {
        rw.bossChoice = null;
        markBoss();
        R.saveResume({ screen: 'reward', rw, type: C.type });
      };
    }
    markBoss();
    let left = false;
    const leave = () => {
      if (left) return;
      if (hasBoss && rw.bossChoice === undefined) {
        UI.toast('Choisis une relique de gardien, ou « N’en prendre aucune ».');
        return;
      }
      left = true;
      if (hasBoss && rw.bossChoice) R.gainRelic(rw.bossChoice);
      if (C.type === 'boss') nextAct();
      else completeNode();
    };
    $('#b-skip').onclick = leave;
    $('#b-take').onclick = () => {
      if (!chosen || left) return;
      if (hasBoss && rw.bossChoice === undefined) {
        UI.toast('Choisis une relique de gardien, ou « N’en prendre aucune ».');
        return;
      }
      R.addCard(chosen, chosenUp);
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
    R.startNextAct();
    go('map', renderMap).then(() => UI.toast(`Acte ${ROMAN[run.act]} · ${G.ACT_POOLS[run.act].name} — PV restaurés`));
  }

  // ------------------------------------------------------------------ autel
  function renderAltar() {
    const run = R.run;
    R.saveResume({ screen: 'altar' });
    const el = $('#altar');
    const noHeal = R.altarHeal() <= 0;
    const heal = R.altarHeal();
    el.innerHTML =
      topbar(whereText()) +
      `<div class="panel-head"><h2>L’Autel</h2><p>Les cierges brûlent sans fondre. Une seule grâce t’est accordée.</p></div>` +
      `<div class="event-art lit"><img alt="" src="${G.Art.event({ id: 'altar', art: 'candle', pal: 'ambre' })}"><div class="c-light" style="position:absolute;inset:0;background:radial-gradient(circle at var(--gx,50%) var(--gy,30%),rgba(255,240,200,.5),transparent 55%);mix-blend-mode:overlay"></div></div>` +
      `<div class="altar-opts">` +
      `<button class="choice" id="b-rest" ${noHeal ? 'disabled' : ''}><span class="t">Se recueillir</span><span class="d">${noHeal ? 'Ici, nul repos ne t’est accordé.' : `Soigne ${heal} PV.`}</span></button>` +
      `<button class="choice" id="b-forge"><span class="t">Graver une rune</span><span class="d">Améliore une carte de ton grimoire.</span></button>` +
      `<button class="choice" id="b-bless"><span class="t">Bénir une carte</span><span class="d">Choisis une bénédiction : Économe, Vive, Tenace, Ardente ou Sainte.</span></button>` +
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
    $('#b-bless').onclick = async () => {
      const done = await UI.pickEnchant('bless', true);
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
    const potions = G.shuffle(Object.keys(G.POTIONS)).slice(0, 3).map((id) => ({ id, price: price(id === 'larme' ? 60 : 45), sold: false }));
    return { cards, relics, potions, remove: Math.round(R.run.removeCost * disc), removed: false, bless: Math.round(90 * disc), blessed: false };
  }
  function renderShop(fresh) {
    if (fresh || !stock) {
      stock = makeStock();
      if (G.Meta) {
        G.Meta.seeAll('c', stock.cards.map((x) => x.id));
        G.Meta.seeAll('r', stock.relics.map((x) => x.id));
        G.Meta.seeAll('p', stock.potions.map((x) => x.id));
        G.Meta.flush();
      }
    }
    if (G.Meta) G.Meta.check({ k: 'tick' });
    // chaque passage (et chaque achat, qui redessine l'écran) mémorise l'étal
    R.saveResume({ screen: 'shop', stock });
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
      `<div class="shop-sec">Fioles</div><div class="shop-relics">${stock.potions
        .map((x, i) => `<button class="shop-relic shop-pot" data-p="${i}" style="${x.sold ? 'visibility:hidden' : ''}"><img alt="" src="${G.Art.potion(x.id)}"><div class="t">${G.POTIONS[x.id].name}</div><div class="d">${G.POTIONS[x.id].desc}</div>${pr(x.price)}</button>`)
        .join('')}</div>` +
      `<div class="shop-sec">Service</div><div class="choice-list"><button class="choice" id="b-remove" ${stock.removed || run.gold < stock.remove ? 'disabled' : ''}><span class="t">Effacer une page — ${stock.remove} or</span><span class="d">${stock.removed ? 'Déjà fait aujourd’hui.' : 'Retire une carte de ton grimoire.'}</span></button>` +
      `<button class="choice" id="b-shop-bless" ${stock.blessed || run.gold < (stock.bless || 90) ? 'disabled' : ''}><span class="t">Bénir une carte — ${stock.bless || 90} or</span><span class="d">${stock.blessed ? 'Déjà fait aujourd’hui.' : 'Une bénédiction au choix sur une carte de ton grimoire.'}</span></button></div>` +
      `</div>` +
      `<div class="actions"><button class="btn gold" id="b-leave">Partir</button></div>`;
    bindTopbar(el);
    $$('.shop-pot', el).forEach((b) => {
      b.onclick = () => {
        const x = stock.potions[Number(b.dataset.p)];
        if (x.sold) return;
        if (run.gold < x.price) return UI.toast('Pas assez d’or');
        if (run.potions.length >= 3) return UI.toast('Ta ceinture est pleine (3 fioles).');
        if (!b.dataset.armed) {
          b.dataset.armed = '1';
          b.style.boxShadow = '0 0 0 2px #f5dc96';
          return UI.toast('Touche encore pour acheter');
        }
        run.gold -= x.price;
        x.sold = true;
        R.addPotion(x.id);
        UI.toast(G.POTIONS[x.id].name + ' achetée');
        renderShop(false);
      };
    });
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
    $('#b-shop-bless').onclick = async () => {
      const price = stock.bless || 90;
      if (stock.blessed || run.gold < price) return;
      const done = await UI.pickEnchant('bless', true);
      if (done) {
        run.gold -= price;
        stock.blessed = true;
        renderShop(false);
      }
    };
    $('#b-leave').onclick = () => completeNode();
  }

  // ------------------------------------------------------------------ événement
  function renderEvent(ev, savedResult) {
    const el = $('#event');
    R.saveResume({ screen: 'event', id: ev.id, result: savedResult });
    el.innerHTML =
      topbar(whereText()) +
      `<div class="panel-head"><h2>${ev.title}</h2></div>` +
      `<div class="scroll">` +
      `<div class="event-art"><img alt="" src="${G.Art.event(ev)}"></div>` +
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
        showResult(typeof res === 'string' ? res : 'C’est fait.');
      };
    });
    const showResult = (text) => {
      R.saveResume({ screen: 'event', id: ev.id, result: text });
      refreshTopbar(el);
      const list = $('.choice-list', el);
      list.innerHTML = `<p class="event-text result">${text}</p><div class="actions"><button class="btn gold" id="b-ev-ok">Continuer</button></div>`;
      $('#b-ev-ok').onclick = () => completeNode();
    };
    if (savedResult) showResult(savedResult);
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
    if (G.Meta) {
      G.Meta.seeAll('c', ids);
      G.Meta.flush();
    }
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

  /**
   * Transformer une carte : on choisit la carte, puis une transformation parmi celles proposées.
   * kind : 'bless' (bénédiction) ou 'curse' (malédiction). Renvoie un message, ou null si annulé.
   */
  UI.pickEnchant = function (kind, cancelable) {
    return new Promise((resolve) => {
      const ov = $('#pick');
      const list = R.run.deck.filter((c) => G.enchOptions(c, kind).length);
      const bless = kind === 'bless';
      ov.innerHTML =
        `<div class="inner"><div class="panel-head"><h2>${bless ? 'Bénir une carte' : 'Maudire une carte'}</h2>` +
        `<p>${list.length ? (bless ? 'Touche la carte à bénir.' : 'Une carte maudite devient plus puissante, mais elle a un prix.') : 'Aucune carte ne peut être transformée.'}</p></div>` +
        `<div class="scroll"><div class="deck-grid"></div><div class="ench-opts"></div></div>` +
        `<div class="actions">${cancelable || !list.length ? `<button class="btn ghost" id="b-ench-cancel">${list.length ? 'Annuler' : 'Continuer'}</button>` : ''}</div></div>`;
      const grid = $('.deck-grid', ov);
      const opts = $('.ench-opts', ov);
      let sel = null;
      // propositions fixées pour chaque carte (pas de « relance » en changeant d'avis)
      const offers = {};
      const draw = () => {
        grid.innerHTML = '';
        list.forEach((card) => {
          const ce = cardEl(card);
          if (sel === card) ce.classList.add('chosen');
          ce.onclick = () => {
            sel = card;
            draw();
            const all = G.shuffle(G.enchOptions(card, kind));
            offers[card.uid] = offers[card.uid] || all.slice(0, bless ? 3 : 2);
            opts.innerHTML =
              `<div class="shop-sec">${G.CARDS[card.id].name} : choisis sa transformation</div>` +
              `<div class="choice-list">${offers[card.uid]
                .map((k) => `<button class="choice" data-e="${k}"><span class="t">${G.ENCH[k].name}</span><span class="d">${G.ENCH[k].desc}</span></button>`)
                .join('')}</div>`;
            $$('.choice', opts).forEach((b) => {
              b.onclick = () => {
                R.enchant(card.uid, b.dataset.e);
                ov.classList.toggle('show', false);
                const msg = `${G.CARDS[card.id].name} est désormais ${bless ? 'bénie' : 'maudite'} : ${G.ENCH[b.dataset.e].name}.`;
                UI.toast(msg);
                resolve(msg);
              };
            });
            opts.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          };
          grid.appendChild(ce);
        });
      };
      draw();
      ov.classList.add('show');
      const cancel = $('#b-ench-cancel');
      if (cancel) {
        cancel.onclick = () => {
          ov.classList.toggle('show', false);
          resolve(list.length ? null : 'Rien ne se passe.');
        };
      }
    });
  };
  R.chooseEnchant = (kind, cancelable) => UI.pickEnchant(kind, cancelable).then((m) => m || 'Tu renonces.');

  // ================================================================== le Grimoire : compétences, collection, succès, statistiques
  const HUB_TABS = [
    ['skills', 'Compétences'],
    ['collection', 'Collection'],
    ['ach', 'Succès'],
    ['stats', 'Statistiques'],
  ];
  let hubTab = 'skills';
  let hubHero = 'chevalier';
  let colTab = 'cards';

  function openHub(tab, hero) {
    if (tab) hubTab = tab;
    if (hero) hubHero = hero;
    if (!R.heroUnlocked(hubHero)) hubHero = 'chevalier';
    const ov = $('#hub');
    ov.innerHTML =
      `<div class="inner"><div class="panel-head hub-head"><h2>Grimoire</h2></div>` +
      `<div class="hub-tabs" role="tablist">${HUB_TABS.map(([k, n]) => `<button role="tab" class="${k === hubTab ? 'on' : ''}" data-t="${k}">${n}${k === 'skills' && anyPoints() ? '<i class="dot"></i>' : ''}</button>`).join('')}</div>` +
      `<div class="scroll hub-body"></div>` +
      `<div class="actions"><button class="btn gold" id="hub-close">Fermer</button></div></div>`;
    ov.classList.add('show');
    $$('.hub-tabs button', ov).forEach((b) => {
      b.onclick = () => openHub(b.dataset.t);
    });
    $('#hub-close').onclick = () => {
      ov.classList.toggle('show', false);
      if (current === 'title') renderTitle();
      if (current === 'heroes') renderHeroes();
    };
    const body = $('.hub-body', ov);
    if (hubTab === 'skills') hubSkills(body);
    else if (hubTab === 'collection') hubCollection(body);
    else if (hubTab === 'ach') hubAch(body);
    else hubStats(body);
  }
  UI.openHub = openHub;
  const anyPoints = () => G.Meta && Object.keys(G.HEROES).some((h) => R.heroUnlocked(h) && G.Meta.points(h) > 0);

  // ---- compétences
  function hubSkills(body) {
    const M = G.Meta;
    const h = hubHero;
    const st = M.hero(h);
    const lv = M.levelOf(st.xp);
    const pts = M.points(h);
    const heroes = Object.keys(G.HEROES).filter(R.heroUnlocked);
    body.innerHTML =
      `<div class="hub-heroes">${heroes.map((x) => `<button class="${x === h ? 'on' : ''}" data-h="${x}">${G.HEROES[x].name.replace(/^L[ea] /, '')}${M.points(x) > 0 ? ' <i class="dot"></i>' : ''}</button>`).join('')}</div>` +
      `<div class="lvl"><div class="lvl-top"><b>Niveau ${lv.level}</b><span>${lv.next ? `${lv.into} / ${lv.next} expérience` : 'Niveau maximum'}</span></div>` +
      `<div class="xp-bar"><div class="xp-fill" style="width:${lv.next ? Math.round((lv.into / lv.next) * 100) : 100}%"></div></div>` +
      `<div class="lvl-pts">${pts > 0 ? `<b>${pts} point${pts > 1 ? 's' : ''} à dépenser</b> : touche une compétence dorée.` : 'Gagne de l’expérience en jouant (étages, ennemis, gardiens, pactes) pour obtenir des points.'}</div></div>` +
      `<div class="tree">${G.TREES[h]
        .map(
          (br) =>
            `<div class="branch"><div class="br-name">${br.name}</div>${br.nodes
              .map((n, i) => {
                const have = st.alloc.includes(n.id);
                const can = M.canLearn(h, n.id);
                return `${i ? '<div class="br-link ' + (have ? 'on' : '') + '"></div>' : ''}<button class="node ${have ? 'have' : can ? 'can' : ''}" data-n="${n.id}"><span class="n-name">${n.name}</span></button>`;
              })
              .join('')}</div>`
        )
        .join('')}</div>` +
      `<div class="node-detail" id="node-detail"><p class="foot">Touche une compétence pour la lire.</p></div>` +
      (st.alloc.length ? `<div class="actions"><button class="btn ghost sm" id="tree-reset">Réinitialiser (gratuit)</button></div>` : '');
    $$('.hub-heroes button', body).forEach((b) => {
      b.onclick = () => {
        hubHero = b.dataset.h;
        openHub('skills');
      };
    });
    $$('.node', body).forEach((b) => {
      b.onclick = () => {
        const n = G.SKILL_NODES[b.dataset.n];
        const have = st.alloc.includes(n.id);
        const can = M.canLearn(h, n.id);
        $('#node-detail', body).innerHTML =
          `<div class="nd-name">${n.name}</div><div class="nd-desc">${n.desc}</div>` +
          (have ? '<div class="nd-state">Apprise</div>' : can ? `<button class="btn gold sm" id="learn">Apprendre (1 point)</button>` : `<div class="nd-state">${pts > 0 ? 'Apprends d’abord la compétence précédente de la branche.' : 'Il te faut un point de compétence.'}</div>`);
        const lb = $('#learn', body);
        if (lb) {
          lb.onclick = () => {
            if (M.learn(h, n.id)) {
              UI.toast(n.name + ' apprise');
              openHub('skills');
            }
          };
        }
      };
    });
    const rs = $('#tree-reset', body);
    if (rs) {
      let armed = false;
      rs.onclick = (e) => {
        if (!armed) {
          armed = true;
          e.currentTarget.textContent = 'Toucher encore : récupérer tous les points';
          return;
        }
        M.resetTree(h);
        openHub('skills');
      };
    }
  }

  // ---- collection
  function lockHint(lock) {
    const a = G.ACH.find((x) => x.id === lock);
    return a ? `Succès « ${a.name} »` : '';
  }
  function hubCollection(body) {
    const col = G.Meta.collection();
    const tabs = [
      ['cards', 'Cartes', col.cards.length, col.cards.filter((id) => col.seen.c[id]).length],
      ['relics', 'Reliques', col.relics.length, col.relics.filter((id) => col.seen.r[id]).length],
      ['enemies', 'Ennemis', col.enemies.length, col.enemies.filter((id) => col.seen.e[id]).length],
      ['pots', 'Fioles', col.pots.length, col.pots.filter((id) => col.seen.p[id]).length],
    ];
    body.innerHTML =
      `<div class="col-pct"><b>${col.pct} %</b> de la collection découverte (${col.found} / ${col.total})</div>` +
      `<div class="hub-heroes">${tabs.map(([k, n, t, f]) => `<button class="${k === colTab ? 'on' : ''}" data-c="${k}">${n} <small>${f}/${t}</small></button>`).join('')}</div>` +
      `<div class="col-body"></div>`;
    $$('.hub-heroes button', body).forEach((b) => {
      b.onclick = () => {
        colTab = b.dataset.c;
        openHub('collection');
      };
    });
    const cb = $('.col-body', body);
    const unknown = (label, hint) => `<div class="unknown"><div class="u-q">?</div><div class="u-l">${label}</div>${hint ? `<div class="u-h">${hint}</div>` : ''}</div>`;
    if (colTab === 'cards') {
      let html = '';
      for (const h of Object.keys(G.HEROES)) {
        const ids = col.cards.filter((id) => G.CARDS[id].hero === h);
        html += `<div class="shop-sec">${G.HEROES[h].name}</div><div class="deck-grid col-grid" data-h="${h}"></div>`;
        void ids;
      }
      cb.innerHTML = html;
      for (const h of Object.keys(G.HEROES)) {
        const grid = $(`.col-grid[data-h="${h}"]`, cb);
        col.cards
          .filter((id) => G.CARDS[id].hero === h)
          .forEach((id) => {
            if (col.seen.c[id]) {
              const card = G.newCard(id);
              const ce = cardEl(card);
              ce.onclick = () => openCardView(card);
              grid.appendChild(ce);
            } else {
              grid.insertAdjacentHTML('beforeend', `<div class="card unknown-card">${unknown('Carte inconnue', G.CARDS[id].lock && G.Meta.locked(G.CARDS[id].lock) ? lockHint(G.CARDS[id].lock) : '')}</div>`);
            }
          });
      }
    } else if (colTab === 'relics') {
      cb.innerHTML = `<div class="col-list">${col.relics
        .map((id) => {
          const r = G.RELICS[id];
          if (!col.seen.r[id]) return `<div class="col-item">${unknown('Relique inconnue', r.lock && G.Meta.locked(r.lock) ? lockHint(r.lock) : '')}</div>`;
          return `<div class="col-item"><img alt="" src="${G.Art.relic(id)}"><div><div class="t">${r.name}</div><div class="d">${r.desc}</div></div></div>`;
        })
        .join('')}</div>`;
    } else if (colTab === 'enemies') {
      const s = G.Meta.stats();
      cb.innerHTML = `<div class="col-foes">${col.enemies
        .map((id) => {
          const e = G.ENEMIES[id];
          if (!col.seen.e[id]) return `<div class="col-foe">${unknown('Ennemi inconnu', `Acte ${ROMAN[e.act]}`)}</div>`;
          const tag = e.boss ? 'Gardien' : e.elite ? 'Élite' : 'Acte ' + ROMAN[e.act];
          return `<div class="col-foe"><img alt="" src="${G.Art.enemy(id)}"><div class="t">${e.name}</div><div class="d">${tag} · vaincu ${s.enemies[id] || 0} fois</div></div>`;
        })
        .join('')}</div>`;
    } else {
      cb.innerHTML = `<div class="col-list">${col.pots
        .map((id) => {
          const p = G.POTIONS[id];
          if (!col.seen.p[id]) return `<div class="col-item">${unknown('Fiole inconnue')}</div>`;
          return `<div class="col-item"><img alt="" src="${G.Art.potion(id)}"><div><div class="t">${p.name}</div><div class="d">${p.desc}</div></div></div>`;
        })
        .join('')}</div>`;
    }
  }

  // ---- succès
  function hubAch(body) {
    const got = R.meta.ach || {};
    const n = G.ACH.filter((a) => got[a.id]).length;
    body.innerHTML =
      `<div class="col-pct"><b>${n} / ${G.ACH.length}</b> succès obtenus</div>` +
      `<div class="ach-list">${G.ACH.map((a) => {
        const ok = !!got[a.id];
        const date = ok ? new Date(got[a.id]).toLocaleDateString('fr-FR') : '';
        return (
          `<div class="ach ${ok ? 'ok' : ''}"><div class="ach-ico">${ok ? '✦' : '✧'}</div><div class="ach-txt"><div class="t">${a.name}</div><div class="d">${a.desc}</div>` +
          (a.unlock ? `<div class="u">${G.Meta.unlockText(a.unlock)}</div>` : '') +
          `</div>${ok ? `<div class="ach-date">${date}</div>` : ''}</div>`
        );
      }).join('')}</div>`;
  }

  // ---- statistiques
  function hubStats(body) {
    const s = G.Meta.stats();
    const rate = s.runs ? Math.round((s.wins / s.runs) * 100) : 0;
    const top = (obj, n) => Object.keys(obj).sort((a, b) => obj[b] - obj[a]).slice(0, n);
    const tile = (v, l) => `<div class="tile"><b>${v}</b><small>${l}</small></div>`;
    const hours = Math.floor(s.time / 3600);
    const mins = Math.floor((s.time % 3600) / 60);
    const heroRows = Object.keys(G.HEROES)
      .map((h) => {
        const x = s.heroes[h] || { runs: 0, wins: 0, bestAct: 0 };
        const lv = G.Meta.levelOf(G.Meta.hero(h).xp).level;
        return `<tr><th>${G.HEROES[h].name.replace(/^L[ea] /, '')}</th><td>${lv}</td><td>${x.runs}</td><td>${x.wins}</td><td>${x.bestAct === 4 ? 'Victoire' : x.bestAct ? 'Acte ' + ROMAN[x.bestAct] : '—'}</td></tr>`;
      })
      .join('');
    const list = (ids, obj, name) => (ids.length ? `<ol class="rank">${ids.map((id) => `<li><span>${name(id)}</span><b>${obj[id]}</b></li>`).join('')}</ol>` : '<p class="foot">Pas encore de données.</p>');
    const hist = s.history.length
      ? s.history
          .map((r) => {
            const d = new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const end = r.won ? '<b class="win">Victoire</b>' : `Acte ${ROMAN[r.act]}${r.killer && G.ENEMIES[r.killer] ? ', ' + G.ENEMIES[r.killer].name : ''}`;
            return `<div class="hist ${r.won ? 'won' : ''}"><div class="h-top"><span>${G.HEROES[r.hero] ? G.HEROES[r.hero].name.replace(/^L[ea] /, '') : r.hero} · palier ${r.palier}</span><span>${d}</span></div><div class="h-mid">${end} · étage ${r.floor} · +${r.xp} exp.</div>${r.pacts && r.pacts.length ? `<div class="h-pacts">${r.pacts.map((p) => (G.PACTS[p] ? G.PACTS[p].name : p)).join(', ')}</div>` : ''}</div>`;
          })
          .join('')
      : '<p class="foot">Aucune partie terminée pour l’instant.</p>';
    body.innerHTML =
      `<div class="shop-sec">Générales</div><div class="tiles">` +
      tile(s.runs, 'Parties') + tile(s.wins, 'Victoires') + tile(rate + ' %', 'Réussite') + tile(hours ? `${hours} h ${mins}` : `${mins} min`, 'Temps de jeu') +
      tile(s.bestStreak, 'Meilleure série') + tile(s.bestPalier >= 0 ? s.bestPalier : '—', 'Plus haut palier gagné') + tile(s.kills, 'Ennemis vaincus') + tile(s.guardians, 'Gardiens vaincus') +
      `</div>` +
      `<div class="shop-sec">Par héros</div><table class="hero-tab"><thead><tr><th></th><th>Niv.</th><th>Parties</th><th>Victoires</th><th>Record</th></tr></thead><tbody>${heroRows}</tbody></table>` +
      `<div class="shop-sec">Cartes les plus jouées</div>${list(top(s.cards, 5), s.cards, (id) => (G.CARDS[id] ? G.CARDS[id].name : id))}` +
      `<div class="shop-sec">Ennemis les plus vaincus</div>${list(top(s.enemies, 5), s.enemies, (id) => (G.ENEMIES[id] ? G.ENEMIES[id].name : id))}` +
      `<div class="shop-sec">Les plus meurtriers</div>${list(top(s.killers, 3), s.killers, (id) => (G.ENEMIES[id] ? G.ENEMIES[id].name : id))}` +
      `<div class="shop-sec">Dernières parties</div><div class="hist-list">${hist}</div>`;
  }

  // ---- succès obtenus : annonce, l'un après l'autre
  const achQueue = [];
  let achShowing = false;
  UI.onAchievements = function (list) {
    achQueue.push(...list);
    if (!achShowing) nextAch();
  };
  function nextAch() {
    const a = achQueue.shift();
    if (!a) {
      achShowing = false;
      return;
    }
    achShowing = true;
    const el = $('#ach-pop');
    el.innerHTML = `<div class="ap-k">Succès</div><div class="ap-t">${a.name}</div>${a.unlock ? `<div class="ap-u">${G.Meta.unlockText(a.unlock)}</div>` : `<div class="ap-u">${a.desc}</div>`}`;
    el.classList.toggle('show', false);
    void el.offsetWidth;
    el.classList.add('show');
    G.FX.burst(window.innerWidth / 2, 70, '245,220,150', 24);
    setTimeout(() => {
      el.classList.toggle('show', false);
      setTimeout(nextAch, 400);
    }, 3200);
  }

  // ---- pactes : choisis sur l'écran des héros
  let selPacts = [];
  function openPacts() {
    const ov = $('#pick');
    const avail = Object.keys(G.PACTS);
    const draw = () => {
      const bonus = Math.round(G.Meta.pactXp(selPacts) * 100);
      ov.innerHTML =
        `<div class="inner"><div class="panel-head"><h2>Pactes</h2><p>Jusqu’à trois pactes : chacun rend l’ascension plus dure, mais rapporte plus d’expérience.</p></div>` +
        `<div class="scroll"><div class="choice-list">${avail
          .map((id) => {
            const p = G.PACTS[id];
            const open = G.Meta.pactAvailable(id);
            const on = selPacts.includes(id);
            return `<button class="choice pact ${on ? 'on' : ''}" data-p="${id}" ${open ? '' : 'disabled'}><span class="t">${open ? p.name : 'Pacte scellé'}<em>+${Math.round(p.xp * 100)} % exp.</em></span><span class="d">${open ? p.desc : 'Se débloque par le ' + lockHint(p.lock).toLowerCase() + '.'}</span></button>`;
          })
          .join('')}</div></div>` +
        `<div class="actions"><div class="pact-sum">${selPacts.length}/3 · expérience <b>+${bonus} %</b></div><button class="btn gold" id="pact-ok">Valider</button></div></div>`;
      $$('.pact', ov).forEach((b) => {
        b.onclick = () => {
          const id = b.dataset.p;
          if (selPacts.includes(id)) selPacts = selPacts.filter((x) => x !== id);
          else if (selPacts.length < 3) selPacts.push(id);
          else UI.toast('Trois pactes au plus.');
          draw();
        };
      });
      $('#pact-ok').onclick = () => {
        ov.classList.toggle('show', false);
        renderHeroes();
      };
    };
    draw();
    ov.classList.add('show');
  }

  // ---- temps de jeu : compté pendant la partie, écran visible
  setInterval(() => {
    if (!document.hidden && R.run && UI.inGame()) R.run.stats.time = (R.run.stats.time || 0) + 5;
  }, 5000);

  // ------------------------------------------------------------------ fin de partie
  function endRun(won, killer) {
    const run = R.run;
    const s = run.stats;
    if (won) R.meta.wins++;
    R.meta.best = Math.max(R.meta.best || 0, run.act);
    const newPalier = won ? R.recordWin() : null;
    R.saveMeta();
    // expérience, niveaux, statistiques et succès
    const xp = G.Meta ? G.Meta.recordRun(run, won, killer) : null;
    R.clear();
    const unlocks = run.unlocks || [];
    const el = $('#end');
    const lv = xp && G.Meta.levelOf(G.Meta.hero(run.hero).xp);
    const xpHTML = xp
      ? `<div class="xp-gain"><div class="xp-line"><b>+${xp.xp} expérience</b> pour ${G.HEROES[run.hero].name.toLowerCase()}` +
        ((run.pacts || []).length ? ` <small>(pactes : +${Math.round(G.Meta.pactXp(run.pacts) * 100)} %)</small>` : '') +
        `</div><div class="xp-bar"><div class="xp-fill" style="width:${lv.next ? Math.round((lv.into / lv.next) * 100) : 100}%"></div></div>` +
        `<div class="xp-lv">Niveau ${lv.level}${xp.after > xp.before ? ` — <b>${xp.after - xp.before} point${xp.after - xp.before > 1 ? 's' : ''} de compétence à dépenser</b>` : ''}</div></div>`
      : '';
    go('end', () => {
      el.innerHTML =
        `<div class="title-rose lit" style="width:min(46vw,200px)"><img alt="" src="${G.Art.rosace(won ? 'win' : 'lose', won ? 'or' : 'nuit', 220)}"></div>` +
        `<h2>${won ? 'La rosace est sauve' : 'Ton vitrail s’est brisé'}</h2>` +
        `<p>${won ? 'Aldric s’effondre en mille éclats de lumière. Dans la nef, le jour revient, couleur de rubis et de saphir.' : `Tu es tombé à l’acte ${ROMAN[run.act]}, ${G.ACT_POOLS[run.act].name.toLowerCase()}. Le grimoire se referme, mais il se souviendra.`}</p>` +
        `<div class="end-stats"><div><b>${run.floor}</b><small>Étages</small></div><div><b>${s.kills}</b><small>Ennemis</small></div><div><b>${s.cards}</b><small>Cartes jouées</small></div></div>` +
        xpHTML +
        (newPalier ? `<p class="unlock">Palier ${newPalier} débloqué pour ${G.HEROES[run.hero].name.toLowerCase()} : ${R.PALIERS[newPalier]}</p>` : '') +
        unlocks.map((id) => `<p class="unlock">${G.HEROES[id].name} s’est éveillé${id === 'sorciere' ? 'e' : ''} !</p>`).join('') +
        `<div class="menu"><button class="btn gold" id="b-again">Nouvelle ascension</button>` +
        (xp && G.Meta.points(run.hero) > 0 ? `<button class="btn" id="b-skills">Dépenser mes points</button>` : '') +
        `<button class="btn ghost" id="b-home">Titre</button></div>`;
      $('#b-again').onclick = () => go('heroes', renderHeroes);
      const sk = $('#b-skills');
      if (sk) sk.onclick = () => openHub('skills', run.hero);
      $('#b-home').onclick = () => go('title', renderTitle);
    });
  }

  // ------------------------------------------------------------------ démarrage
  UI.init = function () {
    R.loadMeta();
    R.askPersistence();
    loadSettings();
    if (G.Cloud) G.Cloud.init();
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
      // l'app passe en arrière-plan (ou est fermée) : on sauvegarde l'état exact
      if (!document.hidden || !R.run) return;
      if (current === 'combat' && C.combat && !C.busy && !C.combat.over) saveCombat('player');
      else R.save();
    });
  };

  window.addEventListener('load', UI.init);
})(window.G = window.G || {});
