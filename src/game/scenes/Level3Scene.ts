import Phaser from 'phaser';

import {
  LEVEL3_MAP_KEY,
  LEVEL3_PLAYER_SPEED,
  LEVEL3_POINTS_OF_INTEREST,
  LEVEL3_SPAWN,
  LEVEL3_WORLD_HEIGHT,
  LEVEL3_WORLD_WIDTH,
  LEVEL3_WALKABLE_ZONES,
  LEVEL3_ZONE_SUMMARY
} from '../data/level3Layout';
import { Player } from '../entities/Player';
import type { SaveData } from '../types';
import { audioManager } from '../utils/audio';
import { loadSaveData, saveGame } from '../utils/save';

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

export class Level3Scene extends Phaser.Scene {
  private saveData!: SaveData;
  private player!: Player;
  private keys!: KeyboardKeys;
  private panelRoot?: HTMLDivElement;
  private currentZoneChip?: HTMLDivElement;
  private joystickPad?: HTMLDivElement;
  private joystickStick?: HTMLDivElement;
  private touchEnabled = false;
  private activePointerId?: number;
  private touchVector = { x: 0, y: 0 };
  private resizeHandler?: () => void;
  private currentZoneLabel = '';
  private cleanupCallbacks: Array<() => void> = [];

  constructor() {
    super('Level3Scene');
  }

  preload(): void {
    if (!this.textures.exists(LEVEL3_MAP_KEY)) {
      this.load.image(LEVEL3_MAP_KEY, '/assets/levels/ville3.png');
    }
  }

