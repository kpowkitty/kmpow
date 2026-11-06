import { cameraStep, initialCamera } from '../../src/galaxy/camera';

const GALAXY = { cols: 64, rows: 32 };
const OPTIONS = { cellPx: 100, inertia: 0.92, clickThreshold: 5, keyStep: 100 };
const START = initialCamera(1000, 1000);

const play = (actions, state = START, options = OPTIONS) => actions.reduce((s, a) => cameraStep(s, a, GALAXY, options), state);
const drag = (moves, { endAt } = {}) => {
  const actions = [{ type: 'drag-start', t: 0 }];
  moves.forEach(([dx, dy], i) => actions.push({ type: 'drag-move', dx, dy, t: (i + 1) * 16 }));
  actions.push({ type: 'drag-end', t: endAt ?? moves.length * 16 + 1 });
  return actions;
};
const ticks = (n, dt) => Array.from({ length: n }, () => ({ type: 'tick', dt }));

describe('dragging', () => {
  test('dragging right moves the camera left, so the stars follow the pointer', () => {
    const s = play([{ type: 'drag-start', t: 0 }, { type: 'drag-move', dx: 30, dy: -20, t: 16 }]);
    expect(s).toMatchObject({ x: 970, y: 1020, dragging: true });
  });

  test('moves are ignored when not dragging', () => {
    expect(play([{ type: 'drag-move', dx: 30, dy: 0, t: 16 }])).toEqual(START);
  });

  test('ticks during a drag do not glide', () => {
    const s = play([{ type: 'drag-start', t: 0 }, { type: 'drag-move', dx: 30, dy: 0, t: 16 }, ...ticks(5, 16)]);
    expect(s.x).toBe(970);
  });
});

describe('click vs drag', () => {
  test('a release under the threshold is a click with no glide', () => {
    const s = play(drag([[2, 1], [1, 0]]));
    expect(s).toMatchObject({ click: true, vx: 0, vy: 0, dragging: false });
  });

  test('a release over the threshold is a drag, not a click', () => {
    const s = play(drag([[10, 0], [10, 0]]));
    expect(s.click).toBe(false);
    expect(s.vx).toBeLessThan(0);
  });

  test('click is only true on the step that ends the drag', () => {
    const s = play([...drag([[1, 0]]), { type: 'tick', dt: 16 }]);
    expect(s.click).toBe(false);
  });

  test('holding still before release means no glide', () => {
    const s = play(drag([[20, 0], [20, 0]], { endAt: 500 }));
    expect(s).toMatchObject({ vx: 0, vy: 0, click: false });
  });
});

describe('glide', () => {
  test('keeps moving after release, slows down, and stops', () => {
    let s = play(drag([[20, 0], [20, 0]]));
    const speeds = [];
    for (let i = 0; i < 400 && s.vx; i++) {
      s = cameraStep(s, { type: 'tick', dt: 16 }, GALAXY, OPTIONS);
      speeds.push(Math.abs(s.vx));
    }
    for (let i = 1; i < speeds.length; i++) expect(speeds[i]).toBeLessThanOrEqual(speeds[i - 1]);
    expect(s.vx).toBe(0);
    expect(s.x).toBeLessThan(960);
  });

  test('covers the same distance at 60 Hz and 120 Hz', () => {
    const released = play(drag([[20, 0], [20, 0]]));
    const at60 = play(ticks(120, 1000 / 60), released);
    const at120 = play(ticks(240, 1000 / 120), released);
    expect(at120.x).toBeCloseTo(at60.x, 0);
  });

  test('a new drag stops the glide', () => {
    const s = play([...drag([[20, 0], [20, 0]]), { type: 'drag-start', t: 100 }]);
    expect(s).toMatchObject({ vx: 0, vy: 0 });
  });
});

describe('wheel and keys', () => {
  test('wheel pans by its delta and stops any glide', () => {
    const s = play([...drag([[20, 0], [20, 0]]), { type: 'wheel', dx: 5, dy: 40 }]);
    expect(s).toMatchObject({ x: 965, y: 1040, vx: 0, vy: 0 });
  });

  test.each([
    ['left', 900, 1000], ['right', 1100, 1000], ['up', 1000, 900], ['down', 1000, 1100],
  ])('the %s arrow pans one key step', (dir, x, y) => {
    expect(play([{ type: 'key', dir }])).toMatchObject({ x, y });
  });

  test('an unknown key or action changes nothing', () => {
    expect(play([{ type: 'key', dir: 'sideways' }, { type: 'nonsense' }])).toEqual(START);
  });
});

describe('wrapping and purity', () => {
  test('the position wraps into the galaxy', () => {
    const s = play([{ type: 'wheel', dx: -1100, dy: 2300 }]);
    expect(s).toMatchObject({ x: 6300, y: 100 });
  });

  test('never modifies the state it is given', () => {
    const state = Object.freeze(play(drag([[20, 0], [20, 0]])));
    const copy = { ...state };
    cameraStep(state, { type: 'tick', dt: 16 }, GALAXY, OPTIONS);
    expect(state).toEqual(copy);
  });
});
