// Canvas rendering for Lantern Catch: deep indigo night sky, stars, basket player, glowing items, HUD, and panels.
import { FIELD, FONT, LIVES, PALETTE } from './config.js';
import { KIND_EMBER, KIND_FIREFLY, KIND_LANTERN, KIND_POWERUP } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 620, top: 130, line: 36, bottom: 80 };
const LIFE_SIZE = 22;
const LIFE_GAP = 10;

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas, particleSystem) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const levelLabel = cachedLabel('Level ');
  const comboLabel = cachedLabel('Combo x');
  const finalLabel = cachedLabel('Final Score: ');
  const bestLabel = cachedLabel('Best Score: ');

  // Generate static background stars once
  const stars = [];
  for (let i = 0; i < 70; i++) {
    stars.push({
      x: Math.random() * FIELD.width,
      y: Math.random() * (FIELD.groundY - 100),
      size: 1 + Math.random() * 2.5,
      alpha: 0.3 + Math.random() * 0.7,
    });
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawField(state) {
    // Sky gradient
    const grad = context.createLinearGradient(0, 0, 0, FIELD.groundY);
    grad.addColorStop(0, PALETTE.skyTop);
    grad.addColorStop(1, PALETTE.skyBottom);
    context.fillStyle = grad;
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    // Stars
    for (const star of stars) {
      context.fillStyle = PALETTE.text;
      context.globalAlpha = star.alpha;
      context.beginPath();
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1.0;

    // Ground festival floor
    context.fillStyle = PALETTE.ground;
    context.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    context.fillStyle = PALETTE.groundTop;
    context.fillRect(0, FIELD.groundY, FIELD.width, 6);

    // Festival lanterns glowing on ground
    for (let gx = 60; gx < FIELD.width; gx += 180) {
      context.fillStyle = '#ffb703';
      context.beginPath();
      context.arc(gx, FIELD.groundY + 25, 12, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255, 183, 3, 0.2)';
      context.beginPath();
      context.arc(gx, FIELD.groundY + 25, 30, 0, Math.PI * 2);
      context.fill();
    }

    // Items (fireflies, golden lanterns, embers, powerups)
    const items = state.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.active) continue;

      if (item.kind === KIND_FIREFLY) {
        context.fillStyle = PALETTE.fireflyGlow;
        context.beginPath();
        context.arc(item.x + item.width / 2, item.y + item.height / 2, item.width * 0.9, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = PALETTE.firefly;
        context.beginPath();
        context.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
        context.fill();
      } else if (item.kind === KIND_LANTERN) {
        context.fillStyle = 'rgba(255, 183, 3, 0.4)';
        context.beginPath();
        context.arc(item.x + item.width / 2, item.y + item.height / 2, item.width * 1.1, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = PALETTE.goldenLantern;
        context.fillRect(item.x + 4, item.y + 4, item.width - 8, item.height - 8);
        context.fillStyle = '#ffffff';
        context.fillRect(item.x + item.width / 2 - 3, item.y + 8, 6, 12);
      } else if (item.kind === KIND_POWERUP) {
        let col = PALETTE.powerupMagnet;
        if (item.powerupType === 'slow') col = PALETTE.powerupSlow;
        if (item.powerupType === 'shield') col = PALETTE.powerupShield;

        context.fillStyle = col;
        context.beginPath();
        context.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#ffffff';
        text(item.powerupType[0].toUpperCase(), item.x + item.width / 2, item.y + 6, 18, '#ffffff', 'center');
      } else {
        // Ember
        context.fillStyle = PALETTE.ember;
        context.beginPath();
        context.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
        context.fill();
      }
    }

    // Player (Lantern basket keeper)
    const player = state.player;
    if (player.invulnerable === 0 || Math.floor(player.invulnerable * 12) % 2 === 1) {
      // Glow under basket
      context.fillStyle = PALETTE.playerGlow;
      context.beginPath();
      context.ellipse(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.7, player.height * 1.2, 0, 0, Math.PI * 2);
      context.fill();

      // Basket body
      context.fillStyle = PALETTE.player;
      context.fillRect(player.x, player.y, player.width, player.height);
      context.fillStyle = '#d4af37';
      context.fillRect(player.x - 4, player.y - 6, player.width + 8, 8);

      if (state.shieldActive) {
        context.strokeStyle = PALETTE.powerupShield;
        context.lineWidth = 4;
        context.beginPath();
        context.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2);
        context.stroke();
      }
    }

    // Particles and popups
    if (particleSystem) {
      particleSystem.draw(context);
    }
  }

  function drawHud(state) {
    // Dark strip behind the HUD so a falling sprite can never sit behind the
    // score/level/lives text: the strip is drawn after the field, before the text.
    context.fillStyle = 'rgba(8, 10, 26, 0.62)';
    context.fillRect(0, 0, FIELD.width, 82);
    context.textBaseline = 'top';
    text(scoreLabel(state.score), 28, 20, 26, PALETTE.text, 'left');
    text(levelLabel(state.level), FIELD.width / 2 - 120, 20, 26, PALETTE.text, 'center');
    if (state.combo > 1) {
      text(comboLabel(state.combo), FIELD.width / 2 + 100, 20, 26, PALETTE.goldenLantern, 'center');
    }

    if (state.activePowerup) {
      text(`Power: ${state.activePowerup.toUpperCase()} (${state.powerupTimeLeft.toFixed(1)}s)`, FIELD.width / 2, 55, 18, PALETTE.powerupMagnet, 'center');
    }

    const firstLife = FIELD.width - 28 - LIVES * (LIFE_SIZE + LIFE_GAP) + LIFE_GAP;
    text('Lives', firstLife - 16, 20, 26, PALETTE.text, 'right');
    for (let life = 0; life < LIVES; life++) {
      context.fillStyle = life < state.lives ? PALETTE.player : PALETTE.ground;
      context.fillRect(firstLife + life * (LIFE_SIZE + LIFE_GAP), 22, LIFE_SIZE, LIFE_SIZE);
    }
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.strokeStyle = '#2a3b5e';
    context.lineWidth = 3;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeRect(x, y, PANEL.width, height);

    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 70, 42, PALETTE.player, 'center');
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], FIELD.width / 2, y + PANEL.top + i * PANEL.line, 20, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 22, PALETTE.goldenLantern, 'center');
  }

  const TITLE_LINES = [
    'Catch glowing fireflies and golden lanterns.',
    'Dodge falling ash embers. Collect power-ups.',
    'Move with ← → / A D or Mouse. Restart with R.',
    ''
  ];
  const PAUSED_LINES = ['The festival pauses for a moment.'];
  const OVER_LINES = ['', ''];

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const shake = particleSystem ? particleSystem.getShake() : { x: 0, y: 0 };
    context.setTransform(view.scale, 0, 0, view.scale, view.x + shake.x, view.y + shake.y);

    drawField(state);

    if (screen === SCREEN_TITLE) {
      TITLE_LINES[3] = bestLabel(best);
      drawPanel('Lantern Catch — Festival of Lights', TITLE_LINES, 'Press Space or Click to start');
      return;
    }

    drawHud(state);

    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', PAUSED_LINES, 'Press P or Escape to resume');
    } else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(state.score);
      OVER_LINES[1] = bestLabel(best);
      drawPanel('Festival Ended', OVER_LINES, 'Press R or Click to restart');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
