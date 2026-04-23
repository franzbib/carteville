# Reperage en ville

Jeu pedagogique de reperage en ville pour apprenants de FLE, realise avec Phaser 3, TypeScript et Vite.

La version actuelle est centree sur la phase 1 :

1. explorer la carte ;
2. parler aux habitants ;
3. collecter des indices ;
4. proposer une etiquette pour chaque batiment ;
5. voir immediatement l etiquette posee sur le batiment concerne.

## Lancer le projet

```bash
npm install
npm run dev
```

Pour produire un build :

```bash
npm run build
```

## Commandes

- `Fleches` ou `ZQSD` : deplacement
- `E` : parler / observer
- `L` : attribuer une etiquette au batiment proche
- `C` : ouvrir ou fermer le carnet
- `Echap` : fermer la fenetre active

## Modes

- `Mode facile` : feedback immediat apres chaque etiquette
- `Mode normal` : validation globale quand tous les batiments ont recu un nom
- `Mode revision` : les batiments sont visibles des le depart

Depuis le menu :

- `Entree` reprend la partie en cours s il y a une sauvegarde
- `N` demarre une nouvelle partie avec le mode selectionne
- `R` efface la sauvegarde

## Sauvegarde

La progression est stockee dans `localStorage` :

- mode choisi
- indices decouverts
- etat des batiments
- preference sonore

Le jeu reste stable si la sauvegarde est absente ou corrompue : une nouvelle partie propre est recreee automatiquement.

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

- carte dessinee directement dans le projet avec les formes Phaser
- collisions Arcade Physics sur batiments, PNJ et parking
- interface en DOM superposee au canvas pour des panneaux lisibles
- camera suivie dans le canvas, sans scroll de page
- audio leger genere en Web Audio, sans assets externes fragiles

## Contenu implemente

- ecran d accueil avec choix de mode et reprise de partie
- 7 PNJ repartis dans la ville
- carnet d indices avec 9 indices a decouvrir
- etiquetage clavier des 9 batiments
- affichage direct des etiquettes sur les batiments
- validation `facile` et `normal`
- fin de partie locale quand le plan est entierement reconstitue

## Remarques

- Le jeu est pense d abord pour desktop.
- Le rendu tient dans le viewport sans ascenseur de navigateur pendant la partie.
- Les sons ne demarrent qu apres la premiere interaction utilisateur, pour respecter les politiques des navigateurs.
