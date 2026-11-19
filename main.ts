// Vice Cover — build entry.
// Copies app/ and screenshots/ into the output directory (MAKEFUN_OUTPUT_DIR,
// default "out") and writes dossier.json with vendor/makefun-app.ts's
// buildDossier, under the bounty's caps.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || 'out');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(resolve('app'), join(outDir, 'app'), { recursive: true });
cpSync(resolve('screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
