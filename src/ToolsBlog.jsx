import React from 'react';
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

export default function ToolsBlog({ onBack }) {
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
          </div>
        </div>
        <div className="blog-subcopy">
          Scroll as far as you want — the column is intentionally deep so future
          entries from the dojo have room to breathe.
        </div>
      </header>

      <div className="blog-feed">
        {PLACEHOLDER_POSTS.map((post) => (
          <article key={post.id} className="blog-card">
            <div className="blog-card-header">
              <span className="blog-card-badge">{post.status}</span>
              <span className="blog-card-index">#{String(post.id).padStart(2, '0')}</span>
            </div>
            <h2 className="blog-card-title">{post.title}</h2>
            <p className="blog-card-body">{post.excerpt}</p>
            <div className="blog-card-footer">
              <span className="blog-card-tag">{post.stream}</span>
              <span className="blog-card-mood">{post.mood}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
