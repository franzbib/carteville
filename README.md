# Repérage en ville

Petit jeu pédagogique de repérage en ville pour apprenants de FLE, réalisé avec Phaser 3, TypeScript et Vite.

Le jeu se déroule en deux phases :

1. explorer la carte, parler aux habitants et identifier les 9 bâtiments ;
2. accomplir les séries de missions quotidiennes dans le bon lieu.

## Lancer le projet

```bash
npm install
npm run dev
```

Vite démarre ensuite un serveur local. Pour produire un build :

```bash
npm run build
```

## Commandes

- `Flèches` ou `ZQSD` : déplacement
- `E` : parler / agir / consulter un lieu
- `L` : attribuer une étiquette au bâtiment proche
- `C` : ouvrir ou fermer le carnet
- `M` : ouvrir ou fermer les missions
- `Échap` : fermer la fenêtre active

## Modes

- `Mode facile` : feedback immédiat après chaque étiquette
- `Mode normal` : validation globale quand tous les bâtiments ont reçu un nom
- `Mode révision` : les bâtiments sont visibles dès le départ

Depuis le menu :

- `Entrée` reprend la partie en cours s'il y a une sauvegarde
- `N` démarre une nouvelle partie avec le mode sélectionné
- `R` efface la sauvegarde

## Sauvegarde

La progression est stockée dans `localStorage` :

- mode choisi
- indices découverts
- état des bâtiments
- progression des missions
- préférence sonore

Le jeu reste stable si la sauvegarde est absente ou corrompue : une nouvelle partie propre est recréée automatiquement.

## Structure

```text
src/
  main.ts
  game/
    Game.ts
    data/
    entities/
    scenes/
    ui/
    utils/
  styles/
public/
  assets/ui/city-emblem.svg
```

## Direction technique

- carte dessinée directement dans le projet avec les formes Phaser
- collisions Arcade Physics sur bâtiments et parking
- interface en DOM superposée au canvas pour des panneaux lisibles
- audio léger généré en Web Audio, sans assets externes fragiles

## Contenu implémenté

- écran d'accueil avec choix de mode et reprise de partie
- 7 PNJ répartis dans la ville
- carnet d'indices avec 9 indices à découvrir
- étiquetage clavier des 9 bâtiments
- validation `facile` et `normal`
- transition vers la phase 2
- 4 séries de missions successives
- écran de victoire final

## Remarques

- Le jeu est pensé d'abord pour desktop.
- Le rendu est responsive sur les formats desktop courants et reste lisible sur des tailles plus serrées.
- Les sons ne démarrent qu'après la première interaction utilisateur, pour respecter les politiques des navigateurs.
