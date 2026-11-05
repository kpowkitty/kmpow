// fetch mock backed by the API snapshots in tests/seed/api.
// Filename rule mirrors tests/seed/snapshots.py: /api/blogs/kyua-test/ -> api__blogs__kyua-test.json
import fs from 'fs';
import path from 'path';

const SNAPSHOT_DIR = path.resolve(__dirname, '../../seed/api');

const pathnameOf = (url) => new URL(url, 'http://localhost').pathname;

export function snapshotPath(url) {
  const name = pathnameOf(url).replace(/^\/+|\/+$/g, '').replace(/\//g, '__');
  return path.join(SNAPSHOT_DIR, `${name}.json`);
}

export function readSnapshot(url) {
  return JSON.parse(fs.readFileSync(snapshotPath(url), 'utf8'));
}

const respond = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

// overrides: { '/api/blogs/': { status: 500, body: {...} } }
export function mockApi(overrides = {}) {
  global.fetch = jest.fn(async (url) => {
    const override = overrides[pathnameOf(url)];
    if (override) return respond(override.body, override.status);
    if (!fs.existsSync(snapshotPath(url))) return respond({ detail: 'Not found.' }, 404);
    return respond(readSnapshot(url));
  });
  return global.fetch;
}
