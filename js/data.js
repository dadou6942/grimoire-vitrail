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
      id: 'sorciere', name: 'La Sorcière', title: 'Lectrice des cendres', color: 'amethyste', locked: true, art: 'witch',
      desc: 'Sorts enchaînés et brûlures. Bientôt.',
    },
    saigneur: {
      id: 'saigneur', name: 'Le Saigneur', title: 'Prêtre du sang', color: 'rubis', locked: true, art: 'bleeder',
      desc: 'Paie en sang des coups dévastateurs. Bientôt.',
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
    1: { normal: ['goule', 'acolyte', 'essaim', 'gargouille'], elite: ['chevalierCreux'], boss: 'mereOs', name: 'Les Cryptes', pal: 'emeraude' },
    2: { normal: ['penitent', 'vitrailPossede', 'soeur', 'chien'], elite: ['inquisiteur'], boss: 'choeur', name: 'La Nef', pal: 'rubis' },
    3: { normal: ['angeDechu', 'cloche', 'scribe', 'gisant'], elite: ['seraphin'], boss: 'eveque', name: 'Le Sanctuaire', pal: 'saphir' },
  };

  // ------------------------------------------------------------------ reliques
  // hooks : combatStart(c), turnStart(c), combatEnd(run), cardPlayed(c, card), hpLow(c)
  const RELICS = {
    ecuSaphir: { name: 'Écu de saphir', rarity: 'start', art: 'shield', pal: 'saphir', desc: 'Au début de chaque combat, gagne 6 Armure.', combatStart: (c) => c.block(6) },
    chapelet: { name: 'Chapelet d’ambre', rarity: 'c', art: 'rose', pal: 'ambre', desc: 'Après chaque combat, soigne 6 PV.', combatEnd: (run) => G.Run.heal(6) },
    encrier: { name: 'Encrier sans fond', rarity: 'c', art: 'chalice', pal: 'nuit', desc: '+1 Encre au premier tour de chaque combat.', turnStart: (c) => c.turn === 1 && c.gainInk(1) },
    plume: { name: 'Plume de corbeau', rarity: 'c', art: 'feather', pal: 'nuit', desc: 'Pioche 2 cartes de plus au premier tour.', turnStart: (c) => c.turn === 1 && c.draw(2) },
    cierge: { name: 'Cierge éternel', rarity: 'c', art: 'candle', pal: 'or', desc: 'Au début de chaque combat, gagne 1 Force.', combatStart: (c) => c.self('force', 1) },
    sablier: { name: 'Sablier fêlé', rarity: 'c', art: 'hourglass', pal: 'ambre', desc: 'L’ennemi commence chaque combat avec 2 Fêlure.', combatStart: (c) => c.apply('fel', 2) },
    cendre: { name: 'Cendre bénite', rarity: 'c', art: 'flame', pal: 'os', desc: 'L’ennemi commence chaque combat avec 1 Faiblesse.', combatStart: (c) => c.apply('faib', 1) },
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

  G.CARDS = CARDS;
  G.HEROES = HEROES;
  G.STATUS = STATUS;
  G.ENEMIES = ENEMIES;
  G.ACT_POOLS = ACT_POOLS;
  G.RELICS = RELICS;
  G.EVENTS = EVENTS;

  G.cardCost = function (cardInst) {
    const def = CARDS[cardInst.id];
    if (def.unplayable) return -1;
    if (cardInst.up && def.upCost !== undefined) return def.upCost;
    return def.cost;
  };
  G.cardVals = (cardInst) => {
    const def = CARDS[cardInst.id];
    return cardInst.up ? Object.assign({}, def.v, def.up) : def.v;
  };
})(typeof window !== 'undefined' ? (window.G = window.G || {}) : module.exports);
