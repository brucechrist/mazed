import React, { useEffect, useMemo, useState } from 'react';
import ActivityApp from './ActivityApp.jsx';
import ActivityLog from './ActivityLog.jsx';
import ActivityTimer from './ActivityTimer.jsx';
import MoodQuadrantGame from '../MoodQuadrantGame.jsx';
import NofapCalendar from '../NofapCalendar.jsx';
import Singing from '../Singing.jsx';
import './semi-formless-workbench.css';

const BLOCK_SIZES = ['narrow', 'medium', 'wide'];
const PAGES_STORAGE_KEY = 'semiFormlessPages';
const ACTIVE_PAGE_STORAGE_KEY = 'semiFormlessActivePage';

const generateId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const generateBlockId = () => generateId('block');
const generatePageId = () => generateId('page');

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

const MODULE_LIBRARY = [
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

const MODULE_MAP = MODULE_LIBRARY.reduce((map, module) => {
  map.set(module.id, module);
  return map;
}, new Map());

const getModuleSizes = (moduleId) => {
  const module = MODULE_MAP.get(moduleId);
  if (!module) {
    return BLOCK_SIZES;
  }
  const sizes = Array.isArray(module.sizes) ? module.sizes : BLOCK_SIZES;
  const filtered = sizes.filter((size) => BLOCK_SIZES.includes(size));
  return filtered.length > 0 ? filtered : BLOCK_SIZES;
};

const sanitizeBlock = (block) => {
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

const sanitizePage = (page) => {
  if (page == null || typeof page !== 'object') {
    return null;
  }

  const pageId =
    typeof page.id === 'string' && page.id.trim().length > 0
      ? page.id.trim()
      : generatePageId();

  const title = sanitizeText(page.title ?? '', {
    maxLength: 80,
    fallback: 'Untitled Canvas',
  });

  const description = sanitizeText(page.description ?? '', {
    maxLength: 240,
    fallback: '',
  });

  const blocksSource = Array.isArray(page.blocks) ? page.blocks : [];
  const blocks = blocksSource.map((block) => sanitizeBlock(block)).filter(Boolean);

  return {
    id: pageId,
    title: title || 'Untitled Canvas',
    description,
    blocks,
  };
};

const sanitizePages = (pages) => {
  if (!Array.isArray(pages)) {
    return [];
  }

  return pages.map((page) => sanitizePage(page)).filter(Boolean);
};

const createBlock = (moduleId, options = {}) => {
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

const cloneBlock = (block) => {
  const sanitized = sanitizeBlock(block);
  if (!sanitized) {
    return null;
  }
  return {
    ...sanitized,
    id: generateBlockId(),
  };
};

const buildDefaultPages = () => {
  const introBlock = createBlock('text-note', {
    state: {
      text: 'Drop blocks from the library to build a page that mirrors the current activity. Layer timers, logs, streaks, and notes in whatever order feels right.',
    },
  });

  const activityTemplate = [
    createBlock('text-note', {
      state: { text: 'Focus: Describe the vibe of this practice and what winning today looks like.' },
    }),
    createBlock('activity-app'),
    createBlock('activity-timer', { size: 'narrow' }),
    createBlock('activity-log'),
  ].filter(Boolean);

  const signalTemplate = [
    createBlock('text-note', {
      state: { text: 'Signal Check: What quadrant are you in before you start? What do you want to amplify?' },
    }),
    createBlock('mood-quadrant'),
    createBlock('singing-history'),
  ].filter(Boolean);

  return sanitizePages([
    {
      id: generatePageId(),
      title: 'Semi-Formless Canvas',
      description:
        'A blank playground to remix Mazed building blocks. Create a canvas per activity and stitch timers, logs, and notes together.',
      blocks: introBlock ? [introBlock] : [],
    },
    {
      id: generatePageId(),
      title: 'Activity Spotlight',
      description: 'Timer + control deck + log ready to focus on one craft.',
      blocks: activityTemplate,
    },
    {
      id: generatePageId(),
      title: 'Signal Board',
      description: 'Blend the mood scanner with your singing archive to map resonance.',
      blocks: signalTemplate,
    },
  ]);
};

const BLUEPRINTS = [
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
          state: { text: 'Note the current signal: textures, emotions, colors. How does it influence today\'s practice?' },
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

const BLUEPRINT_MAP = BLUEPRINTS.reduce((map, blueprint) => {
  map.set(blueprint.id, blueprint);
  return map;
}, new Map());

const loadStoredPages = () => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return buildDefaultPages();
  }

  try {
    const raw = window.localStorage.getItem(PAGES_STORAGE_KEY);
    if (!raw) {
      return buildDefaultPages();
    }
    const parsed = JSON.parse(raw);
    const sanitized = sanitizePages(parsed);
    return sanitized.length > 0 ? sanitized : buildDefaultPages();
  } catch (error) {
    console.warn('Failed to read semi-formless pages from storage', error);
    return buildDefaultPages();
  }
};

const loadStoredActivePageId = () => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'string' ? parsed : null;
  } catch (error) {
    console.warn('Failed to read active semi-formless page id', error);
    return null;
  }
};

