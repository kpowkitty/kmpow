// Generates <name>.generated.js next to each <name>.glsl: the GLSL text plus a JS copy of its functions.
// Usage: node scripts/shaders.mjs [--dir <dir>] [--watch [command...]]
//   --watch keeps regenerating on change and, if given a command, runs it alongside (exits when it does).
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import GLSL from 'glsl-transpiler';

const DECLARATION = /^\s*(?:void|bool|int|float|[biu]?vec[234]|mat[234])\s+(\w+)\s*\(/gm;
const GENERATED = '.generated.js';
const DEBOUNCE_MS = 50;

function parseArgs(argv) {
  const options = { dir: 'src/galaxy/shaders', watch: false, command: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dir') options.dir = argv[++i];
    else if (argv[i] === '--watch') { options.watch = true; options.command = argv.slice(i + 1); break; }
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return options;
}

const constName = (name) => `${name.replace(/\W+/g, '_').toUpperCase()}_GLSL`;
const declaredFunctions = (source) => [...new Set([...source.matchAll(DECLARATION)].map((m) => m[1]))];

function generate(file, source) {
  const name = basename(file, '.glsl');
  const functions = declaredFunctions(source);
  if (!functions.length) throw new Error(`${file}: no functions found`);
  return [
    '/* eslint-disable */',
    `// Generated from ${name}.glsl by scripts/shaders.mjs. Don't edit; edit the .glsl and rerun.`,
    `export const ${constName(name)} = ${JSON.stringify(source)};`,
    GLSL()(source),
    `export { ${functions.join(', ')} };`,
    '',
  ].join('\n');
}

// Brings every generated file in line with its .glsl; returns the number of failures.
function build(dir, { quiet = false } = {}) {
  const entries = existsSync(dir) ? readdirSync(dir).sort() : [];
  let failures = 0;
  for (const file of entries.filter((f) => f.endsWith('.glsl'))) {
    const out = join(dir, file.replace(/\.glsl$/, GENERATED));
    try {
      const code = generate(file, readFileSync(join(dir, file), 'utf8'));
      const changed = !existsSync(out) || readFileSync(out, 'utf8') !== code;
      if (changed) writeFileSync(out, code);
      if (changed || !quiet) console.log(`${file} → ${basename(out)}${changed ? '' : ' (unchanged)'}`);
    } catch (err) {
      failures++;
      console.error(`${file}: ${err.message} (kept the last good ${basename(out)})`);
    }
  }
  for (const file of entries.filter((f) => f.endsWith(GENERATED))) {
    if (entries.includes(file.replace(GENERATED, '.glsl'))) continue;
    rmSync(join(dir, file));
    console.log(`removed ${file} (its .glsl is gone)`);
  }
  return failures;
}

function watchDir(dir) {
  mkdirSync(dir, { recursive: true });
  let timer;
  watch(dir, (_, filename) => {
    if (!filename?.endsWith('.glsl')) return;
    clearTimeout(timer);
    timer = setTimeout(() => build(dir, { quiet: true }), DEBOUNCE_MS);
  });
  console.log(`watching ${dir} for .glsl changes`);
}

function runAlongside(command) {
  const child = spawn(command[0], command.slice(1), { stdio: 'inherit' });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}

const options = parseArgs(process.argv.slice(2));
const failures = build(options.dir);
if (!options.watch) process.exit(failures ? 1 : 0);
watchDir(options.dir);
if (options.command.length) runAlongside(options.command);
