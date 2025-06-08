import { Scene, Types, GameObjects, Physics } from 'phaser';
import { PlayerConfig, GameConstants } from '../config';
import { Leech } from './enemies/Leech';

export class Player extends GameObjects.Sprite {
  // Physics body
  body!: Physics.Arcade.Body;
  
  // Input
  private cursors!: Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  
  // State
  private isAttacking: boolean = false;
  private isJumping: boolean = false;
  private isInvincible: boolean = false;
  private health: number = PlayerConfig.maxHealth;
  private attachedLeeches: Leech[] = [];
  private lastAttackTime: number = 0;
  private lastHitTime: number = 0;
  
  // Effects
  private meleeRange: number = 1.0; // Multiplier for attack range
  private invincibleTimer: Phaser.Time.TimerEvent | null = null;
  
  // Animations
  private animPrefix: string = 'player-';
  
  constructor(scene: Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    
    // Set up physics
    scene.physics.world.enable(this);
    this.body.setSize(PlayerConfig.width, PlayerConfig.height);
    this.body.setOffset(PlayerConfig.offsetX, PlayerConfig.offsetY);
    this.body.setCollideWorldBounds(true);
    
    // Set up input
    this.setupInput();
    
    // Add to scene
    scene.add.existing(this);
    
    // Set up animations
    this.createAnimations();
    
    // Play idle animation
    this.play(`${this.animPrefix}idle`);
  }
  
