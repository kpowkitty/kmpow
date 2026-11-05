# kmpow refresh: context handoff for another Claude session

Read this first in a new session; it captures the state and decisions so far.

## Project
- Personal site **kmpow.com**: React (CRA, MUI 7, react-router 6) frontend in `src/`, Django + DRF backend in `backend/` (apps: `blog`, `about`, `resume`, `contact`). Postgres in production, hosted on FreeBSD + Nginx.
- Work happens on branch **`refresh`** (not `main`).
- Goal of the refresh:
  1. Rebuild the home "galaxy" splash, where blog posts are stars and posts in the same category form constellations, as a deterministic grid.
  2. Clean up the codebase: no duplication, everything idempotent and reusable, real tests.

## How the user wants to work (important)
- **Before every code change, explain it in 2-3 sentences** (more only if needed). Make **one change at a time** so each edit can be approved knowingly.
- **Slow down and explain the whole problem before proposing fixes.** Avoid the XY problem: don't solve your own constraint and present it as theirs.
- Everything must be **composable, configurable and idempotent**.
- **DO NOT change any visual styling.** Every color, size, shadow and animation stays identical; styling will be discussed separately later.
- Keep comments minimal. The user trimmed docstrings and comments, so match the sparse style.
- Do the work in parts, in this order: **1. tests → 2. grid → 3. stars → 4. backend → 5. routes → …** Pause after each part so the user can run it.

## Decisions already made (don't re-ask)
- **Galaxy:** an endless wrapping grid (a torus of cells) plus a spherical "globe lens": stars toward the edges shrink, dim and curve "up and out". Panning is X/Y only, with no Z travel and no zoom.
- **Controls:** mouse/touch drag with inertia, wheel/trackpad, arrow keys. No idle drift.
- **Blog posts come from Django admin only.** New posts get a grid cell automatically on save. `src/scripts/addStar.js`, `clearJson.js` and `src/static/stars.json` are dead code to delete.
- **Tests:**
  - All tests live in root `tests/`, not next to the code they test.
  - Backend tests use **pytest + pytest-django**.
  - Test configs are defined in **one Python file** (`tests/config.py`).
- **Seed data:** one source (`tests/seed/data/*.json`) with edge cases per component. Used for test fixtures and a local dev DB. Frontend mocks come from the same source, via API snapshots.
- **Docker:** tests run in Docker so they work on any OS, and the same command runs locally and in GitHub Actions on PRs.
- **Environment and secrets:**
  - Settings must **hard-fail** if env vars are missing; don't add defaults to `settings.py`.
  - **No real secrets** in tests or CI. Fake values live in the compose file.
  - Claude is blocked from writing `.env*` files by permission rules.
- **Repo hygiene:** migrations and `yarn.lock` should be committed (removed from `.gitignore`).

## Part 1 (tests) status: DONE
`python3 tests/run.py ci` is green: backend 30/30, frontend 10/10.

Environment, pinned to match prod (FreeBSD server):
- Python 3.11 and Node 23 are the Docker image defaults.
- `backend/.requirements.txt` is pinned from prod's `pip freeze` (Django 5.1.7, DRF 3.16.0, psycopg2 2.9.10, …).
- **yarn is the only package manager.** `package-lock.json` is gitignored and deleted. Use `yarn add`, never `npm install`, or `yarn.lock` drifts and the frontend image build fails.

Migrations were **reset**: one fresh `0001_initial.py` per app (blog, about, contact, resume), generated from the current models. Prod's history differs (for example, resume had 0001–0004 on the server, never committed). On the **first deploy**, prod needs this one-time sync:
1. Back up with `pg_dump`.
2. Diff prod's schema (`pg_dump --schema-only`) against a test DB built from the new migrations. They must match.
3. Run `DELETE FROM django_migrations WHERE app IN ('blog','about','contact','resume')`.
4. Run `manage.py migrate --fake-initial`.

Test output: `tests/reporting.py` prints results grouped by file, at 80 columns: `name : PASS | FAIL | ERROR | SKIPPED | KNOWN BUG | BUG FIXED, REMOVE MARK`. `-v` falls back to pytest's own format.

