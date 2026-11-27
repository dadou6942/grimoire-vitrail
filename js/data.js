/* Grimoire de Vitrail — données : cartes, ennemis, reliques, événements */
(function (G) {
  'use strict';

  // ------------------------------------------------------------------ cartes
  // type : atk (attaque), skl (technique), pow (pouvoir), curse (malédiction)
  // rareté : start, c (commune), u (peu commune), r (rare), curse
  // v / up : valeurs de base et améliorées ; {D} = dégâts modifiés par les états
  const CARDS = {};
  function card(id, o) {
    o.id = id;
    CARDS[id] = o;
  }

  // ---------- Chevalier (saphir)
  card('taille', {
    hero: 'chevalier', name: 'Taille', type: 'atk', rarity: 'start', cost: 1,
    v: { d: 6 }, up: { d: 9 }, text: 'Inflige {D} dégâts.',
    play: (c, v) => c.attack(v.d),
    art: 'sword', quote: 'Le fer se souvient de chaque prière.',
  });
  card('egide', {
    hero: 'chevalier', name: 'Égide', type: 'skl', rarity: 'start', cost: 1,
    v: { b: 5 }, up: { b: 8 }, text: 'Gagne {b} Armure.',
    play: (c, v) => c.block(v.b),
    art: 'shield', quote: 'Derrière le verre, la lumière ; derrière l’écu, le cœur.',
  });
  card('heurt', {
    hero: 'chevalier', name: 'Heurt du pavois', type: 'atk', rarity: 'start', cost: 2,
    v: { d: 8, f: 2 }, up: { d: 10, f: 3 }, text: 'Inflige {D} dégâts. Applique {f} Fêlure.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('fel', v.f);
    },
    art: 'shieldSword', quote: 'Un bouclier est aussi un marteau.',
  });
  card('riposte', {
    hero: 'chevalier', name: 'Riposte', type: 'skl', rarity: 'c', cost: 1,
    v: { b: 4, t: 3 }, up: { b: 6, t: 5 }, text: 'Gagne {b} Armure et {t} Épines ce tour.',
    play: (c, v) => {
      c.block(v.b);
      c.self('epines', v.t);
    },
    art: 'swords', quote: 'Frappe-moi, et tu frapperas l’acier.',
  });
  card('doubleTaille', {
    hero: 'chevalier', name: 'Double taille', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 4 }, up: { d: 6 }, text: 'Inflige {D} dégâts deux fois.',
    play: (c, v) => c.attack(v.d, 2),
    art: 'swords', quote: 'L’aller, puis le retour.',
  });
  card('lameVitrail', {
    hero: 'chevalier', name: 'Lame de vitrail', type: 'atk', rarity: 'c', cost: 0,
    v: { d: 3 }, up: { d: 5 }, text: 'Inflige {D} dégâts. Pioche 1 carte.',
    play: (c, v) => {
      c.attack(v.d);
      c.draw(1);
    },
    art: 'shard', quote: 'Un éclat de saint, aiguisé.',
  });
  card('bastion', {
    hero: 'chevalier', name: 'Bastion', type: 'skl', rarity: 'c', cost: 1,
    v: { b: 7 }, up: { b: 10 }, text: 'Gagne {b} Armure. Pioche 1 carte.',
    play: (c, v) => {
      c.block(v.b);
      c.draw(1);
    },
    art: 'tower', quote: 'Les murs aussi savent attendre.',
  });
  card('pommeau', {
    hero: 'chevalier', name: 'Coup de pommeau', type: 'atk', rarity: 'c', cost: 0,
    v: { d: 4, f: 1 }, up: { d: 6, f: 2 }, text: 'Inflige {D} dégâts. Applique {f} Faiblesse.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('faib', v.f);
    },
    art: 'fist', quote: 'La garde est une arme que l’on oublie.',
  });
  card('ordalie', {
    hero: 'chevalier', name: 'Ordalie', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 8, f: 1 }, up: { d: 10, f: 2 }, text: 'Inflige {D} dégâts. Applique {f} Fêlure.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('fel', v.f);
    },
    art: 'flame', quote: 'Le feu dira qui ment.',
  });
  card('murLances', {
    hero: 'chevalier', name: 'Mur de lances', type: 'atk', rarity: 'c', cost: 2,
    v: { d: 8, b: 8 }, up: { d: 11, b: 11 }, text: 'Inflige {D} dégâts. Gagne {b} Armure.',
    play: (c, v) => {
      c.attack(v.d);
      c.block(v.b);
    },
    art: 'lance', quote: 'Cent pointes, un seul serment.',
  });
  card('contreCoup', {
    hero: 'chevalier', name: 'Contre-coup', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 6, b: 6 }, up: { d: 8, b: 9 }, text: 'Inflige {D} dégâts. Si l’ennemi prépare une attaque, gagne {b} Armure.',
    play: (c, v) => {
      c.attack(v.d);
      if (c.enemyAttacks()) c.block(v.b);
    },
    art: 'shieldSword', quote: 'Lire le geste avant le geste.',
  });
  card('veille', {
    hero: 'chevalier', name: 'Veille', type: 'skl', rarity: 'c', cost: 1,
    v: { b: 6 }, up: { b: 9 }, text: 'Gagne {b} Armure. Au prochain tour, gagne 1 Encre.',
    play: (c, v) => {
      c.block(v.b);
      c.self('veille', 1);
    },
    art: 'candle', quote: 'Une flamme pour la nuit, une autre pour l’aube.',
  });
  card('chargeSainte', {
    hero: 'chevalier', name: 'Charge sainte', type: 'atk', rarity: 'c', cost: 2,
    v: { d: 14 }, up: { d: 19 }, text: 'Inflige {D} dégâts.',
    play: (c, v) => c.attack(v.d),
    art: 'lance', quote: 'La nef tremble sous les sabots.',
  });
  card('ferContreFer', {
    hero: 'chevalier', name: 'Fer contre fer', type: 'atk', rarity: 'u', cost: 1,
    v: { x: 0 }, up: { x: 5 }, text: 'Inflige des dégâts égaux à ton Armure.', textUp: 'Inflige des dégâts égaux à ton Armure +{x}.',
    play: (c, v) => c.attack(c.p.block + v.x),
    preview: (c, v) => c.p.block + v.x,
    art: 'shield', quote: 'Mon rempart est ma colère.',
  });
  card('voeuPierre', {
    hero: 'chevalier', name: 'Vœu de pierre', type: 'skl', rarity: 'u', cost: 2,
    v: { b: 13 }, up: { b: 18 }, text: 'Gagne {b} Armure.',
    play: (c, v) => c.block(v.b),
    art: 'tower', quote: 'Je serai la colonne.',
  });
  card('serment', {
    hero: 'chevalier', name: 'Serment de fer', type: 'pow', rarity: 'u', cost: 1,
    v: { s: 2 }, up: { s: 3 }, text: 'Gagne {s} Force.',
    play: (c, v) => c.self('force', v.s),
    art: 'hand', quote: 'Les mots gravés ne s’effacent pas.',
  });
  card('couronneFer', {
    hero: 'chevalier', name: 'Couronne de fer', type: 'pow', rarity: 'u', cost: 1,
    v: { t: 3 }, up: { t: 5 }, text: 'Gagne {t} Épines permanentes.',
    play: (c, v) => c.self('epinesP', v.t),
    art: 'crown', quote: 'Qui me touche se blesse.',
  });
  card('defi', {
    hero: 'chevalier', name: 'Défi', type: 'skl', rarity: 'u', cost: 0, exhaust: true,
    v: { f: 2 }, up: { f: 3 }, text: 'Applique {f} Faiblesse. Épuise.',
    play: (c, v) => c.apply('faib', v.f),
    art: 'fist', quote: 'Viens. Je t’attends.',
  });
  card('bouclierArdent', {
    hero: 'chevalier', name: 'Bouclier ardent', type: 'skl', rarity: 'u', cost: 2,
    v: { b: 11, t: 5 }, up: { b: 14, t: 7 }, text: 'Gagne {b} Armure et {t} Épines ce tour.',
    play: (c, v) => {
      c.block(v.b);
      c.self('epines', v.t);
    },
    art: 'shieldFlame', quote: 'L’écu rougeoie comme une forge.',
  });
  card('lumiereChoeur', {
    hero: 'chevalier', name: 'Lumière du chœur', type: 'skl', rarity: 'u', cost: 1, exhaust: true,
    v: { h: 6 }, up: { h: 10 }, text: 'Soigne {h} PV. Épuise.',
    play: (c, v) => c.heal(v.h),
    art: 'sun', quote: 'Le soleil traverse les saints et se pose sur toi.',
  });
  card('execution', {
    hero: 'chevalier', name: 'Exécution', type: 'atk', rarity: 'u', cost: 2,
    v: { d: 10 }, up: { d: 13 }, text: 'Inflige {D} dégâts. Double si l’ennemi a moins de la moitié de ses PV.',
    play: (c, v) => c.attack(c.e.hp * 2 < c.e.maxHp ? v.d * 2 : v.d),
    art: 'axe', quote: 'Le dernier coup est toujours le plus juste.',
  });
  card('benediction', {
    hero: 'chevalier', name: 'Grâce du verrier', type: 'skl', rarity: 'u', cost: 1,
    v: { n: 2 }, up: { n: 3 }, text: 'Pioche {n} cartes.',
    play: (c, v) => c.draw(v.n),
    art: 'chalice', quote: 'Le verre se souffle, la grâce aussi.',
  });
  card('frappeVerre', {
    hero: 'chevalier', name: 'Frappe de verre', type: 'atk', rarity: 'u', cost: 1,
    v: { d: 5 }, up: { d: 8 }, text: 'Inflige {D} dégâts. Applique 1 Fêlure et 1 Faiblesse.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('fel', 1);
      c.apply('faib', 1);
    },
    art: 'shard', quote: 'Le vitrail coupe ceux qui le brisent.',
  });
  card('rempart', {
    hero: 'chevalier', name: 'Rempart', type: 'pow', rarity: 'r', cost: 2, upCost: 1,
    v: {}, up: {}, text: 'Ton Armure ne disparaît plus à la fin du tour.',
    play: (c) => c.self('rempart', 1),
    art: 'tower', quote: 'Pierre sur pierre, jusqu’au ciel.',
  });
  card('martyre', {
    hero: 'chevalier', name: 'Martyre', type: 'pow', rarity: 'r', cost: 2,
    v: { b: 4 }, up: { b: 6 }, text: 'Au début de chaque tour, gagne {b} Armure.',
    play: (c, v) => c.self('martyre', v.b),
    art: 'heart', quote: 'Chaque blessure devient un vitrail.',
  });
  card('echoCloche', {
    hero: 'chevalier', name: 'Écho de cloche', type: 'skl', rarity: 'r', cost: 2, upCost: 1,
    v: {}, up: {}, text: 'Double ton Armure.',
    play: (c) => c.block(c.p.block, true),
    art: 'bell', quote: 'Un seul coup, et la tour entière répond.',
  });
  card('jugement', {
    hero: 'chevalier', name: 'Jugement', type: 'atk', rarity: 'r', cost: 3,
    v: { d: 22 }, up: { d: 30 }, text: 'Inflige {D} dégâts. Applique 3 Fêlure.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('fel', 3);
    },
    art: 'eye', quote: 'Rien n’échappe au regard de la rosace.',
  });
  card('derniereCathedrale', {
    hero: 'chevalier', name: 'Dernière nef', type: 'skl', rarity: 'r', cost: 1,
    v: { b: 3 }, up: { b: 4 }, text: 'Gagne {b} Armure pour chaque carte dans ta main.',
    play: (c, v) => c.block(v.b * c.hand.length),
    art: 'rose', quote: 'Chaque carte, une pierre ; chaque pierre, une prière.',
  });

  card('coupEcu', {
    hero: 'chevalier', name: 'Coup d’écu', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 5, x: 5 }, up: { d: 7, x: 6 }, text: 'Inflige {D} dégâts. Si tu as de l’Armure, {x} dégâts de plus.',
    play: (c, v) => c.attack(v.d + (c.p.block > 0 ? v.x : 0)),
    art: 'shield', quote: 'Le rebord de l’écu est une lame qui s’ignore.',
  });
  card('priereGuet', {
    hero: 'chevalier', name: 'Prière du guet', type: 'skl', rarity: 'c', cost: 0, exhaust: true,
    v: { b: 4 }, up: { b: 7 }, text: 'Gagne {b} Armure. Pioche 1 carte. Épuise.',
    play: (c, v) => {
      c.block(v.b);
      c.draw(1);
    },
    art: 'candle', quote: 'Que la nuit passe sans moi.',
  });
  card('assaut', {
    hero: 'chevalier', name: 'Assaut furieux', type: 'atk', rarity: 'u', cost: 1,
    v: { d: 4 }, up: { d: 6 }, text: 'Inflige {D} dégâts, une fois de plus par Attaque déjà jouée ce tour.',
    play: (c, v) => c.attack(v.d, Math.max(1, c.stats.atkTurn)),
    art: 'axe', quote: 'Chaque coup appelle le suivant.',
  });
  card('paradeParfaite', {
    hero: 'chevalier', name: 'Parade parfaite', type: 'skl', rarity: 'u', cost: 1,
    v: { m: 20 }, up: { m: 32 }, text: 'Gagne autant d’Armure que les dégâts annoncés par l’ennemi (au plus {m}).',
    play: (c, v) => {
      const m = c.e.intent;
      const d = m && m.dmg ? c.calcDamage(c.e, c.p, m.dmg, true) * (m.hits || 1) : 0;
      c.block(Math.min(v.m, d));
    },
    art: 'shieldSword', quote: 'Je savais où tu frapperais.',
  });
  card('banniere', {
    hero: 'chevalier', name: 'Bannière de la nef', type: 'pow', rarity: 'r', cost: 2,
    v: { n: 2 }, up: { n: 3 }, text: 'Chaque fois que tu gagnes de l’Armure, inflige {n} dégâts.',
    play: (c, v) => c.self('banniere', v.n),
    art: 'lance', quote: 'Tant que flotte la bannière, la nef tient.',
  });
  card('vigilance', {
    hero: 'chevalier', name: 'Vigilance', type: 'pow', rarity: 'r', cost: 1, upCost: 0,
    v: {}, up: {}, text: 'Pioche 1 carte de plus au début de chaque tour.',
    play: (c) => c.self('vigilance', 1),
    art: 'eye', quote: 'Le sommeil est pour les gisants.',
  });

  // ---------- Sorcière (améthyste) : brûlure et sorts enchaînés
  const SO = 'sorciere';
  card('trait', {
    hero: SO, name: 'Trait de cendre', type: 'atk', rarity: 'start', cost: 1,
    v: { d: 6 }, up: { d: 9 }, text: 'Inflige {D} dégâts.',
    play: (c, v) => c.attack(v.d),
    art: 'feather', quote: 'La plume trempée dans la braise écrit en lettres de feu.',
  });
  card('voile', {
    hero: SO, name: 'Voile d’ombre', type: 'skl', rarity: 'start', cost: 1,
    v: { b: 5 }, up: { b: 8 }, text: 'Gagne {b} Armure.',
    play: (c, v) => c.block(v.b),
    art: 'moon', quote: 'La nuit m’habille.',
  });
  card('embrasement', {
    hero: SO, name: 'Embrasement', type: 'skl', rarity: 'start', cost: 1,
    v: { u: 3 }, up: { u: 5 }, text: 'Applique {u} Brûlure.',
    play: (c, v) => c.apply('brulure', v.u),
    art: 'flame', quote: 'Tout ce qui brûle finit par parler.',
  });
  card('etincelle', {
    hero: SO, name: 'Étincelle', type: 'atk', rarity: 'c', cost: 0,
    v: { d: 3, u: 1 }, up: { d: 4, u: 2 }, text: 'Inflige {D} dégâts. Applique {u} Brûlure.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('brulure', v.u);
    },
    art: 'star', quote: 'Il suffit d’une seule.',
  });
  card('litanie', {
    hero: SO, name: 'Litanie', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 4, x: 2 }, up: { d: 5, x: 3 }, text: 'Inflige {D} dégâts, +{x} par carte déjà jouée ce tour.',
    play: (c, v) => c.attack(v.d + v.x * (c.stats.playedTurn || 0)),
    art: 'book', quote: 'Chaque verset appelle le suivant.',
  });
  card('cendresVives', {
    hero: SO, name: 'Cendres vives', type: 'skl', rarity: 'c', cost: 1,
    v: { u: 2 }, up: { u: 4 }, text: 'Applique {u} Brûlure. Pioche 1 carte.',
    play: (c, v) => {
      c.apply('brulure', v.u);
      c.draw(1);
    },
    art: 'flame', quote: 'Souffle doucement, et la braise répond.',
  });
  card('murCendres', {
    hero: SO, name: 'Mur de cendres', type: 'skl', rarity: 'c', cost: 1,
    v: { b: 7, x: 4 }, up: { b: 9, x: 5 }, text: 'Gagne {b} Armure, et {x} de plus si l’ennemi brûle.',
    play: (c, v) => c.block(v.b + (c.burn() > 0 ? v.x : 0)),
    art: 'tower', quote: 'Un rempart de suie entre moi et toi.',
  });
  card('murmure', {
    hero: SO, name: 'Murmure', type: 'skl', rarity: 'c', cost: 0, exhaust: true,
    v: { n: 2 }, up: { n: 3 }, text: 'Pioche {n} cartes. Épuise.',
    play: (c, v) => c.draw(v.n),
    art: 'eye', quote: 'Les pages tournent toutes seules.',
  });
  card('flecheSoufre', {
    hero: SO, name: 'Flèche de soufre', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 8 }, up: { d: 11 }, text: 'Inflige {D} dégâts. Applique 1 Faiblesse.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('faib', 1);
    },
    art: 'lance', quote: 'Elle sent l’œuf pourri et l’enfer.',
  });
  card('braiseNoire', {
    hero: SO, name: 'Braise noire', type: 'atk', rarity: 'c', cost: 2,
    v: { d: 7 }, up: { d: 10 }, text: 'Inflige {D} dégâts. Augmente de moitié la Brûlure de l’ennemi.',
    play: (c, v) => {
      c.attack(v.d);
      if (c.burn() > 1) c.apply('brulure', Math.floor(c.burn() / 2));
    },
    art: 'flame', quote: 'Le feu noir ne s’éteint jamais tout à fait.',
  });
  card('sceauLunaire', {
    hero: SO, name: 'Sceau lunaire', type: 'skl', rarity: 'c', cost: 1,
    v: { b: 6 }, up: { b: 9 }, text: 'Gagne {b} Armure. Au prochain tour, gagne 1 Encre.',
    play: (c, v) => {
      c.block(v.b);
      c.self('veille', 1);
    },
    art: 'moon', quote: 'La lune garde ce que je lui confie.',
  });
  card('combustion', {
    hero: SO, name: 'Combustion', type: 'atk', rarity: 'u', cost: 1,
    v: { d: 4 }, up: { d: 7 }, text: 'Inflige {D} dégâts, plus la Brûlure de l’ennemi.',
    play: (c, v) => c.attack(v.d + c.burn()),
    preview: (c, v) => v.d + c.burn(),
    art: 'sun', quote: 'Ce qui couvait éclate.',
  });
  card('pageArdente', {
    hero: SO, name: 'Page ardente', type: 'pow', rarity: 'u', cost: 1,
    v: { u: 1 }, up: { u: 2 }, text: 'Chaque fois que tu joues une Technique, applique {u} Brûlure.',
    play: (c, v) => c.self('braise', v.u),
    art: 'book', quote: 'Le grimoire s’enflamme sans se consumer.',
  });
  card('cercleCendre', {
    hero: SO, name: 'Cercle de cendre', type: 'skl', rarity: 'u', cost: 2,
    v: { b: 11, u: 2 }, up: { b: 14, u: 3 }, text: 'Gagne {b} Armure. Applique {u} Brûlure.',
    play: (c, v) => {
      c.block(v.b);
      c.apply('brulure', v.u);
    },
    art: 'rose', quote: 'Nul ne franchit le cercle.',
  });
  card('incantation', {
    hero: SO, name: 'Incantation', type: 'skl', rarity: 'u', cost: 1, upCost: 0, exhaust: true,
    v: {}, up: {}, text: 'Gagne 2 Encre. Épuise.',
    play: (c) => c.gainInk(2),
    art: 'chalice', quote: 'Les mots anciens ont un goût de fer.',
  });
  card('tisonnier', {
    hero: SO, name: 'Tisonnier', type: 'atk', rarity: 'u', cost: 1,
    v: { d: 5 }, up: { d: 7 }, text: 'Inflige {D} dégâts deux fois. Applique 1 Brûlure par coup.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('brulure', 1);
      c.attack(v.d);
      c.apply('brulure', 1);
    },
    art: 'sword', quote: 'Remue les braises, et elles mordent.',
  });
  card('evocation', {
    hero: SO, name: 'Évocation', type: 'skl', rarity: 'u', cost: 1,
    v: { n: 2 }, up: { n: 3 }, text: 'Ajoute {n} Étincelles à ta main (elles s’épuisent).',
    play: (c, v) => c.addToHand('etincelle', v.n),
    art: 'star', quote: 'Viens, petite flamme. Et tes sœurs aussi.',
  });
  card('maledictionCendres', {
    hero: SO, name: 'Anathème', type: 'skl', rarity: 'u', cost: 1, exhaust: true,
    v: { f: 2 }, up: { f: 3 }, text: 'Applique {f} Fêlure et {f} Faiblesse. Épuise.',
    play: (c, v) => {
      c.apply('fel', v.f);
      c.apply('faib', v.f);
    },
    art: 'skull', quote: 'Que ton verre se fende et ton bras se lasse.',
  });
  card('brasier', {
    hero: SO, name: 'Brasier', type: 'pow', rarity: 'r', cost: 2,
    v: { u: 2 }, up: { u: 3 }, text: 'Au début de chaque tour, applique {u} Brûlure.',
    play: (c, v) => c.self('brasier', v.u),
    art: 'flame', quote: 'La nef entière devient fournaise.',
  });
  card('pluieFeu', {
    hero: SO, name: 'Pluie de feu', type: 'atk', rarity: 'r', cost: 3,
    v: { d: 4 }, up: { d: 5 }, text: 'Inflige {D} dégâts 5 fois. Applique 1 Brûlure par coup.',
    play: (c, v) => {
      for (let i = 0; i < 5; i++) {
        c.attack(v.d);
        c.apply('brulure', 1);
      }
    },
    art: 'sun', quote: 'Le ciel de la rosace se met à pleuvoir.',
  });
  card('echoInterdit', {
    hero: SO, name: 'Écho interdit', type: 'pow', rarity: 'r', cost: 3, upCost: 2,
    v: {}, up: {}, text: 'La première carte jouée à chaque tour est jouée deux fois.',
    play: (c) => c.self('echo', 1),
    art: 'bell', quote: 'Ce que je dis, la voûte le redit.',
  });
  card('phenix', {
    hero: SO, name: 'Cendres du phénix', type: 'skl', rarity: 'r', cost: 2, exhaust: true,
    v: { h: 10, u: 5 }, up: { h: 15, u: 7 }, text: 'Soigne {h} PV. Applique {u} Brûlure. Épuise.',
    play: (c, v) => {
      c.heal(v.h);
      c.apply('brulure', v.u);
    },
    art: 'feather', quote: 'Je renais de ce qui te consume.',
  });

  // ---------- Saigneur (rubis) : payer en PV, vol de vie, frénésie
  const SA = 'saigneur';
  card('entaille', {
    hero: SA, name: 'Entaille', type: 'atk', rarity: 'start', cost: 1,
    v: { d: 6 }, up: { d: 9 }, text: 'Inflige {D} dégâts.',
    play: (c, v) => c.attack(v.d),
    art: 'axe', quote: 'Une ligne rouge, nette comme une prière.',
  });
  card('gardeFer', {
    hero: SA, name: 'Garde de fer', type: 'skl', rarity: 'start', cost: 1,
    v: { b: 5 }, up: { b: 8 }, text: 'Gagne {b} Armure.',
    play: (c, v) => c.block(v.b),
    art: 'shield', quote: 'Même le sang a besoin d’un rempart.',
  });
  card('saignee', {
    hero: SA, name: 'Saignée', type: 'atk', rarity: 'start', cost: 0, hp: 3,
    v: { d: 10 }, up: { d: 14 }, text: 'Paie 3 PV. Inflige {D} dégâts.',
    play: (c, v) => c.attack(v.d),
    art: 'drop', quote: 'Je te donne mon sang ; tu me donnes le tien.',
  });
  card('morsureSang', {
    hero: SA, name: 'Morsure', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 7 }, up: { d: 10 }, text: 'Inflige {D} dégâts. Rends-toi la moitié des dégâts infligés en PV.',
    play: (c, v) => c.attack(v.d, 1, 0.5),
    art: 'skull', quote: 'Le goût du fer, puis la chaleur.',
  });
  card('petitPacte', {
    hero: SA, name: 'Petit pacte', type: 'skl', rarity: 'c', cost: 0, hp: 2, upHp: 1,
    v: {}, up: {}, text: 'Paie 2 PV. Gagne 1 Encre. Pioche 1 carte.', textUp: 'Paie 1 PV. Gagne 1 Encre. Pioche 1 carte.',
    play: (c) => {
      c.gainInk(1);
      c.draw(1);
    },
    art: 'hand', quote: 'Un doigt, pas la main entière.',
  });
  card('lameEcarlate', {
    hero: SA, name: 'Lame écarlate', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 7, x: 7 }, up: { d: 9, x: 9 }, text: 'Inflige {D} dégâts, et {x} de plus si tes PV sont sous la moitié.',
    play: (c, v) => c.attack(v.d + (c.p.hp * 2 < c.p.maxHp ? v.x : 0)),
    art: 'sword', quote: 'Plus je saigne, plus je frappe.',
  });
  card('carapaceSang', {
    hero: SA, name: 'Carapace de sang', type: 'skl', rarity: 'c', cost: 1, hp: 2,
    v: { b: 9 }, up: { b: 12 }, text: 'Paie 2 PV. Gagne {b} Armure.',
    play: (c, v) => c.block(v.b),
    art: 'shield', quote: 'Le sang séché fait une armure étonnante.',
  });
  card('frappeAveugle', {
    hero: SA, name: 'Frappe aveugle', type: 'atk', rarity: 'c', cost: 2, hp: 4,
    v: { d: 20 }, up: { d: 26 }, text: 'Paie 4 PV. Inflige {D} dégâts.',
    play: (c, v) => c.attack(v.d),
    art: 'fist', quote: 'Je ne vois plus rien. Je n’en ai pas besoin.',
  });
  card('transfusion', {
    hero: SA, name: 'Transfusion', type: 'skl', rarity: 'c', cost: 1,
    v: { h: 4 }, up: { h: 7 }, text: 'Soigne {h} PV. Pioche 1 carte.',
    play: (c, v) => {
      c.heal(v.h);
      c.draw(1);
    },
    art: 'chalice', quote: 'Ce qui coule peut aussi remonter.',
  });
  card('griffes', {
    hero: SA, name: 'Griffes', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 3 }, up: { d: 4 }, text: 'Inflige {D} dégâts trois fois.',
    play: (c, v) => c.attack(v.d, 3),
    art: 'axe', quote: 'Trois sillons, trois souvenirs.',
  });
  card('hemorragie', {
    hero: SA, name: 'Hémorragie', type: 'atk', rarity: 'c', cost: 1,
    v: { d: 5, f: 2 }, up: { d: 7, f: 3 }, text: 'Inflige {D} dégâts. Applique {f} Fêlure.',
    play: (c, v) => {
      c.attack(v.d);
      c.apply('fel', v.f);
    },
    art: 'drop', quote: 'La plaie s’ouvre et ne se referme plus.',
  });
  card('soif', {
    hero: SA, name: 'Soif', type: 'pow', rarity: 'u', cost: 1, upCost: 0,
    v: {}, up: {}, text: 'Chaque fois que tu paies des PV, gagne 1 Force.',
    play: (c) => c.self('soif', 1),
    art: 'chalice', quote: 'Chaque goutte versée m’en réclame une autre.',
  });
  card('sacrifice', {
    hero: SA, name: 'Sacrifice', type: 'skl', rarity: 'u', cost: 1, hp: 6, upHp: 4,
    v: {}, up: {}, text: 'Paie 6 PV. Gagne 2 Encre et pioche 2 cartes.', textUp: 'Paie 4 PV. Gagne 2 Encre et pioche 2 cartes.',
    play: (c) => {
      c.gainInk(2);
      c.draw(2);
    },
    art: 'heart', quote: 'On n’ouvre pas la porte sans s’ouvrir la main.',
  });
  card('etreinte', {
    hero: SA, name: 'Étreinte vampirique', type: 'atk', rarity: 'u', cost: 2, exhaust: true,
    v: { d: 12 }, up: { d: 17 }, text: 'Inflige {D} dégâts. Rends-toi tous les dégâts infligés en PV. Épuise.',
    play: (c, v) => c.attack(v.d, 1, 1),
    art: 'heart', quote: 'Viens plus près.',
  });
  card('rage', {
    hero: SA, name: 'Rage écarlate', type: 'skl', rarity: 'u', cost: 1, hp: 3,
    v: { s: 2 }, up: { s: 3 }, text: 'Paie 3 PV. Gagne {s} Force.',
    play: (c, v) => c.self('force', v.s),
    art: 'flame', quote: 'La douleur est un tambour de guerre.',
  });
  card('cicatrices', {
    hero: SA, name: 'Cicatrices', type: 'skl', rarity: 'u', cost: 1,
    v: { m: 20 }, up: { m: 30 }, text: 'Gagne 1 Armure pour 2 PV manquants (au plus {m}).',
    play: (c, v) => c.block(Math.min(v.m, Math.floor((c.p.maxHp - c.p.hp) / 2))),
    art: 'shield', quote: 'Chaque marque est un bouclier.',
  });
  card('communion', {
    hero: SA, name: 'Communion', type: 'atk', rarity: 'u', cost: 1,
    v: { d: 4 }, up: { d: 8 }, text: 'Inflige {D} dégâts, plus les PV que tu as payés ce combat (au plus 30).',
    play: (c, v) => c.attack(v.d + Math.min(30, c.stats.paid || 0)),
    art: 'chalice', quote: 'Bois, c’est mon sang offert.',
  });
  card('pacteSang', {
    hero: SA, name: 'Pacte de sang', type: 'pow', rarity: 'r', cost: 1,
    v: { n: 2 }, up: { n: 1 }, text: 'Au début de chaque tour, paie {n} PV et gagne 1 Encre.',
    play: (c, v) => c.self('pacte', v.n),
    art: 'book', quote: 'Signé, scellé, saigné.',
  });
  card('grandCalice', {
    hero: SA, name: 'Grand calice', type: 'pow', rarity: 'r', cost: 2, upCost: 1,
    v: {}, up: {}, text: 'Chaque coup qui te fait infliger des dégâts te soigne de 1 PV.',
    play: (c) => c.self('calice', 1),
    art: 'chalice', quote: 'La coupe ne désemplit jamais.',
  });
  card('massacre', {
    hero: SA, name: 'Massacre', type: 'atk', rarity: 'r', cost: 3, hp: 5,
    v: { d: 32 }, up: { d: 42 }, text: 'Paie 5 PV. Inflige {D} dégâts.',
    play: (c, v) => c.attack(v.d),
    art: 'axe', quote: 'Il ne restera que le silence et le rouge.',
  });
  card('dernierSouffle', {
    hero: SA, name: 'Dernier souffle', type: 'skl', rarity: 'r', cost: 2, exhaust: true,
    v: { b: 12, x: 30 }, up: { b: 16, x: 40 }, text: 'Gagne {b} Armure, ou {x} si tes PV sont sous le quart. Épuise.',
    play: (c, v) => c.block(c.p.hp * 4 < c.p.maxHp ? v.x : v.b),
    art: 'heart', quote: 'Pas encore.',
  });

  // ---------- cartes débloquées par les succès (champ lock)
  card('tourbillon', {
    hero: 'chevalier', name: 'Tourbillon', type: 'atk', rarity: 'u', cost: 2, lock: 'meute',
    v: { d: 8 }, up: { d: 11 }, text: 'Inflige {D} dégâts à tous les ennemis.',
    play: (c, v) => c.attackAll(v.d),
    art: 'swords', quote: 'La lame trace un cercle ; personne n’en sort.',
  });
  card('forteresse', {
    hero: 'chevalier', name: 'Forteresse', type: 'skl', rarity: 'r', cost: 3, upCost: 2, exhaust: true, lock: 'rempart50',
    v: { b: 30 }, up: { b: 30 }, text: 'Gagne {b} Armure. Épuise.',
    play: (c, v) => c.block(v.b),
    art: 'tower', quote: 'Je suis devenu les murs.',
  });
  card('nova', {
    hero: 'sorciere', name: 'Nova de cendre', type: 'atk', rarity: 'u', cost: 2, lock: 'escorte',
    v: { d: 5, u: 2 }, up: { d: 7, u: 3 }, text: 'Inflige {D} dégâts à tous les ennemis et leur applique {u} Brûlure.',
    play: (c, v) => {
      c.attackAll(v.d);
      c.alive().forEach((e) => c.apply('brulure', v.u, e));
    },
    art: 'sun', quote: 'Une seule étincelle, et la nef s’embrase.',
  });
  card('immolation', {
    hero: 'sorciere', name: 'Immolation', type: 'atk', rarity: 'r', cost: 2, lock: 'pyromane',
    v: { x: 2 }, up: { x: 3 }, text: 'Inflige {x} fois la Brûlure de la cible en dégâts.',
    play: (c, v) => c.attack(c.burn() * v.x),
    art: 'flame', quote: 'Ce qui couvait devient brasier.',
  });
  card('pluieSang', {
    hero: 'saigneur', name: 'Pluie de sang', type: 'atk', rarity: 'u', cost: 1, hp: 4, lock: 'hemophile',
    v: { d: 9 }, up: { d: 13 }, text: 'Paie 4 PV. Inflige {D} dégâts à tous les ennemis.',
    play: (c, v) => c.attackAll(v.d),
    art: 'drop', quote: 'Le ciel de la nef saigne avec moi.',
  });
  card('festin', {
    hero: 'saigneur', name: 'Festin', type: 'atk', rarity: 'r', cost: 2, lock: 'cent',
    v: { d: 14 }, up: { d: 18 }, text: 'Inflige {D} dégâts. Si la cible tombe, gagne 4 PV maximum.',
    play: (c, v) => {
      const t = c.e;
      c.attack(v.d);
      if (t.hp <= 0) {
        c.p.maxHp += 4;
        c.p.hp += 4;
      }
    },
    art: 'chalice', quote: 'Rien ne se perd.',
  });

  // ---------- malédictions
  card('doute', {
    name: 'Doute', type: 'curse', rarity: 'curse', cost: -1, unplayable: true,
    v: {}, up: {}, text: 'Injouable.',
    art: 'eye', quote: 'Et si la lumière mentait ?',
  });
  card('blessure', {
    name: 'Plaie', type: 'curse', rarity: 'curse', cost: -1, unplayable: true,
    v: {}, up: {}, text: 'Injouable. Si elle est en main à la fin du tour, perds 2 PV.',
    art: 'drop', quote: 'Elle ne se referme jamais tout à fait.',
  });

  // ------------------------------------------------------------------ héros
  const HEROES = {
    chevalier: {
      id: 'chevalier', name: 'Le Chevalier', title: 'Gardien de la nef', hp: 80, color: 'saphir',
      deck: ['taille', 'taille', 'taille', 'taille', 'taille', 'egide', 'egide', 'egide', 'egide', 'heurt'],
      relic: 'ecuSaphir', art: 'knight',
      desc: 'Armure, contre-attaques et endurance. Il tient la ligne jusqu’à ce que l’ennemi se brise.',
    },
    sorciere: {
      id: 'sorciere', name: 'La Sorcière', title: 'Lectrice des cendres', hp: 66, color: 'amethyste',
      deck: ['trait', 'trait', 'trait', 'trait', 'trait', 'voile', 'voile', 'voile', 'voile', 'embrasement'],
      relic: 'cendrier', art: 'witch', unlock: 1,
      desc: 'Elle enflamme l’ennemi et enchaîne les sorts. La Brûlure ronge sa cible à chaque tour, à travers l’Armure.',
    },
    saigneur: {
      id: 'saigneur', name: 'Le Saigneur', title: 'Prêtre du sang', hp: 90, color: 'rubis',
      deck: ['entaille', 'entaille', 'entaille', 'entaille', 'entaille', 'gardeFer', 'gardeFer', 'gardeFer', 'gardeFer', 'saignee'],
      relic: 'calice', art: 'bleeder', unlock: 3,
      desc: 'Il paie en PV des coups dévastateurs et se soigne en volant la vie. Plus il saigne, plus il frappe fort.',
    },
  };

  // ------------------------------------------------------------------ états
  const STATUS = {
    force: { name: 'Force', icon: 'force', good: true, desc: 'Chaque coup inflige {n} dégâts de plus.' },
    faib: { name: 'Faiblesse', icon: 'faib', good: false, desc: 'Inflige 25 % de dégâts en moins. {n} tour(s).' },
    fel: { name: 'Fêlure', icon: 'fel', good: false, desc: 'Subit 50 % de dégâts en plus. {n} tour(s).' },
    epines: { name: 'Épines', icon: 'epines', good: true, desc: 'Renvoie {n} dégâts à chaque coup reçu ce tour.' },
    epinesP: { name: 'Couronne d’épines', icon: 'epines', good: true, desc: 'Renvoie {n} dégâts à chaque coup reçu.' },
    rempart: { name: 'Rempart', icon: 'rempart', good: true, desc: 'L’Armure ne disparaît plus à la fin du tour.' },
    martyre: { name: 'Martyre', icon: 'martyre', good: true, desc: 'Gagne {n} Armure au début de chaque tour.' },
    veille: { name: 'Veille', icon: 'veille', good: true, desc: 'Gagne {n} Encre au prochain tour.' },
    rituel: { name: 'Rituel', icon: 'force', good: true, desc: 'Gagne {n} Force à la fin de chaque tour.' },
    banniere: { name: 'Bannière', icon: 'banniere', good: true, desc: 'Inflige {n} dégâts chaque fois que tu gagnes de l’Armure.' },
    brulure: { name: 'Brûlure', icon: 'flame', good: false, desc: 'Subit {n} dégâts au début de son tour (à travers l’Armure), puis la Brûlure baisse de 1.' },
    braise: { name: 'Page ardente', icon: 'flame', good: true, desc: 'Chaque Technique jouée applique {n} Brûlure.' },
    brasier: { name: 'Brasier', icon: 'flame', good: true, desc: 'Applique {n} Brûlure au début de chaque tour.' },
    echo: { name: 'Écho', icon: 'bell', good: true, desc: 'La première carte de chaque tour est jouée deux fois.' },
    soif: { name: 'Soif', icon: 'drop', good: true, desc: 'Gagne {n} Force chaque fois que tu paies des PV.' },
    pacte: { name: 'Pacte de sang', icon: 'drop', good: true, desc: 'Paie {n} PV et gagne 1 Encre au début de chaque tour.' },
    calice: { name: 'Grand calice', icon: 'heart', good: true, desc: 'Chaque coup qui inflige des dégâts te soigne de {n} PV.' },
    vigilance: { name: 'Vigilance', icon: 'veille', good: true, desc: 'Pioche {n} carte(s) de plus à chaque tour.' },
  };

  // ------------------------------------------------------------------ ennemis
  // moves : { name, dmg, hits, block, buff:{}, debuff:{}, curse, n }
  const ENEMIES = {
    // Acte I — les cryptes
    goule: {
      name: 'Goule affamée', act: 1, hp: [40, 44], art: 'ghoul', pal: 'emeraude',
      moves: { morsure: { name: 'Morsure', dmg: 11 }, griffes: { name: 'Griffes', dmg: 6, debuff: { faib: 1 } } },
      ai: (e, t, r) => (t === 0 ? 'griffes' : r() < 0.55 ? 'morsure' : 'griffes'),
    },
    acolyte: {
      name: 'Acolyte creux', act: 1, hp: [36, 40], art: 'hooded', pal: 'ambre',
      moves: { chant: { name: 'Chant creux', block: 6, buff: { force: 2 } }, fouet: { name: 'Fouet de corde', dmg: 5, hits: 2 } },
      ai: (e, t) => (t % 3 === 0 ? 'chant' : 'fouet'),
    },
    essaim: {
      name: 'Essaim de cendres', act: 1, hp: [28, 32], art: 'swarm', pal: 'rubis',
      moves: { nuee: { name: 'Nuée', dmg: 3, hits: 3 }, tourbillon: { name: 'Tourbillon', buff: { force: 2 }, block: 4 } },
      ai: (e, t) => (t % 3 === 2 ? 'tourbillon' : 'nuee'),
    },
    gargouille: {
      name: 'Gargouille du porche', act: 1, hp: [46, 50], art: 'gargoyle', pal: 'nuit',
      moves: { petrifier: { name: 'Se pétrifier', block: 12 }, ecraser: { name: 'Écrasement', dmg: 15 } },
      ai: (e, t) => (t % 2 === 0 ? 'petrifier' : 'ecraser'),
    },
    ratMoine: {
      name: 'Rat-moine', act: 1, hp: [32, 36], art: 'rat', pal: 'ambre',
      moves: { larcin: { name: 'Larcin', dmg: 6, steal: 12 }, morsure: { name: 'Morsure', dmg: 8 } },
      ai: (e, t) => (t % 2 === 0 ? 'larcin' : 'morsure'),
    },
    sentinelle: {
      name: 'Sentinelle d’ossements', act: 1, elite: true, hp: [68, 72], art: 'skeleton', pal: 'os',
      moves: {
        garde: { name: 'Garde', block: 12 },
        pique: { name: 'Double pique', dmg: 7, hits: 2 },
        hurle: { name: 'Hurlement d’os', debuff: { faib: 2 }, buff: { force: 1 } },
      },
      ai: (e, t) => ['pique', 'garde', 'hurle', 'pique'][t % 4],
    },
    chevalierCreux: {
      name: 'Chevalier creux', act: 1, elite: true, hp: [64, 68], art: 'knightFoe', pal: 'nuit',
      moves: {
        charge: { name: 'Charge', dmg: 9, debuff: { fel: 2 } },
        lance: { name: 'Lance rouillée', dmg: 12 },
        parade: { name: 'Parade', block: 10, buff: { force: 1 } },
      },
      ai: (e, t) => ['charge', 'lance', 'parade'][t % 3],
    },
    mereOs: {
      name: 'La Mère des Os', act: 1, boss: true, hp: [115, 115], art: 'boneMother', pal: 'os',
      moves: {
        pluie: { name: 'Pluie d’os', dmg: 4, hits: 3 },
        lamentation: { name: 'Lamentation', debuff: { faib: 2 }, curse: 'doute', n: 1 },
        ossature: { name: 'Ossature', block: 12, buff: { force: 1 } },
        etreinte: { name: 'Étreinte', dmg: 18 },
      },
      ai: (e, t) => ['pluie', 'lamentation', 'ossature', 'etreinte'][t % 4],
    },

    // Acte II — la nef
    penitent: {
      name: 'Pénitent flagellant', act: 2, hp: [56, 60], art: 'penitent', pal: 'rubis',
      moves: { flagellation: { name: 'Flagellation', buff: { force: 2 }, selfDmg: 4 }, discipline: { name: 'Discipline', dmg: 9 } },
      ai: (e, t) => (t % 3 === 0 ? 'flagellation' : 'discipline'),
    },
    vitrailPossede: {
      name: 'Vitrail possédé', act: 2, hp: [58, 62], art: 'mask', pal: 'saphir', start: { epinesP: 2 },
      moves: { eclats: { name: 'Éclats', dmg: 6, hits: 2 }, reflet: { name: 'Reflet', block: 13 } },
      ai: (e, t, r) => (t === 0 || r() < 0.6 ? 'eclats' : 'reflet'),
    },
    soeur: {
      name: 'Sœur sans visage', act: 2, hp: [50, 54], art: 'nun', pal: 'amethyste',
      moves: {
        regard: { name: 'Regard vide', debuff: { fel: 2, faib: 1 } },
        ongles: { name: 'Ongles', dmg: 13 },
        murmure: { name: 'Murmure', dmg: 7, curse: 'blessure', n: 1 },
      },
      ai: (e, t) => ['regard', 'ongles', 'murmure', 'ongles'][t % 4],
    },
    chien: {
      name: 'Chien du chapitre', act: 2, hp: [48, 52], art: 'hound', pal: 'ambre',
      moves: { curee: { name: 'Curée', dmg: 4, hits: 3 }, hurlement: { name: 'Hurlement', dmg: 5, buff: { force: 1 } } },
      ai: (e, t) => (t % 3 === 1 ? 'hurlement' : 'curee'),
    },
    cierge: {
      name: 'Cierge vivant', act: 2, hp: [42, 46], art: 'candleFoe', pal: 'or', start: { rituel: 1 },
      moves: { flamme: { name: 'Flamme', dmg: 7 }, cire: { name: 'Cire brûlante', dmg: 4, hits: 2 } },
      ai: (e, t) => (t % 2 ? 'cire' : 'flamme'),
    },
    bourreau: {
      name: 'Le Bourreau', act: 2, elite: true, hp: [96, 100], art: 'executioner', pal: 'rubis',
      moves: {
        chaine: { name: 'Chaîne', dmg: 6, debuff: { fel: 2 } },
        hache: { name: 'Hache', dmg: 17 },
        aiguiser: { name: 'Aiguiser', block: 10, buff: { force: 2 } },
      },
      ai: (e, t) => ['chaine', 'hache', 'aiguiser'][t % 3],
    },
    inquisiteur: {
      name: 'L’Inquisiteur', act: 2, elite: true, hp: [96, 102], art: 'inquisitor', pal: 'rubis',
      moves: {
        question: { name: 'La Question', dmg: 6, debuff: { fel: 1 } },
        sentence: { name: 'Sentence', dmg: 16 },
        aveu: { name: 'Aveu', block: 12, buff: { force: 2 } },
      },
      ai: (e, t) => ['question', 'sentence', 'aveu', 'sentence'][t % 4],
    },
    choeur: {
      name: 'Le Chœur Brisé', act: 2, boss: true, hp: [170, 170], art: 'choir', pal: 'or',
      moves: {
        cantique: { name: 'Cantique', dmg: 7, hits: 2 },
        dissonance: { name: 'Dissonance', debuff: { fel: 1, faib: 2 } },
        crescendo: { name: 'Crescendo', block: 16, buff: { force: 2 } },
        unisson: { name: 'Unisson', dmg: 22 },
      },
      ai: (e, t) => ['cantique', 'dissonance', 'crescendo', 'unisson', 'cantique'][t % 5],
    },

    // Acte III — le sanctuaire
    angeDechu: {
      name: 'Ange déchu', act: 3, hp: [68, 72], art: 'angel', pal: 'or',
      moves: { plumes: { name: 'Plumes de plomb', dmg: 3, hits: 4 }, aureole: { name: 'Auréole', block: 12, buff: { force: 1 } } },
      ai: (e, t) => (t % 3 === 2 ? 'aureole' : 'plumes'),
    },
    cloche: {
      name: 'Cloche maudite', act: 3, hp: [74, 78], art: 'bellFoe', pal: 'ambre',
      moves: {
        glas: { name: 'Glas', dmg: 18 },
        resonance: { name: 'Résonance', dmg: 8, debuff: { faib: 2 } },
        silence: { name: 'Silence', block: 18 },
      },
      ai: (e, t) => ['resonance', 'silence', 'glas'][t % 3],
    },
    scribe: {
      name: 'Scribe de l’Évêque', act: 3, hp: [62, 66], art: 'scribe', pal: 'amethyste',
      moves: {
        rature: { name: 'Rature', dmg: 6, curse: 'doute', n: 2 },
        plume: { name: 'Plume acérée', dmg: 14 },
        annotation: { name: 'Annotation', buff: { force: 2 }, block: 8 },
      },
      ai: (e, t) => ['plume', 'rature', 'annotation', 'plume'][t % 4],
    },
    gisant: {
      name: 'Gisant éveillé', act: 3, hp: [82, 86], art: 'effigy', pal: 'os',
      moves: { sommeil: { name: 'Sommeil de pierre', block: 20 }, reveil: { name: 'Réveil', dmg: 22 }, poids: { name: 'Poids des siècles', dmg: 10, debuff: { fel: 2 } } },
      ai: (e, t) => ['sommeil', 'reveil', 'poids'][t % 3],
    },
    heraut: {
      name: 'Héraut du glas', act: 3, hp: [70, 74], art: 'herald', pal: 'nuit',
      moves: { appel: { name: 'Appel', block: 12, buff: { force: 1 } }, echo: { name: 'Écho', dmg: 10 }, glas: { name: 'Grand Glas', dmg: 22 } },
      ai: (e, t) => ['appel', 'echo', 'glas'][t % 3],
    },
    reflet: {
      name: 'Reflet du Chevalier', act: 3, elite: true, hp: [118, 124], art: 'knightFoe', pal: 'saphir',
      moves: {
        taille: { name: 'Taille', dmg: 11 },
        egide: { name: 'Égide', block: 16, buff: { force: 1 } },
        heurt: { name: 'Heurt du pavois', dmg: 12, debuff: { fel: 2 } },
      },
      ai: (e, t) => ['heurt', 'taille', 'egide', 'taille'][t % 4],
    },
    seraphin: {
      name: 'Séraphin noir', act: 3, elite: true, hp: [124, 130], art: 'seraph', pal: 'nuit',
      moves: {
        ailes: { name: 'Six ailes', dmg: 4, hits: 4 },
        jugement: { name: 'Jugement', dmg: 18 },
        gloire: { name: 'Gloire', block: 16, buff: { force: 2 } },
      },
      ai: (e, t) => ['ailes', 'gloire', 'jugement'][t % 3],
    },
    eveque: {
      name: 'Aldric, l’Évêque de verre', act: 3, boss: true, hp: [240, 240], art: 'bishop', pal: 'saphir',
      moves: {
        rosace: { name: 'Rosace', dmg: 7, hits: 3 },
        hostie: { name: 'Hostie noire', debuff: { faib: 2, fel: 1 }, curse: 'doute', n: 1 },
        ostensoir: { name: 'Ostensoir', block: 20, buff: { force: 2 } },
        lumiereMorte: { name: 'Lumière morte', dmg: 26 },
      },
      ai: (e, t) => ['rosace', 'hostie', 'ostensoir', 'lumiereMorte', 'rosace'][t % 5],
    },
  };

  const ACT_POOLS = {
    1: { normal: ['goule', 'acolyte', 'essaim', 'gargouille', 'ratMoine'], elite: ['chevalierCreux', 'sentinelle'], boss: 'mereOs', name: 'Les Cryptes', pal: 'emeraude' },
    2: { normal: ['penitent', 'vitrailPossede', 'soeur', 'chien', 'cierge'], elite: ['inquisiteur', 'bourreau'], boss: 'choeur', name: 'La Nef', pal: 'rubis' },
    3: { normal: ['angeDechu', 'cloche', 'scribe', 'gisant', 'heraut'], elite: ['seraphin', 'reflet'], boss: 'eveque', name: 'Le Sanctuaire', pal: 'saphir' },
  };

  // ------------------------------------------------------------------ reliques
  // hooks : combatStart(c), turnStart(c), combatEnd(run), cardPlayed(c, card), hpLow(c)
  const RELICS = {
    cendrier: { name: 'Cendrier ardent', rarity: 'start', art: 'flame', pal: 'amethyste', desc: 'Au début de chaque combat, applique 3 Brûlure à tous les ennemis.', combatStart: (c) => c.enemies.forEach((e) => c.apply('brulure', 3, e)) },
    calice: { name: 'Calice de sang', rarity: 'start', art: 'chalice', pal: 'rubis', desc: 'Après chaque combat, soigne 9 PV.', combatEnd: () => G.Run.heal(9) },
    vitrailSaint: { name: 'Vitrail saint', rarity: 'c', lock: 'gardien', art: 'sun', pal: 'saphir', desc: 'Au début de chaque combat, soigne 3 PV.', combatStart: (c) => c.heal(3) },
    aureole: { name: 'Auréole ternie', rarity: 'u', lock: 'intouchable', art: 'crown', pal: 'or', desc: 'Élites et gardiens commencent chaque combat avec 1 Faiblesse.', combatStart: (c) => c.enemies.forEach((e) => (e.def.elite || e.def.boss) && c.apply('faib', 1, e)) },
    trinite: { name: 'Trinité', rarity: 'r', lock: 'trio', art: 'rose', pal: 'amethyste', desc: '+1 Encre par tour.', energy: 1 },
    ecuSaphir: { name: 'Écu de saphir', rarity: 'start', art: 'shield', pal: 'saphir', desc: 'Au début de chaque combat, gagne 6 Armure.', combatStart: (c) => c.block(6) },
    chapelet: { name: 'Chapelet d’ambre', rarity: 'c', art: 'rose', pal: 'ambre', desc: 'Après chaque combat, soigne 6 PV.', combatEnd: (run) => G.Run.heal(6) },
    encrier: { name: 'Encrier sans fond', rarity: 'c', art: 'chalice', pal: 'nuit', desc: '+1 Encre au premier tour de chaque combat.', turnStart: (c) => c.turn === 1 && c.gainInk(1) },
    plume: { name: 'Plume de corbeau', rarity: 'c', art: 'feather', pal: 'nuit', desc: 'Pioche 2 cartes de plus au premier tour.', turnStart: (c) => c.turn === 1 && c.draw(2) },
    cierge: { name: 'Cierge éternel', rarity: 'c', art: 'candle', pal: 'or', desc: 'Au début de chaque combat, gagne 1 Force.', combatStart: (c) => c.self('force', 1) },
    sablier: { name: 'Sablier fêlé', rarity: 'c', art: 'hourglass', pal: 'ambre', desc: 'Les ennemis commencent chaque combat avec 2 Fêlure.', combatStart: (c) => c.enemies.forEach((e) => c.apply('fel', 2, e)) },
    cendre: { name: 'Cendre bénite', rarity: 'c', art: 'flame', pal: 'os', desc: 'Les ennemis commencent chaque combat avec 1 Faiblesse.', combatStart: (c) => c.enemies.forEach((e) => c.apply('faib', 1, e)) },
    couronne: { name: 'Couronne d’épines', rarity: 'c', art: 'crown', pal: 'rubis', desc: 'Au début de chaque combat, gagne 3 Épines permanentes.', combatStart: (c) => c.self('epinesP', 3) },
    bourse: { name: 'Bourse du passeur', rarity: 'c', art: 'coin', pal: 'or', desc: 'Gagne 50 % d’or en plus.' },
    lanterne: { name: 'Lanterne sourde', rarity: 'u', art: 'candle', pal: 'ambre', desc: 'Au début de ton tour, si tu n’as pas d’Armure, gagne 4 Armure.', turnStart: (c) => c.p.block === 0 && c.block(4) },
    ampoule: { name: 'Ampoule sacrée', rarity: 'u', art: 'drop', pal: 'rubis', desc: 'La première fois par combat que tes PV passent sous la moitié, gagne 12 Armure.', hpLow: (c) => c.block(12) },
    reliquaire: { name: 'Reliquaire', rarity: 'u', art: 'book', pal: 'or', desc: 'Les récompenses proposent 4 cartes au lieu de 3.' },
    cle: { name: 'Clé de la crypte', rarity: 'u', art: 'key', pal: 'os', desc: 'Le marchand fait 25 % de remise.' },
    sceau: { name: 'Sceau de l’abbé', rarity: 'u', art: 'sun', pal: 'or', desc: 'Les autels soignent 15 PV de plus.' },
    clocheBronze: { name: 'Cloche de bronze', rarity: 'u', art: 'bell', pal: 'ambre', desc: 'Toutes les 6 cartes jouées, pioche 1 carte.', cardPlayed: (c) => c.stats.played % 6 === 0 && c.draw(1) },
    gantFer: { name: 'Gantelet de fer', rarity: 'r', art: 'fist', pal: 'nuit', desc: 'Les cartes à 0 Encre infligent 3 dégâts à l’ennemi.', cardPlayed: (c, card) => G.cardCost(card) === 0 && c.pierce(3) },
    eclatRosace: { name: 'Éclat de rosace', rarity: 'r', art: 'rose', pal: 'saphir', desc: 'Tous les 3 tours, gagne 1 Encre.', turnStart: (c) => c.turn % 3 === 0 && c.gainInk(1) },
    coeurVerre: { name: 'Cœur de verre', rarity: 'r', art: 'heart', pal: 'rubis', desc: '+10 PV maximum.', onGain: () => G.Run.addMaxHp(10) },
    // reliques de boss
    ostensoir: { name: 'Ostensoir', rarity: 'boss', art: 'sun', pal: 'or', desc: '+1 Encre par tour. Les autels ne soignent plus.', energy: 1 },
    rosaceOr: { name: 'Rosace d’or', rarity: 'boss', art: 'rose', pal: 'or', desc: '+1 Encre par tour. Pioche 1 carte de moins.', energy: 1, drawMod: -1 },
    grimoireScelle: { name: 'Grimoire scellé', rarity: 'boss', art: 'book', pal: 'rubis', desc: '+1 Encre par tour. Ajoute 2 Doutes à ton paquet.', energy: 1, onGain: () => G.Run.addCard('doute', false, 2) },
  };

  // ------------------------------------------------------------------ événements
  const EVENTS = [
    {
      id: 'reliquaireVerre', title: 'Le Reliquaire de verre', art: 'chalice', pal: 'saphir',
      text: 'Sous une cloche de cristal, un coussin de velours attend une offrande. La lumière y tombe en colonne, comme sur un saint.',
      choices: [
        { label: 'Y déposer une carte', detail: 'Bénis une carte de ton choix.', act: (R) => R.chooseEnchant('bless') },
        { label: 'Garder tes distances', detail: 'Rien ne se passe.', act: () => 'La lumière se retire doucement.' },
      ],
    },
    {
      id: 'forgeNoire', title: 'La Forge noire', art: 'flame', pal: 'nuit',
      text: 'Un four où brûle un feu sans couleur. Ce qu’on y trempe en ressort plus fort, et plus avide.',
      choices: [
        { label: 'Tremper une carte', detail: 'Maudis une carte : plus puissante, mais avec un prix.', act: (R) => R.chooseEnchant('curse') },
        { label: 'Reculer', detail: 'Rien ne se passe.', act: () => 'Le feu sans couleur te regarde partir.' },
      ],
    },
    {
      id: 'confessionnal', title: 'Le Confessionnal', art: 'hand', pal: 'nuit',
      text: 'Derrière la grille de bois, quelqu’un respire. Une voix sans âge murmure : « Dis-moi ce que tu portes, et je t’en délivrerai. »',
      choices: [
        { label: 'Avouer', detail: 'Perds 6 PV. Retire une carte de ton paquet.', act: (R) => R.hurt(6) || R.chooseRemove() },
        { label: 'Garder le silence', detail: 'Rien ne se passe.', act: () => 'Tu repars, plus lourd qu’avant.' },
      ],
    },
    {
      id: 'fontaine', title: 'La Fontaine de cire', art: 'chalice', pal: 'ambre',
      text: 'Une vasque déborde de cire tiède. Elle a la couleur du miel et l’odeur des cierges éteints.',
      choices: [
        { label: 'S’y baigner les mains', detail: 'Soigne 20 PV.', act: (R) => R.heal(20) && 'La chaleur remonte jusqu’au cœur.' },
        { label: 'Fouiller le fond', detail: 'Gagne une relique. Ajoute un Doute à ton paquet.', act: (R) => (R.gainRandomRelic(), R.addCard('doute'), 'Tes doigts se referment sur quelque chose de froid.') },
      ],
    },
    {
      id: 'orgue', title: 'L’Orgue silencieux', art: 'tower', pal: 'or',
      text: 'Les tuyaux montent dans l’ombre comme une forêt d’argent. Les touches sont tachées de sang séché.',
      choices: [
        { label: 'Jouer', detail: 'Perds 7 PV. Améliore 2 cartes au hasard.', act: (R) => (R.hurt(7), R.upgradeRandom(2)) },
        { label: 'Écouter le silence', detail: 'Soigne 8 PV.', act: (R) => R.heal(8) && 'Le silence, parfois, guérit.' },
      ],
    },
    {
      id: 'gisant', title: 'Le Gisant', art: 'sword', pal: 'os',
      text: 'Un chevalier de pierre dort sur son tombeau, les mains jointes sur une épée qui, elle, n’est pas de pierre.',
      choices: [
        { label: 'Prendre l’épée', detail: 'Perds 10 PV. Gagne une carte rare.', act: (R) => (R.hurt(10), R.gainRandomCard('r')) },
        { label: 'Prier à ses côtés', detail: 'Soigne 12 PV.', act: (R) => R.heal(12) && 'Il te semble l’entendre respirer.' },
      ],
    },
    {
      id: 'vitrailPleure', title: 'Le Vitrail qui pleure', art: 'eye', pal: 'saphir',
      text: 'Le visage d’une sainte, sur le vitrail, verse des larmes de verre bleu qui s’amassent au sol.',
      choices: [
        { label: 'Recueillir les larmes', detail: '+6 PV maximum.', act: (R) => (R.addMaxHp(6), 'Elles ont le goût du sel et de la pluie.') },
        { label: 'Briser le vitrail', detail: 'Gagne 75 or. Ajoute une Plaie à ton paquet.', act: (R) => (R.gainGold(75), R.addCard('blessure'), 'Le verre te mord en tombant.') },
      ],
    },
    {
      id: 'pelerin', title: 'Le Pèlerin', art: 'feather', pal: 'nuit',
      text: 'Un vieil homme sans yeux tend une main ouverte. « Une pièce, chevalier, et je te dirai ce que j’ai vu avant de perdre la vue. »',
      choices: [
        { label: 'Donner 40 or', detail: 'Gagne une relique.', cond: (R) => R.run.gold >= 40, act: (R) => (R.gainGold(-40), R.gainRandomRelic(), 'Il te glisse un objet dans la paume.') },
        { label: 'Passer ton chemin', detail: 'Rien ne se passe.', act: () => 'Il rit doucement dans ton dos.' },
      ],
    },
    {
      id: 'cloches', title: 'La Chambre des cloches', art: 'bell', pal: 'ambre',
      text: 'Des cordes pendent du plafond, chacune reliée à une cloche invisible. L’une d’elles est tressée d’or.',
      choices: [
        { label: 'Tirer la corde d’or', detail: '50 % : une relique. 50 % : perds 12 PV.', act: (R) => (Math.random() < 0.5 ? (R.gainRandomRelic(), 'Un tintement clair. Quelque chose tombe à tes pieds.') : (R.hurt(12), 'Le bourdon s’abat. Tes oreilles saignent.')) },
        { label: 'Ne rien toucher', detail: 'Rien ne se passe.', act: () => 'Les cordes oscillent encore quand tu t’éloignes.' },
      ],
    },
    {
      id: 'bibliotheque', title: 'La Bibliothèque engloutie', art: 'book', pal: 'emeraude',
      text: 'L’eau monte jusqu’aux genoux. Sur les étagères, des grimoires gonflés d’humidité murmurent leurs pages.',
      choices: [
        { label: 'Lire', detail: 'Choisis 1 carte parmi 5.', act: (R) => R.chooseCard(5) },
        { label: 'Dormir', detail: 'Soigne 15 PV.', act: (R) => R.heal(15) && 'Tu rêves de lettres enluminées.' },
      ],
    },
    {
      id: 'pacte', title: 'Le Pacte', art: 'skull', pal: 'rubis',
      text: 'Sur un lutrin, un parchemin et une plume trempée dans quelque chose de trop rouge pour être de l’encre.',
      choices: [
        { label: 'Signer', detail: 'Gagne 120 or. Ajoute 2 Doutes à ton paquet.', act: (R) => (R.gainGold(120), R.addCard('doute', false, 2), 'Ton nom brûle un instant, puis disparaît.') },
        { label: 'Refuser', detail: 'Rien ne se passe.', act: () => 'La plume se brise d’elle-même.' },
      ],
    },
    {
      id: 'forge', title: 'La Forge des verriers', art: 'flame', pal: 'ambre',
      text: 'Le four ronfle encore. Des cannes de souffleur attendent, et des moules en forme de saints.',
      choices: [
        { label: 'Retremper une carte', detail: 'Améliore une carte de ton choix.', act: (R) => R.chooseUpgrade() },
        { label: 'Se réchauffer', detail: 'Soigne 10 PV.', act: (R) => R.heal(10) && 'Le feu chasse le froid des cryptes.' },
      ],
    },
  ];

  // ------------------------------------------------------------------ fioles (usage unique)
  const POTIONS = {
    larme: { name: 'Larme de sainte', pal: 'ciel', desc: 'Soigne 18 PV. Utilisable partout.', anywhere: true, use: (c) => (c ? c.heal(18) : G.Run.heal(18)) },
    feu: { name: 'Feu grégeois', pal: 'ambre', desc: 'Inflige 20 dégâts à l’ennemi.', use: (c) => c.pierce(20) },
    verre: { name: 'Verre fondu', pal: 'saphir', desc: 'Gagne 14 Armure.', use: (c) => c.block(14) },
    encre: { name: 'Encre de seiche', pal: 'nuit', desc: 'Gagne 2 Encre.', use: (c) => c.gainInk(2) },
    acide: { name: 'Acide de verrier', pal: 'emeraude', desc: 'Applique 3 Fêlure.', use: (c) => c.apply('fel', 3) },
    elixir: { name: 'Élixir du templier', pal: 'rubis', desc: 'Gagne 3 Force pour ce combat.', use: (c) => c.self('force', 3) },
    corbeau: { name: 'Encre de corbeau', pal: 'amethyste', desc: 'Pioche 3 cartes.', use: (c) => c.draw(3) },
    cendre: { name: 'Cendre grise', pal: 'os', desc: 'Applique 2 Faiblesse.', use: (c) => c.apply('faib', 2) },
  };

  G.POTIONS = POTIONS;
  G.CARDS = CARDS;
  G.HEROES = HEROES;
  G.STATUS = STATUS;
  G.ENEMIES = ENEMIES;
  G.ACT_POOLS = ACT_POOLS;
  G.RELICS = RELICS;
  G.EVENTS = EVENTS;

  // ------------------------------------------------------------------ cartes transformées
  // Une carte peut porter une transformation : bénédiction (avantage pur) ou malédiction
  // (plus puissante, mais avec un prix). Elle est notée dans l'instance de la carte : card.ench.
  const ENCH = {
    eco: { name: 'Économe', kind: 'bless', desc: 'Coûte 1 Encre de moins.', ok: (def) => def.cost >= 1 },
    vive: { name: 'Vive', kind: 'bless', desc: 'Pioche 1 carte quand tu la joues.', onPlay: (c) => c.draw(1) },
    tenace: { name: 'Tenace', kind: 'bless', desc: 'Reste dans ta main à la fin du tour.', ok: (def) => def.type !== 'pow' },
    ardente: { name: 'Ardente', kind: 'bless', desc: 'Inflige 3 dégâts à la cible quand tu la joues.', onPlay: (c) => c.pierce(3) },
    sainte: { name: 'Sainte', kind: 'bless', desc: 'Soigne 2 PV quand tu la joues.', onPlay: (c) => c.heal(2) },
    sanglante: { name: 'Sanglante', kind: 'curse', desc: 'Ses valeurs augmentent de moitié, mais elle coûte 2 PV.', mul: 1.5, hp: 2, ok: (def) => Object.keys(def.v || {}).length > 0 },
    fragile: { name: 'Fragile', kind: 'curse', desc: 'Ses valeurs doublent, mais elle s’épuise.', mul: 2, exhaust: true, ok: (def) => Object.keys(def.v || {}).length > 0 && def.type !== 'pow' },
  };
  G.ENCH = ENCH;
  /** Transformations possibles pour une carte (kind : 'bless' ou 'curse'). */
  G.enchOptions = function (cardInst, kind) {
    const def = CARDS[cardInst.id];
    if (def.type === 'curse' || cardInst.ench) return [];
    return Object.keys(ENCH).filter((k) => ENCH[k].kind === kind && (!ENCH[k].ok || ENCH[k].ok(def)));
  };

  G.cardCost = function (cardInst) {
    const def = CARDS[cardInst.id];
    if (def.unplayable) return -1;
    let cost = cardInst.up && def.upCost !== undefined ? def.upCost : def.cost;
    if (cardInst.ench === 'eco') cost = Math.max(0, cost - 1);
    return cost;
  };
  /** PV à payer pour jouer la carte (Saigneur, cartes sanglantes). */
  G.cardHp = function (cardInst) {
    const def = CARDS[cardInst.id];
    let hp = def.hp ? (cardInst.up && def.upHp !== undefined ? def.upHp : def.hp) : 0;
    if (cardInst.ench && ENCH[cardInst.ench] && ENCH[cardInst.ench].hp) hp += ENCH[cardInst.ench].hp;
    return hp;
  };
  G.cardVals = (cardInst) => {
    const def = CARDS[cardInst.id];
    const v = cardInst.up ? Object.assign({}, def.v, def.up) : Object.assign({}, def.v);
    const en = cardInst.ench && ENCH[cardInst.ench];
    if (en && en.mul) for (const k in v) if (typeof v[k] === 'number' && v[k] > 0) v[k] = Math.ceil(v[k] * en.mul);
    return v;
  };
})(typeof window !== 'undefined' ? (window.G = window.G || {}) : module.exports);
