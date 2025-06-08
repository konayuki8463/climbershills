import { Scene, GameObjects, Physics } from 'phaser';
import { Player } from '../Player';

export abstract class Item extends GameObjects.Sprite {
  // Physics body
  body!: Physics.Arcade.Body;
  
  // Item properties
  protected isCollected: boolean = false;
  protected effectDuration: number = 0;
  
  constructor(scene: Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
    
    // Set up physics
    scene.physics.world.enable(this);
    const body = this.body as Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setBounce(0.3, 0.3);
    
    // Add to scene
    scene.add.existing(this);
    
    // Set up animations
    this.createAnimations();
    
    // Start floating animation
    this.playFloatAnimation();
  }
  
  protected createAnimations() {
    // Base item animations (can be overridden)
    this.scene.anims.create({
      key: `${this.texture.key}-float`,
      frames: this.scene.anims.generateFrameNumbers(this.texture.key, { start: 0, end: 3 }),
      frameRate: 3,
      repeat: -1
    });
    
    this.scene.anims.create({
      key: `${this.texture.key}-collect`,
      frames: this.scene.anims.generateFrameNumbers(this.texture.key, { start: 4, end: 7 }),
      frameRate: 12,
      repeat: 0
    });
  }
  
  protected playFloatAnimation() {
    this.play(`${this.texture.key}-float`, true);
    
    // Add floating tween
    this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  public applyEffect(player: Player) {
    if (this.isCollected) return;
    
    this.isCollected = true;
    
    // Play collect animation
    this.play(`${this.texture.key}-collect`, true);
    
    // Disable physics
    const body = this.body as Physics.Arcade.Body;
    body.enable = false;
    
    // Apply the specific effect
    this.onCollect(player);
    
    // Remove from scene after animation completes
    this.once('animationcomplete', () => {
      this.destroy();
    });
    
    // Emit collected event
    this.emit('collected', this);
  }
  
  protected abstract onCollect(player: Player): void;
  
  public update() {
    // Base item update logic (can be overridden)
  }
  
  public destroy(fromScene?: boolean) {
    // Clean up any tweens or timers
    this.scene.tweens.killTweensOf(this);
    
    // Emit removed event
    this.emit('removed', this);
    
    // Call parent destroy
    super.destroy(fromScene);
  }
}
