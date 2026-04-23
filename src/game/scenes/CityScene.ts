import Phaser from 'phaser';

import { BUILDING_OPTIONS, BUILDINGS_BY_KEY, TOTAL_BUILDINGS } from '../data/buildings';
import { TOTAL_CLUES } from '../data/clues';
import {
  BENCH_POINTS,
  LAMP_POINTS,
  MAP_HEIGHT,
  MAP_WIDTH,
  PARKING_RECT,
  PLACE_RECT,
  ROAD_RECTS,
  SPAWN_POINT,
  TREE_POINTS
} from '../data/mapLayout';
import { NPCS } from '../data/npcs';
import { BuildingZone } from '../entities/BuildingZone';
import { NPC } from '../entities/NPC';
import { Player } from '../entities/Player';
import type { GameMode, SaveData } from '../types';
import { HUD } from '../ui/HUD';
import { LabelModal } from '../ui/LabelModal';
import { NotebookModal } from '../ui/NotebookModal';
import { audioManager } from '../utils/audio';
import { loadSaveData, resetSave, saveGame } from '../utils/save';

type KeyboardKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  z: Phaser.Input.Keyboard.Key;
  q: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
};

export class CityScene extends Phaser.Scene {
  private saveData!: SaveData;
  private player!: Player;
  private buildings: BuildingZone[] = [];
  private npcs: NPC[] = [];
  private hud!: HUD;
  private notebook!: NotebookModal;
  private labelModal!: LabelModal;
  private keys!: KeyboardKeys;
  private activeLabelBuilding?: BuildingZone;
  private dialogueOpen = false;
  private parkingZone?: Phaser.GameObjects.Zone;
  private cleanupCallbacks: Array<() => void> = [];

  constructor() {
    super('CityScene');
  }

