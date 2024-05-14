import type { SpawnOptions } from 'child_process';
import os from 'os';

/** return SpawnOptions of different os */
export default function getSpawnOptions(): SpawnOptions {
  const platform = os.platform(); // "darwin", "win32" or "linux"
  if (platform === 'win32') {
    return { shell: true };
  }
  return {};
}
