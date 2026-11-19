// Vice Cover — entry point for the make.fun scorer.
// Copies app/ and screenshots/ into the output directory and writes dossier.json.
// The scorer runs `node /bot/main.ts` from an arbitrary working directory (often /),
// so every path here is anchored to this script's own directory, never to process.cwd().
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const appDir = join(scriptDir, 'app');
const shotsDir = join(scriptDir, 'screenshots');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote dossier.json (${dossier.length} bytes) to ${outDir}`);
