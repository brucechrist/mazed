import React, { useState, useEffect } from "react";
import { RIcon, XIcon } from "./ResourceIcons.jsx";
import QuestModal from "./QuestModal.jsx";
import MainQuestModal from "./MainQuestModal.jsx";
import { supabaseClient } from "./supabaseClient";
import { useQuests } from "./QuestContext.jsx";
import TasteT from "./TasteT.jsx";
import MoodQuadrantGame from "../MoodQuadrantGame.jsx";
import "./world.css";

function FormlessUnityStage() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Launching Mazed Unity...");

  useEffect(() => {
    let cancelled = false;

    const mountUnity = async () => {
      if (!window.unity?.mount) {
        setStatus("unsupported");
        setMessage("Unity bridge is unavailable in this build.");
        return;
      }
      try {
        setStatus("loading");
        setMessage("Launching Mazed Unity...");
        const result = await window.unity.mount();
        if (cancelled) return;
        if (result && result.ok === false) {
          throw new Error(result.error || "Unity mount failed");
        }
        setStatus("ready");
      } catch (err) {
        console.error("Unity mount failed", err);
        if (cancelled) return;
        setStatus("error");
        setMessage(err?.message || "Failed to embed the Unity experience.");
      }
    };

    mountUnity();

    return () => {
      cancelled = true;
      if (window.unity?.hide) {
        window.unity
          .hide()
          .catch(() => {
            /* ignore */
          });
      }
    };
  }, []);

  return (
    <div className="world-container world-formless-stage">
      <div id="unity-panel" className="unity-panel" />
      {status !== "ready" && (
        <div className={`unity-status unity-status-${status}`}>
          <span>{message}</span>
          {status === "unsupported" && (
            <small>Desktop build is missing the Unity runtime.</small>
          )}
        </div>
      )}
    </div>
  );
}

