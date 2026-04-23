import Phaser from 'phaser';

import { BUILDINGS_BY_ID } from '../data/buildings';
import { BUILDING_LAYOUTS } from '../data/mapLayout';
import type { BuildingProgress } from '../types';

export class BuildingZone {
  readonly id: number;
  readonly definition;
  readonly layout;
  readonly solid: Phaser.GameObjects.Zone;

  private readonly scene: Phaser.Scene;
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly base: Phaser.GameObjects.Rectangle;
  private readonly trim: Phaser.GameObjects.Rectangle;
  private readonly door: Phaser.GameObjects.Rectangle;
  private readonly numberBadge: Phaser.GameObjects.Ellipse;
  private readonly numberText: Phaser.GameObjects.Text;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly halo: Phaser.GameObjects.Ellipse;
  private readonly missionHalo: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, id: number) {
    this.scene = scene;
    this.id = id;
    this.definition = BUILDINGS_BY_ID[id];
    this.layout = BUILDING_LAYOUTS[id];

    const layout = this.layout;
    const depth = layout.y + layout.height;
    const centerX = layout.x + layout.width / 2;
    const centerY = layout.y + layout.height / 2;

    this.shadow = scene.add
      .rectangle(centerX + 6, centerY + 10, layout.width, layout.height, 0x1c2227, 0.14)
      .setDepth(depth - 4)
      .setOrigin(0.5);

    this.base = scene.add
      .rectangle(centerX, centerY, layout.width, layout.height, 0xe7dcc4)
      .setStrokeStyle(3, 0x7d6b57, 0.9)
      .setDepth(depth);

    this.trim = scene.add
      .rectangle(centerX, centerY - layout.height / 2 + 16, layout.width - 12, 24, 0xf8f2e5)
      .setDepth(depth + 1);

    this.door = scene.add
      .rectangle(centerX, layout.y + layout.height - 12, Math.min(36, layout.width * 0.28), 18, 0x5a4d41)
      .setDepth(depth + 1);

    this.numberBadge = scene.add
      .ellipse(layout.x + 28, layout.y + 28, 36, 36, 0x24303a, 0.92)
      .setDepth(depth + 4);

    this.numberText = scene.add
      .text(layout.x + 28, layout.y + 28, String(id), {
        fontFamily: 'Trebuchet MS',
        fontSize: '18px',
        color: '#f6f0e3',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(depth + 5);

    this.nameText = scene.add
      .text(centerX, layout.y + layout.height + (layout.namePlateOffsetY ?? 12), '', {
        fontFamily: 'Trebuchet MS',
        fontSize: '16px',
        color: '#24303a',
        backgroundColor: '#f6f0e3cc',
        padding: { left: 10, right: 10, top: 4, bottom: 4 }
      })
      .setOrigin(0.5, 0)
      .setDepth(depth + 6)
      .setVisible(false)
      .setWordWrapWidth(layout.width + 70);

    this.halo = scene.add
      .ellipse(centerX, centerY, layout.width + 38, layout.height + 38, 0xe7b75f, 0.18)
      .setStrokeStyle(2, 0xfff3cf, 0.9)
      .setDepth(depth - 6)
      .setVisible(false);

    this.missionHalo = scene.add
      .ellipse(centerX, centerY, layout.width + 52, layout.height + 52, 0x83b18a, 0.14)
      .setStrokeStyle(3, 0x5b8761, 0.85)
      .setDepth(depth - 7)
      .setVisible(false);

    scene.tweens.add({
      targets: [this.halo, this.missionHalo],
      alpha: { from: 0.14, to: 0.38 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.solid = scene.add.zone(centerX, centerY, layout.width, layout.height);
    scene.physics.add.existing(this.solid, true);
    this.solid.setData('buildingId', id);
  }

  distanceTo(x: number, y: number): number {
    const centerX = this.layout.x + this.layout.width / 2;
    const centerY = this.layout.y + this.layout.height / 2;
    return Phaser.Math.Distance.Between(centerX, centerY, x, y);
  }

  getInteractionRadius(): number {
    return Math.max(this.layout.width, this.layout.height) * 0.55 + 56;
  }

  setNearby(active: boolean): void {
    this.halo.setVisible(active);
  }

  setMissionTarget(active: boolean): void {
    this.missionHalo.setVisible(active);
  }

  applyProgress(progress: BuildingProgress, revealName = false): void {
    const isValidated = progress.validated || revealName;
    const baseColor = isValidated ? this.definition.color : 0xe7dcc4;
    const borderColor = progress.flaggedWrong ? 0xa5574f : 0x7d6b57;
    const alpha = isValidated ? 0.88 : 1;

    this.base.setFillStyle(baseColor, alpha);
    this.base.setStrokeStyle(progress.flaggedWrong ? 4 : 3, borderColor, 0.92);

    this.trim.setFillStyle(isValidated ? 0xf8f2e5 : 0xf2ebdc);
    this.numberBadge.setFillStyle(isValidated ? 0x24303a : 0x48545f, 0.94);

    if (isValidated) {
      this.nameText.setText(this.definition.shortName);
      this.nameText.setVisible(true);
    } else {
      this.nameText.setVisible(false);
    }

    if (progress.proposed && !isValidated) {
      const proposalLabel = progress.proposed === this.definition.key ? 'À vérifier' : 'Proposé';
      this.nameText.setText(proposalLabel);
      this.nameText.setVisible(true);
      this.nameText.setColor(progress.flaggedWrong ? '#8b4940' : '#7e4c35');
    } else {
      this.nameText.setColor('#24303a');
    }
  }

  showAsIdentified(): void {
    this.base.setFillStyle(this.definition.color, 0.9);
    this.nameText.setText(this.definition.shortName);
    this.nameText.setVisible(true);
    this.nameText.setColor('#24303a');
  }

  destroyBuilding(): void {
    this.shadow.destroy();
    this.base.destroy();
    this.trim.destroy();
    this.door.destroy();
    this.numberBadge.destroy();
    this.numberText.destroy();
    this.nameText.destroy();
    this.halo.destroy();
    this.missionHalo.destroy();
    this.solid.destroy();
  }
}