Server to-do (user): prod's venv contains `sqlite3==0.0.0`, `mysqlite==0.0.0` and `awaiter==0.1.2`. They're unused, and two of them look like possible typosquats. Inspect them with `pip show -f`, then remove them.

Gotcha: if the disk fills during a Docker build, cached layers can end up with 0-byte files, which makes components import as `{}`. Fix it with `docker compose ... build --no-cache`.

Files created or changed:
```
.gitignore                       # no longer ignores backend/*/migrations/* or yarn.lock
.dockerignore                    # keeps .env*, node_modules, .venv, .git etc out of images
.github/workflows/tests.yml      # PR + push-to-main; matrix read from tests/config.py CI_CONFIGS; no secrets
package.json                     # "test": "python3 tests/run.py all"
README.md                        # Testing section
tests/
  config.py        # Suite(service, args) / Config(description, suites); CONFIGS dict; CI_CONFIGS; 'ci' derived
  run.py           # python3 tests/run.py <config> [-- extra args] | --list ; always `compose down` after
  dockerctl.py     # shared compose() helper; projects kmpow-tests vs kmpow-dev; passes HOST_UID/GID
  seed_dev.py      # starts persistent devdb (profile dev, port DEVDB_PORT=5433) and runs `python -m seed`
  conftest.py      # --update-snapshots option; loads reporting.py
  reporting.py     # grouped `name : RESULT` output (off under -v)
  pytest.ini       # pythonpath ../backend + . ; testpaths backend; markers unit/integration/snapshot;
                   # --strict-markers --import-mode=importlib -p no:cacheprovider; console_output_style=classic
  requirements.txt # pytest==8.3.3, pytest-django==4.9.0
  docker/compose.yml           # db (tmpfs postgres:16), backend, snapshots (backend + rw mount of tests/seed/api),
                               # frontend, devdb (profile dev, named volume). Fake env via YAML anchor.
  docker/backend.Dockerfile    # python:${PYTHON_VERSION:-3.11}-slim (+gcc libc6-dev libpq-dev), ENTRYPOINT pytest, WORKDIR /repo/tests
  docker/frontend.Dockerfile   # node:${NODE_VERSION:-23}-slim, yarn --frozen-lockfile, ENTRYPOINT node jest.js --config tests/frontend/jest.config.js
  seed/data/{blogs,about,resume}.json  # edge cases: null position, 0/100 positions, unicode, long title,
                                       # lone category, 3-post constellation, pluralization, uncategorized tag...
  seed/loader.py      # LOADERS registry; idempotent upserts on natural keys; @transaction.atomic load(*components)
  seed/__main__.py    # python -m seed [component...] → django.setup, migrate, load
  seed/snapshots.py   # snapshot_urls(); url→file rule: /api/blogs/x/ → api__blogs__x.json
  seed/api/.gitkeep   # snapshots go here (generated, committed)
  backend/conftest.py # fixtures: api (APIClient), seed (=load, needs db), seeded
  backend/unit/test_seed_data.py
  backend/integration/test_seed_loader.py, test_blog_api.py, test_about_api.py,
                      test_resume_api.py, test_contact_api.py, test_api_snapshots.py (reset_sequences=True)
  frontend/jest.config.js      # plain jest + babel-preset-react-app (runtime automatic); ESM_PACKAGES allowlist
  frontend/support/setup.js, mockApi.js (fetch mock from snapshots), render.js (renderAt + location probe), stubs/
  frontend/FadeAppBar.test.js, BlogAccessories.test.js   # characterization tests
                               # BlogAccessories: renderPost/click settle the mocked fetches inside act()
```

