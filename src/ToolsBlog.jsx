import React, { useEffect, useState } from 'react';
import './tools-blog.css';

const THEMES = [
  'Training sync',
  'Night shift log',
  'Idea vault entry',
  'Signal dispatch',
  'Moodboard fragment',
  'Momentum ping',
];

const STATUSES = ['Draft', 'Incubating', 'Signal', 'Idea seed', 'Private', 'Queue'];

const STREAMS = [
  'training-layer',
  'idea-feed',
  'signal',
  'night-mode',
  'public-draft',
  'open-loop',
];

const MOODS = ['queued', 'listening', 'charging', 'wide-awake', 'low-fi', 'signal-boost'];

const MESSAGES = [
  'We are stretching a tall canvas to host entries from the training layer. Every card you see keeps the scroll lively while we wire the live feed.',
  'Future posts will flow in automatically once the bridge from the training layer is ready. Until then, this loop ensures the blog feels endless.',
  'Consider this a Tumblr-style stream in rehearsal. The design will hold personal notes, drops from the dojo, and anything worth making public.',
  'The blog will be able to flip between private and public states. These placeholder posts map out the rhythm for when the toggle arrives.',
  'Each card hints at upcoming features: cross-posting from the training space, curated highlights, and community-ready stories.',
  'Scroll freely — we are stress-testing the layout for long-form sessions, moodboards, and memory dumps from nightly explorations.',
  'We want to keep the space atmospheric yet functional. Expect to pin hero entries, spotlight audio drops, and attach training artifacts soon.',
  'Until automation is complete, treat this as a breathing storyboard for what the blog wants to become.',
];

const PLACEHOLDER_POSTS = Array.from({ length: 48 }, (_, index) => {
  const themeIndex = index % THEMES.length;
  const cycle = Math.floor(index / THEMES.length) + 1;
  return {
    id: index + 1,
    title: `${THEMES[themeIndex]} ${String(cycle).padStart(2, '0')}`,
    status: STATUSES[index % STATUSES.length],
    excerpt: MESSAGES[index % MESSAGES.length],
    stream: STREAMS[index % STREAMS.length],
    mood: MOODS[index % MOODS.length],
  };
});

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid',
};

