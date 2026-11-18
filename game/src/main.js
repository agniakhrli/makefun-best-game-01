// Main loop, state machine, audio, particles, and screenshot harness for Lantern Catch.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CATCH, EVENT_GOLDEN, EVENT_HIT, EVENT_LEVELUP, EVENT_OVER, EVENT_POWERUP } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { playSound } from './audio.js';
import { createParticleSystem } from './particles.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const world = createWorld(random);
const particles = createParticleSystem();
const renderer = createRenderer(canvas, particles);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {}
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(msg) {
    status.textContent = msg;
  }

  function startGame() {
    world.reset();
    particles.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Festival started. ${LIVES} lives.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    playSound('gameover');
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Festival ended. Score ${world.state.score}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_RESTART) {
      startGame();
    } else if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, null, true);
      particles.update(STEP);
      return;
    }
    const pointerX = input.getPointerX();
    const events = world.step(STEP, input.direction(), pointerX, false);
    particles.update(STEP);

    // Handle events for audio and particles
    const player = world.state.player;
    const px = player.x + player.width / 2;
    const py = player.y;

    if (events & EVENT_CATCH) {
      playSound('catch', world.state.combo);
      particles.burst(px, py, '#70d6ff', 10);
    }
    if (events & EVENT_GOLDEN) {
      playSound('golden');
      particles.burst(px, py, '#ffb703', 20);
      particles.popup(px, py - 20, '+50 Golden!', '#ffb703');
    }
    if (events & EVENT_POWERUP) {
      playSound('powerup');
      particles.burst(px, py, '#3a86ff', 15);
      particles.popup(px, py - 20, 'Power Up!', '#3a86ff');
    }
    if (events & EVENT_LEVELUP) {
      playSound('levelup');
      particles.popup(FIELD.width / 2, 150, `Level Up: ${world.state.level}!`, '#ffb703');
    }
    if (events & EVENT_HIT) {
      playSound('hit');
      particles.shake(12);
      particles.burst(px, py, '#ef476f', 16);
      announce(world.state.lives === 1 ? 'Ember hit! 1 life left.' : `Ember hit! ${world.state.lives} lives left.`);
    }
    if (events & EVENT_OVER) {
      endGame();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Lantern Catch — Festival of Lights. Press Space or Click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
