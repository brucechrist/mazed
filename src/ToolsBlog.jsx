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

const MAX_IMAGES = 4;

const MEDIA_BLUEPRINTS = [
  {
    images: [
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
    ],
    link: 'https://www.youtube.com/watch?v=8pJEc-Ky3zE',
  },
  {
    images: [
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    ],
    link: 'https://www.youtube.com/watch?v=SMKPKGW083c',
  },
  {
    images: [
      'https://images.unsplash.com/photo-1470790376778-a9fbc86d70e2?auto=format&fit=crop&w=1200&q=80',
    ],
    link: 'https://mazed.studio',
  },
  {
    images: [
      'https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    ],
    link: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
  },
  {
    images: [
      'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
    ],
    link: 'https://youtu.be/z9Ul9ccDOqE',
  },
  {
    images: [],
    link: 'https://www.are.na/mazed-studio',
  },
];

const STORAGE_KEY = 'tools-blog-posts';

const sanitizeImages = (images) =>
  Array.isArray(images)
    ? images
        .map((source) => (typeof source === 'string' ? source.trim() : ''))
        .filter(Boolean)
        .slice(0, MAX_IMAGES)
    : [];

const sanitizeLink = (value) => (typeof value === 'string' ? value.trim() : '');

const parseYouTubeTimestamp = (value) => {
  if (!value) {
    return null;
  }

  if (/^\d+$/.test(value)) {
    return Number(value);
  }

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds] = match;
  const totalSeconds =
    (hours ? Number(hours) * 3600 : 0) +
    (minutes ? Number(minutes) * 60 : 0) +
    (seconds ? Number(seconds) : 0);

  return totalSeconds > 0 ? totalSeconds : null;
};

const getYouTubeEmbedUrl = (value) => {
  const link = sanitizeLink(value);
  if (!link) {
    return null;
  }

  try {
    const url = new URL(link);
    const host = url.hostname.replace(/^www\./i, '').toLowerCase();
    const segments = url.pathname.split('/').filter(Boolean);

    let videoId = '';
    if (host === 'youtu.be') {
      videoId = segments[0] ?? '';
    } else if (host.endsWith('youtube.com')) {
      if (url.searchParams.has('v')) {
        videoId = url.searchParams.get('v') ?? '';
      } else if (segments[0] === 'embed' && segments[1]) {
        videoId = segments[1];
      } else if (segments[0] === 'shorts' && segments[1]) {
        videoId = segments[1];
      }
    } else {
      return null;
    }

    if (!videoId) {
      return null;
    }

    const params = new URLSearchParams();
    params.set('rel', '0');

    let startParam = url.searchParams.get('t') ?? url.searchParams.get('start');
    if (!startParam && url.hash) {
      const hashValue = url.hash.replace('#', '');
      if (hashValue.toLowerCase().startsWith('t=')) {
        startParam = hashValue.slice(2);
      }
    }
    const startSeconds = parseYouTubeTimestamp(startParam);
    if (startSeconds) {
      params.set('start', String(startSeconds));
    }

    const query = params.toString();
    return `https://www.youtube.com/embed/${videoId}?${query}`;
  } catch (error) {
    return null;
  }
};

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
  const media = MEDIA_BLUEPRINTS[index % MEDIA_BLUEPRINTS.length] ?? {};
  return {
    id: index + 1,
    title: `${THEMES[themeIndex]} ${String(cycle).padStart(2, '0')}`,
    status: STATUSES[index % STATUSES.length],
    excerpt: MESSAGES[index % MESSAGES.length],
    stream: STREAMS[index % STREAMS.length],
    mood: MOODS[index % MOODS.length],
    images: sanitizeImages(media.images ?? []),
    link: sanitizeLink(media.link),
  };
});

const sanitizePostRecord = (post) => {
  if (post == null || typeof post !== 'object') {
    return null;
  }

  const parsedId = Number(post.id);
  if (!Number.isInteger(parsedId)) {
    return null;
  }

  return {
    id: parsedId,
    title: typeof post.title === 'string' ? post.title : '',
    status: typeof post.status === 'string' ? post.status : STATUSES[0],
    excerpt: typeof post.excerpt === 'string' ? post.excerpt : '',
    stream: typeof post.stream === 'string' ? post.stream : STREAMS[0],
    mood: typeof post.mood === 'string' ? post.mood : MOODS[0],
    images: sanitizeImages(post.images),
    link: sanitizeLink(post.link),
  };
};

const loadStoredPosts = () => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    return [];
  }
};

const buildInitialPosts = () => {
  const storedPosts = loadStoredPosts()
    .map((post) => sanitizePostRecord(post))
    .filter(Boolean);

  if (storedPosts.length > 0) {
    return storedPosts;
  }

  return PLACEHOLDER_POSTS.map((post) => sanitizePostRecord(post)).filter(Boolean);
};

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid',
};

