import { Scene, Types } from 'phaser';
import { GameConstants, PlayerConfig, EnemyConfig, ItemConfig, DifficultyConfig } from '../config';
import { Player } from '../objects/Player';
import { Leech } from '../objects/enemies/Leech';
import { LeechBoss } from '../objects/enemies/LeechBoss';
import { Item } from '../objects/items/Item';
import { Stick } from '../objects/items/Stick';
import { Salt } from '../objects/items/Salt';
import { Charm } from '../objects/items/Charm';

interface GameState {
  score: number;
  distance: number;
  gameTime: number;
  difficulty: number;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
}

export class GameScene extends Scene {
  // Game objects
  private player!: Player;
  private leeches: Leech[] = [];
  private items: Item[] = [];
  
  // Game state
  private state: GameState = {
    score: 0,
    distance: 0,
    gameTime: 0,
    difficulty: 0,
    isPaused: false,
    isGameOver: false,
    isVictory: false,
  };
  
  // Groups
  private leechGroup!: Phaser.Physics.Arcade.Group;
  private itemGroup!: Phaser.Physics.Arcade.Group;
  
  // UI elements
  private scoreText!: Phaser.GameObjects.BitmapText;
  private distanceText!: Phaser.GameObjects.BitmapText;
  private healthBar!: Phaser.GameObjects.Graphics;
  private healthText!: Phaser.GameObjects.BitmapText;
  private pausePanel!: Phaser.GameObjects.Container;
  
  // Timers
  private spawnTimer!: Phaser.Time.TimerEvent;
  private difficultyTimer!: Phaser.Time.TimerEvent;
  
  // Background layers
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  
  constructor() {
    super({ key: GameConstants.STATES.GAME });
  }

