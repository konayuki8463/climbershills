import { Scene, GameObjects } from 'phaser';
import { Item } from './Item';
import { Player } from '../Player';

export class Stick extends Item {
  private static readonly EFFECT_DURATION = 10000; // 10 seconds
  
  constructor(scene: Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
    
    // Set effect duration
    this.effectDuration = Stick.EFFECT_DURATION;
    
    // Set item properties
    this.setScale(0.5);
  }
  
  protected onCollect(player: Player): void {
    // Increase player's melee range
    const originalRange = player.getMeleeRange();
    player.setMeleeRange(originalRange * 1.5); // 1.5x range
    
    // Show effect text
    this.showEffectText('MELEE RANGE UP!');
    
    // Play collect sound
    this.scene.sound.play('powerup');
    
    // Reset after duration
    this.scene.time.delayedCall(this.effectDuration, () => {
      player.setMeleeRange(originalRange);
    });
  }
  
  private showEffectText(text: string) {
    const style = {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffeb3b',
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
