# Grimoire de Vitrail

Un jeu de cartes en solo, dans un univers dark fantasy, pensé pour iPhone : en portrait, à une main, en parties de 15 à 20 minutes.
Toutes les images sont des **vitraux générés par le code** : cellules de verre, plomb, grisaille et lumière qui suit le doigt.
Il n'y a aucune image ni aucune dépendance, et pas d'étape de build.

## Jouer

Sur iPhone, ouvre la page du jeu dans Safari, puis **Partager → Sur l'écran d'accueil** : le jeu se lance alors en plein écran,
comme une application, et fonctionne ensuite hors ligne.

En local :

```bash
python3 -m http.server 8000
# puis http://<ip-de-l-ordinateur>:8000 sur le téléphone (même Wi-Fi)
```

Le dossier se publie tel quel sur GitHub Pages (Settings → Pages → branche `main`, dossier racine).

## Sur PC

Sur un grand écran, l'interface s'agrandit pour remplir la hauteur de la fenêtre et s'élargit (cartes, portes,
Grimoire). On joue à la souris (cliquer deux fois une carte, ou la glisser sur un ennemi) ou au clavier :

| Touche | Action |
|---|---|
| 1 à 9 (0 = 10e carte) | choisir une carte ; la même touche la joue |
| Entrée ou Espace | jouer la carte choisie, sinon finir le tour |
| ← → | changer d'ennemi ciblé |
| Échap | annuler, fermer une fenêtre, ou ouvrir la pause |

## Règles

