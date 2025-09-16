import React from 'react';
import './collective.css';

export default function Collective({ onBack }) {
  return (
    <div className="collective-page">
      <header className="collective-header">
        <button type="button" className="collective-back" onClick={onBack}>
          ← Back to the Fifth Layer
        </button>
        <div className="collective-hero">
          <span className="collective-badge">Layer 3</span>
          <h1>Collective</h1>
          <p>
            The Collective is the living commons of Mazed. It will host shared galleries,
            collaborative projects, and the social heartbeat of the app. Everything that
            connects us will converge here.
          </p>
          <div className="collective-cta">
            <button
              type="button"
              className="collective-action"
              onClick={() => {
                console.info('Collective upload flow coming soon.');
              }}
            >
              Prepare an upload
            </button>
            <p>
              Warm up the pipeline for stories, artwork, recordings, and every other
              artefact we will co-create. The infrastructure will plug in here when it is
              ready.
            </p>
          </div>
        </div>
      </header>
      <div className="collective-body">
        <main className="collective-main">
          <section className="collective-panel">
            <h2>Shared Gallery</h2>
            <p>
              A mosaic reserved for community uploads. Each tile below represents a future
              contribution. Once the upload service goes live the gallery will stream
              directly from our storage buckets.
            </p>
            <div className="collective-gallery-grid">
              {['Artwork', 'Screenshots', 'Sketches', 'Notes'].map((label) => (
                <div key={label} className="collective-tile">
                  <span>{label}</span>
                  <small>Placeholder feed waiting for uploads</small>
                </div>
              ))}
            </div>
          </section>
          <section className="collective-panel">
            <h2>Live Canvas</h2>
            <p>
              Reserve space for collaborative boards, watch parties, or streaming rooms.
              Drop in real-time tools once they are ready and they will sit on this canvas.
            </p>
            <div className="collective-canvas">
              <div className="collective-canvas-grid">
                <div className="collective-canvas-cell highlight">Now</div>
                <div className="collective-canvas-cell">Upcoming session</div>
                <div className="collective-canvas-cell">Shared playlist</div>
                <div className="collective-canvas-cell">Live reactions</div>
              </div>
            </div>
          </section>
          <section className="collective-panel collective-roadmap">
            <h2>Rollout Roadmap</h2>
            <ul>
              <li>🔌 Wire Supabase storage and realtime channels for media uploads.</li>
              <li>🖼️ Render community galleries with moderation tools.</li>
              <li>🎙️ Embed live rooms for audio, video, or co-working sessions.</li>
              <li>📣 Broadcast announcements and layered missions to the whole crew.</li>
            </ul>
          </section>
        </main>
        <aside className="collective-sidebar">
          <section className="collective-panel">
            <h3>Activity Feed</h3>
            <ul className="collective-activity">
              <li>
                <span className="collective-dot" />
                Live updates will surface here once the realtime bridge is connected.
              </li>
              <li>
                <span className="collective-dot" />
                Keep the space ready for status pings, shout-outs, and event invites.
              </li>
              <li>
                <span className="collective-dot" />
                Draft ideas in the Fifth layer and syndicate them here when approved.
              </li>
            </ul>
          </section>
          <section className="collective-panel collective-guidelines">
            <h3>Upload Playbook</h3>
            <p>
              Prepare guidelines, prompts, and automation hooks. This checklist will help
              us plug the future upload wizard straight into the UI.
            </p>
            <ol>
              <li>Define media types and size thresholds.</li>
              <li>Draft moderation flow and flagging signals.</li>
              <li>Design the reveal animations for freshly shared artefacts.</li>
              <li>Outline seasonal or thematic collections.</li>
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
