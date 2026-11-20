// Cashvio project foundation policy. Generated component copies are kept identical.
// Checks filenames and toolchain entry points; never reads credential contents.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function checkFoundations(root) {
  const failures = [];
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  } catch {
    console.error('FAIL foundations: missing or invalid package.json.');
    return 1;
  }

  const manager = /^\b(npm|yarn)@(\d+\.\d+\.\d+)$/.exec(manifest.packageManager || '');
  if (!manager) failures.push('packageManager must pin npm or Yarn to an exact version.');
  const expectedLock = manager?.[1] === 'npm' ? 'package-lock.json' : 'yarn.lock';
  const lockNames = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb'];
  const existingLocks = lockNames.filter((name) => fs.existsSync(path.join(root, name)));
  if (manager && (existingLocks.length !== 1 || existingLocks[0] !== expectedLock)) {
    failures.push(`Expected only ${expectedLock}; found ${existingLocks.join(', ') || 'none'}.`);
  }
  if (!manifest.engines?.node) failures.push('engines.node must declare the component runtime.');

  for (const [name, command] of Object.entries(manifest.scripts || {})) {
    if (typeof command !== 'string') { failures.push(`Invalid script: ${name}.`); continue; }
    if (/\bnext\s+lint\b/.test(command)) failures.push(`${name}: next lint is not a Next 16 verification command.`);
    // Validate direct node entry points, not arbitrary shell/binary semantics.
    for (const match of command.matchAll(/\bnode\s+(?:--\S+\s+)*["']?([^\s"']+\.(?:js|mjs|cjs))\b/g)) {
      const entry = match[1];
      if (entry.replace(/^\.\//, '').startsWith('node_modules/')) continue;
      const absolute = path.resolve(root, entry);
      const relative = path.relative(root, absolute);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        failures.push(`${name}: missing or out-of-component node entry point ${entry}.`);
      } else if (/[*?[{]/.test(entry) && /\bnode\s+[^;&]*--test\b/.test(command)) {
        try {
          if (fs.globSync(entry, { cwd: root }).length === 0) failures.push(`${name}: node test pattern selects no files: ${entry}.`);
        } catch { failures.push(`${name}: cannot validate node test pattern ${entry}.`); }
      } else if (!fs.existsSync(absolute)) {
        failures.push(`${name}: missing or out-of-component node entry point ${entry}.`);
      }
    }
  }

  const git = spawnSync('git', ['ls-files', '--cached', '-z'], {
    cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  if (git.error || git.status !== 0) {
    failures.push('Git tracked-path inventory is unavailable; credential-state hygiene is not verified.');
  } else {
    for (const file of git.stdout.split('\0').filter(Boolean)) {
      const normalized = file.replaceAll('\\', '/');
      const name = path.posix.basename(normalized);
      const localAgentState = /(^|\/)\.pi\//i.test(normalized)
        || /(^|\/)\.(?:claude|cursor)\/settings\.local\.json$/i.test(normalized);
      const privateEnv = /^\.env(?:$|\.)/i.test(name)
        && !/\.(?:example|sample|template)$/i.test(name);
      if (localAgentState || privateEnv) failures.push(`Tracked local credential/runtime path: ${normalized}.`);
    }
  }

  if (failures.length) {
    for (const failure of failures) console.error(`FAIL foundations: ${failure}`);
    return 1;
  }
  console.log(`Foundations PASS: ${manager[0]}, one matching lockfile, direct node entry points and tracked-path hygiene.`);
  console.log('Scope: no credential contents/history scanned; no application, live CI or deployment validation.');
  return 0;
}

const scriptPath = fileURLToPath(import.meta.url);
const isMain = typeof import.meta.main === 'boolean' ? import.meta.main
  : Boolean(process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(scriptPath));
if (isMain) {
  const args = process.argv.slice(2);
  if (args.length !== 0 && !(args.length === 2 && args[0] === '--root')) {
    console.error('Usage: node scripts/check-foundations.mjs [--root <component-root>]');
    process.exitCode = 64;
  } else {
    process.exitCode = checkFoundations(path.resolve(args[1] || path.join(path.dirname(scriptPath), '..')));
  }
}