- Tu grimpes **3 actes**. Chaque acte compte **5 étages** puis un gardien (boss).
- **À chaque étage, tu choisis librement ta porte** parmi trois : combat (avec le portrait de l'ennemi), élite, marchand, autel, mystère ou trésor.
  Certains combats ont une **variante** qui rapporte davantage :
  - **Enragé** : l'ennemi commence avec 2 Force. Tu gagnes plus d'or et des cartes plus rares.
  - **Cuirassé** : l'ennemi est plus robuste. Tu gagnes le double d'or.
  - **Dans la brume** : ses intentions sont cachées. Une fiole t'est garantie.
- Un combat oppose ton héros à un ennemi, ou à une **meute de 2 ou 3 ennemis** (porte marquée ×2 ou ×3) ; certaines élites viennent **escortées**.
  Pour viser, **fais glisser la carte sur l'ennemi** choisi (ou touche un ennemi pour en faire ta cible).
- Tu disposes de **3 points d'Encre** par tour et tu pioches 5 cartes.
  **Touche une carte** pour la choisir, puis **touche-la encore** pour la jouer, ou fais-la glisser vers le haut. Un appui long l'affiche en grand.
- Dès que ton doigt se pose sur une carte, les jauges **montrent son effet** : PV retirés à l'ennemi et Armure gagnée.
  La partie claire de ta jauge indique les PV que tu perdras si tu termines ton tour.
- L'icône au-dessus de l'ennemi annonce **son prochain geste** et ses dégâts exacts.
- **Armure** : absorbe les dégâts, et disparaît au début de ton tour. **Fêlure** : la cible subit 50 % de dégâts en plus.
  **Faiblesse** : la cible inflige 25 % de dégâts en moins. **Épines** : renvoient des dégâts à chaque coup reçu.
- Tu portes **3 fioles** au plus à ta ceinture. Touche une fiole pour la boire.
- Après chaque victoire, tu choisis une carte (parfois déjà améliorée). Les élites donnent une relique, les gardiens une relique puissante.
  Tu récupères tous tes PV entre deux actes.
- Un guide explique les gestes lors de la première partie. Le menu ☰ ouvre un pupitre en bas de l'écran : paquet, animations,
  conseils, compte, sauvegarder et quitter, ou abandonner.

## Sauvegardes et comptes

- La partie est sauvegardée en continu. Si tu quittes (ou si le téléphone ferme l'app), tu reprends **exactement** où tu en étais :
  en plein combat, sur une récompense, chez le marchand… Le bouton « Sauvegarder et quitter » refuse de quitter
  pendant le tour de l'ennemi.
- Les sauvegardes survivent aux mises à jour : les anciennes sont adaptées automatiquement, chaque écriture a une copie
  de secours, et une sauvegarde abîmée n'est jamais effacée (`node tools/test-saves.js` le vérifie).
- **Compte et sauvegarde** (écran titre ou menu ☰) :
  - un **code de transfert** pour passer ta progression d'un appareil à l'autre, sans compte ;
  - des **comptes en ligne** pour synchroniser automatiquement ses appareils. Pour les activer, suis le guide [COMPTES.md](COMPTES.md) (projet Supabase gratuit, une dizaine de minutes).

## Contenu

- **Trois héros**, chacun avec ses cartes et sa relique :
  - **le Chevalier** (36 cartes) : armure, épines, contre-attaques ;
  - **la Sorcière** (24 cartes) : la **Brûlure** ronge l'ennemi à chaque tour, à travers l'Armure, et ses sorts s'enchaînent ;
  - **le Saigneur** (23 cartes) : il **paie en PV** des coups dévastateurs et vole la vie.
- **Progression entre les parties** : la Sorcière s'éveille après ton premier gardien vaincu, le Saigneur après le troisième.
  Chaque victoire débloque le **palier** suivant (5 paliers de difficulté cumulables) pour le héros qui l'a remportée.
- **31 ennemis** : 18 ennemis, 8 élites, 4 gardiens et l'Éclat de la Mère, du Rat-moine voleur à Aldric, l'Évêque de verre. Parmi eux :
  - **le Lecteur sans yeux** recopie ta dernière attaque ; **l'Essaim de cierges** vient toujours à trois et te brûle ;
  - **la Cloche-qui-pleure** glisse des « Échos » injouables dans ta pioche ;
  - **le Reliquaire ambulant** vole ton or, mais rend une relique de plus s'il tombe vite ;
  - **l'Ange de plomb** se cuirasse à chaque coup reçu ;
  - **la Mère-Verrière**, gardienne de l'acte II une partie sur deux, se brise en deux éclats qui se ressoudent s'ils survivent trois tours.
- **26 reliques**, **8 fioles** et **12 événements**.

## Progression (Grimoire)

Le bouton **Grimoire** de l'écran titre réunit tout ce qui suit d'une partie à l'autre ; on passe d'une page à l'autre
par les quatre médaillons de verre en bas de l'écran.

- **Pactes** : avant de partir, signe jusqu'à 3 pactes (9 en tout). Chacun ajoute une contrainte
  (ennemis plus forts, moins d'or, pas de soin à l'autel…) et augmente l'expérience gagnée.
- **Compétences** : chaque partie rapporte de l'expérience au héros joué (étages, ennemis, élites, gardiens, victoire).
  Chaque niveau (15 au plus) donne un point à placer dans son arbre : 3 branches de 4 compétences.
  On peut tout réinitialiser gratuitement.
- **Cartes transformées** : une carte peut être **bénie** (moins chère, conservée en main, plus forte…)
  à l'autel ou chez le marchand, ou **maudite** (bien plus puissante, mais coûteuse en PV ou épuisée) lors d'événements.
- **Succès** : 19 succès, dont beaucoup débloquent des cartes, des reliques ou des pactes.
- **Collection** : cartes, reliques, ennemis et fioles rencontrés ; ce qui reste à découvrir apparaît en silhouette.
- **Statistiques** : générales, par héros, cartes les plus jouées, ennemis les plus vaincus et les plus meurtriers, et les 20 dernières parties.

## Structure

```
index.html, style.css   écrans et style
js/data.js              cartes, héros, ennemis, reliques, événements
js/engine.js            partie en cours, portes, règles de combat, sauvegardes et migrations
js/meta.js              expérience, compétences, pactes, succès, collection, statistiques
js/cloud.js             comptes en ligne (Supabase) et synchronisation
js/config.js            adresse et clé publique du projet Supabase (vides = sans compte)
js/art.js               générateur de vitraux (Voronoï, plomb, grisaille, motifs et figures)
js/fx.js                éclats de verre (pré-découpés), étincelles, poussières, transition en rosace
js/ui.js                écrans, main de cartes au doigt, déroulé animé des combats
tools/balance.js        un bot joue des centaines de parties pour mesurer la difficulté
tools/enemies.js        PV perdus par combat avec le paquet de départ
tools/make-icons.js     icônes de l’application
tools/test-saves.js     vérifie la migration des sauvegardes et le code de transfert
tools/mock-supabase.js  faux serveur Supabase pour tester les comptes
tools/bump.js           numéro de version (à lancer avant chaque publication : node tools/bump.js X.Y.Z)
```

Équilibrage : `node tools/balance.js 500 chevalier` (ou `sorciere`, `saigneur`). Le bot simple gagne de 25 à 33 % de ses parties sans passer par le marchand ni boire de fiole.
