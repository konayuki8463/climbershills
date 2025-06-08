import { Scene } from 'phaser';
import { GameConstants, AssetKeys } from '../config';

export class PreloaderScene extends Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private progressBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: GameConstants.STATES.PRELOADER });
  }

  preload() {
    // Set up the loading screen
    this.createLoadingScreen();
    
    // Update progress bar as assets load
    this.load.on('progress', (value: number) => {
      this.updateProgressBar(value);
    });
    
    // When loading completes
    this.load.on('complete', () => {
      this.onLoadComplete();
    });
    
    // Load assets
    this.loadAssets();
  }
  
  private createLoadingScreen() {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Background
    this.add.rectangle(centerX, centerY, width, height, 0x1a1f2c);
    
    // Loading bar frame
    const barWidth = 400;
    const barHeight = 20;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 50;
    
    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x444444, 1);
    this.loadingBar.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress bar
    this.progressBar = this.add.graphics();
    
    // Loading text
    this.loadingText = this.add.text(
      centerX, 
      barY - 40, 
      'Loading...', 
      { 
        fontFamily: 'Arial', 
        fontSize: '24px', 
        color: '#ffffff' 
      }
    ).setOrigin(0.5);
    
    // Game title
    this.add.text(
      centerX, 
      centerY - 100, 
      'FOREST LEECHES', 
      { 
        fontFamily: 'Arial', 
        fontSize: '48px', 
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);
    
    // Subtitle
    this.add.text(
      centerX, 
      centerY - 50, 
      'Quest to Seiwa Hills', 
      { 
        fontFamily: 'Arial', 
        fontSize: '18px', 
        color: '#cccccc'
      }
    ).setOrigin(0.5);
  }
  
  private updateProgressBar(progress: number) {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;
    const barWidth = 400;
    const barHeight = 20;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 50;
    
    // Clear previous progress
    this.progressBar.clear();
    
    // Draw new progress
    this.progressBar.fillStyle(0x4CAF50, 1);
    this.progressBar.fillRect(barX, barY, barWidth * progress, barHeight);
    
    // Update loading text
    this.loadingText.setText(`Loading: ${Math.round(progress * 100)}%`);
  }
  
  private loadAssets() {
    // Load bitmap font
    this.load.bitmapFont(
      AssetKeys.FONTS.PRESS_START,
      'assets/fonts/press-start-2p.png',
      'assets/fonts/press-start-2p.xml'
    );
    
    // Load spritesheets
    // Placeholder sprites - in a real game, replace these with actual assets
    this.load.spritesheet('player', 'assets/images/player.png', {
      frameWidth: 16,
      frameHeight: 24,
    });
    
    this.load.spritesheet('leech', 'assets/images/leech.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    
    this.load.spritesheet('items', 'assets/images/items.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
    
    // Load background images
    this.load.image('bg-far', 'assets/images/background/far.png');
    this.load.image('bg-mid', 'assets/images/background/mid.png');
    this.load.image('bg-near', 'assets/images/background/near.png');
    
    // Load audio
    this.load.audio('bgm', ['assets/audio/bgm.mp3', 'assets/audio/bgm.ogg']);
    this.load.audio('jump', ['assets/audio/jump.mp3', 'assets/audio/jump.ogg']);
    this.load.audio('attack', ['assets/audio/attack.mp3', 'assets/audio/attack.ogg']);
    this.load.audio('hit', ['assets/audio/hit.mp3', 'assets/audio/hit.ogg']);
    this.load.audio('pickup', ['assets/audio/pickup.mp3', 'assets/audio/pickup.ogg']);
    this.load.audio('gameover', ['assets/audio/gameover.mp3', 'assets/audio/gameover.ogg']);
    this.load.audio('victory', ['assets/audio/victory.mp3', 'assets/audio/victory.ogg']);
  }
  
  private onLoadComplete() {
    // Add a short delay before moving to the title screen
    // This allows the player to see that loading is complete
    this.time.delayedCall(500, () => {
      this.scene.start(GameConstants.STATES.TITLE);
    });
  }
}
