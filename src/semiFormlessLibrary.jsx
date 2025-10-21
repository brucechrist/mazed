import ActivityApp from './ActivityApp.jsx';
import ActivityLog from './ActivityLog.jsx';
import ActivityTimer from './ActivityTimer.jsx';
import MoodQuadrantGame from '../MoodQuadrantGame.jsx';
import NofapCalendar from '../NofapCalendar.jsx';
import Singing from '../Singing.jsx';

export const BLOCK_SIZES = ['narrow', 'medium', 'wide'];

const sanitizeText = (value, { maxLength = 2000, fallback = '' } = {}) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.replace(/\s+$/g, '');
  return trimmed.slice(0, maxLength);
};

const noteModule = {
  id: 'text-note',
  label: 'Freeform Note',
  icon: '📝',
  description: 'Drop intentions, lyrics, or prompts directly on the canvas.',
  defaultSize: 'wide',
  sizes: ['narrow', 'medium', 'wide'],
  createState: () => ({ text: '' }),
  sanitizeState: (state) => ({
    text: sanitizeText(state?.text ?? '', { maxLength: 4000 }),
  }),
  render: ({ block, updateState }) => {
    const text = block.state?.text ?? '';
    return (
      <div className="canvas-text-note">
        <textarea
          value={text}
          onChange={(event) =>
            updateState({ text: event.target.value.slice(0, 4000) })
          }
          placeholder="Write the feel of this space, add lyrics, or capture notes while you explore."
          className="canvas-textarea"
          rows={6}
        />
      </div>
    );
  },
};

export const MODULE_LIBRARY = [
  noteModule,
  {
    id: 'activity-app',
    label: 'Activity Control Deck',
    icon: '🎛️',
    description: 'Start sessions, award XP, and send timers to the HUD.',
    defaultSize: 'wide',
    sizes: ['medium', 'wide'],
    hideBackButton: true,
    render: () => <ActivityApp onBack={() => {}} />,
  },
  {
    id: 'activity-timer',
    label: 'Activity Timer',
    icon: '⏱️',
    description: 'Live countdown for the current focused session.',
    defaultSize: 'narrow',
    sizes: ['narrow', 'medium'],
    render: () => <ActivityTimer />,
  },
  {
    id: 'activity-log',
    label: 'Activity Log',
    icon: '📈',
    description: 'Stream of completed sessions synced with the blog index.',
    defaultSize: 'wide',
    sizes: ['medium', 'wide'],
    render: () => <ActivityLog />,
  },
  {
    id: 'mood-quadrant',
    label: 'Signal Scanner',
    icon: '🧭',
    description: 'Quickly capture quadrant moods and archive momentum.',
    defaultSize: 'medium',
    sizes: ['medium', 'wide'],
    hideBackButton: true,
    render: () => <MoodQuadrantGame onBack={() => {}} />,
  },
  {
    id: 'nofap-calendar',
    label: 'Streak Calendar',
    icon: '📅',
    description: 'Layer the streak heatmap right on your canvas.',
    defaultSize: 'wide',
    sizes: ['wide'],
    hideBackButton: true,
    render: () => <NofapCalendar onBack={() => {}} />,
  },
  {
    id: 'singing-history',
    label: 'Singing History',
    icon: '🎤',
    description: 'Surface practice logs and references for your vocal training.',
    defaultSize: 'medium',
    sizes: ['medium', 'wide'],
    hideBackButton: true,
    render: () => <Singing onBack={() => {}} />,
  },
];

export const MODULE_MAP = MODULE_LIBRARY.reduce((map, module) => {
  map.set(module.id, module);
  return map;
}, new Map());

export const getModuleSizes = (moduleId) => {
  const module = MODULE_MAP.get(moduleId);
  if (!module) {
    return BLOCK_SIZES;
  }
  const sizes = Array.isArray(module.sizes) ? module.sizes : BLOCK_SIZES;
  const filtered = sizes.filter((size) => BLOCK_SIZES.includes(size));
  return filtered.length > 0 ? filtered : BLOCK_SIZES;
};

export const sanitizeBlock = (block) => {
  if (block == null || typeof block !== 'object') {
    return null;
  }

  const moduleId = typeof block.moduleId === 'string' ? block.moduleId.trim() : '';
  if (!moduleId) {
    return null;
  }

  const module = MODULE_MAP.get(moduleId);
  const sizeOptions = getModuleSizes(moduleId);
  const defaultSize = module?.defaultSize && sizeOptions.includes(module.defaultSize)
    ? module.defaultSize
    : sizeOptions[0];

  const sanitized = {
    id:
      typeof block.id === 'string' && block.id.trim().length > 0
        ? block.id.trim()
        : generateBlockId(),
    moduleId,
    size: sizeOptions.includes(block.size) ? block.size : defaultSize,
  };

  let state = block.state;
  if (module) {
    if (state == null && typeof module.createState === 'function') {
      state = module.createState();
    } else if (state != null && typeof state === 'object') {
      state = { ...state };
    } else {
      state = undefined;
    }

    if (typeof module.sanitizeState === 'function') {
      state = module.sanitizeState(state);
    }
  } else if (state != null && typeof state === 'object') {
    state = { ...state };
  }

  if (state != null) {
    sanitized.state = state;
  }

  return sanitized;
};

export const sanitizeBlocks = (blocks) => {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks.map((block) => sanitizeBlock(block)).filter(Boolean);
};

const generateId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const generateBlockId = () => generateId('block');

export const createBlock = (moduleId, options = {}) => {
  const module = MODULE_MAP.get(moduleId);
  if (!module) {
    return null;
  }

  const baseState = typeof module.createState === 'function' ? module.createState() : undefined;
  const mergedState = options.state
    ? { ...(baseState ?? {}), ...options.state }
    : baseState;

  const sanitized = sanitizeBlock({
    id: generateBlockId(),
    moduleId,
    size: options.size,
    state: mergedState,
  });

  return sanitized;
};

export const cloneBlock = (block) => {
  const sanitized = sanitizeBlock(block);
  if (!sanitized) {
    return null;
  }
  return {
    ...sanitized,
    id: generateBlockId(),
  };
};

export const BLUEPRINTS = [
  {
    id: 'activity-stack',
    icon: '🎯',
    label: 'Activity Stack',
    description: 'Adds a note, control deck, timer, and log for a single practice.',
    createBlocks: () =>
      [
        createBlock('text-note', {
          state: { text: 'What am I cultivating in this session? Capture the intent before you press start.' },
        }),
        createBlock('activity-app'),
        createBlock('activity-timer', { size: 'narrow' }),
        createBlock('activity-log'),
      ].filter(Boolean),
  },
  {
    id: 'signal-sweep',
    icon: '📡',
    label: 'Signal Sweep',
    description: 'Stacks a mood scan with a reflection note and the singing history.',
    createBlocks: () =>
      [
        createBlock('text-note', {
          state: { text: "Note the current signal: textures, emotions, colors. How does it influence today's practice?" },
        }),
        createBlock('mood-quadrant'),
        createBlock('singing-history'),
      ].filter(Boolean),
  },
  {
    id: 'streak-anchor',
    icon: '🔥',
    label: 'Streak Anchor',
    description: 'Pins the streak calendar next to a journaling block.',
    createBlocks: () =>
      [
        createBlock('text-note', {
          state: { text: 'Log how the streak feels and what support structure keeps it alive.' },
        }),
        createBlock('nofap-calendar'),
      ].filter(Boolean),
  },
];

export const BLUEPRINT_MAP = BLUEPRINTS.reduce((map, blueprint) => {
  map.set(blueprint.id, blueprint);
  return map;
}, new Map());