### Bugs found (documented, not fixed)
- **Open question:** contact messages have no subject. Django saves the missing `subject` as `''` (not a bug), and `ContactPage.js` never sends one. Decide whether a subject is wanted.
- **React Router v7 future-flag warnings in tests:** enable `v7_startTransition` and `v7_relativeSplatPath` in the app router and `tests/frontend/support/render.js` together, in the routes part.
- **Stray props:** `BlogAccessories.js` passes `disableGutters`/`maxWidth` to a `Box` (they're `Container` props), so React warns about an unknown DOM attribute. Check `BlogPage.js:156` too.
- **Contact page:** status typo `"succes"` and a hardcoded `https://kmpow.com` POST URL in `src/ContactPage.js`.
- **Galaxy:** `Stars.js` crashes on a blog with `position: null`.
- **Prop mismatch:** `LoadingStars` passes `starCount`, but `TwinklyStars` expects `count`.
- **`order` field:** `ConstellationLines` and `BlogAccessories` sort by `order`, which doesn't exist on `Blog`.
- **`ConstellationLines` logging:** it logs to the console on every render.
- **Unordered API:** the About and blog list APIs have no explicit ordering; About sorts by `-updated_at` only.

## Remaining plan (parts 2+)
**Open decision for Part 3:** the frontend grid needs `grid_col`/`grid_row`, which only arrive with the backend part. Either add a temporary percent→cell adapter or do the backend part first.

**Grid / galaxy (frontend, pure modules first, each with tests in `tests/frontend/`):**
- `src/lib/random.js`: mulberry32 + `hash2(col, row, seed)`.
- `src/galaxy/config.js`: `CELL_PX`, `LENS_STRENGTH`, `DENSITY`, `INERTIA`, `KEY_STEP`.
- `src/galaxy/grid.js`: wrap, `cellKey`, `cellCenter`, `visibleCells(camera, viewport)`, `torusDelta`.
- `src/galaxy/background.js`: `starsForCell(col, row, seed)`, deterministic. Blog cells and their 8 neighbors stay empty.
- `src/galaxy/projection.js`: `project(dx, dy, R)`. Offset `d` maps to `R·sin(|d|/R)`, with `scale = cos(|d|/R)` and opacity following it. Identity at the center.
- `src/galaxy/camera.js`: pure reducer `cameraStep(state, action, dt)` (pan, wrap, inertia decay, click threshold).
- `src/galaxy/constellations.js`: group by category, order by `order`, edges via the shortest torus delta, `neighbors(slug)` (reused by `BlogAccessories`).
- **Galaxy components:** `useGalaxyControls`, then `Galaxy.js` with `BlogStar`, `BackgroundStar` and `ConstellationLayer`; `Galaxy.js` replaces `Stars.js`.
  - DOM rendering only; blog stars stay `StarOutlinedIcon` with the same `sx`.
  - React renders only the visible cells. One rAF loop writes transforms via refs.
  - Data is fetched once, and a resize never regenerates anything.
  - Constellation lines are drawn as pixel-space SVG polylines.

**Backend:**
- `Blog` model: replace `position` JSON with `grid_col`/`grid_row` (nullable, unique together) and add `order`. `save()` auto-assigns a cell if it's empty and never moves an existing one.
- `blog/placement.py`: pure `assign_cell` that spirals out from the category centroid (or `hash(category)`), honoring `MIN_GAP`.
- `settings.GALAXY = {cols, rows, seed}`.
- Data migration from percent positions to cells, centered on the origin.
- `GET /api/galaxy/` returns `{cols, rows, seed, stars:[...]}` without content. The list serializer drops `content`.
- Admin: show and edit `order`, plus a "re-place" action.
- `manage.py place_stars [--reset]`, idempotent.
- Update the seed data and snapshots to match.

**Cleanup / dedupe (logic only, styles identical):**
- `src/theme/tokens.js` (verbatim colors) and `src/theme/animations.css` (twinkle/shimmer, defined once).
- `src/lib/api.js` (`fetchJSON` + `useFetch`).
- `components/GlassPage.js` (the shared Box→Container→Paper shell for About, Resume, Contact and Blog) and `components/MarkdownView.js`.
- `FadeAppBar`: build the nav from a `NAV_ITEMS` map.
- `TwinklyStars`: seeded and idempotent.
- `BlogAccessories`: use `/api/galaxy/` + `neighbors()`.
- Delete `Stars.js`, `ConstellationLines.js`, `src/scripts/`, `src/static/stars.json`, and the `fs`/`readline`/`yarn` deps.
- `public/content/*.md` can go once it's confirmed the DB content matches.

## Verification
- `python3 tests/run.py ci` is green.
- `python3 tests/seed_dev.py` run twice: the second run changes nothing.
- Manual check: resizing doesn't reshuffle stars, and panning wraps endlessly with lines staying attached across the seam. Center-of-screen styling should be identical to before.
