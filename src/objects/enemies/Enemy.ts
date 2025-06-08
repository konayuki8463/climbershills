import { Scene, GameObjects, Physics } from 'phaser';
import { EnemyConfig } from '../../config';

export abstract class Enemy extends GameObjects.Sprite {
  // Physics body
  body!: Physics.Arcade.Body;
  
  // State
  protected health: number;
  protected damage: number;
  protected speed: number;
  protected scoreValue: number;
  protected isAttached: boolean = false;
  protected isDead: boolean = false;
  protected target: GameObjects.GameObject | null = null;
  
  // Hitbox (separate from the sprite for better collision detection)
  protected hitbox!: Physics.Arcade.Sprite;
  
  constructor(
    scene: Scene, 
    x: number, 
    y: number, 
    texture: string, 
    config: EnemyConfig
  ) {
    super(scene, x, y, texture);
    
    // Initialize from config
    this.health = config.health;
    this.damage = config.damage;
    this.speed = config.speed;
    this.scoreValue = config.score;
    
    // Set up physics
    this.setupPhysics();
    
    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Create animations
    this.createAnimations();
    
    // Start with idle animation
    this.play(this.getAnimKey('idle'));
  }
  
  protected setupPhysics() {
    // Configure physics body
    const body = this.body as Physics.Arcade.Body;
    body.setSize(16, 16);
    body.setOffset(0, 0);
    body.setCollideWorldBounds(false);
    
    // Create hitbox for better collision detection
    this.createHitbox();
  }
  
  protected createHitbox() {
    // Create a separate sprite for hit detection
    this.hitbox = this.scene.physics.add.sprite(
      this.x,
      this.y,
      '' // Invisible
    );
    
    // Set hitbox size (smaller than the sprite for better gameplay)
    this.hitbox.body.setSize(12, 12);
    this.hitbox.body.setOffset(2, 2);
    this.hitbox.setVisible(false);
    
    // Make the hitbox follow the enemy
    this.scene.physics.add.collider(this, this.hitbox);
  }
  
  public getHitbox(): Physics.Arcade.Sprite {
    return this.hitbox;
  }
  
  protected abstract createAnimations(): void;
  
  protected getAnimKey(name: string): string {
    return `${this.texture.key}-${name}`;
  }
  
  public update() {
    if (this.isDead) return;
    
    // Update hitbox position
    if (this.hitbox) {
      this.hitbox.x = this.x;
      this.hitbox.y = this.y;
    }
    
    // Update behavior based on state
    if (this.isAttached) {
      this.updateAttached();
    } else if (this.target) {
      this.updateMovement();
    }
  }
  
  protected abstract updateMovement(): void;
  
  protected updateAttached() {
    // Default behavior when attached (can be overridden)
  }
  
  public takeDamage(amount: number): boolean {
    if (this.isDead) return false;
    
    // Reduce health
    this.health -= amount;
    
    // Flash effect
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
    
    // Check if dead
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    return false;
  }
  
  public attachTo(target: GameObjects.GameObject) {
    if (this.isAttached || this.isDead) return;
    
    this.isAttached = true;
    this.target = target;
    
    // Disable physics
    this.body.enable = false;
    
    // Play attach animation
    this.play(this.getAnimKey('attach'), true);
    
    // Emit event
    this.emit('attached', this);
  }
  
  public detach() {
    if (!this.isAttached || this.isDead) return;
    
    this.isAttached = false;
    
    // Re-enable physics
    this.body.enable = true;
    
    // Apply a small force away from the player
    if (this.target) {
      const angle = Phaser.Math.Angle.Between(
        (this.target as any).x,
        (this.target as any).y,
        this.x,
        this.y
      );
      
      const force = 200;
      const body = this.body as Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(angle) * force,
        Math.sin(angle) * force
      );
    }
    
    // Play detach animation
    this.play(this.getAnimKey('idle'), true);
    
    // Schedule removal after a delay
    this.scene.time.delayedCall(1000, () => {
      if (!this.isAttached) {
        this.die();
      }
    });
    
    // Emit event
    this.emit('detached', this);
  }
  
  public getDamage(): number {
    return this.damage;
  }
  
  public die() {
    if (this.isDead) return;
    
    this.isDead = true;
    
    // Play death animation
    this.play(this.getAnimKey('die'), true);
    
    // Disable physics
    this.body.enable = false;
    
    // Emit event
    this.emit('death', this);
    
    // Remove from scene after animation
    this.once('animationcomplete', () => {
      this.destroy();
    });
  }
  
  public stop() {
    // Stop any movement
    const body = this.body as Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
    }
  }
  
  public destroy(fromScene?: boolean) {
    // Clean up hitbox
    if (this.hitbox) {
      this.hitbox.destroy();
    }
    
    // Call parent destroy
    super.destroy(fromScene);
    
    // Emit removed event
    this.emit('removed', this);
  }
}
