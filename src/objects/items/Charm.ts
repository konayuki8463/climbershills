import { Scene, GameObjects } from 'phaser';
import { Item } from './Item';
import { Player } from '../Player';

export class Charm extends Item {
  private static readonly DURATION = 5000; // 5 seconds
  
  constructor(scene: Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
    
    // Set effect duration
    this.effectDuration = Charm.DURATION;
    
    // Set item properties
    this.setScale(0.5);
  }
  
  protected onCollect(player: Player): void {
    // Make player invincible
    player.setInvincible(true);
    
    // Show effect text
    this.showEffectText('INVINCIBILITY!');
    
    // Play collect sound
    this.scene.sound.play('powerup');
    
    // Create visual effect
    this.createAuraEffect(player);
    
    // Reset after duration
    this.scene.time.delayedCall(this.effectDuration, () => {
      player.setInvincible(false);
    });
  }
  
  private createAuraEffect(player: Player) {
    // Create a circle around the player
    const aura = this.scene.add.circle(
      player.x,
      player.y,
      30,
      0xffff00,
      0.3
    );
    
    // Make aura follow player
    this.scene.physics.add.existing(aura);
    this.scene.physics.add.overlap(
      player,
      aura,
      () => {
        aura.x = player.x;
        aura.y = player.y;
      },
      undefined,
      this
    );
    
    // Pulse effect
    this.scene.tweens.add({
      targets: aura,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.1,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
    
    // Remove aura when effect ends
    this.scene.time.delayedCall(this.effectDuration, () => {
      this.scene.tweens.add({
        targets: aura,
        alpha: 0,
        duration: 500,
        onComplete: () => {
          aura.destroy();
        }
      });
    });
  }
  
  private showEffectText(text: string) {
    const style = {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ff9800',
      stroke: '#000',
      strokeThickness: 3
    };
    
    const textObj = this.scene.add.text(
      this.x,
      this.y - 30,
      text,
      style
    ).setOrigin(0.5);
    
    // Animate text
    this.scene.tweens.add({
      targets: textObj,
      y: textObj.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        textObj.destroy();
      }
    });
  }
}
