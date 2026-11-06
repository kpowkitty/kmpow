import { CELL_PX, CLICK_THRESHOLD_PX, INERTIA, KEY_STEP } from './config';
import { worldSize, wrap } from './grid';

const FRAME_MS = 1000 / 60;
const STOP_SPEED = 0.01; // px/ms; a glide slower than this stops
const RELEASE_STILL_MS = 100; // holding still this long before release means no glide

const DEFAULTS = { cellPx: CELL_PX, inertia: INERTIA, clickThreshold: CLICK_THRESHOLD_PX, keyStep: KEY_STEP };
const KEYS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

export const initialCamera = (x = 0, y = 0) => ({ x, y, vx: 0, vy: 0, dragging: false, travel: 0, lastMoveAt: 0, click: false });

// Glide with velocity decaying by `inertia` per 60 Hz frame, integrated exactly so any frame rate covers the same distance.
function glide(state, dt, inertia) {
  if (!state.vx && !state.vy) return state;
  const rate = -Math.log(inertia) / FRAME_MS;
  const decay = Math.exp(-rate * dt);
  const travelled = rate ? (1 - decay) / rate : dt;
  const vx = state.vx * decay;
  const vy = state.vy * decay;
  const stopped = Math.hypot(vx, vy) < STOP_SPEED;
  return { ...state, x: state.x + state.vx * travelled, y: state.y + state.vy * travelled, vx: stopped ? 0 : vx, vy: stopped ? 0 : vy };
}

function step(state, action, o) {
  switch (action.type) {
    case 'drag-start':
      return { ...state, vx: 0, vy: 0, dragging: true, travel: 0, lastMoveAt: action.t };
    case 'drag-move': {
      if (!state.dragging) return state;
      const elapsed = Math.max(action.t - state.lastMoveAt, 1);
      return {
        ...state,
        x: state.x - action.dx,
        y: state.y - action.dy,
        vx: -action.dx / elapsed,
        vy: -action.dy / elapsed,
        travel: state.travel + Math.hypot(action.dx, action.dy),
        lastMoveAt: action.t,
      };
    }
    case 'drag-end': {
      if (!state.dragging) return state;
      const click = state.travel < o.clickThreshold;
      const still = action.t - state.lastMoveAt > RELEASE_STILL_MS;
      return { ...state, dragging: false, click, vx: click || still ? 0 : state.vx, vy: click || still ? 0 : state.vy };
    }
    case 'wheel':
      return { ...state, x: state.x + action.dx, y: state.y + action.dy, vx: 0, vy: 0 };
    case 'key': {
      const [kx, ky] = KEYS[action.dir] ?? [0, 0];
      return { ...state, x: state.x + kx * o.keyStep, y: state.y + ky * o.keyStep, vx: 0, vy: 0 };
    }
    case 'tick':
      return state.dragging ? state : glide(state, action.dt, o.inertia);
    default:
      return state;
  }
}

// Pure: (state, action) → new state. `click` is true only on the step that ends a drag shorter than the threshold.
export function cameraStep(state, action, galaxy, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const next = step({ ...state, click: false }, action, o);
  const { width, height } = worldSize(galaxy, o.cellPx);
  return { ...next, x: wrap(next.x, width), y: wrap(next.y, height) };
}
