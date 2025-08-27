import React, { useState, useEffect } from "react";
import { RIcon, XIcon } from "./ResourceIcons.jsx";
import QuestModal from "./QuestModal.jsx";
import MainQuestModal from "./MainQuestModal.jsx";
import { supabaseClient } from "./supabaseClient";
import { useQuests } from "./QuestContext.jsx";
import "./world.css";

export default function World() {
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

  useEffect(() => {
    const id = setInterval(() => {
      setResource((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!navigator.onLine) return;
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profileData } = await supabaseClient
        .from("profiles")
        .select("resources, mbti, enneagram, instinct")
        .eq("id", user.id)
        .single();
      if (profileData) {
        if (typeof profileData.resources === "number") {
          setResource(profileData.resources);
        }
        setProfile(profileData);
        setNeedsMainQuest(!profileData.mbti || !profileData.enneagram);
      }
      // quests are loaded via QuestProvider
    };
    load();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && typeof e.detail.resource === "number") {
        setResource(e.detail.resource);
      }
    };
    window.addEventListener("resourceChange", handler);
    return () => window.removeEventListener("resourceChange", handler);
  }, []);

  useEffect(() => {
    localStorage.setItem("resourceR", resource);
    if (userId && navigator.onLine) {
      supabaseClient
        .from("profiles")
        .update({ resources: resource })
        .eq("id", userId);
    }
  }, [resource, userId]);

  useEffect(() => {
    localStorage.setItem("resourceX", xResource);
  }, [xResource]);

  useEffect(() => {
    document.body.classList.add("world-page");
    return () => {
      document.body.classList.remove("world-page");
    };
  }, []);

  const handleQuestAdd = (q) => {
    addQuest(q);
    setShowPublished(true);
    setTimeout(() => setShowPublished(false), 1500);
  };

  // quests are managed via QuestProvider

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
