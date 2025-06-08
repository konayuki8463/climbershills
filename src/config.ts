// Game configuration
export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#1a1f2c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 450, // 16:9 aspect ratio
    parent: 'game-canvas',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false,
    },
  },
  pixelArt: true,
  roundPixels: true,
  scene: [],
};

// Game constants
export const GameConstants = {
  // Display
  SCALE: 4, // Pixel art scale factor
  TILE_SIZE: 16, // Base tile size in pixels
  
  // Gameplay
  PLAYER_SPEED: 200,
  PLAYER_JUMP_FORCE: -400,
  PLAYER_ATTACK_COOLDOWN: 500, // ms
  
  // World
  WORLD_WIDTH: 4000,
  WORLD_HEIGHT: 720,
  
  // Layers
  LAYER_DEPTH: {
    BG: 0,
    MID: 1,
    FG: 2,
    PLAYER: 3,
    UI: 4,
  },
  
  // Colors
  COLORS: {
    DARK_GREEN: 0x1e3b2e,
    FOREST_GREEN: 0x2d5a3f,
    LIGHT_GREEN: 0x7aa874,
    BROWN: 0x5d3a1e,
    LIGHT_BROWN: 0xa67c52,
    YELLOW: 0xf3c969,
    RED: 0x8b1e3f,
    WHITE: 0xffffff,
  },
  
  // Game states
  STATES: {
    BOOT: 'Boot',
    PRELOADER: 'Preloader',
    TITLE: 'Title',
    GAME: 'Game',
    GAME_OVER: 'GameOver',
    VICTORY: 'Victory',
  },
};

// Asset keys
export const AssetKeys = {
  // Images
  IMAGES: {
    TILES: 'tiles',
    PLAYER: 'player',
    LEECH: 'leech',
    ITEMS: 'items',
    UI: 'ui',
  },
  
  // Audio
  AUDIO: {
    MUSIC: 'bgm',
    SFX: {
      JUMP: 'jump',
      ATTACK: 'attack',
      HIT: 'hit',
      PICKUP: 'pickup',
      GAME_OVER: 'gameover',
      VICTORY: 'victory',
    },
  },
  
  // Fonts
  FONTS: {
    PRESS_START: 'PressStart2P',
  },
  
  // Atlases
  ATLASES: {
    UI: 'ui-atlas',
  },
};

// Player configuration
export const PlayerConfig = {
  // Movement
  speed: 200,
  jumpForce: -400,
  gravity: 800,
  
  // Combat
  maxHealth: 100,
  attackCooldown: 500, // ms
  invincibleDuration: 1000, // ms after being hit
  
  // Collision
  width: 16,
  height: 24,
  offsetX: 8,
  offsetY: 4,
};

// Enemy configuration
export const EnemyConfig = {
  // Leech
  leech: {
    speed: 60,
    health: 1,
    damage: 5, // Damage per second when attached
    attachDuration: 1000, // ms to attach to player
    jumpForce: 200,
    jumpCooldown: { min: 1000, max: 3000 }, // ms
    spawnRate: 3000, // ms between spawns
    score: 100,
  },
  
  // Boss (Leechelor)
  boss: {
    speed: 80,
    health: 50,
    damage: 10,
    attachDuration: 500,
    jumpForce: 300,
    jumpCooldown: { min: 500, max: 1500 },
    score: 5000,
  },
};

// Item configuration
export const ItemConfig = {
  // Stick (木の枝)
  STICK: {
    key: 'stick',
    duration: 10000, // 10 seconds
    effect: {
      meleeRange: 1.5, // 1.5x range
    },
  },
  
  // Salt (塩)
  SALT: {
    key: 'salt',
    effect: {
      radius: 120, // Pixels
      damage: 10,
    },
  },
  
  // Charm (御守り)
  CHARM: {
    key: 'charm',
    duration: 5000, // 5 seconds
    effect: {
      invincible: true,
    },
  },
};

// Game difficulty settings
export const DifficultyConfig = {
  // How often to increase difficulty (in meters)
  INCREASE_EVERY: 200,
  
  // Percentage increases per difficulty level
  INCREASE_RATES: {
    SPAWN_RATE: 0.1, // 10% faster spawns
    ENEMY_SPEED: 0.1, // 10% faster enemies
    ENEMY_HEALTH: 0.1, // 10% more health
  },
  
  // Maximum difficulty level (after this, no more increases)
  MAX_LEVEL: 5,
};
