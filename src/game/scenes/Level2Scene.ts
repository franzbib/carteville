import Phaser from 'phaser';

import { MAP_HEIGHT, MAP_WIDTH } from '../data/mapLayout';
import { audioManager } from '../utils/audio';
import { loadSaveData, regenerateLevel2Seed, saveGame } from '../utils/save';
import type { SaveData } from '../types';

const HORIZONTAL_NAMES = [
  'avenue des Tisserands',
  'cours des Acacias',
  'avenue des Lampions',
  'cours du Belvedere',
  'avenue des Forges'
];

const VERTICAL_NAMES = [
  'rue des Ateliers',
  'rue de la Verriere',
  'rue des Moulins',
  'rue des Fleurs',
  'rue du Canal'
];

const PLACE_NAMES = ['place du Verger', 'place des Arcades', 'place des Bateliers'];

export class Level2Scene extends Phaser.Scene {
  private saveData!: SaveData;
  private panelRoot?: HTMLDivElement;
  private cleanupCallbacks: Array<() => void> = [];

  constructor() {
    super('Level2Scene');
  }

  create(): void {
    this.saveData = loadSaveData();
    this.saveData.started = true;
    this.saveData.currentLevel = 2;
    audioManager.syncFromPreference(this.saveData.soundEnabled);
    saveGame(this.saveData);

    this.drawProceduralMap(this.saveData.level2Seed);
    this.createDockPanel();
    this.setupKeyboard();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupCallbacks.forEach((callback) => callback());
      this.panelRoot?.remove();
    });
  }

  private drawProceduralMap(seed: string): void {
    const rng = new Phaser.Math.RandomDataGenerator([seed]);
    this.cameras.main.setBackgroundColor('#d7ccb7');

    const graphics = this.add.graphics();
    graphics.fillStyle(0xd7ccb7, 1);
    graphics.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    graphics.fillStyle(0xe7ded0, 0.74);
    graphics.fillCircle(216, 180, 180);
    graphics.fillCircle(1170, 780, 220);
    graphics.fillRoundedRect(42, 44, MAP_WIDTH - 84, MAP_HEIGHT - 88, 34);

    this.drawCanal(rng, graphics);

    const roadWidth = 78;
    const verticalRoads = [190, 470, 790, 1090].map((value) => value + rng.between(-30, 30));
    const horizontalRoads = [170, 420, 710].map((value) => value + rng.between(-32, 32));

    verticalRoads.forEach((centerX) => this.drawRoad(graphics, centerX - roadWidth / 2, 58, roadWidth, MAP_HEIGHT - 116, true));
    horizontalRoads.forEach((centerY) => this.drawRoad(graphics, 58, centerY - roadWidth / 2, MAP_WIDTH - 116, roadWidth, false));

    const xIntervals = this.computeIntervals(verticalRoads, roadWidth, 72, MAP_WIDTH - 72);
    const yIntervals = this.computeIntervals(horizontalRoads, roadWidth, 72, MAP_HEIGHT - 72);
    const plazaCellX = Math.min(1, xIntervals.length - 1);
    const plazaCellY = Math.min(1, yIntervals.length - 1);
    const plazaName = PLACE_NAMES[rng.between(0, PLACE_NAMES.length - 1)];

    xIntervals.forEach((xInterval, xIndex) => {
      yIntervals.forEach((yInterval, yIndex) => {
        const width = xInterval.end - xInterval.start;
        const height = yInterval.end - yInterval.start;

        if (width < 90 || height < 90) {
          return;
        }

        const centerX = xInterval.start + width / 2;
        const centerY = yInterval.start + height / 2;
        const isPlaza = xIndex === plazaCellX && yIndex === plazaCellY;
        const isPark = !isPlaza && rng.frac() < 0.24;

        if (isPlaza) {
          this.drawPlaza(centerX, centerY, width, height, plazaName);
          return;
        }

        if (isPark) {
          this.drawPark(rng, centerX, centerY, width, height);
          return;
        }

        this.drawBuildingBlock(rng, xInterval.start, yInterval.start, width, height);
      });
    });

    this.drawStreetLabels(rng, verticalRoads, horizontalRoads);

    this.add
      .text(MAP_WIDTH - 44, 34, 'Niveau 2', {
        fontFamily: 'Georgia',
        fontSize: '38px',
        color: '#24303a',
        fontStyle: 'bold'
      })
      .setOrigin(1, 0)
      .setAlpha(0.88);

    this.add
      .text(MAP_WIDTH - 44, 78, 'Carte generee automatiquement', {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#55616d'
      })
      .setOrigin(1, 0)
      .setAlpha(0.9);
  }

  private drawCanal(rng: Phaser.Math.RandomDataGenerator, graphics: Phaser.GameObjects.Graphics): void {
    const startY = rng.between(160, 240);
    const endY = rng.between(660, 760);
    const outerPath = new Phaser.Curves.Path(-80, startY);
    outerPath.cubicBezierTo(220, startY - 40, 520, endY - 80, 760, endY - 10);
    outerPath.cubicBezierTo(980, endY + 54, 1180, endY - 90, MAP_WIDTH + 80, endY - 30);

    const innerPath = new Phaser.Curves.Path(-80, startY + 4);
    innerPath.cubicBezierTo(220, startY - 36, 520, endY - 72, 760, endY - 6);
    innerPath.cubicBezierTo(980, endY + 58, 1180, endY - 86, MAP_WIDTH + 80, endY - 26);

    graphics.lineStyle(52, 0xaec9d4, 1);
    outerPath.draw(graphics, 72);

    graphics.lineStyle(8, 0xd9eef2, 0.75);
    innerPath.draw(graphics, 72);
  }

  private drawRoad(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    vertical: boolean
  ): void {
    graphics.fillStyle(0xe8e4de, 1);
    graphics.lineStyle(2, 0xc5bfb5, 0.9);
    graphics.fillRoundedRect(x, y, width, height, 18);
    graphics.strokeRoundedRect(x, y, width, height, 18);

    const segments = vertical ? Math.floor(height / 54) : Math.floor(width / 54);

    for (let index = 0; index < segments; index += 1) {
      const markX = vertical ? x + width / 2 - 4 : x + 20 + index * 54;
      const markY = vertical ? y + 18 + index * 54 : y + height / 2 - 3;
      const markWidth = vertical ? 8 : 26;
      const markHeight = vertical ? 26 : 6;

      graphics.fillStyle(0xf9f7f2, 0.74);
      graphics.fillRoundedRect(markX, markY, markWidth, markHeight, 3);
    }
  }

  private computeIntervals(centers: number[], width: number, min: number, max: number): Array<{ start: number; end: number }> {
    const result: Array<{ start: number; end: number }> = [];
    const sorted = [...centers].sort((left, right) => left - right);
    let cursor = min;

    sorted.forEach((center) => {
      const start = center - width / 2;
      if (start - cursor > 24) {
        result.push({ start: cursor, end: start });
      }
      cursor = center + width / 2;
    });

    if (max - cursor > 24) {
      result.push({ start: cursor, end: max });
    }

    return result;
  }

  private drawPlaza(centerX: number, centerY: number, width: number, height: number, name: string): void {
    const plazaWidth = Math.min(width - 18, 210);
    const plazaHeight = Math.min(height - 18, 168);

    const shadow = this.add
      .rectangle(centerX + 6, centerY + 8, plazaWidth, plazaHeight, 0x1c2227, 0.12)
      .setOrigin(0.5);
    const plaza = this.add
      .rectangle(centerX, centerY, plazaWidth, plazaHeight, 0xf0e4cf)
      .setStrokeStyle(4, 0xd0c0a1, 1)
      .setOrigin(0.5);

    for (let x = centerX - plazaWidth / 2 + 18; x < centerX + plazaWidth / 2 - 18; x += 34) {
      for (let y = centerY - plazaHeight / 2 + 18; y < centerY + plazaHeight / 2 - 18; y += 34) {
        this.add.rectangle(x, y, 16, 16, 0xe6d7be, 0.82).setOrigin(0.5);
      }
    }

    this.add.circle(centerX, centerY, 24, 0xc57a50, 0.94);
    this.add.circle(centerX, centerY, 10, 0xf6f0e3, 0.92);
    this.add
      .text(centerX, centerY - plazaHeight / 2 + 18, name, {
        fontFamily: 'Georgia',
        fontSize: '22px',
        color: '#7e4c35',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    shadow.setDepth(centerY - 2);
    plaza.setDepth(centerY);
  }

  private drawPark(
    rng: Phaser.Math.RandomDataGenerator,
    centerX: number,
    centerY: number,
    width: number,
    height: number
  ): void {
    const parkWidth = Math.max(90, width - 18);
    const parkHeight = Math.max(90, height - 18);

    this.add
      .rectangle(centerX, centerY, parkWidth, parkHeight, 0xc7d9b8)
      .setStrokeStyle(3, 0x88a175, 0.9)
      .setOrigin(0.5);

    const treeCount = rng.between(6, 12);
    for (let index = 0; index < treeCount; index += 1) {
      const x = centerX + rng.between(Math.round(-parkWidth / 2 + 18), Math.round(parkWidth / 2 - 18));
      const y = centerY + rng.between(Math.round(-parkHeight / 2 + 18), Math.round(parkHeight / 2 - 18));
      this.add.rectangle(x, y + 10, 7, 16, 0x735439).setOrigin(0.5);
      this.add.circle(x, y, rng.between(12, 18), 0x729564).setOrigin(0.5);
    }
  }

  private drawBuildingBlock(
    rng: Phaser.Math.RandomDataGenerator,
    startX: number,
    startY: number,
    width: number,
    height: number
  ): void {
    const columns = rng.between(1, width > 190 ? 3 : 2);
    const rows = rng.between(1, height > 180 ? 3 : 2);
    const gutter = 12;
    const cellWidth = (width - gutter * (columns + 1)) / columns;
    const cellHeight = (height - gutter * (rows + 1)) / rows;
    const palette = [0xe3c8a8, 0xdab89a, 0xdcc6b5, 0xcfa892, 0xe6d3b8];

    for (let column = 0; column < columns; column += 1) {
      for (let row = 0; row < rows; row += 1) {
        if (rng.frac() < 0.14) {
          continue;
        }

        const baseX = startX + gutter + column * (cellWidth + gutter);
        const baseY = startY + gutter + row * (cellHeight + gutter);
        const buildingWidth = Math.max(42, cellWidth * rng.realInRange(0.72, 0.94));
        const buildingHeight = Math.max(42, cellHeight * rng.realInRange(0.68, 0.93));
        const x = baseX + (cellWidth - buildingWidth) / 2;
        const y = baseY + (cellHeight - buildingHeight) / 2;
        const centerX = x + buildingWidth / 2;
        const centerY = y + buildingHeight / 2;
        const color = palette[rng.between(0, palette.length - 1)];

        this.add.rectangle(centerX + 5, centerY + 7, buildingWidth, buildingHeight, 0x1c2227, 0.12);
        this.add
          .rectangle(centerX, centerY, buildingWidth, buildingHeight, color)
          .setStrokeStyle(3, 0x7d6b57, 0.86);
        this.add.rectangle(centerX, y + 12, Math.max(30, buildingWidth - 12), 18, 0xf7eddc, 0.84);
      }
    }
  }

  private drawStreetLabels(
    rng: Phaser.Math.RandomDataGenerator,
    verticalRoads: number[],
    horizontalRoads: number[]
  ): void {
    horizontalRoads.forEach((centerY, index) => {
      const label = HORIZONTAL_NAMES[(index + rng.between(0, HORIZONTAL_NAMES.length - 1)) % HORIZONTAL_NAMES.length];
      this.add
        .text(MAP_WIDTH - 170 - index * 26, centerY + 58, label, {
          fontFamily: 'Georgia',
          fontSize: '22px',
          color: '#5a6470',
          fontStyle: 'bold',
          backgroundColor: '#f3ece0cc',
          padding: { left: 10, right: 10, top: 5, bottom: 5 }
        })
        .setOrigin(1, 0.5)
        .setAlpha(0.92);
    });

    verticalRoads.forEach((centerX, index) => {
      const label = VERTICAL_NAMES[(index + rng.between(0, VERTICAL_NAMES.length - 1)) % VERTICAL_NAMES.length];
      this.add
        .text(centerX - 34, 228 + index * 20, label, {
          fontFamily: 'Georgia',
          fontSize: '20px',
          color: '#5a6470',
          fontStyle: 'bold',
          backgroundColor: '#f3ece0cc',
          padding: { left: 10, right: 10, top: 5, bottom: 5 }
        })
        .setOrigin(0.5)
        .setRotation(Phaser.Math.DegToRad(-90))
        .setAlpha(0.92);
    });
  }

  private createDockPanel(): void {
    const container = document.getElementById('hud-dock');

    if (!container) {
      throw new Error("La zone d'interface n'a pas ete trouvee.");
    }

    this.panelRoot = document.createElement('div');
    this.panelRoot.className = 'level2-root';
    this.panelRoot.innerHTML = `
      <section class="dock-panel">
        <p class="panel-kicker">Niveau 2</p>
        <h2 class="panel-heading">Nouvelle carte de travail</h2>
        <p class="panel-text">
          Cette scene affiche une carte elegante generee automatiquement. Vous pourrez y brancher le prochain exercice quand vous serez pret.
        </p>
        <div class="status-pill">Graine : ${this.saveData.level2Seed}</div>
        <div class="level2-button-row">
          <button type="button" class="level2-button" data-action="regen">Nouvelle carte</button>
          <button type="button" class="level2-button" data-action="level1">Retour niveau 1</button>
          <button type="button" class="level2-button" data-action="menu">Menu</button>
        </div>
        <p class="panel-close">Clavier : <strong>N</strong> nouvelle carte, <strong>1</strong> retour niveau 1, <strong>Echap</strong> menu.</p>
      </section>
      <section class="dock-panel">
        <p class="panel-kicker">Base future</p>
        <ul class="level2-list">
          <li>quartier genere de maniere reproducible a partir d une graine</li>
          <li>voirie, ilots, parcs et place centrale deja en place</li>
          <li>pret a accueillir des zones interactives, PNJ et nouvelles consignes</li>
        </ul>
      </section>
    `;

    container.appendChild(this.panelRoot);

    this.panelRoot.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        audioManager.unlock();

        switch (button.dataset.action) {
          case 'regen':
            this.regenerateMap();
            return;
          case 'level1':
            this.returnToLevel1();
            return;
          default:
            this.scene.start('MenuScene');
            return;
        }
      });
    });
  }

  private setupKeyboard(): void {
    const keyboard = this.input.keyboard;
    keyboard?.on('keydown', this.handleKeyDown, this);
    this.cleanupCallbacks.push(() => keyboard?.off('keydown', this.handleKeyDown, this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    audioManager.unlock();

    switch (event.code) {
      case 'KeyN':
        this.regenerateMap();
        return;
      case 'Digit1':
      case 'Numpad1':
      case 'Backspace':
        this.returnToLevel1();
        return;
      case 'Escape':
        this.scene.start('MenuScene');
        return;
      default:
        return;
    }
  }

  private regenerateMap(): void {
    this.saveData = regenerateLevel2Seed(this.saveData);
    saveGame(this.saveData);
    this.scene.restart();
  }

  private returnToLevel1(): void {
    this.saveData.currentLevel = 1;
    saveGame(this.saveData);
    this.scene.start('CityScene');
  }
}
