// Capture real screenshots of Lantern Catch using Playwright and Chromium.
import { chromium } from '/home/hatch/.npm/_npx/41b79885fbdb2a18/node_modules/playwright/index.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const shots = [
  { name: '1-start.jpg', query: '?shot=start&seed=1' },
  { name: '2-play.jpg', query: '?shot=play&seed=1' },
  { name: '3-end.jpg', query: '?shot=end&seed=1' },
];

mkdirSync('screenshots', { recursive: true });

const server = spawn('node', ['serve.ts', '--port', '8080'], { stdio: 'inherit' });
await new Promise((resolve) => setTimeout(resolve, 1500));

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--disable-setuid-sandbox'],
});

const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

for (const shot of shots) {
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  await page.goto(`http://localhost:8080/${shot.query}`);
  try {
    await page.waitForFunction('window.__shotReady === true', { timeout: 15000 });
  } catch (e) {
    console.warn(`Timeout waiting for __shotReady on ${shot.name}, proceeding anyway...`);
  }
  await new Promise(r => setTimeout(r, 500));

  const path = join('screenshots', shot.name);
  await page.screenshot({ path, type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1280, height: 720 } });
  
  const stats = statSync(path);
  console.log(`Saved ${path}: ${stats.size} bytes. Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }
  await page.close();
}

await browser.close();
server.kill();
console.log('Screenshots captured successfully!');
