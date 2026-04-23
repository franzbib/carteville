import Phaser from 'phaser';

import { MISSION_SERIES } from '../data/missions';
import { audioManager } from '../utils/audio';
import { loadSaveData, saveGame } from '../utils/save';

export class PhaseTransitionScene extends Phaser.Scene {
  constructor() {
    super('PhaseTransitionScene');
  }

  create(): void {
    const save = loadSaveData();
    const currentSeries = MISSION_SERIES[Math.min(save.currentMissionSeries, MISSION_SERIES.length - 1)];

    audioManager.syncFromPreference(save.soundEnabled);

    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x24303a, 0x24303a, 0x4d5a63, 0x4d5a63, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    graphics.fillStyle(0xf6f0e3, 0.96);
    graphics.fillRoundedRect(184, 124, 1032, 696, 40);

    this.add
      .text(this.scale.width / 2, 220, 'Phase 2 débloquée', {
        fontFamily: 'Georgia',
        fontSize: '52px',
        color: '#24303a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(
        this.scale.width / 2,
        296,
        'Tous les bâtiments sont maintenant identifiés. Les missions quotidiennes peuvent commencer.',
        {
          fontFamily: 'Trebuchet MS',
          fontSize: '24px',
          color: '#55616d',
          wordWrap: { width: 820 },
          align: 'center'
        }
      )
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 388, currentSeries.title, {
        fontFamily: 'Georgia',
        fontSize: '34px',
        color: '#7e4c35',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(this.scale.width / 2, 432, currentSeries.intro, {
        fontFamily: 'Trebuchet MS',
        fontSize: '22px',
        color: '#55616d'
      })
      .setOrigin(0.5);

    currentSeries.tasks.forEach((task, index) => {
      this.add
        .text(this.scale.width / 2, 522 + index * 72, `• ${task.label}`, {
          fontFamily: 'Trebuchet MS',
          fontSize: '28px',
          color: '#24303a'
        })
        .setOrigin(0.5);
    });

    this.add
      .text(this.scale.width / 2, 730, 'Entrée : rejoindre la carte · Échap : revenir au menu', {
        fontFamily: 'Trebuchet MS',
        fontSize: '20px',
        color: '#55616d'
      })
      .setOrigin(0.5);

    const keyboard = this.input.keyboard;
    keyboard?.once('keydown-ENTER', () => {
      audioManager.unlock();
      save.phase = 'missions';
      saveGame(save);
      this.scene.start('CityScene');
    });
    keyboard?.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }
}
