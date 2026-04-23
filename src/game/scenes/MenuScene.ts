import Phaser from 'phaser';

import { audioManager } from '../utils/audio';
import {
  createDefaultSave,
  hasMeaningfulProgress,
  loadSaveData,
  resetSave,
  saveGame
} from '../utils/save';
import type { GameMode, SaveData } from '../types';

const MODES: Array<{
  key: GameMode;
  title: string;
  description: string;
}> = [
  {
    key: 'easy',
    title: 'Mode facile',
    description: 'Feedback immédiat vrai ou faux après chaque étiquette.'
  },
  {
    key: 'normal',
    title: 'Mode normal',
    description: 'Validation globale quand tous les bâtiments ont reçu un nom.'
  },
  {
    key: 'review',
    title: 'Mode révision',
    description: 'Les bâtiments sont visibles dès le départ pour corriger ou réviser.'
  }
];

export class MenuScene extends Phaser.Scene {
  private selectedIndex = 1;
  private cardRects: Phaser.GameObjects.Rectangle[] = [];
  private cardTexts: Array<{
    title: Phaser.GameObjects.Text;
    description: Phaser.GameObjects.Text;
  }> = [];
  private actionHint!: Phaser.GameObjects.Text;
  private saveHint!: Phaser.GameObjects.Text;
  private footerHint!: Phaser.GameObjects.Text;
  private currentSave!: SaveData;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.currentSave = loadSaveData();
    const selected = MODES.findIndex((mode) => mode.key === this.currentSave.mode);
    this.selectedIndex = selected >= 0 ? selected : 1;

    audioManager.syncFromPreference(this.currentSave.soundEnabled);
    this.createBackground();
    this.createLayout();
    this.refreshModeCards();