export default function ToolsBlog({ onBack }) {
  const [posts, setPosts] = useState(buildInitialPosts);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);

  useEffect(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return;
    }

    try {
      const sanitizedPosts = posts
        .map((post) => sanitizePostRecord(post))
        .filter(Boolean);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedPosts));
    } catch (error) {
      // Ignore persistence errors so the UI remains responsive even if storage is unavailable.
    }
  }, [posts]);

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
      images: sanitizeImages(post.images),
      link: sanitizeLink(post.link),
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

    const sanitizedDraft = {
      ...editDraft,
      images: sanitizeImages(editDraft.images),
      link: sanitizeLink(editDraft.link),
    };

    setPosts((previousPosts) =>
      previousPosts.map((post) =>
        post.id === editingPostId ? { ...post, ...sanitizedDraft } : post
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

  const addImageField = () => {
    setEditDraft((previousDraft) => {
      if (previousDraft == null) {
        return previousDraft;
      }

      const currentImages = previousDraft.images ?? [];
      if (currentImages.length >= MAX_IMAGES) {
        return previousDraft;
      }

      return {
        ...previousDraft,
        images: [...currentImages, ''],
      };
    });
  };

  const updateImageField = (index, value) => {
    setEditDraft((previousDraft) => {
      if (previousDraft == null) {
        return previousDraft;
      }

      const currentImages = [...(previousDraft.images ?? [])];
      currentImages[index] = value;

      return {
        ...previousDraft,
        images: currentImages,
      };
    });
  };

  const removeImageField = (index) => {
    setEditDraft((previousDraft) => {
      if (previousDraft == null) {
        return previousDraft;
      }

      const currentImages = [...(previousDraft.images ?? [])];
      currentImages.splice(index, 1);

      return {
        ...previousDraft,
        images: currentImages,
      };
    });
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
                aria-label="Show posts in a list"
                title="List view"
              >
                <span className="blog-view-icon" aria-hidden="true">
                  ☰
                </span>
              </button>
              <button
                type="button"
                className={`blog-view-button ${viewMode === VIEW_MODES.GRID ? 'blog-view-button--active' : ''}`}
                onClick={() => handleViewModeChange(VIEW_MODES.GRID)}
                aria-pressed={viewMode === VIEW_MODES.GRID}
                aria-label="Show posts in a grid"
                title="Grid view"
              >
                <span className="blog-view-icon" aria-hidden="true">
                  ⧉
                </span>
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
          const draftImages = isEditing ? (editDraft?.images ?? []) : [];
          const imageSources = sanitizeImages(post.images);
          const linkToDisplay = sanitizeLink(post.link);
          const youTubeEmbedUrl = getYouTubeEmbedUrl(linkToDisplay);
          const hasLink = linkToDisplay.length > 0;
          const hasMedia =
            imageSources.length > 0 || Boolean(youTubeEmbedUrl) || hasLink;

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
                    <label className="blog-card-label" htmlFor={`link-${post.id}`}>
                      Attached link
                    </label>
                    <input
                      id={`link-${post.id}`}
                      type="url"
                      className="blog-card-input"
                      placeholder="https://"
                      value={editDraft?.link ?? ''}
                      onChange={updateDraftField('link')}
                    />
                    <p className="blog-card-hint">
                      Drop any URL — YouTube links will automatically embed in the post.
                    </p>
                  </div>

                  <div className="blog-card-field blog-card-field--media">
                    <div className="blog-card-label-row">
                      <span className="blog-card-label">Images</span>
                      <span className="blog-card-label-helper">Up to {MAX_IMAGES}</span>
                    </div>
                    <div className="blog-card-image-list">
                      {draftImages.length === 0 ? (
                        <div className="blog-card-image-empty">No images attached yet.</div>
                      ) : (
                        draftImages.map((imageUrl, imageIndex) => {
                          const hasImage =
                            typeof imageUrl === 'string' && imageUrl.trim().length > 0;
                          return (
                            <div
                              key={`image-${post.id}-${imageIndex}`}
                              className="blog-card-image-row"
                            >
                              <div className="blog-card-image-thumb">
                                {hasImage ? (
                                  <img src={imageUrl} alt="" />
                                ) : (
                                  <span className="blog-card-image-placeholder">Preview</span>
                                )}
                              </div>
                              <input
                                type="url"
                                className="blog-card-input"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={(event) =>
                                  updateImageField(imageIndex, event.target.value)
                                }
                                aria-label={`Image ${imageIndex + 1} URL`}
                              />
                              <button
                                type="button"
                                className="blog-card-icon-button blog-card-icon-button--small"
                                onClick={() => removeImageField(imageIndex)}
                                aria-label={`Remove image ${imageIndex + 1}`}
                              >
                                <span aria-hidden="true">✕</span>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {draftImages.length < MAX_IMAGES && (
                      <button
                        type="button"
                        className="blog-card-button blog-card-button--ghost"
                        onClick={addImageField}
                      >
                        Add image
                      </button>
                    )}
                    <p className="blog-card-hint">
                      Paste direct image URLs. The gallery adapts to one to four shots.
                    </p>
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
                  {hasMedia && (
                    <div className="blog-card-media">
                      {imageSources.length > 0 && (
                        <div className="blog-card-gallery">
                          {imageSources.map((source, mediaIndex) => (
                            <div
                              key={`${post.id}-image-${mediaIndex}`}
                              className="blog-card-gallery-item"
                            >
                              <img src={source} alt="" loading="lazy" />
                            </div>
                          ))}
                        </div>
                      )}
                      {youTubeEmbedUrl ? (
                        <div className="blog-card-video">
                          <iframe
                            src={youTubeEmbedUrl}
                            title={`${post.title} video`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      ) : null}
                      {hasLink && (
                        <a
                          className="blog-card-link"
                          href={linkToDisplay}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span aria-hidden="true">🔗</span>
                          <span className="blog-card-link-text">{linkToDisplay}</span>
                        </a>
                      )}
                    </div>
                  )}
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
