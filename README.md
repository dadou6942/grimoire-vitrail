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

## Règles

- Tu grimpes **3 actes**. Chaque acte compte **5 étages** puis un gardien (boss).
- **À chaque étage, tu choisis librement ta porte** parmi trois : combat (avec le portrait de l'ennemi), élite, marchand, autel, mystère ou trésor.
  Certains combats ont une **variante** qui rapporte davantage :
  - **Enragé** : l'ennemi commence avec 2 Force. Tu gagnes plus d'or et des cartes plus rares.
  - **Cuirassé** : l'ennemi est plus robuste. Tu gagnes le double d'or.
  - **Dans la brume** : ses intentions sont cachées. Une fiole t'est garantie.
- Chaque combat est un duel. Tu disposes de **3 points d'Encre** par tour et tu pioches 5 cartes.
  **Touche une carte** pour la choisir, puis **touche-la encore** pour la jouer, ou fais-la glisser vers le haut. Un appui long l'affiche en grand.
- Dès que ton doigt se pose sur une carte, les jauges **montrent son effet** : PV retirés à l'ennemi et Armure gagnée.
  La partie claire de ta jauge indique les PV que tu perdras si tu termines ton tour.
- L'icône au-dessus de l'ennemi annonce **son prochain geste** et ses dégâts exacts.
- **Armure** : absorbe les dégâts, et disparaît au début de ton tour. **Fêlure** : la cible subit 50 % de dégâts en plus.
  **Faiblesse** : la cible inflige 25 % de dégâts en moins. **Épines** : renvoient des dégâts à chaque coup reçu.
- Tu portes **3 fioles** au plus à ta ceinture. Touche une fiole pour la boire.
- Après chaque victoire, tu choisis une carte (parfois déjà améliorée). Les élites donnent une relique, les gardiens une relique puissante.
  Tu récupères tous tes PV entre deux actes.
- Un guide explique les gestes lors de la première partie. Le menu ☰ permet de revoir les conseils, d'accélérer les animations,
  de sauvegarder et quitter, ou d'abandonner.

## Contenu

- **Trois héros**, chacun avec ses cartes et sa relique :
  - **le Chevalier** (34 cartes) : armure, épines, contre-attaques ;
  - **la Sorcière** (22 cartes) : la **Brûlure** ronge l'ennemi à chaque tour, à travers l'Armure, et ses sorts s'enchaînent ;
  - **le Saigneur** (21 cartes) : il **paie en PV** des coups dévastateurs et vole la vie.
- **Progression entre les parties** : la Sorcière s'éveille après ton premier gardien vaincu, le Saigneur après le troisième.
  Chaque victoire débloque le **palier** suivant (5 paliers de difficulté cumulables) pour le héros qui l'a remportée.
- **24 ennemis** : 15 ennemis, 6 élites et 3 gardiens, du Rat-moine voleur à Aldric, l'Évêque de verre.
- **21 reliques**, **8 fioles** et **10 événements**.

## Structure

```
index.html, style.css   écrans et style
js/data.js              cartes, héros, ennemis, reliques, événements
js/engine.js            partie en cours, carte d'ascension, règles de combat
js/art.js               générateur de vitraux (Voronoï, plomb, grisaille, motifs et figures)
js/fx.js                éclats de verre (pré-découpés), étincelles, poussières, transition en rosace
js/ui.js                écrans, main de cartes au doigt, déroulé animé des combats
tools/balance.js        un bot joue des centaines de parties pour mesurer la difficulté
tools/enemies.js        PV perdus par combat avec le paquet de départ
tools/make-icons.js     icônes de l'application
```

Équilibrage : `node tools/balance.js 500 chevalier` (ou `sorciere`, `saigneur`). Le bot simple gagne de 25 à 33 % de ses parties sans passer par le marchand ni boire de fiole.
