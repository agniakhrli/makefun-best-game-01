// Particle system for bursts, floating score popups, and screen shake.
export function createParticleSystem() {
  const particles = [];
  const popups = [];
  let screenShake = 0;

  return {
    burst(x, y, color, count = 12) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 180;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.4 + Math.random() * 0.4,
          maxLife: 0.8,
          color,
          size: 3 + Math.random() * 4,
        });
      }
    },
    popup(x, y, text, color = '#ffd166') {
      popups.push({ x, y, text, color, life: 1.0, vy: -40 });
    },
    shake(intensity = 10) {
      screenShake = Math.max(screenShake, intensity);
    },
    update(dt) {
      if (screenShake > 0) {
        screenShake = Math.max(0, screenShake - dt * 25);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // gravity
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
      for (let i = popups.length - 1; i >= 0; i--) {
        const pop = popups[i];
        pop.y += pop.vy * dt;
        pop.life -= dt;
        if (pop.life <= 0) {
          popups.splice(i, 1);
        }
      }
    },
    getShake() {
      if (screenShake <= 0) return { x: 0, y: 0 };
      return {
        x: (Math.random() - 0.5) * screenShake,
        y: (Math.random() - 0.5) * screenShake,
      };
    },
    draw(context) {
      for (const p of particles) {
        context.fillStyle = p.color;
        context.globalAlpha = Math.max(0, p.life / p.maxLife);
        context.fillRect(p.x, p.y, p.size, p.size);
      }
      context.globalAlpha = 1.0;
      context.font = 'bold 20px system-ui, sans-serif';
      for (const pop of popups) {
        context.fillStyle = pop.color;
        context.globalAlpha = Math.max(0, pop.life);
        context.textAlign = 'center';
        context.fillText(pop.text, pop.x, pop.y);
      }
      context.globalAlpha = 1.0;
    },
    reset() {
      particles.length = 0;
      popups.length = 0;
      screenShake = 0;
    }
  };
}
