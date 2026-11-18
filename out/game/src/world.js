// Game simulation for Lantern Catch: fireflies, golden lanterns, ash embers, power-ups, combo, levels, and collisions.
import { EMBER, FIELD, FIREFLY, LANTERN, LEVEL, LIVES, PLAYER, POOL_SIZE, POWERUP } from './config.js';

export const KIND_FIREFLY = 0;
export const KIND_LANTERN = 1;
export const KIND_EMBER = 2;
export const KIND_POWERUP = 3;

export const EVENT_CATCH = 1;
export const EVENT_GOLDEN = 2;
export const EVENT_HIT = 4;
export const EVENT_POWERUP = 8;
export const EVENT_LEVELUP = 16;
export const EVENT_OVER = 32;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const player = {
    x: (FIELD.width - PLAYER.width) / 2,
    y: FIELD.groundY - PLAYER.height - 10,
    width: PLAYER.width,
    height: PLAYER.height,
    vx: 0,
    invulnerable: 0,
  };

  const items = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    items.push({ active: false, kind: KIND_FIREFLY, x: 0, y: 0, width: 0, height: 0, speed: 0, powerupType: 'magnet' });
  }

  const state = {
    player,
    items,
    score: 0,
    lives: LIVES,
    level: 1,
    catches: 0,
    combo: 1,
    fireflyTimer: 0,
    lanternTimer: 0,
    emberTimer: 0,
    powerupTimer: 0,
    activePowerup: null,
    powerupTimeLeft: 0,
    shieldActive: false,
  };

  function reset() {
    player.x = (FIELD.width - player.width) / 2;
    player.vx = 0;
    player.invulnerable = 0;
    for (const item of items) item.active = false;
    state.score = 0;
    state.lives = LIVES;
    state.level = 1;
    state.catches = 0;
    state.combo = 1;
    state.fireflyTimer = FIREFLY.interval;
    state.lanternTimer = LANTERN.interval;
    state.emberTimer = EMBER.interval;
    state.powerupTimer = POWERUP.interval;
    state.activePowerup = null;
    state.powerupTimeLeft = 0;
    state.shieldActive = false;
  }

  function freeItem() {
    for (let i = 0; i < items.length; i++) {
      if (!items[i].active) return items[i];
    }
    return null;
  }

  function spawnFirefly() {
    const item = freeItem();
    if (!item) return;
    item.active = true;
    item.kind = KIND_FIREFLY;
    item.width = FIREFLY.size;
    item.height = FIREFLY.size;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height;
    item.speed = FIREFLY.speed + FIREFLY.speedPerLevel * (state.level - 1) + random() * 40;
  }

  function spawnLantern() {
    const item = freeItem();
    if (!item) return;
    item.active = true;
    item.kind = KIND_LANTERN;
    item.width = LANTERN.size;
    item.height = LANTERN.size;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height;
    item.speed = LANTERN.speed + LANTERN.speedPerLevel * (state.level - 1);
  }

  function spawnEmber() {
    const item = freeItem();
    if (!item) return;
    item.active = true;
    item.kind = KIND_EMBER;
    item.width = EMBER.width;
    item.height = EMBER.height;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height;
    item.speed = EMBER.speed + EMBER.speedPerLevel * (state.level - 1) + random() * EMBER.speedJitter;
  }

  function spawnPowerup() {
    const item = freeItem();
    if (!item) return;
    item.active = true;
    item.kind = KIND_POWERUP;
    item.width = POWERUP.size;
    item.height = POWERUP.size;
    item.x = random() * (FIELD.width - item.width);
    item.y = -item.height;
    item.speed = POWERUP.speed;
    const types = ['magnet', 'slow', 'shield'];
    item.powerupType = types[Math.floor(random() * types.length)];
  }

  function step(dt, direction, pointerX, harmless) {
    let events = 0;

    // Powerup timer countdown
    if (state.activePowerup && !harmless) {
      state.powerupTimeLeft -= dt;
      if (state.powerupTimeLeft <= 0) {
        state.activePowerup = null;
        state.shieldActive = false;
      }
    }

    // Player movement
    if (pointerX !== null && !harmless) {
      const targetX = pointerX - player.width / 2;
      player.x += (targetX - player.x) * Math.min(1, dt * 15);
    } else {
      if (direction !== 0) {
        player.vx += direction * PLAYER.acceleration * dt;
        player.vx = Math.max(-PLAYER.speed, Math.min(PLAYER.speed, player.vx));
      } else {
        player.vx *= Math.max(0, 1 - PLAYER.friction * dt);
      }
      player.x += player.vx * dt;
    }
    player.x = Math.max(0, Math.min(FIELD.width - player.width, player.x));

    if (player.invulnerable > 0 && !harmless) {
      player.invulnerable = Math.max(0, player.invulnerable - dt);
    }

    // Time scaling for powerup
    const timeScale = state.activePowerup === 'slow' ? 0.5 : 1.0;
    const effectiveDt = dt * timeScale;

    // Spawning timers
    if (!harmless) {
      state.fireflyTimer -= effectiveDt;
      if (state.fireflyTimer <= 0) {
        spawnFirefly();
        const interval = Math.max(FIREFLY.minInterval, FIREFLY.interval * (FIREFLY.intervalScale ** (state.level - 1)));
        state.fireflyTimer += interval;
      }

      state.lanternTimer -= effectiveDt;
      if (state.lanternTimer <= 0) {
        spawnLantern();
        state.lanternTimer += LANTERN.interval + random() * 2;
      }

      state.emberTimer -= effectiveDt;
      if (state.emberTimer <= 0) {
        spawnEmber();
        const interval = Math.max(EMBER.minInterval, EMBER.interval * (EMBER.intervalScale ** (state.level - 1)));
        state.emberTimer += interval;
      }

      state.powerupTimer -= effectiveDt;
      if (state.powerupTimer <= 0) {
        spawnPowerup();
        state.powerupTimer += POWERUP.interval + random() * 5;
      }
    }

    // Update items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.active) continue;

      // Magnet powerup attraction
      if (state.activePowerup === 'magnet' && item.kind === KIND_FIREFLY && !harmless) {
        const pCenterX = player.x + player.width / 2;
        const itemCenterX = item.x + item.width / 2;
        if (itemCenterX < pCenterX) item.x += 120 * dt;
        else item.x -= 120 * dt;
      }

      item.y += item.speed * timeScale * dt;

      // Hit ground
      if (item.y > FIELD.groundY) {
        item.active = false;
        if (item.kind === KIND_FIREFLY && !harmless) {
          state.combo = 1; // missed firefly resets combo
        }
        continue;
      }

      if (harmless || !overlaps(item, player)) continue;

      // Caught / collision
      item.active = false;
      if (item.kind === KIND_FIREFLY) {
        const points = FIREFLY.points * state.combo;
        state.score += points;
        state.catches += 1;
        state.combo = Math.min(5, state.combo + 1);
        events |= EVENT_CATCH;

        const newLevel = Math.min(LEVEL.max, 1 + Math.floor(state.catches / LEVEL.catchesPerLevel));
        if (newLevel > state.level) {
          state.level = newLevel;
          events |= EVENT_LEVELUP;
        }
      } else if (item.kind === KIND_LANTERN) {
        state.score += LANTERN.points * state.combo;
        state.catches += 2;
        events |= EVENT_GOLDEN;
      } else if (item.kind === KIND_POWERUP) {
        state.activePowerup = item.powerupType;
        if (item.powerupType === 'shield') {
          state.shieldActive = true;
          state.powerupTimeLeft = POWERUP.duration.shield;
        } else if (item.powerupType === 'slow') {
          state.powerupTimeLeft = POWERUP.duration.slow;
        } else {
          state.powerupTimeLeft = POWERUP.duration.magnet;
        }
        events |= EVENT_POWERUP;
      } else if (item.kind === KIND_EMBER && player.invulnerable === 0) {
        if (state.shieldActive) {
          state.shieldActive = false;
          state.activePowerup = null;
          player.invulnerable = PLAYER.invulnerable;
        } else {
          state.lives -= 1;
          player.invulnerable = PLAYER.invulnerable;
          state.combo = 1;
          events |= EVENT_HIT;
          if (state.lives <= 0) {
            events |= EVENT_OVER;
            break;
          }
        }
      }
    }

    return events;
  }

  reset();
  return { state, reset, step };
}