  create(): void {
    this.saveData = loadSaveData();
    this.saveData.started = true;
    this.saveData.currentLevel = 3;
    audioManager.syncFromPreference(this.saveData.soundEnabled);
    saveGame(this.saveData);

    this.physics.world.setBounds(0, 0, LEVEL3_WORLD_WIDTH, LEVEL3_WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#d7ccb7');

    this.add
      .image(0, 0, LEVEL3_MAP_KEY)
      .setOrigin(0)
      .setDisplaySize(LEVEL3_WORLD_WIDTH, LEVEL3_WORLD_HEIGHT);

    this.createPlayer();
    this.createDockPanel();
    this.setupInput();
    this.updateCurrentZone();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupCallbacks.forEach((callback) => callback());
      this.panelRoot?.remove();
    });
  }

  update(_time: number, delta: number): void {
    this.updateMovement(delta);
    this.player.syncDepth();
    this.updateCurrentZone();
  }

  private createPlayer(): void {
    this.player = new Player(this, LEVEL3_SPAWN.x, LEVEL3_SPAWN.y);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.enable = false;

    const camera = this.cameras.main;
    camera.setBounds(0, 0, LEVEL3_WORLD_WIDTH, LEVEL3_WORLD_HEIGHT);
    camera.startFollow(this.player, true, 0.1, 0.1);
    camera.setLerp(0.1, 0.1);
    camera.setZoom(this.scale.width >= 1100 ? 1.18 : 1.04);
    camera.roundPixels = false;
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
        <p class="panel-kicker">Niveau 3</p>
        <h2 class="panel-heading">Grande carte libre</h2>
        <p class="panel-text">
          La carte complete est maintenant jouable. Vous pouvez circuler sur les grands axes, la place centrale, le secteur de la gare et plusieurs promenades pour preparer le prochain exercice.
        </p>
        <div class="status-pill" data-role="zone-chip">Zone actuelle : place Gambetta</div>
        <div class="level2-button-row">
          <button type="button" class="level2-button" data-action="level2">Retour niveau 2</button>
          <button type="button" class="level2-button" data-action="menu">Menu</button>
        </div>
        <p class="panel-close">Clavier : <strong>Fleches</strong> ou <strong>ZQSD</strong> pour se deplacer, <strong>2</strong> pour revenir au niveau 2, <strong>Echap</strong> pour le menu.</p>
      </section>
      <section class="dock-panel">
        <p class="panel-kicker">Zone jouable</p>
        <ul class="level2-list">
          ${LEVEL3_ZONE_SUMMARY.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </section>
      <section class="mobile-controls hidden">
        <div class="mobile-controls-header">
          <div>
            <p class="panel-kicker">Telephone</p>
            <h3>Deplacement tactile</h3>
          </div>
        </div>
        <div class="mobile-controls-layout">
          <div class="joystick-card">
            <div class="joystick-pad" data-joystick-pad>
              <div class="joystick-ring"></div>
              <div class="joystick-stick" data-joystick-stick></div>
            </div>
            <p class="mobile-help-copy">Glissez le pouce dans le cercle pour parcourir la ville.</p>
          </div>
          <div class="mobile-action-grid">
            <button type="button" class="mobile-action" data-mobile="level2">Niveau 2</button>
            <button type="button" class="mobile-action" data-mobile="menu">Menu</button>
          </div>
        </div>
      </section>
    `;

    container.appendChild(this.panelRoot);
    this.currentZoneChip = this.panelRoot.querySelector('[data-role="zone-chip"]') as HTMLDivElement;
    this.joystickPad = this.panelRoot.querySelector('[data-joystick-pad]') as HTMLDivElement;
    this.joystickStick = this.panelRoot.querySelector('[data-joystick-stick]') as HTMLDivElement;

    this.panelRoot.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        audioManager.unlock();

        if (button.dataset.action === 'level2') {
          this.returnToLevel2();
          return;
        }

        this.scene.start('MenuScene');
      });
    });

    this.panelRoot.querySelectorAll<HTMLButtonElement>('[data-mobile]').forEach((button) => {
      button.addEventListener('click', () => {
        audioManager.unlock();

        if (button.dataset.mobile === 'level2') {
          this.returnToLevel2();
          return;
        }

        this.scene.start('MenuScene');
      });
    });

    this.setupJoystick();

    this.resizeHandler = () => {
      this.syncTouchLayout();
    };

    window.addEventListener('resize', this.resizeHandler);
    this.cleanupCallbacks.push(() => {
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
      }
    });
    this.syncTouchLayout();
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

  private handleKeyDown(event: KeyboardEvent): void {
    audioManager.unlock();

    switch (event.code) {
      case 'Digit2':
      case 'Numpad2':
      case 'Backspace':
        this.returnToLevel2();
        return;
      case 'Escape':
        this.scene.start('MenuScene');
        return;
      default:
        return;
    }
  }

  private updateMovement(delta: number): void {
    const keyboardHorizontal =
      (this.keys.left.isDown || this.keys.q.isDown ? -1 : 0) +
      (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0);
    const keyboardVertical =
      (this.keys.up.isDown || this.keys.z.isDown ? -1 : 0) +
      (this.keys.down.isDown || this.keys.s.isDown ? 1 : 0);

    const useTouch =
      this.touchEnabled && (Math.abs(this.touchVector.x) > 0.02 || Math.abs(this.touchVector.y) > 0.02);

    const vector = new Phaser.Math.Vector2(
      useTouch ? this.touchVector.x : keyboardHorizontal,
      useTouch ? this.touchVector.y : keyboardVertical
    );

    if (vector.lengthSq() === 0) {
      this.player.stop();
      return;
    }

    vector.normalize();

    const distance = LEVEL3_PLAYER_SPEED * Math.min(delta, 40) * 0.001;
    const margin = 18;
    const nextX = Phaser.Math.Clamp(this.player.x + vector.x * distance, margin, LEVEL3_WORLD_WIDTH - margin);
    const nextY = Phaser.Math.Clamp(this.player.y + vector.y * distance, margin, LEVEL3_WORLD_HEIGHT - margin);

    let resolvedX = this.player.x;
    let resolvedY = this.player.y;

    if (this.isWalkable(nextX, this.player.y)) {
      resolvedX = nextX;
    }

    if (this.isWalkable(resolvedX, nextY)) {
      resolvedY = nextY;
    }

    if (resolvedX === this.player.x && resolvedY === this.player.y && this.isWalkable(nextX, nextY)) {
      resolvedX = nextX;
      resolvedY = nextY;
    }

    this.player.setPosition(resolvedX, resolvedY);
    this.player.setFlipX(vector.x < 0);
    this.player.stop();
  }

  private isWalkable(x: number, y: number): boolean {
    return LEVEL3_WALKABLE_ZONES.some((zone) => {
      const dx = x - zone.x;
      const dy = y - zone.y;
      return dx * dx + dy * dy <= zone.radius * zone.radius;
    });
  }

  private updateCurrentZone(): void {
    if (!this.currentZoneChip) {
      return;
    }

    let best = LEVEL3_POINTS_OF_INTEREST[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    LEVEL3_POINTS_OF_INTEREST.forEach((point) => {
      const dx = this.player.x - point.x;
      const dy = this.player.y - point.y;
      const distance = dx * dx + dy * dy;

      if (distance < bestDistance) {
        bestDistance = distance;
        best = point;
      }
    });

    if (best.label === this.currentZoneLabel) {
      return;
    }

    this.currentZoneLabel = best.label;
    this.currentZoneChip.textContent = `Zone actuelle : ${best.label}`;
  }

  private syncTouchLayout(): void {
    if (!this.panelRoot) {
      return;
    }

    this.touchEnabled = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 900;
    const mobileControls = this.panelRoot.querySelector('.mobile-controls') as HTMLDivElement;
    mobileControls.classList.toggle('hidden', !this.touchEnabled);

    if (!this.touchEnabled) {
      this.resetTouchVector();
    }
  }

  private setupJoystick(): void {
    if (!this.joystickPad || !this.joystickStick) {
      return;
    }

    const updateFromPointer = (event: PointerEvent) => {
      if (!this.joystickPad || !this.joystickStick) {
        return;
      }

      const rect = this.joystickPad.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = rect.width * 0.34;
      const rawX = event.clientX - centerX;
      const rawY = event.clientY - centerY;
      const distance = Math.hypot(rawX, rawY);
      const scale = distance > maxRadius ? maxRadius / distance : 1;
      const clampedX = rawX * scale;
      const clampedY = rawY * scale;

      this.touchVector = {
        x: clampedX / maxRadius,
        y: clampedY / maxRadius
      };

      this.joystickStick.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0px)`;
    };

    const releasePointer = (event?: PointerEvent) => {
      if (event && event.pointerId !== this.activePointerId) {
        return;
      }

      this.activePointerId = undefined;
      this.resetTouchVector();
    };

    this.joystickPad.addEventListener('pointerdown', (event) => {
      if (!this.touchEnabled || !this.joystickPad) {
        return;
      }

      event.preventDefault();
      this.activePointerId = event.pointerId;
      this.joystickPad.setPointerCapture(event.pointerId);
      updateFromPointer(event);
    });

    this.joystickPad.addEventListener('pointermove', (event) => {
      if (event.pointerId !== this.activePointerId) {
        return;
      }

      event.preventDefault();
      updateFromPointer(event);
    });

    this.joystickPad.addEventListener('pointerup', (event) => {
      releasePointer(event);
    });

    this.joystickPad.addEventListener('pointercancel', (event) => {
      releasePointer(event);
    });

    this.joystickPad.addEventListener('lostpointercapture', () => {
      releasePointer();
    });
  }

  private resetTouchVector(): void {
    this.touchVector = { x: 0, y: 0 };

    if (this.joystickStick) {
      this.joystickStick.style.transform = 'translate3d(0px, 0px, 0px)';
    }
  }

  private returnToLevel2(): void {
    this.saveData.currentLevel = 2;
    saveGame(this.saveData);
    this.scene.start('Level2Scene');
  }
}
