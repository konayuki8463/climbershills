import { Scene, Types } from 'phaser';
import { GameConstants } from '../config';

export class TitleScene extends Scene {
  private campfire!: Phaser.GameObjects.Sprite;
  private startText!: Phaser.GameObjects.Text;
  private blinkTimer!: number;
  
  constructor() {
    super({ key: GameConstants.STATES.TITLE });
  }

  create() {
    console.log('TitleScene: create');
    
    // Set background color
    this.cameras.main.setBackgroundColor('#1a1f2c');
    
    // Get center coordinates
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Add title text
    this.add.bitmapText(
      centerX, 
      centerY - 120, 
      GameConstants.FONTS.PRESS_START, 
      'FOREST LEECHES', 
      32
    ).setOrigin(0.5);
    
    // Add subtitle
    this.add.bitmapText(
      centerX, 
      centerY - 70, 
      GameConstants.FONTS.PRESS_START, 
      'Quest to Seiwa Hills', 
      16
    ).setOrigin(0.5);
    
    // Add campfire (placeholder)
    this.campfire = this.add.sprite(
      centerX, 
      centerY + 20, 
      'campfire'
    ).setScale(4);
    
    // Create campfire animation if not exists
    if (!this.anims.exists('campfire-flicker')) {
      this.anims.create({
        key: 'campfire-flicker',
        frames: [
          { key: 'campfire', frame: 0 },
          { key: 'campfire', frame: 1 },
        ],
        frameRate: 3,
        repeat: -1,
      });
    }
    
    // Play campfire animation
    this.campfire.play('campfire-flicker');
    
    // Add start prompt
    this.startText = this.add.bitmapText(
      centerX,
      height - 100,
      GameConstants.FONTS.PRESS_START,
      'PRESS SPACE OR TOUCH TO START',
      12
    ).setOrigin(0.5);
    
    // Add controls hint
    this.add.bitmapText(
      centerX,
      height - 60,
      GameConstants.FONTS.PRESS_START,
      'ARROWS: MOVE   X: ATTACK   Z: JUMP',
      8
    ).setOrigin(0.5).setTint(0x888888);
    
    // Start blinking the start text
    this.blinkTimer = this.time.addEvent({
      delay: 800, // ms
      callback: this.toggleStartText,
      callbackScope: this,
      loop: true
    });
    
    // Set up input
    this.input.keyboard?.on('keydown-SPACE', this.startGame, this);
    this.input.on('pointerdown', this.startGame, this);
    
    // Add any additional setup for the title screen
    this.setupTitleScreen();
  }
  
  private setupTitleScreen() {
    // Add any additional title screen elements here
    const { width, height } = this.cameras.main;
    
    // Add version text
    this.add.bitmapText(
      width - 10,
      height - 10,
      GameConstants.FONTS.PRESS_START,
      'v1.0.0',
      8
    ).setOrigin(1, 1).setTint(0x666666);
    
    // Add copyright text
    this.add.bitmapText(
      10,
      height - 10,
      GameConstants.FONTS.PRESS_START,
      '© 2025 Forest Leeches Team',
      8
    ).setOrigin(0, 1).setTint(0x666666);
    
    // Add a subtle particle effect for atmosphere
    this.createParticles();
  }
  
  private createParticles() {
    // Create some particles for visual effect
    const particles = this.add.particles('particle');
    
    // Create a simple white pixel for particles
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture('particle', 2, 2);
    graphics.destroy();
    
    // Configure and start the emitter
    const emitter = particles.createEmitter({
      x: { min: 0, max: this.cameras.main.width },
      y: this.cameras.main.height,
      lifespan: 4000,
      speedY: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      quantity: 1,
      blendMode: 'ADD',
      alpha: { start: 0.3, end: 0 },
      frequency: 100,
    });
  }
  
  private toggleStartText() {
    this.startText.setVisible(!this.startText.visible);
  }
  
  private startGame() {
    // Stop the blink timer
    this.blinkTimer.remove();
    
    // Fade out and start the game
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.time.delayedCall(600, () => {
      this.scene.start(GameConstants.STATES.GAME);
    });
  }
  
  shutdown() {
    // Clean up event listeners
    this.input.keyboard?.off('keydown-SPACE', this.startGame, this);
    this.input.off('pointerdown', this.startGame, this);
    
    // Stop any running tweens or timers
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