export default function SemiFormlessWorkbench({ onBack }) {
  const [pages, setPages] = useState(loadStoredPages);
  const [activePageId, setActivePageId] = useState(() => {
    const stored = loadStoredActivePageId();
    return stored ?? (pages[0]?.id ?? null);
  });
  const [showLibrary, setShowLibrary] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return;
    }

    try {
      const sanitized = sanitizePages(pages);
      window.localStorage.setItem(PAGES_STORAGE_KEY, JSON.stringify(sanitized));
    } catch (error) {
      console.warn('Failed to persist semi-formless pages', error);
    }
  }, [pages]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return;
    }
    if (!activePageId) {
      window.localStorage.removeItem(ACTIVE_PAGE_STORAGE_KEY);
      return;
    }
    try {
      window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, JSON.stringify(activePageId));
    } catch (error) {
      console.warn('Failed to persist active semi-formless page id', error);
    }
  }, [activePageId]);

  useEffect(() => {
    if (!pages.some((page) => page.id === activePageId)) {
      setActivePageId(pages[0]?.id ?? null);
    }
  }, [pages, activePageId]);

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? pages[0] ?? null,
    [pages, activePageId],
  );

  const handleCreatePage = () => {
    const newPage = sanitizePage({
      id: generatePageId(),
      title: 'Untitled Canvas',
      description: '',
      blocks: [
        createBlock('text-note', {
          state: { text: 'Sketch the vibe of this canvas or drop a quick checklist.' },
        }),
      ].filter(Boolean),
    });

    setPages((previous) => [...previous, newPage]);
    setActivePageId(newPage.id);
  };

  const handleDeletePage = (pageId) => {
    if (pages.length <= 1) {
      return;
    }

    setPages((previous) => {
      const filtered = previous.filter((page) => page.id !== pageId);
      if (filtered.length === previous.length) {
        return previous;
      }
      if (pageId === activePageId) {
        const index = previous.findIndex((page) => page.id === pageId);
        const fallback = filtered[Math.max(0, index - 1)] ?? filtered[0] ?? null;
        setActivePageId(fallback?.id ?? null);
      }
      return filtered;
    });
  };

  const handleDuplicatePage = (pageId) => {
    const source = pages.find((page) => page.id === pageId);
    if (!source) {
      return;
    }

    const duplicated = {
      ...source,
      id: generatePageId(),
      title: `${source.title} copy`,
      blocks: source.blocks.map((block) => cloneBlock(block)).filter(Boolean),
    };

    setPages((previous) => {
      const index = previous.findIndex((page) => page.id === pageId);
      if (index === -1) {
        return [...previous, duplicated];
      }
      const next = [...previous];
      next.splice(index + 1, 0, duplicated);
      return next;
    });

    setActivePageId(duplicated.id);
  };

  const handleRenamePage = (pageId, value) => {
    setPages((previous) =>
      previous.map((page) =>
        page.id === pageId
          ? { ...page, title: sanitizeText(value, { maxLength: 80, fallback: 'Untitled Canvas' }) || 'Untitled Canvas' }
          : page,
      ),
    );
  };

  const handleUpdateDescription = (pageId, value) => {
    setPages((previous) =>
      previous.map((page) =>
        page.id === pageId
          ? { ...page, description: sanitizeText(value, { maxLength: 240, fallback: '' }) }
          : page,
      ),
    );
  };

  const handleAddBlock = (moduleId) => {
    if (!activePage) {
      return;
    }
    const newBlock = createBlock(moduleId);
    if (!newBlock) {
      return;
    }

    setPages((previous) =>
      previous.map((page) =>
        page.id === activePage.id
          ? { ...page, blocks: [...page.blocks, newBlock] }
          : page,
      ),
    );
    setShowLibrary(false);
  };

  const handleApplyBlueprint = (blueprintId) => {
    if (!activePage) {
      return;
    }
    const blueprint = BLUEPRINT_MAP.get(blueprintId);
    if (!blueprint) {
      return;
    }
    const blocks = blueprint.createBlocks().filter(Boolean);
    if (!blocks.length) {
      return;
    }

    setPages((previous) =>
      previous.map((page) =>
        page.id === activePage.id
          ? { ...page, blocks: [...page.blocks, ...blocks] }
          : page,
      ),
    );
    setShowLibrary(false);
  };

  const handleRemoveBlock = (blockId) => {
    if (!activePage) {
      return;
    }

    setPages((previous) =>
      previous.map((page) =>
        page.id === activePage.id
          ? { ...page, blocks: page.blocks.filter((block) => block.id !== blockId) }
          : page,
      ),
    );
  };

  const handleMoveBlock = (blockId, offset) => {
    if (!activePage) {
      return;
    }

    setPages((previous) =>
      previous.map((page) => {
        if (page.id !== activePage.id) {
          return page;
        }
        const index = page.blocks.findIndex((block) => block.id === blockId);
        if (index === -1) {
          return page;
        }
        const target = index + offset;
        if (target < 0 || target >= page.blocks.length) {
          return page;
        }
        const updated = [...page.blocks];
        const [removed] = updated.splice(index, 1);
        updated.splice(target, 0, removed);
        return { ...page, blocks: updated };
      }),
    );
  };

  const handleDuplicateBlock = (blockId) => {
    if (!activePage) {
      return;
    }

    setPages((previous) =>
      previous.map((page) => {
        if (page.id !== activePage.id) {
          return page;
        }
        const index = page.blocks.findIndex((block) => block.id === blockId);
        if (index === -1) {
          return page;
        }
        const duplicated = cloneBlock(page.blocks[index]);
        if (!duplicated) {
          return page;
        }
        const updated = [...page.blocks];
        updated.splice(index + 1, 0, duplicated);
        return { ...page, blocks: updated };
      }),
    );
  };

  const handleCycleBlockSize = (blockId) => {
    if (!activePage) {
      return;
    }

    setPages((previous) =>
      previous.map((page) => {
        if (page.id !== activePage.id) {
          return page;
        }
        const updated = page.blocks.map((block) => {
          if (block.id !== blockId) {
            return block;
          }
          const sizes = getModuleSizes(block.moduleId);
          const currentIndex = sizes.indexOf(block.size);
          const nextSize = sizes[(currentIndex + 1) % sizes.length];
          return { ...block, size: nextSize };
        });
        return { ...page, blocks: updated };
      }),
    );
  };

  const handleUpdateBlockState = (blockId, updater) => {
    if (!activePage) {
      return;
    }

    setPages((previous) =>
      previous.map((page) => {
        if (page.id !== activePage.id) {
          return page;
        }
        const updatedBlocks = page.blocks.map((block) => {
          if (block.id !== blockId) {
            return block;
          }
          const module = MODULE_MAP.get(block.moduleId);
          const previousState = block.state ?? {};
          const nextState =
            typeof updater === 'function'
              ? updater(previousState)
              : { ...previousState, ...updater };
          let sanitizedState = nextState;
          if (module && typeof module.sanitizeState === 'function') {
            sanitizedState = module.sanitizeState(nextState);
          }
          return {
            ...block,
            state: sanitizedState,
          };
        });
        return { ...page, blocks: updatedBlocks };
      }),
    );
  };

  const renderBlockContent = (block) => {
    const module = MODULE_MAP.get(block.moduleId);
    if (!module) {
      return (
        <div className="canvas-missing-module">
          This block references <code>{block.moduleId}</code>, which is no longer available.
        </div>
      );
    }

    const context = {
      block,
      updateState: (value) => handleUpdateBlockState(block.id, value),
    };

    if (typeof module.render === 'function') {
      return module.render(context);
    }

    return (
      <div className="canvas-missing-module">
        Module <code>{module.id}</code> does not expose a render method.
      </div>
    );
  };

  return (
    <div className="semi-formless-workbench">
      <aside className="workbench-sidebar">
        <div className="workbench-sidebar-header">
          {onBack && (
            <button type="button" className="sidebar-back" onClick={onBack}>
              ← Back
            </button>
          )}
          <h2>Semi-Formless Canvas</h2>
          <p>
            Curate a home for each activity. Drop Mazed building blocks into the canvas and
            arrange them until it feels like your flow.
          </p>
        </div>
        <div className="workbench-page-actions">
          <button type="button" className="sidebar-button" onClick={handleCreatePage}>
            ＋ New canvas
          </button>
        </div>
        <div className="workbench-page-list">
          {pages.map((page) => {
            const isActive = page.id === activePage?.id;
            return (
              <button
                key={page.id}
                type="button"
                className={`page-list-item ${isActive ? 'page-list-item--active' : ''}`}
                onClick={() => setActivePageId(page.id)}
              >
                <span className="page-list-title">{page.title}</span>
                <span className="page-list-meta">
                  {page.blocks.length} block{page.blocks.length === 1 ? '' : 's'}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="workbench-main">
        {activePage ? (
          <div className="canvas-wrapper">
            <header className="canvas-header">
              <div className="canvas-title-group">
                <input
                  type="text"
                  className="canvas-title-input"
                  value={activePage.title}
                  onChange={(event) => handleRenamePage(activePage.id, event.target.value)}
                  placeholder="Untitled Canvas"
                />
                <textarea
                  className="canvas-description-input"
                  value={activePage.description}
                  onChange={(event) => handleUpdateDescription(activePage.id, event.target.value)}
                  placeholder="Describe what this canvas holds or the ritual it supports."
                  rows={2}
                />
              </div>
              <div className="canvas-header-actions">
                <button
                  type="button"
                  className="canvas-action-button"
                  onClick={() => setShowLibrary(true)}
                >
                  ＋ Add block
                </button>
                <button
                  type="button"
                  className="canvas-action-button"
                  onClick={() => handleDuplicatePage(activePage.id)}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className="canvas-action-button canvas-action-button--danger"
                  onClick={() => handleDeletePage(activePage.id)}
                  disabled={pages.length <= 1}
                >
                  Remove
                </button>
              </div>
            </header>

            <div className="canvas-grid">
              {activePage.blocks.length === 0 ? (
                <div className="canvas-empty">
                  <p>No blocks yet. Open the library to drop in timers, logs, or notes.</p>
                  <button
                    type="button"
                    className="canvas-action-button"
                    onClick={() => setShowLibrary(true)}
                  >
                    Open library
                  </button>
                </div>
              ) : (
                activePage.blocks.map((block) => {
                  const module = MODULE_MAP.get(block.moduleId);
                  const hideBack = module?.hideBackButton ? 'canvas-block--hide-back' : '';
                  const sizeClass = `canvas-block--${block.size}`;
                  return (
                    <article key={block.id} className={`canvas-block ${sizeClass} ${hideBack}`}>
                      <header className="canvas-block-header">
                        <div className="canvas-block-meta">
                          <span className="canvas-block-icon" aria-hidden="true">
                            {module?.icon ?? '⬜️'}
                          </span>
                          <span className="canvas-block-title">{module?.label ?? block.moduleId}</span>
                        </div>
                        <div className="canvas-block-actions">
                          <button
                            type="button"
                            className="canvas-block-button"
                            onClick={() => handleMoveBlock(block.id, -1)}
                            title="Move up"
                            aria-label="Move block up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="canvas-block-button"
                            onClick={() => handleMoveBlock(block.id, 1)}
                            title="Move down"
                            aria-label="Move block down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            className="canvas-block-button"
                            onClick={() => handleCycleBlockSize(block.id)}
                            title="Resize block"
                            aria-label="Resize block"
                          >
                            ⤢
                          </button>
                          <button
                            type="button"
                            className="canvas-block-button"
                            onClick={() => handleDuplicateBlock(block.id)}
                            title="Duplicate block"
                            aria-label="Duplicate block"
                          >
                            ⧉
                          </button>
                          <button
                            type="button"
                            className="canvas-block-button canvas-block-button--danger"
                            onClick={() => handleRemoveBlock(block.id)}
                            title="Remove block"
                            aria-label="Remove block"
                          >
                            ✕
                          </button>
                        </div>
                      </header>
                      <div className="canvas-block-body">{renderBlockContent(block)}</div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="canvas-empty">
            <p>Create your first canvas to start assembling blocks.</p>
            <button type="button" className="canvas-action-button" onClick={handleCreatePage}>
              Create canvas
            </button>
          </div>
        )}
      </section>

      {showLibrary && (
        <div className="canvas-library-overlay" role="dialog" aria-modal="true">
          <div className="canvas-library">
            <header className="canvas-library-header">
              <div>
                <h3>Add blocks</h3>
                <p>Pick a single block or drop a full blueprint into the active canvas.</p>
              </div>
              <button
                type="button"
                className="canvas-block-button"
                onClick={() => setShowLibrary(false)}
                aria-label="Close library"
              >
                ✕
              </button>
            </header>

            <section className="canvas-library-section">
              <h4>Blueprints</h4>
              <div className="canvas-library-grid">
                {BLUEPRINTS.map((blueprint) => (
                  <button
                    key={blueprint.id}
                    type="button"
                    className="canvas-library-card"
                    onClick={() => handleApplyBlueprint(blueprint.id)}
                  >
                    <span className="canvas-library-icon" aria-hidden="true">
                      {blueprint.icon}
                    </span>
                    <span className="canvas-library-title">{blueprint.label}</span>
                    <span className="canvas-library-description">{blueprint.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="canvas-library-section">
              <h4>Individual blocks</h4>
              <div className="canvas-library-grid">
                {MODULE_LIBRARY.map((module) => (
                  <button
                    key={module.id}
                    type="button"
                    className="canvas-library-card"
                    onClick={() => handleAddBlock(module.id)}
                  >
                    <span className="canvas-library-icon" aria-hidden="true">
                      {module.icon}
                    </span>
                    <span className="canvas-library-title">{module.label}</span>
                    <span className="canvas-library-description">{module.description}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
