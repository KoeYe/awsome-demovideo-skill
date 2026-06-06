#!/usr/bin/env node
// sync-clips — copy/symlink source clips from a configurable source dir
// into public/clips/ before each render. Wire via `predev` / `prerender`
// in package.json so you can't forget to sync.
//
// Configure by editing the SOURCES array below. Each entry can be a
// single file or a directory (recursively copied).
//
// If your project has no external clip source (clips are checked into
// public/clips/ directly), leave SOURCES empty — this script becomes a
// no-op.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const destDir = path.join(projectRoot, "public", "clips");

const SOURCES = [
  // Example:
  // path.resolve(projectRoot, "../sibling-recordings"),
  // path.resolve(projectRoot, "../another-project/exports/clip.mp4"),
];

fs.mkdirSync(destDir, { recursive: true });

if (SOURCES.length === 0) {
  console.log("[sync-clips] no SOURCES configured — skipping.");
  process.exit(0);
}

let copied = 0;

const copyOne = (src) => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(src)) {
      copyOne(path.join(src, entry));
    }
  } else if (stat.isFile() && /\.(mp4|mov|webm)$/i.test(src)) {
    const destPath = path.join(destDir, path.basename(src));
    const destStat = fs.existsSync(destPath) ? fs.statSync(destPath) : null;
    if (!destStat || destStat.mtimeMs < stat.mtimeMs) {
      fs.copyFileSync(src, destPath);
      console.log(`[sync-clips] ${path.basename(src)}`);
      copied++;
    }
  }
};

for (const src of SOURCES) {
  if (!fs.existsSync(src)) {
    console.warn(`[sync-clips] source not found: ${src}`);
    continue;
  }
  copyOne(src);
}

console.log(`[sync-clips] done. ${copied} file(s) updated.`);
