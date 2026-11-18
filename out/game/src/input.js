// Keyboard and pointer input with smooth movement and action flags.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);

export function createInput(target) {
  let left = false;
  let right = false;
  let pointerX = null;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });

  window.addEventListener('blur', () => {
    left = false;
    right = false;
    pointerX = null;
  });

  target.addEventListener('pointerdown', (e) => {
    actions |= ACTION_CONFIRM;
    const rect = target.getBoundingClientRect();
    pointerX = ((e.clientX - rect.left) / rect.width) * 1280;
  });

  target.addEventListener('pointermove', (e) => {
    if (e.buttons > 0 || pointerX !== null) {
      const rect = target.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width) * 1280;
    }
  });

  target.addEventListener('pointerup', () => {
    pointerX = null;
  });

  return {
    direction() {
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    getPointerX() {
      const px = pointerX;
      return px;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
