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

- Tu grimpes **3 actes de 5 étages**. Avant chaque étage, tu choisis ton chemin sur la carte : combat, élite, marchand, autel ou mystère.
  Un gardien (boss) t'attend au sommet de chaque acte.
- Chaque combat est un duel. Tu disposes de **3 points d'Encre** par tour et tu pioches 5 cartes. Pour jouer une carte, **fais-la glisser vers le haut**.
  Touche une carte pour la lire en grand.
- L'icône au-dessus de l'ennemi annonce **son prochain geste** et ses dégâts exacts.
- **Armure** : absorbe les dégâts, et disparaît au début de ton tour. **Fêlure** : la cible subit 50 % de dégâts en plus.
  **Faiblesse** : la cible inflige 25 % de dégâts en moins. **Épines** : renvoient des dégâts à chaque coup reçu.
- Après chaque victoire, tu choisis une nouvelle carte. Les élites donnent une relique, les gardiens une relique puissante.
  Tu récupères tous tes PV entre deux actes.
- À l'autel, tu peux te soigner ou améliorer une carte. Chez le marchand, tu peux acheter des cartes ou des reliques, ou retirer une carte de ton paquet.

## Contenu (version 1)

- **Le Chevalier** : 28 cartes (armure, épines, contre-attaques). La Sorcière et le Saigneur arrivent dans la version 2.
- **18 ennemis** : 12 ennemis, 3 élites et 3 gardiens, de la Mère des Os à Aldric, l'Évêque de verre.
- **21 reliques**, dont 3 de gardien, et **10 événements**.

## Structure

```
index.html, style.css   écrans et style
js/data.js              cartes, héros, ennemis, reliques, événements
js/engine.js            partie en cours, carte d'ascension, règles de combat
js/art.js               générateur de vitraux (Voronoï, plomb, grisaille, motifs et figures)
js/fx.js                éclats de verre, lumière, poussières, transition en rosace
js/ui.js                écrans, main de cartes au doigt, déroulé animé des combats
tools/balance.js        un bot joue des centaines de parties pour mesurer la difficulté
tools/enemies.js        PV perdus par combat avec le paquet de départ
tools/make-icons.js     icônes de l'application
```

Équilibrage : `node tools/balance.js 500`. Le bot simple gagne environ 1 partie sur 4 sans passer par le marchand ni choisir son chemin.