    const keyboard = this.input.keyboard;
    keyboard?.on('keydown', this.handleKeyDown, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard?.off('keydown', this.handleKeyDown, this);
    });
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0xe6dcc6, 0xe6dcc6, 0xcbb79a, 0xcbb79a, 1);
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);

    graphics.fillStyle(0xf4eddd, 0.8);
    graphics.fillRoundedRect(84, 74, 1232, 812, 44);
    graphics.fillStyle(0xc89470, 0.16);
    graphics.fillCircle(260, 140, 180);
    graphics.fillCircle(1180, 792, 220);

    this.add.image(170, 160, 'city-emblem').setDisplaySize(110, 110).setAlpha(0.96);

    this.add
      .text(246, 132, 'Repérage en ville', {
        fontFamily: 'Georgia',
        fontSize: '54px',
        color: '#24303a',
        fontStyle: 'bold'
      })
      .setOrigin(0, 0.5);

    this.add
      .text(
        246,
        192,
        "Explorez le quartier, croisez les indices et identifiez les bâtiments avant d'accomplir les missions.",
        {
          fontFamily: 'Trebuchet MS',
          fontSize: '24px',
          color: '#55616d',
          wordWrap: { width: 760 }
        }
      )
      .setOrigin(0, 0.5);
  }

  private createLayout(): void {
    const startX = 144;
    const startY = 316;
    const gap = 22;
    const cardWidth = 350;
    const cardHeight = 182;

    MODES.forEach((mode, index) => {
      const x = startX + index * (cardWidth + gap);
      const rect = this.add
        .rectangle(x, startY, cardWidth, cardHeight, 0xf8f2e5)
        .setOrigin(0)
        .setStrokeStyle(2, 0xb8a58c, 0.65);

      const title = this.add.text(x + 24, startY + 26, mode.title, {
        fontFamily: 'Georgia',
        fontSize: '28px',
        color: '#24303a',
        fontStyle: 'bold',
        wordWrap: { width: cardWidth - 48 }
      });

      const description = this.add.text(x + 24, startY + 78, mode.description, {
        fontFamily: 'Trebuchet MS',
        fontSize: '19px',
        color: '#55616d',
        wordWrap: { width: cardWidth - 48 }
      });

      this.cardRects.push(rect);
      this.cardTexts.push({ title, description });
    });

    this.actionHint = this.add.text(146, 560, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '22px',
      color: '#7e4c35'
    });

    this.saveHint = this.add.text(146, 618, '', {
      fontFamily: 'Trebuchet MS',
      fontSize: '20px',
      color: '#55616d',
      wordWrap: { width: 1040 }
    });

    this.footerHint = this.add.text(
      146,
      742,
      'Flèches gauche/droite : changer de mode · Entrée : jouer · N : nouvelle partie · R : effacer la sauvegarde',
      {
        fontFamily: 'Trebuchet MS',
        fontSize: '20px',
        color: '#24303a',
        wordWrap: { width: 1100 }
      }
    );

    this.add
      .text(146, 692, 'Version clavier intégrale, sauvegarde locale automatique, audio discret activable à la première interaction.', {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#55616d',
        wordWrap: { width: 1020 }
      })
      .setAlpha(0.95);
  }

  private refreshModeCards(): void {
    this.cardRects.forEach((rect, index) => {
      const active = index === this.selectedIndex;
      rect.setFillStyle(active ? 0xe8d6bd : 0xf8f2e5, 1);
      rect.setStrokeStyle(active ? 4 : 2, active ? 0x7e4c35 : 0xb8a58c, active ? 0.92 : 0.65);
      this.cardTexts[index].title.setColor(active ? '#7e4c35' : '#24303a');
      this.cardTexts[index].description.setColor(active ? '#4f5f69' : '#55616d');
    });

    const selection = MODES[this.selectedIndex];
    const hasSave = hasMeaningfulProgress(this.currentSave);

    this.actionHint.setText(
      hasSave
        ? `Entrée : reprendre la partie en cours · N : démarrer une nouvelle partie en ${selection.title.toLowerCase()}`
        : `Entrée : commencer une partie en ${selection.title.toLowerCase()}`
    );

    this.saveHint.setText(
      hasSave
        ? `Sauvegarde détectée : ${this.describeSave(this.currentSave)}`
        : "Aucune sauvegarde active. Vous pouvez commencer immédiatement."
    );
  }

  private describeSave(save: SaveData): string {
    if (save.phase === 'identify') {
      return `phase d'identification, ${save.cluesDiscovered.length} indice(s) trouvé(s).`;
    }
    if (save.phase === 'phase2-intro') {
      return 'carte terminée, introduction aux missions prête.';
    }
    if (save.phase === 'missions') {
      return `missions en cours, série ${save.currentMissionSeries + 1}.`;
    }
    return 'victoire finale déjà atteinte.';
  }

  private handleKeyDown(event: KeyboardEvent): void {
    audioManager.unlock();

    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyQ':
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex - 1, 0, MODES.length);
        this.refreshModeCards();
        return;
      case 'ArrowRight':
      case 'KeyD':
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + 1, 0, MODES.length);
        this.refreshModeCards();
        return;
      case 'Enter':
        if (hasMeaningfulProgress(this.currentSave)) {
          this.launchFromSave(this.currentSave);
        } else {
          this.startNewGame(MODES[this.selectedIndex].key);
        }
        return;
      case 'KeyN':
        this.startNewGame(MODES[this.selectedIndex].key);
        return;
      case 'KeyR':
        resetSave();
        this.currentSave = loadSaveData();
        this.refreshModeCards();
        return;
      default:
        return;
    }
  }

  private startNewGame(mode: GameMode): void {
    const save = createDefaultSave(mode);
    save.started = true;
    saveGame(save);
    audioManager.syncFromPreference(save.soundEnabled);

    if (save.phase === 'phase2-intro') {
      this.scene.start('PhaseTransitionScene');
      return;
    }

    this.scene.start('CityScene');
  }

  private launchFromSave(save: SaveData): void {
    if (save.phase === 'phase2-intro') {
      this.scene.start('PhaseTransitionScene');
      return;
    }

    if (save.phase === 'victory') {
      this.scene.start('VictoryScene');
      return;
    }

    this.scene.start('CityScene');
  }
}
