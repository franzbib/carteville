import Phaser from 'phaser';

import { BUILDING_OPTIONS, BUILDINGS_BY_KEY, TOTAL_BUILDINGS } from '../data/buildings';
import { TOTAL_CLUES } from '../data/clues';
import { MAP_HEIGHT, MAP_WIDTH, PARKING_RECT, PLACE_RECT, ROAD_RECTS, TREE_POINTS, BENCH_POINTS, BUILDING_LAYOUTS, LAMP_POINTS, SPAWN_POINT } from '../data/mapLayout';
import { MISSION_SERIES, type MissionTask } from '../data/missions';
import { NPCS } from '../data/npcs';
import { BuildingZone } from '../entities/BuildingZone';
import { NPC } from '../entities/NPC';
import { Player } from '../entities/Player';
import { LabelModal } from '../ui/LabelModal';
import { MissionPanel } from '../ui/MissionPanel';
import { NotebookModal } from '../ui/NotebookModal';
import { HUD } from '../ui/HUD';
import type { BuildingName, GameMode, SaveData } from '../types';
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
  private missionPanel!: MissionPanel;
  private labelModal!: LabelModal;
  private keys!: KeyboardKeys;
  private activeLabelBuilding?: BuildingZone;
  private dialogueOpen = false;
  private dialogueIsTutorial = false;
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
    this.refreshMissionHighlights();
    this.updateHud();
    this.saveSnapshot();

    if (!this.saveData.tutorialSeen && this.saveData.mode !== 'review') {
      this.showDialogue(
        'Repères',
        'Explorez le quartier, parlez avec les habitants en appuyant sur E, puis utilisez L près des bâtiments pour proposer un nom.'
      );
      this.dialogueIsTutorial = true;
      this.saveData.tutorialSeen = true;
      this.saveSnapshot();
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupCallbacks.forEach((callback) => callback());
      this.hud.destroy();
      this.notebook.destroy();
      this.missionPanel.destroy();
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
    graphics.fillStyle(0xd9c8a8, 1);
    graphics.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    graphics.fillStyle(0xcebb99, 0.55);
    graphics.fillRoundedRect(48, 56, MAP_WIDTH - 96, MAP_HEIGHT - 112, 36);

    graphics.fillStyle(0xc4d4b2, 0.86);
    graphics.fillRoundedRect(78, 86, 302, 178, 28);
    graphics.fillRoundedRect(82, 304, 242, 250, 28);
    graphics.fillRoundedRect(92, 602, 334, 236, 32);
    graphics.fillRoundedRect(466, 92, 322, 114, 30);
    graphics.fillRoundedRect(880, 88, 346, 156, 28);
    graphics.fillRoundedRect(884, 610, 350, 230, 30);

    ROAD_RECTS.forEach((road) => {
      graphics.fillStyle(0xe5e3df, 1);
      graphics.lineStyle(2, 0xc4c0bb, 0.9);
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
      .text(PLACE_RECT.x + PLACE_RECT.width / 2, PLACE_RECT.y + 24, 'Place des Grands-Hommes', {
        fontFamily: 'Georgia',
        fontSize: '28px',
        color: '#7e4c35',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    this.add
      .text(PARKING_RECT.x + PARKING_RECT.width / 2, PARKING_RECT.y + 12, 'Parking', {
        fontFamily: 'Trebuchet MS',
        fontSize: '24px',
        color: '#24303a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    ROAD_RECTS.filter((road) => road.label).forEach((road) => {
      this.add
        .text(road.labelX ?? road.x, road.labelY ?? road.y, road.label ?? '', {
          fontFamily: 'Trebuchet MS',
          fontSize: '25px',
          color: '#5e666e',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
        .setRotation(Phaser.Math.DegToRad(road.rotation ?? 0))
        .setAlpha(0.88);
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

    if (this.parkingZone) {
      this.physics.add.collider(this.player, this.parkingZone);
    }
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
    const container = document.getElementById('ui-layer');

    if (!container) {
      throw new Error("La couche d'interface n'a pas été trouvée.");
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
      }
    });
    this.notebook = new NotebookModal(container);
    this.missionPanel = new MissionPanel(container);
    this.labelModal = new LabelModal(container);
  }

  private updateMovement(): void {
    if (this.isOverlayOpen()) {
      this.player.stop();
      return;
    }

    const horizontal =
      (this.keys.left.isDown || this.keys.q.isDown ? -1 : 0) +
      (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0);
    const vertical =
      (this.keys.up.isDown || this.keys.z.isDown ? -1 : 0) +
      (this.keys.down.isDown || this.keys.s.isDown ? 1 : 0);

    this.player.move(horizontal, vertical);
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
      parts.push(`<kbd>E</kbd> parler à ${nearestNpc.dataModel.name}`);
    }

    if (nearestBuilding) {
      if (this.saveData.phase === 'identify' && this.saveData.mode !== 'review') {
        parts.push(`<kbd>L</kbd> étiqueter le bâtiment ${nearestBuilding.id}`);
      }

      if (this.saveData.phase === 'missions') {
        const mission = this.getPendingMissionForBuilding(nearestBuilding.definition.key);
        if (mission) {
          parts.push(`<kbd>E</kbd> ${mission.label.toLowerCase()}`);
        } else {
          parts.push(`<kbd>E</kbd> consulter ${nearestBuilding.definition.shortName.toLowerCase()}`);
        }
      } else if (this.saveData.phase === 'identify') {
        parts.push(`<kbd>E</kbd> observer le bâtiment ${nearestBuilding.id}`);
      }
    }

    this.hud.setPrompt(parts.length > 0 ? parts.join(' · ') : null);
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

    if (this.missionPanel.isOpen()) {
      if (event.code === 'Escape' || event.code === 'KeyM') {
        this.missionPanel.hide();
      }
      return;
    }

    switch (event.code) {
      case 'KeyC':
        this.notebook.render(this.saveData.cluesDiscovered);
        this.notebook.toggle();
        audioManager.playOpen();
        return;
      case 'KeyM':
        this.missionPanel.render({
          phase: this.saveData.phase,
          currentSeriesIndex: this.saveData.currentMissionSeries,
          completedTaskIds: this.saveData.completedMissionTaskIds
        });
        this.missionPanel.toggle();
        audioManager.playOpen();
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
    const nearestNpc = this.getNearestNpc();

    if (nearestNpc) {
      const discovered = new Set(this.saveData.cluesDiscovered);
      const interaction = nearestNpc.getInteraction(discovered);
      const newClues = interaction.newClueIds.filter((clueId) => !discovered.has(clueId));

      if (newClues.length > 0) {
        this.saveData.cluesDiscovered.push(...newClues);
        this.saveData.cluesDiscovered = Array.from(new Set(this.saveData.cluesDiscovered));
        this.notebook.render(this.saveData.cluesDiscovered);
        this.hud.showToast('Indice ajouté au carnet', 'success');
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

    if (this.saveData.phase === 'missions') {
      const task = this.getPendingMissionForBuilding(nearestBuilding.definition.key);
      if (task) {
        this.completeMissionTask(task, nearestBuilding.definition.shortName);
      } else {
        this.showDialogue(
          nearestBuilding.definition.shortName,
          `Aucune tâche active ne demande actuellement de passer par ${nearestBuilding.definition.article}.`
        );
      }
      return;
    }

    const progress = this.saveData.buildingProgress[nearestBuilding.id];
    const message = progress.validated
      ? `${nearestBuilding.definition.shortName} identifié.`
      : progress.proposed
        ? `Bâtiment ${nearestBuilding.id}. Proposition en cours : ${BUILDINGS_BY_KEY[progress.proposed].shortName}.`
        : `Bâtiment ${nearestBuilding.id}. Utilisez L pour lui attribuer un nom.`;

    this.showDialogue('Repère', message);
  }

  private showDialogue(name: string, text: string): void {
    this.dialogueOpen = true;
    this.hud.showDialogue(name, text);
  }

  private hideDialogue(): void {
    this.dialogueOpen = false;
    this.dialogueIsTutorial = false;
    this.hud.hideDialogue();
  }

  private tryOpenLabelModal(): void {
    if (this.saveData.phase !== 'identify' || this.saveData.mode === 'review') {
      this.hud.showToast('Les bâtiments sont déjà connus ou les missions sont actives.', 'info');
      return;
    }

    const nearestBuilding = this.getNearestBuilding();
    if (!nearestBuilding) {
      this.hud.showToast('Approchez-vous davantage d’un bâtiment numéroté.', 'info');
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
        this.hud.showToast('Bonne réponse.', 'success');
        audioManager.playSuccess();
      } else {
        progress.validated = false;
        progress.flaggedWrong = true;
        this.hud.showToast('Ce n’est pas encore le bon lieu.', 'error');
        audioManager.playError();
      }
    } else {
      progress.flaggedWrong = false;
      this.hud.showToast('Étiquette enregistrée.', 'info');
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
      this.hud.showToast('Tous les bâtiments sont correctement identifiés.', 'success');
      audioManager.playSuccess();
      return;
    }

    if (corrected > 0) {
      this.hud.showToast(`${corrected} bâtiment(s) validé(s). ${remaining} restent à corriger.`, 'info');
    } else {
      this.hud.showToast(`${remaining} bâtiment(s) restent à corriger.`, 'error');
      audioManager.playError();
    }
  }

  private finishIdentificationPhase(): void {
    if (this.saveData.phase !== 'identify') {
      return;
    }

    this.saveData.phase = 'phase2-intro';
    this.refreshVisualState();
    this.updateHud();
    this.saveSnapshot();
    this.time.delayedCall(450, () => {
      this.scene.start('PhaseTransitionScene');
    });
  }

  private getPendingMissionForBuilding(buildingName: BuildingName): MissionTask | undefined {
    if (this.saveData.phase !== 'missions') {
      return undefined;
    }

    const series = MISSION_SERIES[Math.min(this.saveData.currentMissionSeries, MISSION_SERIES.length - 1)];
    const completed = new Set(this.saveData.completedMissionTaskIds);

    return series.tasks.find(
      (task) => !completed.has(task.id) && task.targets.includes(buildingName)
    );
  }

  private completeMissionTask(task: MissionTask, locationName: string): void {
    if (this.saveData.completedMissionTaskIds.includes(task.id)) {
      return;
    }

    this.saveData.completedMissionTaskIds.push(task.id);
    this.missionPanel.render({
      phase: this.saveData.phase,
      currentSeriesIndex: this.saveData.currentMissionSeries,
      completedTaskIds: this.saveData.completedMissionTaskIds
    });
    this.hud.showToast(`${task.label} validé à ${locationName}.`, 'success');
    audioManager.playSuccess();

    const series = MISSION_SERIES[this.saveData.currentMissionSeries];
    const completed = new Set(this.saveData.completedMissionTaskIds);
    const seriesDone = series.tasks.every((seriesTask) => completed.has(seriesTask.id));

    if (seriesDone) {
      if (this.saveData.currentMissionSeries === MISSION_SERIES.length - 1) {
        this.saveData.phase = 'victory';
        this.missionPanel.render({
          phase: this.saveData.phase,
          currentSeriesIndex: this.saveData.currentMissionSeries,
          completedTaskIds: this.saveData.completedMissionTaskIds
        });
        this.updateHud();
        this.saveSnapshot();
        this.time.delayedCall(600, () => {
          this.scene.start('VictoryScene');
        });
        return;
      }

      this.saveData.currentMissionSeries += 1;
      const nextSeries = MISSION_SERIES[this.saveData.currentMissionSeries];
      this.missionPanel.render({
        phase: this.saveData.phase,
        currentSeriesIndex: this.saveData.currentMissionSeries,
        completedTaskIds: this.saveData.completedMissionTaskIds
      });
      this.hud.showToast(`${series.title} terminée. ${nextSeries.title} débloquée.`, 'info');
      this.showDialogue('Nouvelle série', nextSeries.intro);
    }

    this.refreshMissionHighlights();
    this.updateHud();
    this.saveSnapshot();
  }

  private refreshVisualState(): void {
    const revealAll = this.saveData.mode === 'review' || this.saveData.phase !== 'identify';
    this.buildings.forEach((building) => {
      const progress = this.saveData.buildingProgress[building.id];
      building.applyProgress(progress, revealAll);
    });
    this.notebook.render(this.saveData.cluesDiscovered);
    this.missionPanel.render({
      phase: this.saveData.phase,
      currentSeriesIndex: this.saveData.currentMissionSeries,
      completedTaskIds: this.saveData.completedMissionTaskIds
    });
  }

  private refreshMissionHighlights(): void {
    const pendingTargets = new Set<BuildingName>();

    if (this.saveData.phase === 'missions') {
      const series = MISSION_SERIES[Math.min(this.saveData.currentMissionSeries, MISSION_SERIES.length - 1)];
      const completed = new Set(this.saveData.completedMissionTaskIds);
      series.tasks
        .filter((task) => !completed.has(task.id))
        .forEach((task) => task.targets.forEach((target) => pendingTargets.add(target)));
    }

    this.buildings.forEach((building) =>
      building.setMissionTarget(pendingTargets.has(building.definition.key))
    );
  }

  private updateHud(): void {
    this.hud.update({
      cluesFound: this.saveData.mode === 'review' ? TOTAL_CLUES : this.saveData.cluesDiscovered.length,
      cluesTotal: TOTAL_CLUES,
      buildingsValidated: this.getValidatedCount(),
      buildingsTotal: TOTAL_BUILDINGS,
      missionSummary: this.getMissionSummary(),
      modeLabel: this.modeLabel(this.saveData.mode),
      phaseLabel: this.phaseLabel(this.saveData.phase),
      soundEnabled: this.saveData.soundEnabled
    });
  }

  private getMissionSummary(): string {
    if (this.saveData.phase === 'identify') {
      return 'Bloquées';
    }

    if (this.saveData.phase === 'phase2-intro') {
      return 'Ouverture';
    }

    if (this.saveData.phase === 'victory') {
      return 'Terminées';
    }

    const series = MISSION_SERIES[Math.min(this.saveData.currentMissionSeries, MISSION_SERIES.length - 1)];
    const completed = new Set(this.saveData.completedMissionTaskIds);
    const doneCount = series.tasks.filter((task) => completed.has(task.id)).length;
    return `${series.title} · ${doneCount} / ${series.tasks.length}`;
  }

  private getValidatedCount(): number {
    return this.buildings.filter(
      (building) => this.saveData.buildingProgress[building.id].validated
    ).length;
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
    return (
      this.dialogueOpen ||
      this.labelModal.isOpen() ||
      this.notebook.isOpen() ||
      this.missionPanel.isOpen()
    );
  }

  private modeLabel(mode: GameMode): string {
    if (mode === 'easy') {
      return 'Facile';
    }
    if (mode === 'normal') {
      return 'Normal';
    }
    return 'Révision';
  }

  private phaseLabel(phase: SaveData['phase']): string {
    switch (phase) {
      case 'identify':
        return 'Phase 1';
      case 'phase2-intro':
        return 'Transition';
      case 'missions':
        return 'Phase 2';
      case 'victory':
        return 'Victoire';
    }
  }
}
