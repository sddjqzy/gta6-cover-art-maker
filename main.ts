// Build entry for the Vice Cover make.fun entry.
//
// Copies app/ and screenshots/ into the output directory
// (MAKEFUN_OUTPUT_DIR, default "out") and writes dossier.json
// with vendor/makefun-app.ts's buildDossier, using the caps from
// the bounty's gate: text_max_bytes 163840, at most 4 screenshots
// of at most 262144 bytes each, at most 993 app files totalling
// at most 50331648 bytes, each app path at most 1000 bytes.
//
// Run:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repo = resolve(fileURLToPath(new URL('.', import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? 'out');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const name of ['app', 'screenshots']) {
  const src = join(repo, name);
  if (!existsSync(src)) throw new Error(`missing ${name}/ in ${repo}`);
  cpSync(src, join(outDir, name), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
