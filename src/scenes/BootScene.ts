import { Scene } from 'phaser';
import { GameConstants } from '../config';

export class BootScene extends Scene {
  constructor() {
    super({ key: GameConstants.STATES.BOOT });
  }

  preload() {
    // Load any assets needed for the preloader (e.g., loading bar, logo)
    // This is optional and can be omitted if you don't need them
  }

  create() {
    console.log('BootScene: create');
    
    // Set up game settings
    this.cameras.main.setRoundPixels(true);
    
    // Start the preloader scene
    this.scene.start(GameConstants.STATES.PRELOADER);
  }
}
