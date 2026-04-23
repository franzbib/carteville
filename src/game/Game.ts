import Phaser from 'phaser';

import { MAP_HEIGHT, MAP_WIDTH } from './data/mapLayout';
import { BootScene } from './scenes/BootScene';
import { CityScene } from './scenes/CityScene';
import { Level2Scene } from './scenes/Level2Scene';
import { MenuScene } from './scenes/MenuScene';

export class FrenchCityGame {
  readonly instance: Phaser.Game;

  constructor(parent: string) {
    this.instance = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      backgroundColor: '#d8cbb5',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      render: {
        antialias: true,
        pixelArt: false
      },
      scene: [BootScene, MenuScene, CityScene, Level2Scene]
    });
  }
}
