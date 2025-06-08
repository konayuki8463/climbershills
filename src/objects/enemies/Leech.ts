import { Scene, GameObjects, Physics, Math as PhaserMath } from 'phaser';
import { Enemy } from './Enemy';
import { EnemyConfig } from '../../config';

export class Leech extends Enemy {
  // Movement
  private jumpTimer: Phaser.Time.TimerEvent | null = null;
  private jumpCooldown: { min: number; max: number };
  private jumpForce: number;
  private attachDuration: number;
  
  // Target tracking
  private target: GameObjects.GameObject | null = null;
  
  constructor(scene: Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture, {
      health: 1,
      damage: 5,
      speed: 60,
      score: 100,
    });
    
    // Set up leech-specific properties
    this.jumpCooldown = { min: 1000, max: 3000 };
    this.jumpForce = 200;
    this.attachDuration = 1000; // ms
    
    // Start AI behavior
    this.startAI();
  }
  
  protected createAnimations() {
    // Idle animation (squirming)
    this.scene.anims.create({
      key: this.getAnimKey('idle'),
      frames: this.scene.anims.generateFrameNumbers('leech', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
    
    // Jump/attack animation
    this.scene.anims.create({
      key: this.getAnimKey('jump'),
      frames: this.scene.anims.generateFrameNumbers('leech', { start: 4, end: 6 }),
      frameRate: 10,
      repeat: 0
    });
    
    // Attach animation
    this.scene.anims.create({
      key: this.getAnimKey('attach'),
      frames: [{ key: 'leech', frame: 7 }],
      frameRate: 1,
      repeat: -1
    });
    
    // Death animation
    this.scene.anims.create({
      key: this.getAnimKey('die'),
      frames: this.scene.anims.generateFrameNumbers('leech', { start: 8, end: 10 }),
      frameRate: 8,
      repeat: 0
    });
  }
  
  private startAI() {
    // Start jumping behavior
    this.scheduleJump();
  }
  
  private scheduleJump() {
    if (this.isDead || this.isAttached) return;
    
    // Random delay between jumps
    const delay = Phaser.Math.Between(this.jumpCooldown.min, this.jumpCooldown.max);
    
    this.jumpTimer = this.scene.time.delayedCall(delay, () => {
      if (!this.isDead && !this.isAttached) {
        this.jumpTowardsPlayer();
      }
    });
  }
  
  private jumpTowardsPlayer() {
    if (this.isDead || this.isAttached) return;
    
    // Play jump animation
    this.play(this.getAnimKey('jump'), true);
    
    // Apply jump force
    if (this.target) {
      // Jump towards player
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        (this.target as any).x,
        (this.target as any).y
      );
      
      const body = this.body as Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angle) * this.jumpForce,
        Math.sin(angle) * this.jumpForce
      );
    } else {
      // Jump in a random direction if no target
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const body = this.body as Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angle) * this.jumpForce * 0.7,
        Math.sin(angle) * this.jumpForce * 0.7
      );
    }
    
    // Schedule next jump
    this.scheduleJump();
  }
  
  protected updateMovement() {
    // Simple movement towards target if it exists
    if (this.target) {
      const angle = Phaser.Math.Angle.Between(
        this.x,
        this.y,
        (this.target as any).x,
        (this.target as any).y
      );
      
      const body = this.body as Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angle) * this.speed,
        Math.sin(angle) * this.speed
      );
    }
  }
  
  protected updateAttached() {
    // No movement when attached
    const body = this.body as Physics.Arcade.Body;
    body.setVelocity(0, 0);
  }
  
  public setTarget(target: GameObjects.GameObject) {
    this.target = target;
  }
  
  public attachTo(target: GameObjects.GameObject) {
    if (this.isAttached || this.isDead) return;
    
    // Stop any current movement
    this.stop();
    
    // Cancel any pending jumps
    if (this.jumpTimer) {
      this.jumpTimer.destroy();
      this.jumpTimer = null;
    }
    
    // Call parent attach
    super.attachTo(target);
    
    // Set up detachment after duration
    this.scene.time.delayedCall(this.attachDuration, () => {
      if (this.isAttached && !this.isDead) {
        this.detach();
      }
    });
  }
  
  public detach() {
    if (!this.isAttached || this.isDead) return;
    
    // Call parent detach
    super.detach();
    
    // Restart AI behavior
    this.scheduleJump();
  }
  
  public die() {
    if (this.isDead) return;
    
    // Stop any timers
    if (this.jumpTimer) {
      this.jumpTimer.destroy();
      this.jumpTimer = null;
    }
    
    // Call parent die
    super.die();
  }
  
  public destroy(fromScene?: boolean) {
    // Clean up timers
    if (this.jumpTimer) {
      this.jumpTimer.destroy();
    }
    
    // Call parent destroy
    super.destroy(fromScene);
  }
}
