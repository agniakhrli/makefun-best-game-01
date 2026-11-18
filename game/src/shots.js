// Seeded autopilot for screenshot scenes (start, play, end).
import { FIELD, PLAYER, STEP } from './config.js';
import { EVENT_OVER, KIND_EMBER, KIND_FIREFLY, KIND_LANTERN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 25;
const END_LIMIT_SECONDS = 600;
const HORIZON_PLAY = 0.8;
const HORIZON_END = 0.3;
const SAMPLE = 1 / 30;
const DIRECTIONS = [0, -1, 1];
const MARGIN = 15;

function timeToHit(state, direction, horizon) {
  const player = state.player;
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    const x = Math.min(FIELD.width - player.width, Math.max(0, player.x + direction * PLAYER.speed * t));
    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      if (!item.active || item.kind !== KIND_EMBER) continue;
      const y = item.y + item.speed * t;
      if (y + item.height > player.y && y < player.y + player.height && item.x < x + player.width + MARGIN && item.x + item.width > x - MARGIN) return t;
    }
  }
  return Infinity;
}

function autopilot(state, horizon) {
  const player = state.player;
  let targetItem = null;
  for (let i = 0; i < state.items.length; i++) {
    const item = state.items[i];
    if (item.active && (item.kind === KIND_FIREFLY || item.kind === KIND_LANTERN) && (targetItem === null || item.y > targetItem.y)) {
      targetItem = item;
    }
  }
  const target = targetItem === null ? FIELD.width / 2 : targetItem.x + targetItem.width / 2;
  const centre = player.x + player.width / 2;
  const wanted = target > centre + 10 ? 1 : target < centre - 10 ? -1 : 0;
  let best = wanted;
  let bestTime = timeToHit(state, wanted, horizon);
  for (let i = 0; i < DIRECTIONS.length && bestTime !== Infinity; i++) {
    const time = timeToHit(state, DIRECTIONS[i], horizon);
    if (time > bestTime) {
      bestTime = time;
      best = DIRECTIONS[i];
    }
  }
  return best;
}

export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i++) world.step(STEP, 0, null, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  const horizon = name === 'end' ? HORIZON_END : HORIZON_PLAY;
  for (let i = 0; i < limit / STEP; i++) {
    if (world.step(STEP, autopilot(world.state, horizon), null, false) & EVENT_OVER) break;
  }
  const over = world.state.lives === 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}
