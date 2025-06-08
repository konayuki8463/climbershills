import { Scene, GameObjects, Physics, Math as PhaserMath } from 'phaser';
import { Enemy } from './Enemy';
import { EnemyConfig } from '../../config';

export class LeechBoss extends Enemy {
  // Movement
  private jumpTimer: Phaser.Time.TimerEvent | null = null;
  private jumpCooldown: { min: number; max: number };
  private jumpForce: number;
  private attachDuration: number;
  
  // Attack patterns
  private attackPatterns: Function[] = [];
  private currentAttack: number = 0;
  private attackCooldown: number = 2000; // ms between attacks
  private lastAttackTime: number = 0;
  
  // Minions
  private minions: Enemy[] = [];
  private maxMinions: number = 5;
  private minionSpawnCooldown: number = 5000; // ms
  private lastMinionSpawn: number = 0;
  
  // Target tracking
  private target: GameObjects.GameObject | null = null;
  
  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, 'leech-boss', {
      health: 50,
      damage: 10,
      speed: 80,
      score: 5000,
    });
    
    // Set up boss-specific properties
    this.jumpCooldown = { min: 500, max: 1500 };
    this.jumpForce = 300;
    this.attachDuration = 500; // ms
    
    // Set up attack patterns
    this.setupAttackPatterns();
    
    // Start AI behavior
    this.startAI();
    
    // Make boss larger
    this.setScale(2);
  }
  
  protected createAnimations() {
    // Idle animation (squirming)
    this.scene.anims.create({
      key: this.getAnimKey('idle'),
      frames: this.scene.anims.generateFrameNumbers('leech-boss', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
    
    // Jump/attack animation
    this.scene.anims.create({
      key: this.getAnimKey('jump'),
      frames: this.scene.anims.generateFrameNumbers('leech-boss', { start: 4, end: 6 }),
      frameRate: 8,
      repeat: 0
    });
    
    // Attach animation
    this.scene.anims.create({
      key: this.getAnimKey('attach'),
      frames: [{ key: 'leech-boss', frame: 7 }],
      frameRate: 1,
      repeat: -1
    });
    
    // Death animation
    this.scene.anims.create({
      key: this.getAnimKey('die'),
      frames: this.scene.anims.generateFrameNumbers('leech-boss', { start: 8, end: 12 }),
      frameRate: 6,
      repeat: 0
    });
  }
  
  private setupAttackPatterns() {
    this.attackPatterns = [
      this.chargeAttack.bind(this),
      this.spiralAttack.bind(this),
      this.summonMinions.bind(this)
    ];
  }
  
  private startAI() {
    // Start with idle behavior
    this.scheduleJump();
    
    // Start attack pattern loop
    this.scene.time.addEvent({
      delay: this.attackCooldown,
      callback: this.executeAttackPattern,
      callbackScope: this,
      loop: true
    });
  }
  
  private executeAttackPattern() {
    if (this.isDead || this.isAttached) return;
    
    // Select next attack pattern
    this.currentAttack = (this.currentAttack + 1) % this.attackPatterns.length;
    const attack = this.attackPatterns[this.currentAttack];
    
    // Execute attack
    attack();
    
    // Update last attack time
    this.lastAttackTime = this.scene.time.now;
  }
  
  private chargeAttack() {
    if (this.isDead || this.isAttached || !this.target) return;
    
    // Play attack animation
    this.play(this.getAnimKey('jump'), true);
    
    // Charge towards player
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      (this.target as any).x,
      (this.target as any).y
    );
    
    const body = this.body as Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * this.jumpForce * 1.5,
      Math.sin(angle) * this.jumpForce * 1.5
    );
    
    // Create shockwave effect
    this.createShockwave();
  }
  
  private spiralAttack() {
    if (this.isDead || this.isAttached) return;
    
    // Create a spiral of projectiles
    const numProjectiles = 12;
    const angleStep = (Math.PI * 2) / numProjectiles;
    
    for (let i = 0; i < numProjectiles; i++) {
      const angle = angleStep * i;
      this.scene.time.delayedCall(i * 100, () => {
        if (!this.isDead && !this.isAttached) {
          this.createProjectile(angle);
        }
      });
    }
  }
  
  private summonMinions() {
    if (this.isDead || this.isAttached || this.minions.length >= this.maxMinions) return;
    
    const now = this.scene.time.now;
    if (now - this.lastMinionSpawn < this.minionSpawnCooldown) return;
    
    // Spawn minions around the boss
    const numMinions = Phaser.Math.Between(1, 3);
    const angleStep = (Math.PI * 2) / numMinions;
    
    for (let i = 0; i < numMinions; i++) {
      if (this.minions.length >= this.maxMinions) break;
      
      const angle = angleStep * i;
      const distance = 50;
      
      const x = this.x + Math.cos(angle) * distance;
      const y = this.y + Math.sin(angle) * distance;
      
      // Create minion (using regular Leech class for now)
      // In a full implementation, you might have a dedicated Minion class
      const minion = new Leech(this.scene, x, y, 'leech');
      this.minions.push(minion);
      
      // Set up minion events
      minion.on('death', () => {
        const index = this.minions.indexOf(minion);
        if (index > -1) {
          this.minions.splice(index, 1);
        }
      });
      
      // Add minion to the scene
      this.scene.add.existing(minion);
      this.scene.physics.add.existing(minion);
    }
    
    this.lastMinionSpawn = now;
  }
  
  private createProjectile(angle: number) {
    // Create a projectile
    const projectile = this.scene.physics.add.sprite(this.x, this.y, 'projectile');
    
    // Set up projectile
    projectile.setScale(0.5);
    projectile.setRotation(angle);
    
    // Set velocity based on angle
    const speed = 200;
    const body = projectile.body as Physics.Arcade.Body;
    body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    
    // Set up collision with player
    this.scene.physics.add.overlap(
      projectile,
      this.target as any,
      () => {
        // Damage player
        if (this.target && 'takeDamage' in this.target) {
          (this.target as any).takeDamage(5);
        }
        projectile.destroy();
      },
      undefined,
      this
    );
    
    // Destroy projectile after a delay
    this.scene.time.delayedCall(3000, () => {
      projectile.destroy();
    });
  }
  
  private createShockwave() {
    // Create a shockwave effect
    const shockwave = this.scene.add.circle(this.x, this.y, 10, 0xff0000, 0.5);
    
    // Animate shockwave
    this.scene.tweens.add({
      targets: shockwave,
      radius: 100,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        shockwave.destroy();
      }
    });
    
    // Check for player in shockwave radius
    if (this.target) {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        (this.target as any).x, (this.target as any).y
      );
      
      if (distance < 100) {
        // Push player away
        const angle = Phaser.Math.Angle.Between(
          (this.target as any).x, (this.target as any).y,
          this.x, this.y
        );
        
        const force = 400;
        (this.target as any).body.setVelocity(
          Math.cos(angle) * force,
          Math.sin(angle) * force
        );
        
        // Damage player
        if ('takeDamage' in this.target) {
          (this.target as any).takeDamage(5);
        }
      }
    }
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
    
    // Kill all minions
    this.minions.forEach(minion => {
      minion.die();
    });
    this.minions = [];
    
    // Play death effect
    this.playDeathEffect();
    
    // Call parent die
    super.die();
  }
  
  private playDeathEffect() {
    // Create explosion particles
    const particles = this.scene.add.particles('particle');
    
    const emitter = particles.createEmitter({
      x: this.x,
      y: this.y,
      speed: { min: -200, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      gravityY: 300,
      quantity: 20
    });
    
    // Destroy emitter after particles are gone
    this.scene.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }
  
  public destroy(fromScene?: boolean) {
    // Clean up timers
    if (this.jumpTimer) {
      this.jumpTimer.destroy();
    }
    
    // Clean up minions
    this.minions.forEach(minion => {
      minion.destroy();
    });
    
    // Call parent destroy
    super.destroy(fromScene);
  }
}