export default function World({ activeLayer = "Form" }) {
  const [resource, setResource] = useState(() => {
    const stored = localStorage.getItem("resourceR");
    return stored ? parseInt(stored, 10) : 0;
  });
  const [xResource, setXResource] = useState(() => {
    const stored = localStorage.getItem("resourceX");
    return stored ? parseInt(stored, 10) : 0;
  });
  const [userId, setUserId] = useState(null);
  const { quests, addQuest, acceptQuest } = useQuests();
  const [expanded, setExpanded] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [profile, setProfile] = useState({});
  const [needsMainQuest, setNeedsMainQuest] = useState(false);
  const [showMainQuest, setShowMainQuest] = useState(false);
  const [showPublished, setShowPublished] = useState(false);
  const isSemiFormless = activeLayer === "Semi-Formless";
  const isFormless = activeLayer === "Formless";
  const [activeSemiFormlessApp, setActiveSemiFormlessApp] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setResource((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isSemiFormless) return;
    const load = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profileData } = await supabaseClient
        .from("profiles")
        .select("resources, x_resources, mbti, enneagram, instinct")
        .eq("id", user.id)
        .single();
      if (profileData) {
        if (typeof profileData.resources === "number") {
          setResource(profileData.resources);
        }
        if (typeof profileData.x_resources === "number") {
          setXResource(profileData.x_resources);
        }
        setProfile(profileData);
        setNeedsMainQuest(!profileData.mbti || !profileData.enneagram);
      }
      // quests are loaded via QuestProvider
    };
    load();
  }, [isSemiFormless]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && typeof e.detail.resource === "number") {
        setResource(e.detail.resource);
      }
      if (e.detail && typeof e.detail.xResource === "number") {
        setXResource(e.detail.xResource);
      }
    };
    window.addEventListener("resourceChange", handler);
    return () => window.removeEventListener("resourceChange", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("resourceR", resource);
    localStorage.setItem("resourceX", xResource);
    if (userId && navigator.onLine) {
      supabaseClient
        .from("profiles")
        .update({ resources: resource, x_resources: xResource })
        .eq("id", userId);
    }
  }, [resource, xResource, userId]);

  useEffect(() => {
    document.body.classList.add("world-page");
    return () => {
      document.body.classList.remove("world-page");
    };
  }, []);

  useEffect(() => {
    if (!isSemiFormless) {
      setActiveSemiFormlessApp(null);
    }
  }, [isSemiFormless]);

  const handleQuestAdd = (q) => {
    addQuest(q);
    setShowPublished(true);
    setTimeout(() => setShowPublished(false), 1500);
  };

  // quests are managed via QuestProvider

  if (isSemiFormless) {
    return (
      <div className="world-container semi-formless-world">
        {activeSemiFormlessApp ? (
          <div className="semi-formless-stage">
            <button
              type="button"
              className="semi-formless-back"
              onClick={() => setActiveSemiFormlessApp(null)}
            >
              ← Back to Semi-Formless hub
            </button>
            <div className="semi-formless-app-frame">
              {activeSemiFormlessApp === "tasteT" ? (
                <TasteT />
              ) : (
                <MoodQuadrantGame
                  onBack={() => setActiveSemiFormlessApp(null)}
                  showBackButton={false}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="semi-formless-hub">
            <header className="semi-formless-hub-header">
              <h2>Layer 1 · Semi-Formless World</h2>
              <p>
                Choose an app to refine your tastes or scan the current mood
                signals. These core tools anchor the access state log.
              </p>
            </header>
            <div className="semi-formless-app-grid">
              <button
                type="button"
                className="semi-formless-app-card"
                onClick={() => setActiveSemiFormlessApp("tasteT")}
              >
                <span className="app-icon">🎛️</span>
                <h3>TierT</h3>
                <p>
                  Rank library entries with Swiss minis and placements to keep
                  your taste map evolving.
                </p>
              </button>
              <button
                type="button"
                className="semi-formless-app-card"
                onClick={() => setActiveSemiFormlessApp("moodQuadrant")}
              >
                <span className="app-icon">🧭</span>
                <h3>Signal Scanner</h3>
                <p>
                  Pick tagged experiences to capture the present mood profile
                  and quadrant resonance.
                </p>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isFormless) {
    return <FormlessUnityStage />;
  }

  return (
    <div className="world-container">
      <h3 className="quest-header">
        Quest
        <button className="add-quest" onClick={() => setShowModal(true)}>
          +
        </button>
      </h3>
      <div className="quest-list">
        {needsMainQuest && (
          <div
            className="quest-banner main-quest-banner"
            onClick={() => setShowMainQuest(true)}
          >
            Main Quest
          </div>
        )}
        {quests
          .filter((q) => !q.accepted && !q.completed)
          .map((q) => (
            <div key={q.id}>
              <div className="quest-banner">
                <div className="quest-info">
                  <div className="quest-name">{q.name}</div>
                  <div className="quest-quadrant">{q.quadrant}</div>
                  {q.resource !== 0 && (
                    <div className="quest-resource">
                      {q.resource > 0 ? "+" : ""}
                      {q.resource} <RIcon />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {q.description && (
                    <button
                      className="info-button"
                      onClick={() =>
                        setExpanded(expanded === q.id ? null : q.id)
                      }
                    >
                      i
                    </button>
                  )}
                  <button
                    className="accept-button"
                    onClick={() => acceptQuest(q.id)}
                  >
                    ✔
                  </button>
                </div>
              </div>
              {expanded === q.id && q.description && (
                <div className="quest-log">{q.description}</div>
              )}
            </div>
          ))}
      </div>
      {showModal && (
        <QuestModal
          onAdd={handleQuestAdd}
          onClose={() => setShowModal(false)}
        />
      )}
      {showMainQuest && (
        <MainQuestModal
          onClose={() => setShowMainQuest(false)}
          onSaved={(p) => {
            setProfile({ ...profile, ...p });
            setNeedsMainQuest(false);
            addQuest({
              id: Date.now(),
              name: "MBTI & Enneagram",
              description:
                `MBTI: ${p.mbti}\nEnneagram: ${p.enneagram}` +
                (p.instinct ? `\nInstinct: ${p.instinct}` : ""),
              quadrant: "II",
              resource: 0,
              rarity: "A",
              urgent: true,
              accepted: true,
              completed: true,
              type: "main",
            });
          }}
          initialMbti={profile.mbti || ""}
          initialEnneagram={profile.enneagram || ""}
          initialInstinct={profile.instinct || ""}
        />
      )}
      <div className="contracts-section">
        <h3 className="contracts-header">Contracts</h3>
        <div className="contracts-grid">
          <div className="contract-box" id="contract-horizontal-top" />
          <div className="contract-box" id="contract-vertical-left" />
          <div className="contract-box square cut-br" id="contract-small-1" />
          <div className="contract-box square cut-bl" id="contract-small-2" />
          <div className="contract-box square cut-tr" id="contract-small-3" />
          <div className="contract-box square cut-tl" id="contract-small-4" />
          <div className="contract-box circle" id="contract-center" />
          <div className="contract-box" id="contract-vertical-right" />
          <div className="contract-box" id="contract-horizontal-bottom" />
        </div>
      </div>
      <div className="resource-box">
        {resource} <RIcon /> | {xResource} <XIcon />
      </div>
      {showPublished && (
        <div className="published-popup">
          <span className="checkmark">✔</span> Quest published
        </div>
      )}
    </div>
  );
}