  private setupInput() {
    // Keyboard input
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.attackKey = this.scene.input.keyboard!.addKey('X');
    this.jumpKey = this.scene.input.keyboard!.addKey('Z');
    
    // Touch input (for mobile)
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Right side of screen for attack
      if (pointer.x > this.scene.cameras.main.width / 2) {
        this.attack();
      }
    });
    
    // Double tap for jump
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.getDuration() < 250 && pointer.y > this.scene.cameras.main.height - 100) {
        this.jump();
      }
    });
  }
  
  public createAnimations() {
    // Idle animation (2 frames)
    this.scene.anims.create({
      key: `${this.animPrefix}idle`,
      frames: this.scene.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
      frameRate: 3,
      repeat: -1
    });
    
    // Run animation (4 frames)
    this.scene.anims.create({
      key: `${this.animPrefix}run`,
      frames: this.scene.anims.generateFrameNumbers('player', { start: 2, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    
    // Jump animation (1 frame)
    this.scene.anims.create({
      key: `${this.animPrefix}jump`,
      frames: [{ key: 'player', frame: 6 }],
      frameRate: 1
    });
    
    // Attack animation (3 frames)
    this.scene.anims.create({
      key: `${this.animPrefix}attack`,
      frames: this.scene.anims.generateFrameNumbers('player', { start: 7, end: 9 }),
      frameRate: 12,
      repeat: 0
    });
    
    // Hurt animation (blinking)
    this.scene.anims.create({
      key: `${this.animPrefix}hurt`,
      frames: [
        { key: 'player', frame: 10 },
        { key: 'player', frame: 0 }
      ],
      frameRate: 8,
      repeat: 3
    });
  }
  
  public update() {
    // Reset horizontal movement
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    
    // Handle movement
    if (this.cursors.left.isDown) {
      this.moveLeft();
    } else if (this.cursors.right.isDown) {
      this.moveRight();
    } else {
      // Decelerate to a stop
      body.setVelocityX(body.velocity.x * 0.9);
    }
    
    // Handle jumping
    if ((this.cursors.up.isDown || this.jumpKey.isDown) && body.onFloor()) {
      this.jump();
    }
    
    // Handle attacking
    if ((Phaser.Input.Keyboard.JustDown(this.attackKey) || this.isAttacking) && 
        !this.isAttacking) {
      this.attack();
    }
    
    // Update animation based on state
    this.updateAnimation();
    
    // Update attached leeches
    this.updateAttachedLeeches();
  }
  
  private moveLeft() {
    this.body.setVelocityX(-PlayerConfig.speed);
    this.setFlipX(true);
  }
  
  private moveRight() {
    this.body.setVelocityX(PlayerConfig.speed);
    this.setFlipX(false);
  }
  
  private jump() {
    if (this.body.onFloor()) {
      this.body.setVelocityY(PlayerConfig.jumpForce);
      this.isJumping = true;
      this.scene.sound.play('jump');
      
      // Event for when jump ends
      this.scene.time.delayedCall(300, () => {
        this.isJumping = false;
      });
    }
  }
  
  private attack() {
    const now = this.scene.time.now;
    
    // Check cooldown
    if (now - this.lastAttackTime < PlayerConfig.attackCooldown) {
      return;
    }
    
    // Set attacking state
    this.isAttacking = true;
    this.lastAttackTime = now;
    
    // Play attack animation
    this.play(`${this.animPrefix}attack`, true);
    
    // Play attack sound
    this.scene.sound.play('attack');
    
    // Create hitbox
    this.createAttackHitbox();
    
    // Reset attack state when animation completes
    this.once('animationcomplete', () => {
      this.isAttacking = false;
    });
  }
  
  private createAttackHitbox() {
    // Create a hitbox in front of the player
    const direction = this.flipX ? -1 : 1;
    const hitbox = this.scene.add.rectangle(
      this.x + (direction * 20 * this.meleeRange),
      this.y - 5,
      30 * this.meleeRange,
      20,
      0xff0000,
      0.3
    );
    
    // Add physics to the hitbox
    this.scene.physics.add.existing(hitbox);
    
    // Destroy the hitbox after a short time
    this.scene.time.delayedCall(200, () => {
      hitbox.destroy();
    });
    
    return hitbox;
  }
  
  private updateAnimation() {
    if (this.isAttacking) {
      return; // Don't change animation while attacking
    }
    
    if (!this.body.onFloor()) {
      this.play(`${this.animPrefix}jump`, true);
    } else if (Math.abs(this.body.velocity.x) > 10) {
      this.play(`${this.animPrefix}run`, true);
    } else {
      this.play(`${this.animPrefix}idle`, true);
    }
  }
  
  public takeDamage(amount: number) {
    if (this.isInvincible) {
      return false; // No damage taken
    }
    
    // Reduce health
    this.health = Math.max(0, this.health - amount);
    
    // Emit event
    this.emit('hit', this.health, PlayerConfig.maxHealth);
    
    // Check for death
    if (this.health <= 0) {
      this.die();
      return true;
    }
    
    // Make player temporarily invincible
    this.setInvincible(true);
    
    // Play hurt animation
    this.play(`${this.animPrefix}hurt`, true);
    
    // Flash effect
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });
    
    return true;
  }
  
  public attachLeech(leech: Leech) {
    // Add leech to attached leeches
    this.attachedLeeches.push(leech);
    
    // Start damage over time
    this.scene.time.delayedCall(1000, () => {
      if (this.attachedLeeches.includes(leech) && this.health > 0) {
        this.takeDamage(leech.getDamage());
      }
    }, null, this);
  }
  
  public detachLeech(leech: Leech) {
    const index = this.attachedLeeches.indexOf(leech);
    if (index > -1) {
      this.attachedLeeches.splice(index, 1);
    }
  }
  
  private updateAttachedLeeches() {
    // Update positions of attached leeches
    this.attachedLeeches.forEach((leech, index) => {
      // Position leeches around the player
      const angle = (index / this.attachedLeeches.length) * Math.PI * 2;
      const radius = 20 + (index * 5);
      
      leech.setPosition(
        this.x + Math.cos(angle) * radius,
        this.y - 10 + Math.sin(angle) * radius
      );
    });
  }
  
  public shakeOffLeeches() {
    // Shake off all attached leeches
    this.attachedLeeches.forEach(leech => {
      leech.detach();
    });
    
    // Clear the array
    this.attachedLeeches = [];
  }
  
  public setInvincible(invincible: boolean) {
    this.isInvincible = invincible;
    
    // Clear any existing timer
    if (this.invincibleTimer) {
      this.invincibleTimer.destroy();
      this.invincibleTimer = null;
    }
    
    if (invincible) {
      // Set a timer to disable invincibility
      this.invincibleTimer = this.scene.time.delayedCall(
        PlayerConfig.invincibleDuration,
        () => {
          this.isInvincible = false;
          this.clearTint();
        }
      );
      
      // Blink effect
      this.scene.tweens.add({
        targets: this,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        repeat: PlayerConfig.invincibleDuration / 200,
        onComplete: () => {
          this.setAlpha(1);
        }
      });
    }
  }
  
  public isInvincibleState(): boolean {
    return this.isInvincible;
  }
  
  public isAttackingState(): boolean {
    return this.isAttacking;
  }
  
  public getMeleeRange(): number {
    return this.meleeRange;
  }
  
  public setMeleeRange(range: number) {
    this.meleeRange = range;
    
    // Reset after a delay
    this.scene.time.delayedCall(10000, () => {
      this.meleeRange = 1.0;
    });
  }
  
  public die() {
    // Emit death event
    this.emit('death');
    
    // Play death animation
    this.play(`${this.animPrefix}hurt`);
    
    // Disable physics
    this.body.enable = false;
    
    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        this.destroy();
      }
    });
  }
  
  // Clean up
  public destroy(fromScene?: boolean) {
    // Clean up any attached leeches
    this.attachedLeeches.forEach(leech => {
      leech.detach();
    });
    
    // Clear timers
    if (this.invincibleTimer) {
      this.invincibleTimer.destroy();
    }
    
    // Call parent destroy
    super.destroy(fromScene);
  }
}
