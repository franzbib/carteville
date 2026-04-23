import Phaser from 'phaser';

import { BUILDINGS_BY_ID, BUILDINGS_BY_KEY } from '../data/buildings';
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
  private readonly labelBadge: Phaser.GameObjects.Rectangle;
  private readonly nameText: Phaser.GameObjects.Text;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly halo: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, id: number) {
    this.scene = scene;
    this.id = id;
    this.definition = BUILDINGS_BY_ID[id];
    this.layout = BUILDING_LAYOUTS[id];

    const layout = this.layout;
    const depth = layout.y + layout.height;
    const centerX = layout.x + layout.width / 2;
    const centerY = layout.y + layout.height / 2;
    const labelWidth = Math.max(56, layout.width - 22);

    this.shadow = scene.add
      .rectangle(centerX + 6, centerY + 10, layout.width, layout.height, 0x1c2227, 0.14)
      .setDepth(depth - 4)
      .setOrigin(0.5);

    this.base = scene.add
      .rectangle(centerX, centerY, layout.width, layout.height, 0xe9dfca)
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

    this.labelBadge = scene.add
      .rectangle(centerX, centerY + 10, labelWidth, Math.min(54, layout.height - 30), 0xf8f3e7, 0.94)
      .setStrokeStyle(2, 0xd7c9b1, 0.95)
      .setDepth(depth + 4)
      .setVisible(false);

    this.nameText = scene.add
      .text(centerX, centerY + 4, '', {
        fontFamily: 'Trebuchet MS',
        fontSize: layout.width < 120 ? '12px' : '14px',
        color: '#24303a',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: Math.max(44, layout.width - 28) }
      })
      .setOrigin(0.5, 0.5)
      .setDepth(depth + 5)
      .setVisible(false);

    this.statusText = scene.add
      .text(centerX, centerY + Math.min(28, layout.height * 0.22), '', {
        fontFamily: 'Trebuchet MS',
        fontSize: layout.width < 120 ? '10px' : '11px',
        color: '#6a726f',
        align: 'center'
      })
      .setOrigin(0.5, 0.5)
      .setDepth(depth + 5)
      .setVisible(false);

    this.halo = scene.add
      .ellipse(centerX, centerY, layout.width + 38, layout.height + 38, 0xe7b75f, 0.18)
      .setStrokeStyle(2, 0xfff3cf, 0.9)
      .setDepth(depth - 6)
      .setVisible(false);

    scene.tweens.add({
      targets: this.halo,
      alpha: { from: 0.14, to: 0.38 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.solid = scene.add.zone(centerX, centerY, Math.max(42, layout.width - 8), Math.max(38, layout.height - 10));
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

  applyProgress(progress: BuildingProgress, revealName = false): void {
    const isValidated = progress.validated || revealName;
    const hasProposal = Boolean(progress.proposed);
    const baseColor = isValidated ? this.definition.color : 0xe9dfca;
    const borderColor = progress.flaggedWrong ? 0xa5574f : isValidated ? 0x50606a : 0x7d6b57;

    this.base.setFillStyle(baseColor, isValidated ? 0.92 : 1);
    this.base.setStrokeStyle(progress.flaggedWrong ? 4 : 3, borderColor, 0.92);
    this.trim.setFillStyle(isValidated ? 0xf8f2e5 : 0xf2ebdc);
    this.numberBadge.setFillStyle(isValidated ? 0x24303a : 0x48545f, 0.94);

    if (isValidated) {
      this.showLabel(this.definition.shortName, 'Valide', '#24303a', '#4f8058', 0xf8f3e7, 0xf2ead6);
      return;
    }

    if (hasProposal && progress.proposed) {
      const proposedBuilding = BUILDINGS_BY_KEY[progress.proposed];
      this.showLabel(
        proposedBuilding.shortName,
        progress.flaggedWrong ? 'A revoir' : 'Proposition',
        progress.flaggedWrong ? '#8b4940' : '#7e4c35',
        progress.flaggedWrong ? '#8b4940' : '#6a726f',
        progress.flaggedWrong ? 0xf5dfdb : 0xf8f3e7,
        progress.flaggedWrong ? 0xdcaea5 : 0xd7c9b1
      );
      return;
    }

    this.hideLabel();
  }

  private showLabel(
    label: string,
    status: string,
    labelColor: string,
    statusColor: string,
    badgeFill: number,
    badgeStroke: number
  ): void {
    this.labelBadge.setFillStyle(badgeFill, 0.96);
    this.labelBadge.setStrokeStyle(2, badgeStroke, 0.96);
    this.labelBadge.setVisible(true);
    this.nameText.setText(label);
    this.nameText.setColor(labelColor);
    this.nameText.setVisible(true);
    this.statusText.setText(status);
    this.statusText.setColor(statusColor);
    this.statusText.setVisible(true);
  }

  private hideLabel(): void {
    this.labelBadge.setVisible(false);
    this.nameText.setVisible(false);
    this.statusText.setVisible(false);
  }

  destroyBuilding(): void {
    this.shadow.destroy();
    this.base.destroy();
    this.trim.destroy();
    this.door.destroy();
    this.numberBadge.destroy();
    this.numberText.destroy();
    this.labelBadge.destroy();
    this.nameText.destroy();
    this.statusText.destroy();
    this.halo.destroy();
    this.solid.destroy();
  }
}
