// Lantern Catch — Festival of Lights entry script (Node 22, standard library only).
// Copies game/ and screenshots/ to /output after strict pre-copy validation,
// and writes /output/dossier.json using the vendored make.fun library.

import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-copy validation
const htmlPath = join(here, 'game', 'index.html');
if (!existsSync(htmlPath)) {
  throw new Error(`Validation failed: missing game/index.html at ${htmlPath}`);
}
const screenshotsDir = join(here, 'screenshots');
if (!existsSync(screenshotsDir)) {
  throw new Error(`Validation failed: missing screenshots/ directory at ${screenshotsDir}`);
}
const ssFiles = readdirSync(screenshotsDir).filter(f => !f.startsWith('.'));
if (ssFiles.length < 3 || ssFiles.length > 4) {
  throw new Error(`Validation failed: screenshots/ must have 3 or 4 files, found ${ssFiles.length}`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(screenshotsDir, join(out, 'screenshots'), { recursive: true });

function countFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countFiles(full);
    } else if (entry.isFile()) {
      count += 1;
    }
  }
  return count;
}

const gameFileCount = countFiles(join(out, 'game'));
const screenshotCount = readdirSync(join(out, 'screenshots')).filter(f => !f.startsWith('.')).length;

const dossierContent = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossierContent);
const dossierBytes = Buffer.byteLength(dossierContent, 'utf8');

console.log(`Lantern Catch built successfully: ${gameFileCount} game files, ${screenshotCount} screenshots, dossier size ${dossierBytes} bytes.`);
