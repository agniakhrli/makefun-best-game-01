// Tuning and palette for Lantern Catch — Festival of Lights.
// Tuned for responsive arcade feel, balanced difficulty progression, and warm night festival aesthetics.
export const FIELD = { width: 1280, height: 720, groundY: 650 };

export const STEP = 1 / 60;

export const PLAYER = {
  width: 96,
  height: 32,
  speed: 680,
  acceleration: 4000,
  friction: 14,
  invulnerable: 1.5,
};

export const LIVES = 3;

export const FIREFLY = {
  size: 22,
  speed: 170,
  speedPerLevel: 16,
  interval: 0.5,
  intervalScale: 0.9,
  minInterval: 0.15,
  points: 10,
};

export const LANTERN = {
  size: 34,
  speed: 130,
  speedPerLevel: 12,
  interval: 3.2,
  points: 50,
};

export const EMBER = {
  width: 30,
  height: 30,
  speed: 250,
  speedPerLevel: 28,
  speedJitter: 70,
  interval: 0.65,
  intervalScale: 0.88,
  minInterval: 0.2,
};

export const POWERUP = {
  size: 32,
  speed: 150,
  interval: 12.0,
  duration: { magnet: 8.0, slow: 6.0, shield: 1.0 },
};

export const LEVEL = { catchesPerLevel: 20, max: 10 };

export const POOL_SIZE = 96;

export const PALETTE = {
  backdrop: '#080c14',
  skyTop: '#0b1021',
  skyBottom: '#1c1535',
  ground: '#150f24',
  groundTop: '#ffb703',
  player: '#ffd166',
  playerGlow: 'rgba(255, 209, 102, 0.4)',
  firefly: '#70d6ff',
  fireflyGlow: '#9bf6ff',
  goldenLantern: '#ffb703',
  ember: '#ef476f',
  powerupMagnet: '#3a86ff',
  powerupSlow: '#8338ec',
  powerupShield: '#ff006e',
  panel: '#141a29',
  text: '#f8fafc',
  muted: '#94a3b8',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const BEST_KEY = 'lantern-catch.best';
