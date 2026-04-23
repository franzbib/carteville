import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.svg('city-emblem', '/assets/ui/city-emblem.svg');
  }

  create(): void {
    this.createTextures();
    this.scene.start('MenuScene');
  }

  private createTextures(): void {
    const graphics = this.add.graphics({ x: 0, y: 0 });
    graphics.setVisible(false);

    graphics.clear();
    graphics.fillStyle(0x1f2529, 0.18);
    graphics.fillEllipse(32, 60, 28, 10);
    graphics.fillStyle(0x2b3c4d, 1);
    graphics.fillCircle(32, 24, 13);
    graphics.fillStyle(0xb56d4a, 1);
    graphics.fillRoundedRect(18, 34, 28, 24, 8);
    graphics.fillStyle(0xf4d6bf, 1);
    graphics.fillCircle(32, 21, 10);
    graphics.fillStyle(0xe7f0f2, 1);
    graphics.fillTriangle(23, 35, 32, 52, 41, 35);
    graphics.generateTexture('player-token', 64, 72);

    graphics.clear();
    graphics.fillStyle(0x1f2529, 0.16);
    graphics.fillEllipse(28, 56, 24, 8);
    graphics.fillStyle(0x22303a, 1);
    graphics.fillCircle(28, 21, 10);
    graphics.fillStyle(0x6f8d5f, 1);
    graphics.fillRoundedRect(16, 31, 24, 24, 8);
    graphics.fillStyle(0xf4d8c4, 1);
    graphics.fillCircle(28, 20, 8);
    graphics.generateTexture('npc-token', 56, 64);

    graphics.destroy();
  }
}
