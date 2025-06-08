import 'phaser';
import { GameConfig } from './config';
import { GameConstants } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloaderScene } from './scenes/PreloaderScene';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';
import { VictoryScene } from './scenes/VictoryScene';

class Game extends Phaser.Game {
  constructor() {
    // Initialize Phaser with our config
    super(GameConfig);

    // Add all the scenes
    this.scene.add(GameConstants.STATES.BOOT, BootScene);
    this.scene.add(GameConstants.STATES.PRELOADER, PreloaderScene);
    this.scene.add(GameConstants.STATES.TITLE, TitleScene);
    this.scene.add(GameConstants.STATES.GAME, GameScene);
    this.scene.add(GameConstants.STATES.GAME_OVER, GameOverScene);
    this.scene.add(GameConstants.STATES.VICTORY, VictoryScene);

    // Start the boot scene
    this.scene.start(GameConstants.STATES.BOOT);
  }
}

// When the page has finished loading, create our game
window.addEventListener('load', () => {
  // Initialize the game
  const game = new Game();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    game.scale.updateBounds();
  });
  
  // Add game to window for debugging
  (window as any).game = game;
});
