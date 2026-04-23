import Phaser from 'phaser';

export class Player extends Phaser.Physics.Arcade.Sprite {
  static readonly SPEED = 220;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player-token');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.82);
    this.setDepth(y + 28);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 26);
    body.setOffset(18, 24);
    body.setAllowGravity(false);

    this.setCollideWorldBounds(true);
    this.setDamping(true);
    this.setDrag(900, 900);
    this.setMaxVelocity(Player.SPEED);
  }

  move(x: number, y: number): void {
    const vector = new Phaser.Math.Vector2(x, y);

    if (vector.lengthSq() === 0) {
      this.stop();
      return;
    }

    vector.normalize().scale(Player.SPEED);
    this.setVelocity(vector.x, vector.y);

    if (vector.x !== 0) {
      this.setFlipX(vector.x < 0);
    }
  }

  override stop(): this {
    this.setVelocity(0, 0);
    return this;
  }

  syncDepth(): void {
    this.setDepth(this.y + 28);
  }
}