  create() {
    console.log('GameScene: create');
    
    // Set up the world bounds
    this.physics.world.setBounds(0, 0, GameConstants.WORLD_WIDTH, GameConstants.WORLD_HEIGHT);
    
    // Create background layers with parallax effect
    this.createBackground();
    
    // Create physics groups
    this.leechGroup = this.physics.add.group();
    this.itemGroup = this.physics.add.group();
    
    // Create player
    this.createPlayer();
    
    // Set up camera
    this.cameras.main.setBounds(0, 0, GameConstants.WORLD_WIDTH, GameConstants.WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(2);
    
    // Set up UI
    this.createUI();
    
    // Set up game timers
    this.setupTimers();
    
    // Set up collisions
    this.setupCollisions();
    
    // Set up input
    this.setupInput();
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Start background music
    this.sound.play('bgm', { loop: true, volume: 0.5 });
  }
  
  private createBackground() {
    const { width, height } = this.cameras.main;
    
    // Far background (30% speed)
    this.bgFar = this.add.tileSprite(
      width / 2, 
      height / 2, 
      width, 
      height, 
      'bg-far'
    );
    this.bgFar.setScrollFactor(0.3, 0);
    this.bgFar.setDepth(GameConstants.LAYER_DEPTH.BG);
    
    // Mid background (60% speed)
    this.bgMid = this.add.tileSprite(
      width / 2, 
      height / 2, 
      width, 
      height, 
      'bg-mid'
    );
    this.bgMid.setScrollFactor(0.6, 0);
    this.bgMid.setDepth(GameConstants.LAYER_DEPTH.MID);
    
    // Near background (90% speed)
    this.bgNear = this.add.tileSprite(
      width / 2, 
      height / 2, 
      width, 
      height, 
      'bg-near'
    );
    this.bgNear.setScrollFactor(0.9, 0);
    this.bgNear.setDepth(GameConstants.LAYER_DEPTH.FG);
  }
  
  private createPlayer() {
    // Create player at starting position
    this.player = new Player(
      this,
      200,
      GameConstants.WORLD_HEIGHT - 100,
      'player'
    );
    
    // Add player to the scene
    this.add.existing(this.player);
    this.physics.add.existing(this.player);
    
    // Set player collision with world bounds
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    
    // Set up player animations
    this.player.createAnimations();
    
    // Set up player events
    this.player.on('hit', this.onPlayerHit, this);
    this.player.on('death', this.onPlayerDeath, this);
  }
  
  private createUI() {
    // Fixed position container for UI elements
    const uiContainer = this.add.container(0, 0).setScrollFactor(0);
    
    // Score text
    this.scoreText = this.add.bitmapText(
      20, 
      20, 
      GameConstants.FONTS.PRESS_START, 
      `SCORE: ${this.state.score}`, 
      16
    ).setDepth(GameConstants.LAYER_DEPTH.UI);
    
    // Distance text
    this.distanceText = this.add.bitmapText(
      20, 
      50, 
      GameConstants.FONTS.PRESS_START, 
      `${Math.floor(this.state.distance)}m`, 
      24
    ).setDepth(GameConstants.LAYER_DEPTH.UI);
    
    // Health bar background
    const healthBarBg = this.add.graphics()
      .fillStyle(0x000000, 0.5)
      .fillRect(20, this.cameras.main.height - 40, 200, 20)
      .setDepth(GameConstants.LAYER_DEPTH.UI);
    
    // Health bar
    this.healthBar = this.add.graphics()
      .fillStyle(0xff0000, 1)
      .fillRect(22, this.cameras.main.height - 38, 196, 16)
      .setDepth(GameConstants.LAYER_DEPTH.UI);
    
    // Health text
    this.healthText = this.add.bitmapText(
      30, 
      this.cameras.main.height - 42, 
      GameConstants.FONTS.PRESS_START, 
      'HP', 
      12
    ).setDepth(GameConstants.LAYER_DEPTH.UI);
    
    // Add all UI elements to container
    uiContainer.add([
      this.scoreText,
      this.distanceText,
      healthBarBg,
      this.healthBar,
      this.healthText
    ]);
    
    // Create pause panel (initially hidden)
    this.createPausePanel();
  }
  
  private createPausePanel() {
    const { width, height } = this.cameras.main;
    
    // Semi-transparent background
    const bg = this.add.graphics()
      .fillStyle(0x000000, 0.7)
      .fillRect(0, 0, width, height)
      .setScrollFactor(0)
      .setDepth(GameConstants.LAYER_DEPTH.UI + 1)
      .setVisible(false);
    
    // Panel
    const panel = this.add.graphics()
      .fillStyle(0x1a1f2c, 1)
      .fillRoundedRect(width / 2 - 150, height / 2 - 120, 300, 240, 10)
      .setScrollFactor(0)
      .setDepth(GameConstants.LAYER_DEPTH.UI + 2)
      .setVisible(false);
    
    // Title
    const title = this.add.bitmapText(
      width / 2,
      height / 2 - 90,
      GameConstants.FONTS.PRESS_START,
      'PAUSED',
      24
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(GameConstants.LAYER_DEPTH.UI + 3)
      .setVisible(false);
    
    // Buttons
    const buttonStyle: Phaser.Types.GameObjects.BitmapText.BitmapTextStyle = {
      fontFamily: GameConstants.FONTS.PRESS_START,
      fontSize: 16,
      color: '#ffffff',
    };
    
    const resumeButton = this.add.bitmapText(
      width / 2,
      height / 2 - 30,
      GameConstants.FONTS.PRESS_START,
      'RESUME',
      16
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(GameConstants.LAYER_DEPTH.UI + 3)
      .setInteractive()
      .on('pointerdown', () => this.togglePause())
      .on('pointerover', () => resumeButton.setTint(0xffff00))
      .on('pointerout', () => resumeButton.clearTint())
      .setVisible(false);
    
    const restartButton = this.add.bitmapText(
      width / 2,
      height / 2 + 20,
      GameConstants.FONTS.PRESS_START,
      'RESTART',
      16
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(GameConstants.LAYER_DEPTH.UI + 3)
      .setInteractive()
      .on('pointerdown', () => this.scene.restart())
      .on('pointerover', () => restartButton.setTint(0xffff00))
      .on('pointerout', () => restartButton.clearTint())
      .setVisible(false);
    
    const menuButton = this.add.bitmapText(
      width / 2,
      height / 2 + 70,
      GameConstants.FONTS.PRESS_START,
      'MAIN MENU',
      16
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(GameConstants.LAYER_DEPTH.UI + 3)
      .setInteractive()
      .on('pointerdown', () => {
        this.sound.stopAll();
        this.scene.start(GameConstants.STATES.TITLE);
      })
      .on('pointerover', () => menuButton.setTint(0xffff00))
      .on('pointerout', () => menuButton.clearTint())
      .setVisible(false);
    
    // Store references
    this.pausePanel = this.add.container(0, 0, [
      bg,
      panel,
      title,
      resumeButton,
      restartButton,
      menuButton
    ]).setDepth(GameConstants.LAYER_DEPTH.UI + 1);
  }
  
  private setupTimers() {
    // Spawn leeches periodically
    this.spawnTimer = this.time.addEvent({
      delay: 2000, // Initial spawn delay
      callback: this.spawnLeech,
      callbackScope: this,
      loop: true
    });
    
    // Increase difficulty over time
    this.difficultyTimer = this.time.addEvent({
      delay: 1000, // Check every second
      callback: this.updateDifficulty,
      callbackScope: this,
      loop: true
    });
    
    // Spawn items occasionally
    this.time.addEvent({
      delay: 10000, // Every 10 seconds
      callback: this.spawnItem,
      callbackScope: this,
      loop: true
    });
  }
  
  private setupCollisions() {
    // Player vs. leeches
    this.physics.add.overlap(
      this.player,
      this.leechGroup,
      this.handlePlayerLeechCollision,
      undefined,
      this
    );
    
    // Player vs. items
    this.physics.add.overlap(
      this.player,
      this.itemGroup,
      this.handleItemPickup,
      undefined,
      this
    );
  }
  
  private setupInput() {
    // Pause game on ESC
    this.input.keyboard?.on('keydown-ESC', this.togglePause, this);
    
    // Pause on two-finger tap (mobile)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.touch?.isDown) {
        this.togglePause();
      }
    });
  }
  
  private spawnLeech() {
    // Don't spawn if game is paused or over
    if (this.state.isPaused || this.state.isGameOver || this.state.isVictory) {
      return;
    }
    
    // Randomly choose side (left or right of screen)
    const side = Phaser.Math.Between(0, 1);
    let x, y;
    
    if (side === 0) {
      // Spawn from left
      x = this.cameras.main.scrollX - 50;
    } else {
      // Spawn from right
      x = this.cameras.main.scrollX + this.cameras.main.width + 50;
    }
    
    // Spawn at random height in the lower half of the screen
    y = Phaser.Math.Between(
      this.cameras.main.scrollY + this.cameras.main.height / 2,
      this.cameras.main.scrollY + this.cameras.main.height - 100
    );
    
    // Create leech
    const leech = new Leech(this, x, y, 'leech');
    this.leechGroup.add(leech);
    this.leechGroup.add(leech.getHitbox());
    this.leeches.push(leech);
    
    // Add to scene
    this.add.existing(leech);
    
    // Set up leech events
    leech.on('removed', () => {
      const index = this.leeches.indexOf(leech);
      if (index > -1) {
        this.leeches.splice(index, 1);
      }
    });
    
    // Adjust spawn rate based on difficulty
    const spawnRate = Math.max(
      500, // Minimum 0.5 seconds between spawns
      this.spawnTimer.delay * (1 - DifficultyConfig.INCREASE_RATES.SPAWN_RATE * this.state.difficulty)
    );
    this.spawnTimer.delay = spawnRate;
  }
  
  private spawnItem() {
    // Don't spawn if game is paused or over
    if (this.state.isPaused || this.state.isGameOver || this.state.isVictory) {
      return;
    }
    
    // Randomly select item type
    const itemTypes = [
      ItemConfig.STICK.key,
      ItemConfig.SALT.key,
      ItemConfig.CHARM.key
    ];
    const itemType = Phaser.Utils.Array.GetRandom(itemTypes);
    
    // Spawn position (random x within camera bounds, above top of screen)
    const x = this.cameras.main.scrollX + Phaser.Math.Between(100, this.cameras.main.width - 100);
    const y = this.cameras.main.scrollY - 50;
    
    // Create item
    let item: Item;
    
    switch (itemType) {
      case ItemConfig.STICK.key:
        item = new Stick(this, x, y, 'items');
        break;
      case ItemConfig.SALT.key:
        item = new Salt(this, x, y, 'items');
        break;
      case ItemConfig.CHARM.key:
        item = new Charm(this, x, y, 'items');
        break;
      default:
        return; // Shouldn't happen
    }
    
    // Add to groups and scene
    this.itemGroup.add(item);
    this.items.push(item);
    this.add.existing(item);
    
    // Set up item events
    item.on('removed', () => {
      const index = this.items.indexOf(item);
      if (index > -1) {
        this.items.splice(index, 1);
      }
    });
  }
  
  private updateDifficulty() {
    // Increase difficulty every 200 meters
    const newDifficulty = Math.min(
      DifficultyConfig.MAX_LEVEL,
      Math.floor(this.state.distance / 200)
    );
    
    if (newDifficulty > this.state.difficulty) {
      this.state.difficulty = newDifficulty;
      console.log(`Difficulty increased to level ${this.state.difficulty}`);
      
      // Show difficulty increase notification
      this.showNotification(`DIFFICULTY INCREASED!`);
    }
  }
  
  private showNotification(text: string, duration: number = 2000) {
    const { width } = this.cameras.main;
    const notification = this.add.bitmapText(
      width / 2,
      100,
      GameConstants.FONTS.PRESS_START,
      text,
      16
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(GameConstants.LAYER_DEPTH.UI + 10)
      .setTint(0xffff00);
    
    // Fade out and destroy
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 500,
      delay: duration - 500,
      onComplete: () => notification.destroy()
    });
  }
  
  private handlePlayerLeechCollision(player: any, leech: any) {
    // Check if the player is attacking
    if (this.player.isAttacking()) {
      // Player hit the leech
      leech.takeDamage(1);
      
      // Add score
      this.addScore(10);
    } else if (!this.player.isInvincible()) {
      // Leech attaches to player
      leech.attachTo(this.player);
    }
  }
  
  private handleItemPickup(player: any, item: any) {
    // Apply item effect
    item.applyEffect(this.player);
    
    // Remove item
    item.destroy();
    
    // Add score
    this.addScore(50);
    
    // Play pickup sound
    this.sound.play('pickup');
  }
  
  private onPlayerHit(health: number, maxHealth: number) {
    // Update health bar
    const healthPercent = health / maxHealth;
    this.healthBar.clear()
      .fillStyle(0xff0000, 1)
      .fillRect(22, this.cameras.main.height - 38, 196 * healthPercent, 16);
    
    // Play hit sound
    this.sound.play('hit');
    
    // Shake camera
    this.cameras.main.shake(100, 0.01);
  }
  
  private onPlayerDeath() {
    // Set game over state
    this.state.isGameOver = true;
    
    // Stop all timers
    this.spawnTimer.destroy();
    this.difficultyTimer.destroy();
    
    // Stop all leeches
    this.leechGroup.getChildren().forEach((leech: any) => {
      leech.stop();
    });
    
    // Stop all items
    this.itemGroup.getChildren().forEach((item: any) => {
      item.stop();
    });
    
    // Play game over sound
    this.sound.stopAll();
    this.sound.play('gameover');
    
    // Show game over screen after a delay
    this.time.delayedCall(2000, () => {
      this.scene.start(GameConstants.STATES.GAME_OVER, {
        score: this.state.score,
        distance: Math.floor(this.state.distance),
        time: Math.floor(this.state.gameTime / 1000)
      });
    });
  }
  
  private addScore(amount: number) {
    this.state.score += amount;
    this.scoreText.setText(`SCORE: ${this.state.score}`);
  }
  
  private togglePause() {
    if (this.state.isGameOver || this.state.isVictory) {
      return;
    }
    
    this.state.isPaused = !this.state.isPaused;
    
    if (this.state.isPaused) {
      // Pause the game
      this.physics.pause();
      this.scene.pause();
      this.pausePanel.setVisible(true);
    } else {
      // Resume the game
      this.physics.resume();
      this.scene.resume();
      this.pausePanel.setVisible(false);
    }
  }
  
  update(time: number, delta: number) {
    // Don't update if game is paused or over
    if (this.state.isPaused || this.state.isGameOver || this.state.isVictory) {
      return;
    }
    
    // Update game time
    this.state.gameTime += delta;
    
    // Update distance (based on time, not actual movement)
    this.state.distance += delta * 0.05; // Adjust speed as needed
    this.distanceText.setText(`${Math.floor(this.state.distance)}m`);
    
    // Update parallax background
    this.bgFar.tilePositionX = this.cameras.main.scrollX * 0.3;
    this.bgMid.tilePositionX = this.cameras.main.scrollX * 0.6;
    this.bgNear.tilePositionX = this.cameras.main.scrollX * 0.9;
    
    // Update player
    if (this.player) {
      this.player.update();
    }
    
    // Update leeches
    this.leechGroup.getChildren().forEach((leech: any) => {
      leech.update();
    });
    
    // Check for victory condition
    if (this.state.distance >= 1000 && !this.state.isVictory) {
      this.onVictory();
    }
  }
  
  private onVictory() {
    this.state.isVictory = true;
    
    // Stop all timers
    this.spawnTimer.destroy();
    this.difficultyTimer.destroy();
    
    // Stop all leeches
    this.leechGroup.getChildren().forEach((leech: any) => {
      leech.stop();
    });
    
    // Stop all items
    this.itemGroup.getChildren().forEach((item: any) => {
      item.stop();
    });
    
    // Play victory sound
    this.sound.stopAll();
    this.sound.play('victory');
    
    // Show victory screen after a delay
    this.time.delayedCall(2000, () => {
      this.scene.start(GameConstants.STATES.VICTORY, {
        score: this.state.score,
        distance: Math.floor(this.state.distance),
        time: Math.floor(this.state.gameTime / 1000),
        leechesDefeated: this.state.score / 10, // Example calculation
        itemsCollected: this.state.score / 50   // Example calculation
      });
    });
  }
  
  shutdown() {
    // Clean up event listeners
    this.input.keyboard?.off('keydown-ESC', this.togglePause, this);
    this.input.off('pointerdown');
    
    // Stop all sounds
    this.sound.stopAll();
    
    // Clear all game objects
    this.leechGroup.clear(true, true);
    this.itemGroup.clear(true, true);
    
    // Clear arrays
    this.leeches = [];
    this.items = [];
    
    // Clear timers
    this.time.removeAllEvents();
    
    // Clear tweens
    this.tweens.killAll();
  }
}
