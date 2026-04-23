import Phaser from 'phaser';

import { MISSION_SERIES } from '../data/missions';
import { audioManager } from '../utils/audio';
import { loadSaveData } from '../utils/save';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create(): void {
    const save = loadSaveData();
    audioManager.syncFromPreference(save.soundEnabled);

    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x22303a, 0x22303a, 0x4f8058, 0x4f8058, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.fillStyle(0xf6f0e3, 0.96);
    graphics.fillRoundedRect(192, 128, 1016, 680, 40);

    this.add
      .text(this.scale.width / 2, 224, 'Quartier maîtrisé', {
        fontFamily: 'Georgia',
        fontSize: '56px',
        color: '#24303a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width / 2,
        306,
        "Vous avez identifié tous les bâtiments puis accompli les quatre séries de missions. Le repérage dans le quartier est réussi.",
        {
          fontFamily: 'Trebuchet MS',
          fontSize: '24px',
          color: '#55616d',
          wordWrap: { width: 780 },
          align: 'center'
        }
      )
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 418, `${MISSION_SERIES.length} séries complétées`, {
        fontFamily: 'Trebuchet MS',
        fontSize: '26px',
        color: '#7e4c35',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width / 2,
        526,
        `Mode joué : ${save.mode === 'easy' ? 'facile' : save.mode === 'normal' ? 'normal' : 'révision'}`,
        {
          fontFamily: 'Trebuchet MS',
          fontSize: '24px',
          color: '#24303a'
        }
      )
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width / 2,
        594,
        'Entrée : revenir au menu · N : recommencer une nouvelle partie',
        {
          fontFamily: 'Trebuchet MS',
          fontSize: '22px',
          color: '#55616d'
        }
      )
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ENTER', () => {
      this.scene.start('MenuScene');
    });
    keyboard?.once('keydown-N', () => {
      this.scene.start('MenuScene');
    });
  }
}