  create(): void {
    this.saveData = loadSaveData();
    this.saveData.started = true;
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    audioManager.syncFromPreference(this.saveData.soundEnabled);

    this.drawMap();
    this.createBuildings();
    this.createParkingObstacle();
    this.createNPCs();
    this.createPlayer();
    this.setupInput();
    this.createUI();
    this.refreshVisualState();
    this.updateHud();
    this.saveSnapshot();

    if (!this.saveData.tutorialSeen && this.saveData.mode !== 'review') {
      this.showDialogue(
        'Reperes',
        "Explorez le quartier, parlez avec les habitants avec E, puis utilisez L pres des batiments pour proposer un nom."
      );
      this.saveData.tutorialSeen = true;
      this.saveSnapshot();
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupCallbacks.forEach((callback) => callback());
      this.hud.destroy();
      this.notebook.destroy();
      this.labelModal.destroy();
      this.buildings.forEach((building) => building.destroyBuilding());
      this.npcs.forEach((npc) => npc.destroyNPC());
      this.parkingZone?.destroy();
    });
  }

  update(): void {
    this.updateMovement();
    this.player.syncDepth();
    this.updatePromptsAndNearby();
  }

  private drawMap(): void {
    this.cameras.main.setBackgroundColor('#d8cbb5');

    const graphics = this.add.graphics();
    graphics.fillStyle(0xd8cbb3, 1);
    graphics.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    graphics.fillStyle(0xcebb99, 0.55);
    graphics.fillRoundedRect(48, 56, MAP_WIDTH - 96, MAP_HEIGHT - 112, 36);

    graphics.fillStyle(0xc8d7b5, 0.88);
    graphics.fillRoundedRect(78, 86, 302, 178, 28);
    graphics.fillRoundedRect(82, 304, 242, 250, 28);
    graphics.fillRoundedRect(92, 602, 334, 236, 32);
    graphics.fillRoundedRect(466, 92, 322, 114, 30);
    graphics.fillRoundedRect(880, 88, 346, 156, 28);
    graphics.fillRoundedRect(884, 610, 350, 230, 30);

    ROAD_RECTS.forEach((road) => {
      graphics.fillStyle(0xe8e4de, 1);
      graphics.lineStyle(2, 0xc5bfb5, 0.9);
      graphics.fillRoundedRect(road.x, road.y, road.width, road.height, 18);
      graphics.strokeRoundedRect(road.x, road.y, road.width, road.height, 18);

      const horizontal = road.width >= road.height;
      const segments = horizontal ? Math.floor(road.width / 54) : Math.floor(road.height / 54);

      for (let index = 0; index < segments; index += 1) {
        const markX = horizontal ? road.x + 20 + index * 54 : road.x + road.width / 2 - 4;
        const markY = horizontal ? road.y + road.height / 2 - 3 : road.y + 20 + index * 54;
        const markWidth = horizontal ? 26 : 8;
        const markHeight = horizontal ? 6 : 26;

        graphics.fillStyle(0xf9f7f2, 0.75);
        graphics.fillRoundedRect(markX, markY, markWidth, markHeight, 3);
      }
    });

    graphics.fillStyle(0xf0e4cf, 1);
    graphics.lineStyle(4, 0xd0c0a1, 1);
    graphics.fillRoundedRect(PLACE_RECT.x, PLACE_RECT.y, PLACE_RECT.width, PLACE_RECT.height, 26);
    graphics.strokeRoundedRect(PLACE_RECT.x, PLACE_RECT.y, PLACE_RECT.width, PLACE_RECT.height, 26);

    for (let x = PLACE_RECT.x + 24; x < PLACE_RECT.x + PLACE_RECT.width - 12; x += 42) {
      for (let y = PLACE_RECT.y + 24; y < PLACE_RECT.y + PLACE_RECT.height - 12; y += 42) {
        graphics.fillStyle(0xe6d7be, 0.66);
        graphics.fillRoundedRect(x, y, 20, 20, 4);
      }
    }

    graphics.fillStyle(0xcbd2d8, 1);
    graphics.lineStyle(3, 0x9da7af, 0.95);
    graphics.fillRoundedRect(PARKING_RECT.x, PARKING_RECT.y, PARKING_RECT.width, PARKING_RECT.height, 18);
    graphics.strokeRoundedRect(PARKING_RECT.x, PARKING_RECT.y, PARKING_RECT.width, PARKING_RECT.height, 18);

    for (let row = 0; row < 6; row += 1) {
      const y = PARKING_RECT.y + 24 + row * 34;
      graphics.lineStyle(2, 0xf5f9ff, 0.72);
      graphics.lineBetween(PARKING_RECT.x + 24, y, PARKING_RECT.x + PARKING_RECT.width - 24, y);
    }

    this.add
      .text(PLACE_RECT.x + PLACE_RECT.width / 2, PLACE_RECT.y + 24, 'place Doualle', {
        fontFamily: 'Georgia',
        fontSize: '28px',
        color: '#7e4c35',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0)
      .setDepth(24);

    this.add
      .text(PARKING_RECT.x + PARKING_RECT.width / 2, PARKING_RECT.y + 12, 'parking', {
        fontFamily: 'Trebuchet MS',
        fontSize: '23px',
        color: '#24303a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0)
      .setDepth(24);

    ROAD_RECTS.filter((road) => road.label).forEach((road) => {
      this.add
        .text(road.labelX ?? road.x, road.labelY ?? road.y, road.label ?? '', {
          fontFamily: 'Georgia',
          fontSize: '24px',
          color: '#5a6470',
          fontStyle: 'bold',
          backgroundColor: '#f3ece0cc',
          padding: { left: 10, right: 10, top: 5, bottom: 5 }
        })
        .setOrigin(0.5)
        .setRotation(Phaser.Math.DegToRad(road.rotation ?? 0))
        .setAlpha(0.92)
        .setDepth(24);
    });

    TREE_POINTS.forEach((point) => {
      const trunk = this.add
        .rectangle(point.x, point.y + 12, 10 * point.scale, 22 * point.scale, 0x735439)
        .setDepth(point.y + 12);
      const canopyA = this.add
        .circle(point.x, point.y - 8, 20 * point.scale, 0x6c8b5d)
        .setDepth(point.y + 11);
      const canopyB = this.add
        .circle(point.x - 14 * point.scale, point.y + 2, 15 * point.scale, 0x7da06e)
        .setDepth(point.y + 12);
      const canopyC = this.add
        .circle(point.x + 12 * point.scale, point.y + 2, 15 * point.scale, 0x82a773)
        .setDepth(point.y + 12);
      this.cleanupCallbacks.push(() => {
        trunk.destroy();
        canopyA.destroy();
        canopyB.destroy();
        canopyC.destroy();
      });
    });

    BENCH_POINTS.forEach((point) => {
      const bench = this.add
        .rectangle(point.x, point.y, 32, 10, 0x8a6545)
        .setStrokeStyle(2, 0x5d422d, 0.9)
        .setRotation(Phaser.Math.DegToRad(point.rotation))
        .setDepth(point.y + 1);
      this.cleanupCallbacks.push(() => bench.destroy());
    });

    LAMP_POINTS.forEach((point) => {
      const pole = this.add.rectangle(point.x, point.y, 4, 24, 0x5f6261).setDepth(point.y);
      const lamp = this.add.circle(point.x, point.y - 16, 7, 0xf9efc0, 0.9).setDepth(point.y + 1);
      this.cleanupCallbacks.push(() => {
        pole.destroy();
        lamp.destroy();
      });
    });
  }

  private createBuildings(): void {
    this.buildings = BUILDING_OPTIONS.map((definition) => new BuildingZone(this, definition.id));
  }

  private createParkingObstacle(): void {
    const centerX = PARKING_RECT.x + PARKING_RECT.width / 2;
    const centerY = PARKING_RECT.y + PARKING_RECT.height / 2;
    this.parkingZone = this.add.zone(centerX, centerY, PARKING_RECT.width - 24, PARKING_RECT.height - 24);
    this.physics.add.existing(this.parkingZone, true);
  }

  private createNPCs(): void {
    this.npcs = NPCS.map((npcData) => new NPC(this, npcData));
  }

  private createPlayer(): void {
    this.player = new Player(this, SPAWN_POINT.x, SPAWN_POINT.y);

    this.buildings.forEach((building) => {
      this.physics.add.collider(this.player, building.solid);
    });

    this.npcs.forEach((npc) => {
      this.physics.add.collider(this.player, npc);
    });

    if (this.parkingZone) {
      this.physics.add.collider(this.player, this.parkingZone);
    }

    const camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera.startFollow(this.player, true, 0.1, 0.1);
    camera.setLerp(0.12, 0.12);
    camera.setZoom(this.scale.width >= 1100 ? 1.12 : 1.02);
    camera.roundPixels = false;
  }

  private setupInput(): void {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error('Clavier indisponible dans Phaser.');
    }

    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      z: Phaser.Input.Keyboard.KeyCodes.Z,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D
    }) as KeyboardKeys;

    keyboard.on('keydown', this.handleKeyDown, this);
    this.cleanupCallbacks.push(() => keyboard.off('keydown', this.handleKeyDown, this));
  }

  private createUI(): void {
    const container = document.getElementById('hud-dock');

    if (!container) {
      throw new Error("La zone d'interface n'a pas ete trouvee.");
    }

    this.hud = new HUD(container, {
      onToggleSound: () => {
        audioManager.unlock();
        this.saveData.soundEnabled = !this.saveData.soundEnabled;
        audioManager.setMuted(!this.saveData.soundEnabled);
        this.updateHud();
        this.saveSnapshot();
      },
      onReset: () => {
        const confirmed = window.confirm('Effacer la progression et revenir au menu ?');
        if (!confirmed) {
          return;
        }

        resetSave();
        this.scene.start('MenuScene');
      },
      onInteract: () => {
        audioManager.unlock();
        this.handleInteract();
      },
      onOpenLabel: () => {
        audioManager.unlock();
        this.tryOpenLabelModal();
      },
      onToggleNotebook: () => {
        audioManager.unlock();
        this.toggleNotebook();
      },
      onCloseActive: () => {
        this.closeActiveElement();
      },
      onAdvanceLevel: () => {
        audioManager.unlock();
        this.advanceToLevel2();
      }
    });

    this.notebook = new NotebookModal(container, {
      onClose: () => {
        this.notebook.hide();
      }
    });

    this.labelModal = new LabelModal(container, {
      onClose: () => {
        this.closeLabelModal();
      },
      onSelect: (key) => {
        this.handleLabelSelection(key.toUpperCase());
      }
    });
  }

  private updateMovement(): void {
    if (this.isOverlayOpen()) {
      this.player.stop();
      this.hud.resetTouchVector();
      return;
    }

    const keyboardHorizontal =
      (this.keys.left.isDown || this.keys.q.isDown ? -1 : 0) +
      (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0);
    const keyboardVertical =
      (this.keys.up.isDown || this.keys.z.isDown ? -1 : 0) +
      (this.keys.down.isDown || this.keys.s.isDown ? 1 : 0);

    const touchVector = this.hud.getTouchVector();
    const useTouch =
      this.hud.isTouchModeEnabled() &&
      (Math.abs(touchVector.x) > 0.02 || Math.abs(touchVector.y) > 0.02);

    this.player.move(
      useTouch ? touchVector.x : keyboardHorizontal,
      useTouch ? touchVector.y : keyboardVertical
    );
  }

  private updatePromptsAndNearby(): void {
    const nearestNpc = this.getNearestNpc();
    const nearestBuilding = this.getNearestBuilding();

    this.npcs.forEach((npc) => npc.setNearby(npc === nearestNpc));
    this.buildings.forEach((building) => building.setNearby(building === nearestBuilding));

    if (this.isOverlayOpen()) {
      this.hud.setPrompt(null);
      return;
    }

    const parts: string[] = [];

    if (nearestNpc) {
      parts.push(`<kbd>E</kbd> parler a ${nearestNpc.dataModel.name}`);
    }

    if (nearestBuilding) {
      if (this.saveData.mode !== 'review' && this.saveData.phase !== 'complete') {
        parts.push(`<kbd>L</kbd> etiqueter le batiment ${nearestBuilding.id}`);
      }

      parts.push(`<kbd>E</kbd> observer le batiment ${nearestBuilding.id}`);
    }

    if (this.saveData.phase === 'complete' && this.saveData.currentLevel === 1) {
      parts.push(`<kbd>Entree</kbd> passer au niveau 2`);
    }

    this.hud.setPrompt(parts.length > 0 ? parts.join(' | ') : null);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    audioManager.unlock();

    if (this.labelModal.isOpen()) {
      if (event.code === 'Escape') {
        this.closeLabelModal();
        return;
      }

      this.handleLabelSelection(event.key.toUpperCase());
      return;
    }

    if (this.dialogueOpen) {
      if (event.code === 'Escape' || event.code === 'KeyE' || event.code === 'Enter') {
        this.hideDialogue();
      }
      return;
    }

    if (this.notebook.isOpen()) {
      if (event.code === 'Escape' || event.code === 'KeyC') {
        this.notebook.hide();
      }
      return;
    }

    switch (event.code) {
      case 'KeyC':
        this.toggleNotebook();
        return;
      case 'Enter':
        this.advanceToLevel2();
        return;
      case 'KeyL':
        this.tryOpenLabelModal();
        return;
      case 'KeyE':
        this.handleInteract();
        return;
      case 'Escape':
        this.hideDialogue();
        return;
      default:
        return;
    }
  }

  private handleInteract(): void {
    if (this.labelModal.isOpen() || this.notebook.isOpen()) {
      return;
    }

    if (this.dialogueOpen) {
      this.hideDialogue();
      return;
    }

    const nearestNpc = this.getNearestNpc();

    if (nearestNpc) {
      const discovered = new Set(this.saveData.cluesDiscovered);
      const interaction = nearestNpc.getInteraction(discovered);
      const newClues = interaction.newClueIds.filter((clueId) => !discovered.has(clueId));

      if (newClues.length > 0) {
        this.saveData.cluesDiscovered.push(...newClues);
        this.saveData.cluesDiscovered = Array.from(new Set(this.saveData.cluesDiscovered));
        this.notebook.render(this.saveData.cluesDiscovered);
        this.hud.showToast('Indice ajoute au carnet', 'success');
        audioManager.playSuccess();
        this.saveSnapshot();
      }

      this.showDialogue(nearestNpc.dataModel.name, interaction.text);
      this.updateHud();
      return;
    }

    const nearestBuilding = this.getNearestBuilding();
    if (!nearestBuilding) {
      return;
    }

    const progress = this.saveData.buildingProgress[nearestBuilding.id];
    const message = progress.validated
      ? `${nearestBuilding.definition.shortName} est correctement identifie.`
      : progress.proposed
        ? `Batiment ${nearestBuilding.id}. Proposition en cours : ${BUILDINGS_BY_KEY[progress.proposed].shortName}.`
        : `Batiment ${nearestBuilding.id}. Utilisez L pour lui attribuer un nom.`;

    this.showDialogue('Repere', message);
  }

  private showDialogue(name: string, text: string): void {
    this.dialogueOpen = true;
    this.hud.showDialogue(name, text);
  }

  private hideDialogue(): void {
    this.dialogueOpen = false;
    this.hud.hideDialogue();
  }

  private tryOpenLabelModal(): void {
    if (this.dialogueOpen || this.notebook.isOpen() || this.labelModal.isOpen()) {
      return;
    }

    if (this.saveData.mode === 'review' || this.saveData.phase === 'complete') {
      this.hud.showToast('Le plan est deja resolu dans ce mode.', 'info');
      return;
    }

    const nearestBuilding = this.getNearestBuilding();
    if (!nearestBuilding) {
      this.hud.showToast("Approchez-vous davantage d'un batiment numerote.", 'info');
      return;
    }

    this.activeLabelBuilding = nearestBuilding;
    const progress = this.saveData.buildingProgress[nearestBuilding.id];
    this.labelModal.show({
      buildingNumber: nearestBuilding.id,
      currentProposal: progress.proposed,
      mode: this.saveData.mode
    });
    audioManager.playOpen();
  }

  private closeLabelModal(): void {
    this.activeLabelBuilding = undefined;
    this.labelModal.hide();
  }

  private toggleNotebook(): void {
    if (this.labelModal.isOpen()) {
      return;
    }

    if (this.dialogueOpen) {
      this.hideDialogue();
    }

    this.notebook.render(this.saveData.cluesDiscovered);
    this.notebook.toggle();
    audioManager.playOpen();
  }

  private closeActiveElement(): void {
    if (this.labelModal.isOpen()) {
      this.closeLabelModal();
      return;
    }

    if (this.notebook.isOpen()) {
      this.notebook.hide();
      return;
    }

    if (this.dialogueOpen) {
      this.hideDialogue();
    }
  }

  private handleLabelSelection(key: string): void {
    const choice = BUILDING_OPTIONS.find((building) => building.labelKey === key);
    const target = this.activeLabelBuilding;

    if (!choice || !target) {
      return;
    }

    const progress = this.saveData.buildingProgress[target.id];
    progress.proposed = choice.key;

    if (this.saveData.mode === 'easy') {
      if (choice.key === target.definition.key) {
        progress.validated = true;
        progress.flaggedWrong = false;
        this.hud.showToast('Bonne reponse.', 'success');
        audioManager.playSuccess();
      } else {
        progress.validated = false;
        progress.flaggedWrong = true;
        this.hud.showToast("Ce n'est pas encore le bon lieu.", 'error');
        audioManager.playError();
      }
    } else {
      progress.flaggedWrong = false;
      this.hud.showToast('Etiquette enregistree.', 'info');

      const allLabeled = this.buildings.every((building) => {
        const buildingProgress = this.saveData.buildingProgress[building.id];
        return buildingProgress.validated || Boolean(buildingProgress.proposed);
      });

      if (allLabeled) {
        this.runGlobalValidation();
      }
    }

    this.refreshVisualState();
    this.updateHud();
    this.saveSnapshot();
    this.closeLabelModal();

    if (this.getValidatedCount() === TOTAL_BUILDINGS) {
      this.finishIdentificationPhase();
    }
  }

  private runGlobalValidation(): void {
    let corrected = 0;
    let remaining = 0;

    this.buildings.forEach((building) => {
      const progress = this.saveData.buildingProgress[building.id];

      if (progress.proposed === building.definition.key) {
        if (!progress.validated) {
          corrected += 1;
        }

        progress.validated = true;
        progress.flaggedWrong = false;
      } else if (!progress.validated) {
        progress.flaggedWrong = true;
        remaining += 1;
      }
    });

    if (remaining === 0) {
      this.hud.showToast('Tous les batiments sont correctement identifies.', 'success');
      audioManager.playSuccess();
      return;
    }

    if (corrected > 0) {
      this.hud.showToast(`${corrected} batiment(s) valide(s). ${remaining} restent a corriger.`, 'info');
    } else {
      this.hud.showToast(`${remaining} batiment(s) restent a corriger.`, 'error');
      audioManager.playError();
    }
  }

  private finishIdentificationPhase(): void {
    if (this.saveData.phase === 'complete') {
      return;
    }

    this.saveData.phase = 'complete';
    this.refreshVisualState();
    this.updateHud();
    this.saveSnapshot();
    this.hud.showToast('Plan reconstitue. La fleche a droite ouvre le niveau 2.', 'success');
    this.showDialogue(
      'Ville',
      'Tous les batiments sont identifies. Utilisez la grande fleche a droite pour passer au niveau 2, ou continuez a reviser les reperes.'
    );
  }

  private refreshVisualState(): void {
    const revealAll = this.saveData.mode === 'review' || this.saveData.phase === 'complete';

    this.buildings.forEach((building) => {
      const progress = this.saveData.buildingProgress[building.id];
      building.applyProgress(progress, revealAll);
    });

    this.notebook.render(this.saveData.cluesDiscovered);
  }

  private updateHud(): void {
    this.hud.update({
      cluesFound: this.saveData.mode === 'review' ? TOTAL_CLUES : this.saveData.cluesDiscovered.length,
      cluesTotal: TOTAL_CLUES,
      buildingsValidated: this.getValidatedCount(),
      buildingsLabeled: this.getLabeledCount(),
      buildingsTotal: TOTAL_BUILDINGS,
      planStatus: this.saveData.phase === 'complete' ? 'reconstitue' : 'a completer',
      modeLabel: this.modeLabel(this.saveData.mode),
      soundEnabled: this.saveData.soundEnabled,
      showLevelAdvance: this.saveData.phase === 'complete' && this.saveData.currentLevel === 1
    });
  }

  private advanceToLevel2(): void {
    if (this.saveData.phase !== 'complete' || this.saveData.currentLevel === 2) {
      return;
    }

    this.saveData.currentLevel = 2;
    this.saveSnapshot();
    this.scene.start('Level2Scene');
  }

  private getValidatedCount(): number {
    return this.buildings.filter(
      (building) => this.saveData.buildingProgress[building.id].validated
    ).length;
  }

  private getLabeledCount(): number {
    return this.buildings.filter((building) => {
      const progress = this.saveData.buildingProgress[building.id];
      return Boolean(progress.validated || progress.proposed);
    }).length;
  }

  private getNearestNpc(): NPC | undefined {
    let nearest: NPC | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;

    this.npcs.forEach((npc) => {
      const distance = npc.distanceTo(this.player.x, this.player.y);
      if (distance < 86 && distance < bestDistance) {
        bestDistance = distance;
        nearest = npc;
      }
    });

    return nearest;
  }

  private getNearestBuilding(): BuildingZone | undefined {
    let nearest: BuildingZone | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;

    this.buildings.forEach((building) => {
      const distance = building.distanceTo(this.player.x, this.player.y);
      if (distance < building.getInteractionRadius() && distance < bestDistance) {
        bestDistance = distance;
        nearest = building;
      }
    });

    return nearest;
  }

  private saveSnapshot(): void {
    saveGame(this.saveData);
  }

  private isOverlayOpen(): boolean {
    return this.dialogueOpen || this.labelModal.isOpen() || this.notebook.isOpen();
  }

  private modeLabel(mode: GameMode): string {
    if (mode === 'easy') {
      return 'Facile';
    }

    if (mode === 'normal') {
      return 'Normal';
    }

    return 'Revision';
  }
}
