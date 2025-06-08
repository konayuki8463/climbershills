import { Scene, GameObjects, Physics } from 'phaser';
import { Item } from './Item';
import { Player } from '../Player';

export class Salt extends Item {
  private static readonly DAMAGE = 10;
  private static readonly RADIUS = 120;
  
  constructor(scene: Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
    
    // Set item properties
    this.setScale(0.6);
  }
  
  protected onCollect(player: Player): void {
    // Create salt burst effect
    this.createBurstEffect();
    
    // Damage all enemies in radius
    this.damageEnemiesInRadius(player);
    
    // Show effect text
    this.showEffectText('SALT BURST!');
    
    // Play collect sound
    this.scene.sound.play('explosion');
  }
  
  private createBurstEffect() {
    // Create particles for burst effect
    const particles = this.scene.add.particles('particle');
    
    // Create a simple white pixel for particles
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 4, 4);
    graphics.generateTexture('salt-particle', 4, 4);
    graphics.destroy();
    
    // Create emitter
    const emitter = particles.createEmitter({
      x: this.x,
      y: this.y,
      speed: { min: 50, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 1000,
      gravityY: 100,
      quantity: 30
    });
    
    // Stop and destroy emitter after burst
    this.scene.time.delayedCall(200, () => {
      emitter.stop();
      particles.destroy();
    });
  }
  
  private damageEnemiesInRadius(player: Player) {
    // Get all enemies in the scene
    const enemies = this.scene.children.list.filter(
      child => (child as any).type === 'Enemy' || (child as any).type === 'Leech' || (child as any).type === 'LeechBoss'
    ) as Phaser.GameObjects.GameObject[];
    
    // Check each enemy if it's within radius
    enemies.forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(
        this.x, this.y,
        enemy.x, enemy.y
      );
      
      if (distance <= Salt.RADIUS) {
        // Damage enemy
        if ('takeDamage' in enemy) {
          (enemy as any).takeDamage(Salt.DAMAGE);
          
          // Apply knockback
          if ('body' in enemy) {
            const angle = Phaser.Math.Angle.Between(
              this.x, this.y,
              enemy.x, enemy.y
            );
            
            const force = 300;
            (enemy as any).body.setVelocity(
              Math.cos(angle) * force,
              Math.sin(angle) * force
            );
          }
        }
      }
    });
    
    // Also detach any leeches attached to player
    if ('shakeOffLeeches' in player) {
      (player as any).shakeOffLeeches();
    }
  }
  
  private showEffectText(text: string) {
    const style = {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    };
    
    const textObj = this.scene.add.text(
      this.x,
      this.y - 50,
      text,
      style
    ).setOrigin(0.5);
    
    // Animate text
    this.scene.tweens.add({
      targets: textObj,
      y: textObj.y - 70,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        textObj.destroy();
      }
    });
  }
}
