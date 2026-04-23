import Phaser from 'phaser';

import type { NPCData } from '../data/npcs';

export interface NPCInteraction {
  text: string;
  newClueIds: string[];
}

export class NPC extends Phaser.Physics.Arcade.Sprite {
  readonly dataModel: NPCData;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly nameTag: Phaser.GameObjects.Text;
  private readonly halo: Phaser.GameObjects.Ellipse;

  constructor(scene: Phaser.Scene, data: NPCData) {
    super(scene, data.x, data.y, 'npc-token');
    this.dataModel = data;

    this.shadow = scene.add.ellipse(data.x, data.y + 12, 42, 14, 0x1d2429, 0.18);
    this.halo = scene.add.ellipse(data.x, data.y + 2, 64, 34, 0xe9c582, 0.24);
    this.halo.setStrokeStyle(2, 0xfff1c6, 0.8);
    this.halo.setVisible(false);
    this.halo.setDepth(data.y - 16);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.82);
    this.setDepth(data.y + 6);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);
    body.moves = false;
    body.setSize(20, 22);
    body.setOffset(16, 22);

    this.nameTag = scene.add
      .text(data.x, data.y - 42, data.name, {
        fontFamily: 'Trebuchet MS',
        fontSize: '14px',
        color: '#24303a',
        backgroundColor: '#f6f0e3',
        padding: { left: 10, right: 10, top: 6, bottom: 6 }
      })
      .setOrigin(0.5)
      .setDepth(data.y - 20)
      .setAlpha(0.92);

    scene.tweens.add({
      targets: this,
      y: data.y - 4,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Math.round(data.x % 230)
    });
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    this.shadow.setPosition(this.x, this.y + 12);
    this.halo.setPosition(this.x, this.y + 2);
    this.nameTag.setPosition(this.x, this.y - 42);
    this.setDepth(this.y + 6);
    this.nameTag.setDepth(this.y - 20);
    this.halo.setDepth(this.y - 18);
    this.shadow.setDepth(this.y - 16);
  }

  getInteraction(discoveredClues: Set<string>): NPCInteraction {
    const nextLine = this.dataModel.lines.find((line) => !discoveredClues.has(line.clueId));

    if (nextLine) {
      return {
        text: nextLine.text,
        newClueIds: [nextLine.clueId]
      };
    }

    return {
      text: this.dataModel.repeatLine,
      newClueIds: []
    };
  }

  distanceTo(x: number, y: number): number {
    return Phaser.Math.Distance.Between(this.x, this.y, x, y);
  }

  setNearby(active: boolean): void {
    this.halo.setVisible(active);
    this.nameTag.setStyle({
      backgroundColor: active ? '#fff4cd' : '#f6f0e3'
    });
  }

  destroyNPC(): void {
    this.shadow.destroy();
    this.halo.destroy();
    this.nameTag.destroy();
    this.destroy();
  }
}
