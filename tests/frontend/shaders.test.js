/**
 * @jest-environment node
 */
// Runs scripts/shaders.mjs as a real process against a temp folder.
import { spawn, spawnSync } from 'child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const SCRIPT = resolve(__dirname, '../../scripts/shaders.mjs');
const GOOD = 'float twice(float x) { return x * 2.0; }\nvec2 flip(vec2 v) { return v.yx; }\n';
const BAD = 'float twice( {';

let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'shaders-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const run = (...args) => spawnSync('node', [SCRIPT, '--dir', dir, ...args], { encoding: 'utf8' });
const put = (name, source) => writeFileSync(join(dir, name), source);
const read = (name) => readFileSync(join(dir, name), 'utf8');

describe('one-off run', () => {
  test('writes a generated module with the GLSL text and every declared function', () => {
    put('my-math.glsl', GOOD);
    const { status, stdout } = run();
    expect(status).toBe(0);
    expect(stdout).toContain('my-math.glsl → my-math.generated.js');
    const out = read('my-math.generated.js');
    expect(out).toMatch(/^\/\* eslint-disable \*\//);
    expect(out).toContain(`export const MY_MATH_GLSL = ${JSON.stringify(GOOD)};`);
    expect(out).toContain('export { twice, flip };');
  });

  test('a second run changes nothing', () => {
    put('a.glsl', GOOD);
    run();
    const before = statSync(join(dir, 'a.generated.js')).mtimeMs;
    const { stdout } = run();
    expect(stdout).toContain('(unchanged)');
    expect(statSync(join(dir, 'a.generated.js')).mtimeMs).toBe(before);
  });

  test('bad GLSL exits 1 and keeps the last good output', () => {
    put('a.glsl', GOOD);
    run();
    const good = read('a.generated.js');
    put('a.glsl', BAD);
    const { status, stderr } = run();
    expect(status).toBe(1);
    expect(stderr).toContain('a.glsl:');
    expect(read('a.generated.js')).toBe(good);
  });

  test('a file with no functions is an error', () => {
    put('empty.glsl', '// nothing here\n');
    const { status, stderr } = run();
    expect(status).toBe(1);
    expect(stderr).toContain('no functions found');
  });

  test('generated files whose .glsl is gone are removed', () => {
    put('old.generated.js', '// stale');
    expect(run().status).toBe(0);
    expect(existsSync(join(dir, 'old.generated.js'))).toBe(false);
  });

  test('a missing folder is fine', () => {
    const missing = join(dir, 'nope');
    const { status } = spawnSync('node', [SCRIPT, '--dir', missing], { encoding: 'utf8' });
    expect(status).toBe(0);
    expect(existsSync(missing)).toBe(false);
  });

  test('an unknown argument fails', () => {
    expect(run('--bogus').status).not.toBe(0);
  });
});

describe('watch mode', () => {
  const waitFor = async (check, ms = 5000) => {
    const end = Date.now() + ms;
    while (!check()) {
      if (Date.now() > end) throw new Error('timed out');
      await new Promise((r) => setTimeout(r, 25));
    }
  };

  test('regenerates on change, survives bad GLSL, and cleans up deletes', async () => {
    const child = spawn('node', [SCRIPT, '--dir', dir, '--watch'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (d) => { output += d; });
    child.stderr.on('data', (d) => { output += d; });
    try {
      await waitFor(() => output.includes('watching'));
      const out = join(dir, 'live.generated.js');

      put('live.glsl', GOOD);
      await waitFor(() => existsSync(out));
      const good = read('live.generated.js');

      put('live.glsl', BAD);
      await waitFor(() => output.includes('kept the last good'));
      expect(read('live.generated.js')).toBe(good);
      expect(child.exitCode).toBe(null);

      put('live.glsl', 'float thrice(float x) { return x * 3.0; }\n');
      await waitFor(() => existsSync(out) && read('live.generated.js').includes('thrice'));

      rmSync(join(dir, 'live.glsl'));
      await waitFor(() => !existsSync(out));
    } finally {
      child.kill();
    }
  }, 20000);

  test('runs a command alongside and exits with its exit code', () => {
    const { status } = spawnSync('node', [SCRIPT, '--dir', dir, '--watch', 'node', '-e', 'process.exit(3)'], { encoding: 'utf8' });
    expect(status).toBe(3);
  });
});
