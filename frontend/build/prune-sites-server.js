import { readdir, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = fileURLToPath(new URL('../dist/server/', import.meta.url));
const staticExtensions = new Set(['.css', '.gif', '.jpeg', '.jpg', '.md', '.png', '.svg', '.ttf', '.webp', '.woff', '.woff2']);

async function prune(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await prune(path);
      return;
    }

    if (staticExtensions.has(extname(entry.name).toLowerCase())) {
      await rm(path);
    }
  }));
}

await prune(serverDirectory);