export default function ToolsBlog({ onBack }) {
  const [posts, setPosts] = useState(() =>
    PLACEHOLDER_POSTS.map((post) => ({ ...post }))
  );
  const [editingPostId, setEditingPostId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);

  const closeActionMenu = () => setOpenMenuPostId(null);

  const startEditing = (post) => {
    closeActionMenu();
    setEditingPostId(post.id);
    setEditDraft({
      title: post.title,
      status: post.status,
      excerpt: post.excerpt,
      stream: post.stream,
      mood: post.mood,
    });
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditDraft(null);
  };

  const saveEdits = (event) => {
    event.preventDefault();
    if (editDraft == null || editingPostId == null) {
      return;
    }

    setPosts((previousPosts) =>
      previousPosts.map((post) =>
        post.id === editingPostId ? { ...post, ...editDraft } : post
      )
    );
    cancelEditing();
  };

  const removePost = (postId) => {
    closeActionMenu();
    setPosts((previousPosts) => previousPosts.filter((post) => post.id !== postId));
    if (editingPostId === postId) {
      cancelEditing();
    }
  };

  const toggleActionMenu = (postId) => {
    setOpenMenuPostId((currentPostId) =>
      currentPostId === postId ? null : postId
    );
  };

  const handleViewModeChange = (mode) => {
    setViewMode((currentMode) =>
      currentMode === mode ? currentMode : mode
    );
  };

  const updateDraftField = (field) => (event) => {
    const value = event.target.value;
    setEditDraft((previousDraft) => ({
      ...(previousDraft ?? {}),
      [field]: value,
    }));
  };

  useEffect(() => {
    if (openMenuPostId == null) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (typeof Element === 'undefined') {
        setOpenMenuPostId(null);
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        setOpenMenuPostId(null);
        return;
      }

      const menuElement = target.closest('[data-action-menu]');
      const menuPostId = menuElement?.getAttribute('data-post-id');

      if (menuPostId !== String(openMenuPostId)) {
        setOpenMenuPostId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpenMenuPostId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuPostId]);

  return (
    <div className="tools-blog">
      <header className="blog-header">
        <div className="blog-header-top">
          <button
            type="button"
            className="blog-back-button back-button"
            onClick={onBack}
          >
            Back
          </button>
          <div className="blog-title">
            <h1>Tumblr-style training blog</h1>
            <p>
              A living space for long-form drops. We are rehearsing the vibe while the
              training layer learns to publish directly into this feed.
            </p>
          </div>
          <div className="blog-controls">
            <button type="button" className="blog-pill blog-pill--active" disabled>
              Draft mode
            </button>
            <button type="button" className="blog-pill" disabled>
              Public toggle soon
            </button>
            <div className="blog-view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                className={`blog-view-button ${viewMode === VIEW_MODES.LIST ? 'blog-view-button--active' : ''}`}
                onClick={() => handleViewModeChange(VIEW_MODES.LIST)}
                aria-pressed={viewMode === VIEW_MODES.LIST}
              >
                <span className="blog-view-icon" aria-hidden="true">
                  ☰
                </span>
                <span className="blog-view-label">List</span>
              </button>
              <button
                type="button"
                className={`blog-view-button ${viewMode === VIEW_MODES.GRID ? 'blog-view-button--active' : ''}`}
                onClick={() => handleViewModeChange(VIEW_MODES.GRID)}
                aria-pressed={viewMode === VIEW_MODES.GRID}
              >
                <span className="blog-view-icon" aria-hidden="true">
                  ⧉
                </span>
                <span className="blog-view-label">Grid</span>
              </button>
            </div>
          </div>
        </div>
        <div className="blog-subcopy">
          Scroll as far as you want — the column is intentionally deep so future
          entries from the dojo have room to breathe.
        </div>
      </header>

      <div className={`blog-feed blog-feed--${viewMode}`}>
        {posts.map((post, index) => {
          const isEditing = editingPostId === post.id;
          const currentStatus = isEditing && editDraft ? editDraft.status : post.status;
          const displayIndex = `#${String(index + 1).padStart(2, '0')}`;
          const articleClassName = [
            'blog-card',
            viewMode === VIEW_MODES.GRID ? 'blog-card--grid' : '',
            isEditing ? 'blog-card--editing' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <article key={post.id} className={articleClassName}>
              <div className="blog-card-header">
                <div className="blog-card-meta">
                  <span className="blog-card-badge">{currentStatus}</span>
                  <span className="blog-card-index">{displayIndex}</span>
                </div>
                {!isEditing && (
                  <div
                    className="blog-card-actions"
                    data-action-menu
                    data-post-id={String(post.id)}
                  >
                    <button
                      type="button"
                      className="blog-card-icon-button"
                      aria-haspopup="menu"
                      aria-expanded={openMenuPostId === post.id}
                      aria-controls={`blog-card-menu-${post.id}`}
                      aria-label={`Open actions for ${post.title}`}
                      onClick={() => toggleActionMenu(post.id)}
                    >
                      <span aria-hidden="true">⋯</span>
                    </button>
                    {openMenuPostId === post.id && (
                      <div
                        id={`blog-card-menu-${post.id}`}
                        className="blog-card-action-dropdown"
                        role="menu"
                      >
                        <button
                          type="button"
                          className="blog-card-menu-button"
                          role="menuitem"
                          onClick={() => startEditing(post)}
                        >
                          Modify
                        </button>
                        <button
                          type="button"
                          className="blog-card-menu-button blog-card-menu-button--danger"
                          role="menuitem"
                          onClick={() => removePost(post.id)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <form className="blog-card-edit-form" onSubmit={saveEdits}>
                  <div className="blog-card-field">
                    <label className="blog-card-label" htmlFor={`title-${post.id}`}>
                      Title
                    </label>
                    <input
                      id={`title-${post.id}`}
                      type="text"
                      className="blog-card-input"
                      value={editDraft?.title ?? ''}
                      onChange={updateDraftField('title')}
                    />
                  </div>

                  <div className="blog-card-field">
                    <label className="blog-card-label" htmlFor={`excerpt-${post.id}`}>
                      Excerpt
                    </label>
                    <textarea
                      id={`excerpt-${post.id}`}
                      className="blog-card-textarea"
                      value={editDraft?.excerpt ?? ''}
                      onChange={updateDraftField('excerpt')}
                    />
                  </div>

                  <div className="blog-card-field">
                    <label className="blog-card-label" htmlFor={`status-${post.id}`}>
                      Status
                    </label>
                    <select
                      id={`status-${post.id}`}
                      className="blog-card-select"
                      value={editDraft?.status ?? ''}
                      onChange={updateDraftField('status')}
                    >
                      {STATUSES.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="blog-card-field">
                    <label className="blog-card-label" htmlFor={`stream-${post.id}`}>
                      Stream
                    </label>
                    <select
                      id={`stream-${post.id}`}
                      className="blog-card-select"
                      value={editDraft?.stream ?? ''}
                      onChange={updateDraftField('stream')}
                    >
                      {STREAMS.map((streamOption) => (
                        <option key={streamOption} value={streamOption}>
                          {streamOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="blog-card-field">
                    <label className="blog-card-label" htmlFor={`mood-${post.id}`}>
                      Mood
                    </label>
                    <select
                      id={`mood-${post.id}`}
                      className="blog-card-select"
                      value={editDraft?.mood ?? ''}
                      onChange={updateDraftField('mood')}
                    >
                      {MOODS.map((moodOption) => (
                        <option key={moodOption} value={moodOption}>
                          {moodOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="blog-card-form-actions">
                    <button
                      type="button"
                      className="blog-card-button"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="blog-card-button blog-card-button--primary"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2 className="blog-card-title">{post.title}</h2>
                  <p className="blog-card-body">{post.excerpt}</p>
                  <div className="blog-card-footer">
                    <span className="blog-card-tag">{post.stream}</span>
                    <span className="blog-card-mood">{post.mood}</span>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
