import React from "react";
import "./taste-t.css";

const roadmap = [
  {
    stage: "Now",
    title: "Palette Calibration",
    detail: "Capture the signature mood, color stories, and textures that TasteT will revolve around.",
  },
  {
    stage: "Next",
    title: "Experience Flow",
    detail: "Sketch the journey from inspiration to tasting notes so we can choreograph each interaction.",
  },
  {
    stage: "Later",
    title: "Sensory Library",
    detail: "Collect audio, visual, and aromatic references that will anchor our experiments.",
  },
];

const tastingMoments = [
  {
    label: "Dawn",
    description: "Bright, crisp openings that wake up curiosity.",
  },
  {
    label: "Noon",
    description: "Balanced harmonies where the rhythm settles in.",
  },
  {
    label: "Dusk",
    description: "Velvet transitions carrying warmth into the night.",
  },
];

const experimentIdeas = [
  {
    title: "Atmosphere Sequencer",
    note: "Layer ambient soundscapes with palette cues to reinforce the tasting arc.",
  },
  {
    title: "Texture Sampler",
    note: "Prototype tactile prompts that respond to progress and choices.",
  },
  {
    title: "Memory Anchor",
    note: "Design rituals that let guests capture a single vivid note from each session.",
  },
];

export default function TasteT() {
  return (
    <div className="tastet-shell">
      <div className="tastet-frame">
        <header className="tastet-header">
          <div className="tastet-title-block">
            <span className="tastet-badge">Semi-Formless · Layer 1 Prototype</span>
            <h1>TasteT</h1>
            <p>
              A generous canvas for cultivating sensory-driven worlds. We begin by
              mapping moods, textures, and rituals so the experience can bloom
              deliberately.
            </p>
            <button type="button" className="tastet-primary-action">
              Enter Studio
            </button>
          </div>
          <div className="tastet-flavor-panel">
            <div className="tastet-flavor-wheel">
              <span className="tastet-wheel-label">flavor<br />intention</span>
            </div>
            <ul className="tastet-flavor-legend">
              <li>
                <span className="tastet-legend-dot tastet-legend-dot--base" />
                Base Notes
              </li>
              <li>
                <span className="tastet-legend-dot tastet-legend-dot--accent" />
                Accents
              </li>
              <li>
                <span className="tastet-legend-dot tastet-legend-dot--spark" />
                Spark
              </li>
            </ul>
          </div>
        </header>

        <div className="tastet-layout">
          <section className="tastet-panel tastet-roadmap">
            <h2>Flavor Roadmap</h2>
            <ol className="tastet-roadmap-list">
              {roadmap.map((item) => (
                <li key={item.stage}>
                  <span className="tastet-roadmap-stage">{item.stage}</span>
                  <div className="tastet-roadmap-content">
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="tastet-panel tastet-moments">
            <h2>Moments to Craft</h2>
            <div className="tastet-moments-grid">
              {tastingMoments.map((moment) => (
                <article key={moment.label}>
                  <h3>{moment.label}</h3>
                  <p>{moment.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="tastet-panel tastet-experiments">
            <h2>Experiment Bench</h2>
            <div className="tastet-experiment-list">
              {experimentIdeas.map((idea) => (
                <div key={idea.title} className="tastet-experiment-card">
                  <h3>{idea.title}</h3>
                  <p>{idea.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="tastet-panel tastet-journal">
            <h2>Studio Notes</h2>
            <p>
              Leave space for sketches, tasting logs, and future collaborators.
              We will weave them in as TasteT evolves.
            </p>
            <div className="tastet-note-placeholder">
              <span>Tap to begin composing the first entry…</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
