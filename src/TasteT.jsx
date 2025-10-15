import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./taste-t.css";
import { loadImageData } from "./assets/LibraryStorage";

const STORAGE_KEY = "tastet-state-v2";
const RATING_LEDGER_KEY = "tastet-rating-ledger-v1";
const LIBRARY_STORAGE_KEY = "mazedImages";
const DEFAULT_VOLATILITY = 0.06;
const MAX_RD = 350;
const MIN_RD = 35;
const HOURS_PER_PERIOD = 36;
const PROMOTION_RD_CAP = 125;
const LOG_LIMIT = 120;
const HISTORY_LIMIT = 6;
const RECENT_MATCHES_LIMIT = 6;
const UNDO_STACK_LIMIT = 8;

const TIER_RULES = [
  {
    key: "Div2",
    label: "Division 2",
    color: "#5c73ff",
    floor: -Infinity,
    demoteBelow: -Infinity,
    promoteAt: 1580,
    tagline: "New challengers finding their footing.",
  },
  {
    key: "Div1",
    label: "Division 1",
    color: "#00b3ff",
    floor: 1500,
    demoteBelow: 1475,
    promoteAt: 1700,
    tagline: "Consistent performers ready for a climb.",
  },
  {
    key: "LFL",
    label: "LFL",
    color: "#8a60ff",
    floor: 1640,
    demoteBelow: 1610,
    promoteAt: 1830,
    tagline: "Regional elite shaping the meta.",
  },
  {
    key: "LEC",
    label: "LEC",
    color: "#ff7a59",
    floor: 1780,
    demoteBelow: 1750,
    promoteAt: 1950,
    tagline: "Major league powerhouses.",
  },
  {
    key: "Worlds",
    label: "Worlds",
    color: "#f9c846",
    floor: 1920,
    demoteBelow: 1890,
    promoteAt: Infinity,
    tagline: "Final stage icons and legends.",
  },
];

const TIER_LOOKUP = TIER_RULES.reduce((acc, tier, index) => {
  acc[tier.key] = { ...tier, index };
  return acc;
}, {});

const MINI_SIZE_OPTIONS = [4, 6, 8, 10, 12, 16];
const TASTET_TABS = [
  { key: "ranking", label: "Ranking suite" },
  { key: "tagging", label: "Tag forge" },
];
const TAGGING_MODES = [
  { key: "dual", label: "Dual" },
  { key: "tri", label: "Tri" },
  { key: "quadrant", label: "Quadrants" },
];
const DEFAULT_TAGGING_MODE = TAGGING_MODES[0].key;
const DUAL_GENDER_TAGS = ["feminine", "masculine"];
const DUAL_FLOW_TAGS = ["up", "neutral", "down"];
const TRI_TAGS = ["P", "M", "F"];
const LEGACY_TRI_TAG_MAP = {
  form: "P",
  "semi-formless": "M",
  formless: "F",
};
const LEGACY_TRI_TAGS = Object.keys(LEGACY_TRI_TAG_MAP);
const TRI_TAG_CANONICAL_LOOKUP = (() => {
  const map = {};
  TRI_TAGS.forEach((tag) => {
    map[tag.toLowerCase()] = tag;
  });
  Object.entries(LEGACY_TRI_TAG_MAP).forEach(([legacy, canonical]) => {
    const normalized = legacy.toLowerCase();
    map[normalized] = canonical;
    const collapsed = normalized.replace(/[\s_-]+/g, '');
    if (!map[collapsed]) {
      map[collapsed] = canonical;
    }
  });
  return map;
})();
const ALL_TRI_TAGS = [...TRI_TAGS, ...LEGACY_TRI_TAGS];

function resolveTriTag(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized.length) return null;
  const collapsed = normalized.replace(/[\s_-]+/g, "");
  const dashed = normalized.replace(/[\s_]+/g, "-");
  return (
    TRI_TAG_CANONICAL_LOOKUP[normalized] ||
    TRI_TAG_CANONICAL_LOOKUP[collapsed] ||
    TRI_TAG_CANONICAL_LOOKUP[dashed] ||
    null
  );
}
const QUADRANT_TAGS = ["II", "IE", "EI", "EE"];

export function shouldFinalizeSwissStatus(status) {
  return status === "awaiting-finish" || status === "completed";
}

export const STALE_SWISS_THRESHOLD_MS = 6 * 60 * 60 * 1000;

function considerTimestamp(latest, value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return latest;
  }
  if (latest == null) {
    return value;
  }
  return Math.max(latest, value);
}

function getSwissLastActivityTimestamp(swiss) {
  if (!swiss || typeof swiss !== "object") {
    return null;
  }

  let latest = null;
  latest = considerTimestamp(latest, swiss.completedAt);
  latest = considerTimestamp(latest, swiss.createdAt);

  if (Array.isArray(swiss.rounds)) {
    swiss.rounds.forEach((round) => {
      latest = considerTimestamp(latest, round?.completedAt);
      if (Array.isArray(round?.pairings)) {
        round.pairings.forEach((pair) => {
          latest = considerTimestamp(latest, pair?.timestamp);
        });
      }
    });
  }

  if (swiss.finalMatch) {
    latest = considerTimestamp(latest, swiss.finalMatch.timestamp);
  }

  if (swiss.finalResult) {
    latest = considerTimestamp(latest, swiss.finalResult.timestamp);
  }

  return latest;
}

export function isSwissSessionStale(swiss, now = Date.now()) {
  if (!swiss) return false;
  const lastActivity = getSwissLastActivityTimestamp(swiss);
  if (lastActivity == null) {
    return false;
  }
  if (now <= lastActivity) {
    return false;
  }
  return now - lastActivity > STALE_SWISS_THRESHOLD_MS;
}

function coerceLibraryId(value) {
  if (value == null) return null;
  return String(value);
}

function sanitizeText(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function normalizeLibraryTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const normalized = [];
  tags.forEach((tag) => {
    const base = sanitizeText(typeof tag === "string" ? tag : "");
    if (!base) return;
    const canonical = resolveTriTag(base) || base;
    const key = canonical.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(canonical);
  });
  return normalized;
}

function sanitizeTabKey(value) {
  return value === "tagging" ? "tagging" : "ranking";
}

function sanitizeTaggingMode(value) {
  return TAGGING_MODES.some((mode) => mode.key === value) ? value : DEFAULT_TAGGING_MODE;
}

function hasAnyTag(list, tags) {
  if (!Array.isArray(list) || !list.length) return false;
  return tags.some((tag) => list.includes(tag));
}

function formatTagLabel(tag) {
  if (typeof tag !== "string" || !tag.length) {
    return "";
  }
  if (/^[A-Z]{2,}$/.test(tag)) {
    return tag;
  }
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

const TRI_TAG_OPTIONS = [
  { key: "form", tags: ["P"], label: "Form" },
  { key: "semi-formless", tags: ["M"], label: "Semi-formless" },
  { key: "formless", tags: ["F"], label: "Formless" },
  { key: "1+2", tags: ["P", "M"], label: "1+2" },
  { key: "1+3", tags: ["P", "F"], label: "1+3" },
  { key: "2+3", tags: ["M", "F"], label: "2+3" },
  { key: "333", tags: ["P", "M", "F"], label: "333" },
];

const TRI_TAG_OPTION_LOOKUP = TRI_TAG_OPTIONS.reduce((acc, option) => {
  acc[option.key] = option;
  return acc;
}, {});

const TRI_TAG_SIGNATURE_LOOKUP = TRI_TAG_OPTIONS.reduce((acc, option) => {
  const signature = option.tags.slice().sort().join("|");
  acc[signature] = option.key;
  return acc;
}, {});

function getTriAssignmentKeyFromTags(tags) {
  if (!Array.isArray(tags) || !tags.length) {
    return null;
  }
  const normalized = normalizeLibraryTags(tags);
  const triTags = normalized
    .map((tag) => resolveTriTag(tag))
    .filter((tag) => tag && TRI_TAGS.includes(tag));

  if (!triTags.length) {
    return null;
  }

  const uniqueSorted = Array.from(new Set(triTags)).sort();
  const signature = uniqueSorted.join("|");
  return TRI_TAG_SIGNATURE_LOOKUP[signature] || uniqueSorted[0] || null;
}

function getTriLabelForKey(key) {
  if (!key) return "";
  const option = TRI_TAG_OPTION_LOOKUP[key];
  if (option && option.label) {
    return option.label;
  }
  return formatTagLabel(key);
}

function getDualStatusFromTags(tags) {
  const gender = DUAL_GENDER_TAGS.find((tag) => tags?.includes(tag)) || null;
  const flow = DUAL_FLOW_TAGS.find((tag) => tags?.includes(tag)) || null;
  return { gender, flow };
}

function imageNeedsDualTags(image) {
  if (!image) return false;
  const tags = Array.isArray(image.tags) ? image.tags : [];
  const { gender, flow } = getDualStatusFromTags(tags);
  return !gender || !flow;
}

function imageNeedsTriTag(image) {
  if (!image) return false;
  const tags = Array.isArray(image.tags) ? image.tags : [];
  return !tags.some((tag) => resolveTriTag(tag));
}

function imageNeedsQuadrantTag(image) {
  if (!image) return false;
  const tags = Array.isArray(image.tags) ? image.tags : [];
  return !hasAnyTag(tags, QUADRANT_TAGS);
}

function buildTaggingCandidates(images, mode) {
  if (!Array.isArray(images) || !images.length) {
    return [];
  }
  switch (mode) {
    case "dual":
      return images.filter(imageNeedsDualTags);
    case "tri":
      return images.filter(imageNeedsTriTag);
    case "quadrant":
      return images.filter(imageNeedsQuadrantTag);
    default:
      return images.filter(imageNeedsDualTags);
  }
}

function sanitizeLedgerEntry(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  return {
    rating: typeof raw.rating === "number" ? raw.rating : null,
    rd: typeof raw.rd === "number" ? raw.rd : null,
    volatility: typeof raw.volatility === "number" ? raw.volatility : null,
    tierKey: sanitizeText(raw.tierKey || "", null),
    tierIndex: typeof raw.tierIndex === "number" ? raw.tierIndex : null,
    stats:
      raw.stats && typeof raw.stats === "object" && !Array.isArray(raw.stats)
        ? { ...raw.stats }
        : null,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : null,
    lastPlayedAt: typeof raw.lastPlayedAt === "number" ? raw.lastPlayedAt : null,
    tierLog: Array.isArray(raw.tierLog) ? raw.tierLog.slice(-10) : null,
    recentMatches: Array.isArray(raw.recentMatches)
      ? raw.recentMatches.slice(0, RECENT_MATCHES_LIMIT)
      : null,
  };
}

function mergeLedgerIntoImage(image, ledgerEntry) {
  if (!ledgerEntry) return image;

  const next = { ...image };
  if (typeof ledgerEntry.rating === "number") {
    next.rating = ledgerEntry.rating;
  }
  if (typeof ledgerEntry.rd === "number") {
    next.rd = ledgerEntry.rd;
  }
  if (typeof ledgerEntry.volatility === "number") {
    next.volatility = ledgerEntry.volatility;
  }
  if (ledgerEntry.tierKey) {
    next.tierKey = ledgerEntry.tierKey;
    next.tierIndex = typeof ledgerEntry.tierIndex === "number" ? ledgerEntry.tierIndex : getTierIndex(ledgerEntry.tierKey);
  }
  if (ledgerEntry.stats) {
    next.stats = { ...next.stats, ...ledgerEntry.stats };
  }
  if (typeof ledgerEntry.updatedAt === "number") {
    next.updatedAt = ledgerEntry.updatedAt;
  }
  if (typeof ledgerEntry.lastPlayedAt === "number") {
    next.lastPlayedAt = ledgerEntry.lastPlayedAt;
  }
  if (ledgerEntry.tierLog) {
    next.tierLog = ledgerEntry.tierLog;
  }
  if (ledgerEntry.recentMatches) {
    next.recentMatches = ledgerEntry.recentMatches;
  }
  return next;
}

function loadRatingLedger() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(RATING_LEDGER_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }
    return Object.entries(parsed).reduce((acc, [key, value]) => {
      const entry = sanitizeLedgerEntry(value);
      if (entry) {
        acc[String(key)] = entry;
      }
      return acc;
    }, {});
  } catch (error) {
    console.warn("TierT: unable to read rating ledger", error);
    return {};
  }
}

function createLedgerPayload(images) {
  return images.reduce((acc, image) => {
    if (!image || !image.id) return acc;
    acc[image.id] = {
      rating: image.rating,
      rd: image.rd,
      volatility: image.volatility,
      tierKey: image.tierKey,
      tierIndex: image.tierIndex,
      stats: image.stats,
      updatedAt: image.updatedAt,
      lastPlayedAt: image.lastPlayedAt,
      tierLog: Array.isArray(image.tierLog) ? image.tierLog.slice(-10) : [],
      recentMatches: Array.isArray(image.recentMatches)
        ? image.recentMatches.slice(0, RECENT_MATCHES_LIMIT)
        : [],
    };
    return acc;
  }, {});
}

function arraysEqual(a = [], b = []) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}

function deepClone(value) {
  if (value == null || typeof value !== "object") {
    return value;
  }

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch (error) {
      // fall back to JSON strategy
    }
  }

  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.warn("TierT: unable to clone value", error);
    return value;
  }
}

function valuesEqual(a, b) {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch (error) {
      return false;
    }
  }
  return false;
}

function loadLibraryCatalog() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry, index) => {
        const id = coerceLibraryId(entry?.id ?? index);
        if (!id) return null;
        const tags = normalizeLibraryTags(entry?.tags);
        const dataUrl = typeof entry?.dataUrl === "string" && entry.dataUrl.length ? entry.dataUrl : null;
        const mimeType = sanitizeText(entry?.mimeType || "", null);
        const createdAt =
          typeof entry?.createdAt === "number"
            ? entry.createdAt
            : typeof entry?.addedAt === "number"
            ? entry.addedAt
            : typeof entry?.timestamp === "number"
            ? entry.timestamp
            : null;
        const rating = typeof entry?.rating === "number" ? entry.rating : null;
        const rd = typeof entry?.rd === "number" ? entry.rd : null;
        const volatility = typeof entry?.volatility === "number" ? entry.volatility : null;
        let tierKey = sanitizeText(entry?.tierKey || entry?.tier || "", null);
        if (!tierKey && typeof rating === "number") {
          tierKey = getTierByRating(rating);
        }
        const tierIndex =
          typeof entry?.tierIndex === "number"
            ? entry.tierIndex
            : tierKey
            ? getTierIndex(tierKey)
            : 0;
        const stats =
          entry?.stats && typeof entry.stats === "object" && !Array.isArray(entry.stats)
            ? { ...entry.stats }
            : {};
        const lastPlayedAt = typeof entry?.lastPlayedAt === "number" ? entry.lastPlayedAt : null;
        const updatedAt = typeof entry?.updatedAt === "number" ? entry.updatedAt : createdAt;
        const tierLog = Array.isArray(entry?.tierLog) ? entry.tierLog.slice(-10) : [];
        const recentMatches = Array.isArray(entry?.recentMatches)
          ? entry.recentMatches.slice(0, RECENT_MATCHES_LIMIT)
          : [];

        return {
          id,
          title: sanitizeText(entry?.title || "", "Untitled"),
          tags,
          dataUrl,
          mimeType,
          width: typeof entry?.width === "number" ? entry.width : null,
          height: typeof entry?.height === "number" ? entry.height : null,
          color: sanitizeText(entry?.color || "", null),
          createdAt,
          rating,
          rd,
          volatility,
          tierKey,
          tierIndex,
          stats,
          lastPlayedAt,
          updatedAt,
          tierLog,
          recentMatches,
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('TierT: unable to read library catalog', error);
    return [];
  }
}

function synchronizeImagesWithLibrary(savedImages, libraryEntries) {
  const savedMap = new Map(savedImages.map((image) => [String(image.id), image]));
  const merged = [];
  const newIds = [];
  let changed = false;
  const now = Date.now();

  libraryEntries.forEach((entry, index) => {
    const id = String(entry.id);
    const existing = savedMap.get(id);
    const tags = normalizeLibraryTags(entry.tags);
    const baseName = sanitizeText(entry.title, existing?.name || `Image ${index + 1}`);
    const dataUrl = entry.dataUrl || existing?.dataUrl || null;
    const imageUrl = dataUrl || existing?.imageUrl || null;
    const mimeType = entry.mimeType || existing?.mimeType || null;
    const createdAt = existing?.createdAt || entry.createdAt || now - index * 1000;

    if (existing) {
      let next = existing;
      if (
        existing.name !== baseName ||
        !arraysEqual(existing.tags, tags) ||
        (dataUrl && existing.dataUrl !== dataUrl) ||
        (imageUrl && existing.imageUrl !== imageUrl) ||
        (mimeType && existing.mimeType !== mimeType) ||
        (entry.color && existing.libraryColor !== entry.color) ||
        (entry.width && existing.libraryWidth !== entry.width) ||
        (entry.height && existing.libraryHeight !== entry.height) ||
        (!existing.createdAt && createdAt)
      ) {
        next = {
          ...existing,
          name: baseName,
          tags,
          dataUrl,
          imageUrl,
          mimeType,
          libraryColor: entry.color || existing.libraryColor || null,
          libraryWidth: entry.width || existing.libraryWidth || null,
          libraryHeight: entry.height || existing.libraryHeight || null,
          createdAt,
        };
        changed = true;
      }
      merged.push(next);
      savedMap.delete(id);
    } else {
      const record = createImageRecord({
        id,
        name: baseName,
        imageUrl,
        dataUrl,
        tags,
        rating: 1500,
        rd: 300,
        volatility: DEFAULT_VOLATILITY,
        createdAt,
      });
      record.mimeType = mimeType;
      record.libraryColor = entry.color || null;
      record.libraryWidth = entry.width || null;
      record.libraryHeight = entry.height || null;
      merged.push(record);
      newIds.push(id);
      changed = true;
    }
  });

  if (savedMap.size > 0) {
    changed = true;
  }

  return { images: changed ? merged : savedImages, newIds, changed };
}

function mergeLibraryMetadataWithRatings(entries = [], images = []) {
  if (!Array.isArray(entries) || !entries.length || !Array.isArray(images) || !images.length) {
    return { entries, changed: false };
  }

  const imageMap = new Map(images.map((image) => [coerceLibraryId(image.id), image]));
  let changed = false;

  const nextEntries = entries.map((entry) => {
    if (!entry) return entry;
    const id = coerceLibraryId(entry.id);
    if (!id || !imageMap.has(id)) {
      return entry;
    }

    const image = imageMap.get(id);
    const updates = {
      rating: image.rating,
      rd: image.rd,
      volatility: image.volatility,
      tierKey: image.tierKey,
      tierIndex: image.tierIndex,
      stats: image.stats,
      lastPlayedAt: image.lastPlayedAt,
      updatedAt: image.updatedAt,
      tierLog: image.tierLog,
      recentMatches: image.recentMatches,
    };

    let entryChanged = false;
    const nextEntry = { ...entry };

    Object.entries(updates).forEach(([key, value]) => {
      if (!valuesEqual(entry[key], value)) {
        nextEntry[key] = value;
        entryChanged = true;
      }
    });

    if (entryChanged) {
      changed = true;
      return nextEntry;
    }

    return entry;
  });

  return changed ? { entries: nextEntries, changed: true } : { entries, changed: false };
}

function serializeImageForStorage(image) {
  if (!image || !image.id) return null;

  const rating = typeof image.rating === "number" ? image.rating : 1500;
  const rd = typeof image.rd === "number" ? image.rd : 260;
  const tierKey = image.tierKey || getTierByRating(rating);
  const tierIndex =
    typeof image.tierIndex === "number" ? image.tierIndex : getTierIndex(tierKey);

  return {
    id: image.id,
    name: sanitizeText(image.name || image.title || "Untitled", "Untitled"),
    imageUrl: typeof image.imageUrl === "string" ? image.imageUrl : null,
    mimeType: image.mimeType || null,
    tags: Array.isArray(image.tags) ? image.tags.slice(0, 24) : [],
    rating,
    rd,
    volatility: typeof image.volatility === "number" ? image.volatility : DEFAULT_VOLATILITY,
    tierKey,
    tierIndex,
    stats: image.stats ? { ...image.stats } : {},
    createdAt: image.createdAt || Date.now(),
    updatedAt: image.updatedAt || image.createdAt || Date.now(),
    lastPlayedAt: image.lastPlayedAt || null,
    tierLog: Array.isArray(image.tierLog) ? image.tierLog.slice(-10) : [],
    recentMatches: Array.isArray(image.recentMatches)
      ? image.recentMatches.slice(0, RECENT_MATCHES_LIMIT)
      : [],
    libraryColor: image.libraryColor || null,
    libraryWidth: image.libraryWidth || null,
    libraryHeight: image.libraryHeight || null,
  };
}

function serializeDuelLogEntry(entry) {
  if (!entry || !entry.id) return null;

  return {
    id: entry.id,
    timestamp: entry.timestamp || Date.now(),
    leftId: entry.leftId,
    rightId: entry.rightId,
    leftName: entry.leftName,
    rightName: entry.rightName,
    leftScore: typeof entry.leftScore === "number" ? entry.leftScore : null,
    rightScore: typeof entry.rightScore === "number" ? entry.rightScore : null,
    outcome: entry.outcome || null,
    winnerId: entry.winnerId || null,
    leftDelta: typeof entry.leftDelta === "number" ? entry.leftDelta : 0,
    rightDelta: typeof entry.rightDelta === "number" ? entry.rightDelta : 0,
    leftRatingAfter:
      typeof entry.leftRatingAfter === "number" ? entry.leftRatingAfter : undefined,
    rightRatingAfter:
      typeof entry.rightRatingAfter === "number" ? entry.rightRatingAfter : undefined,
    context: entry.context ? { ...entry.context } : null,
    tierChanges: entry.tierChanges
      ? { left: entry.tierChanges.left || null, right: entry.tierChanges.right || null }
      : { left: null, right: null },
  };
}

function prepareStateForStorage(state) {
  const images = Array.isArray(state.images)
    ? state.images.map(serializeImageForStorage).filter(Boolean)
    : [];
  const duelLog = Array.isArray(state.duelLog)
    ? state.duelLog.map(serializeDuelLogEntry).filter(Boolean)
    : [];

  let swissHistory = Array.isArray(state.swissHistory)
    ? state.swissHistory.slice(0, HISTORY_LIMIT)
    : [];
  let activeSwiss = state.activeSwiss || null;

  if (activeSwiss && shouldFinalizeSwissStatus(activeSwiss.status)) {
    const imagesById = images.reduce((acc, image) => {
      acc[image.id] = image;
      return acc;
    }, {});
    const { swiss: finalizedSwiss, summary } = finalizeSwissMiniState(activeSwiss, imagesById);
    if (summary) {
      swissHistory = [summary, ...swissHistory.filter((entry) => entry.id !== summary.id)].slice(0, HISTORY_LIMIT);
    }
    activeSwiss = finalizedSwiss && finalizedSwiss.status === "completed" ? null : finalizedSwiss;
  }

  if (activeSwiss && isSwissSessionStale(activeSwiss)) {
    activeSwiss = null;
  }

  return {
    images,
    duelLog,
    swissHistory,
    activeSwiss,
    placementQueue: state.placementQueue || null,
    selectedTag: state.selectedTag || "",
    miniSize: state.miniSize || MINI_SIZE_OPTIONS[0],
  };
}

function buildPlacementQueueForImage(imageId, images, count = 5) {
  if (!imageId) return null;
  const opponents = createPlacementOpponents(imageId, images, count).map((entry) => entry.id);
  if (!opponents.length) {
    return null;
  }
  return {
    imageId,
    opponents,
    currentIndex: 0,
    history: [],
    createdAt: Date.now(),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatDelta(value) {
  const rounded = roundTo(value, 1);
  if (!rounded) {
    return "±0";
  }
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function formatRecord(wins = 0, losses = 0, draws = 0) {
  return draws ? `${wins}-${losses}-${draws}` : `${wins}-${losses}`;
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return "never";
  const diff = Date.now() - timestamp;
  if (diff < 0) return "just now";
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 90) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 24) return `${months}mo ago`;
  const years = Math.round(days / 365);
  return `${years}y ago`;
}

function scoreToPoints(score) {
  if (score === 1) return 2;
  if (score === 0.5) return 1;
  return 0;
}

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

function colorFromString(input) {
  const str = input || "tier";
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

function hexToRgb(color) {
  if (!color) {
    return { r: 120, g: 160, b: 255 };
  }
  let hex = color.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }
  const num = parseInt(hex, 16);
  if (Number.isNaN(num)) {
    return { r: 120, g: 160, b: 255 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function applyAlpha(color, alpha) {
  const { r, g, b } = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createTierGradient(color) {
  return `linear-gradient(135deg, ${applyAlpha(color, 0.85)}, ${applyAlpha(color, 0.45)})`;
}

function getTierIndex(tierKey) {
  return TIER_LOOKUP[tierKey]?.index ?? 0;
}

function getTierByRating(rating) {
  let tierKey = TIER_RULES[0].key;
  for (const tier of TIER_RULES) {
    const floor = tier.floor === -Infinity ? -Infinity : tier.floor;
    if (rating >= floor) {
      tierKey = tier.key;
    }
  }
  return tierKey;
}

function resolveTierChange(currentTierKey, rating, rd) {
  const currentIndex = currentTierKey ? getTierIndex(currentTierKey) : 0;
  let index = currentIndex;

  while (index < TIER_RULES.length - 1) {
    const tier = TIER_RULES[index];
    if (rating >= tier.promoteAt && rd <= PROMOTION_RD_CAP) {
      index += 1;
    } else {
      break;
    }
  }

  while (index > 0) {
    const tier = TIER_RULES[index];
    if (rating < tier.demoteBelow) {
      index -= 1;
    } else {
      break;
    }
  }

  const tier = TIER_RULES[index];
  return {
    key: tier.key,
    index,
    tier,
    changed: tier.key !== currentTierKey,
    direction: tier.key === currentTierKey ? null : index > currentIndex ? "promotion" : "demotion",
  };
}

function computeStreak(recentMatches) {
  if (!recentMatches || !recentMatches.length) return "—";
  const first = recentMatches[0].result;
  if (first === "D") {
    const drawStreak = recentMatches.findIndex((match) => match.result !== "D");
    const count = drawStreak === -1 ? recentMatches.length : drawStreak;
    return `D${count}`;
  }
  let count = 0;
  for (const match of recentMatches) {
    if (match.result !== first) break;
    count += 1;
  }
  return `${first}${count}`;
}

function updateImageStats(image, score, context, newRating, timestamp, tierChange) {
  const stats = {
    wins: image.stats?.wins ?? 0,
    losses: image.stats?.losses ?? 0,
    draws: image.stats?.draws ?? 0,
    totalDuels: image.stats?.totalDuels ?? 0,
    minisEntered: image.stats?.minisEntered ?? 0,
    placementDuels: image.stats?.placementDuels ?? 0,
    promotions: image.stats?.promotions ?? 0,
    demotions: image.stats?.demotions ?? 0,
    bestFinish: image.stats?.bestFinish ?? null,
    highestRating: image.stats?.highestRating ?? image.rating,
    lowestRating: image.stats?.lowestRating ?? image.rating,
    currentStreak: image.stats?.currentStreak ?? "—",
    lastMode: image.stats?.lastMode ?? "duel",
    lastSwissId: image.stats?.lastSwissId ?? null,
    lastOutcome: image.stats?.lastOutcome ?? null,
    lastRating: image.stats?.lastRating ?? image.rating,
    lastRD: image.stats?.lastRD ?? image.rd,
    lastOpponentId: image.stats?.lastOpponentId ?? null,
    lastUpdatedAt: image.stats?.lastUpdatedAt ?? image.updatedAt ?? image.createdAt ?? timestamp,
  };

  if (score === 1) stats.wins += 1;
  else if (score === 0) stats.losses += 1;
  else stats.draws += 1;

  stats.totalDuels += 1;

  if (context.mode === "placement") {
    stats.placementDuels += 1;
  }

  if (tierChange?.direction === "promotion") {
    stats.promotions += 1;
  } else if (tierChange?.direction === "demotion") {
    stats.demotions += 1;
  }

  stats.highestRating = Math.max(stats.highestRating, newRating);
  stats.lowestRating = Math.min(stats.lowestRating, newRating);
  stats.lastMode = context.mode || "duel";
  if (context.swissId) {
    stats.lastSwissId = context.swissId;
  }
  stats.lastUpdatedAt = timestamp;

  const outcomeLabel = score === 1 ? "win" : score === 0 ? "loss" : "draw";
  stats.lastOutcome = outcomeLabel;
  stats.lastRating = newRating;
  if (typeof context.newRd === "number") {
    stats.lastRD = context.newRd;
  }
  if (context.opponentId) {
    stats.lastOpponentId = context.opponentId;
  }

  const streakCode = outcomeLabel === "win" ? "W" : outcomeLabel === "loss" ? "L" : "D";
  const prevStreak = image.stats?.currentStreak || "";
  const prevCode = prevStreak.charAt(0);
  const prevCount = Number.parseInt(prevStreak.slice(1), 10);
  if (prevCode === streakCode && Number.isFinite(prevCount)) {
    stats.currentStreak = `${streakCode}${prevCount + 1}`;
  } else {
    stats.currentStreak = `${streakCode}1`;
  }

  return stats;
}

function computePeriodsElapsed(lastPlayedAt, now = Date.now()) {
  if (!lastPlayedAt) return 1;
  const diff = now - lastPlayedAt;
  if (diff <= 0) return 1;
  const hours = diff / (1000 * 60 * 60);
  if (hours <= HOURS_PER_PERIOD) {
    return 1;
  }
  return Math.min(8, Math.round(hours / HOURS_PER_PERIOD));
}

function updateGlickoPlayer(player, matches, periods = 1) {
  const rating = typeof player.rating === "number" ? player.rating : 1500;
  const rd = typeof player.rd === "number" ? player.rd : 350;
  const sigma = typeof player.volatility === "number" ? player.volatility : DEFAULT_VOLATILITY;

  const scale = 173.7178;
  const mu = (rating - 1500) / scale;
  const phi = rd / scale;
  const phiStar = Math.sqrt(phi * phi + sigma * sigma * periods);

  if (!matches || !matches.length) {
    return {
      rating,
      rd: roundTo(clamp(phiStar * scale, MIN_RD, MAX_RD), 2),
      volatility: sigma,
    };
  }

  let vDenom = 0;
  let deltaSum = 0;

  matches.forEach((match) => {
    const oppMu = ((match.rating ?? 1500) - 1500) / scale;
    const oppPhi = (match.rd ?? 350) / scale;
    const gPhi = 1 / Math.sqrt(1 + (3 * oppPhi * oppPhi) / (Math.PI * Math.PI));
    const expected = 1 / (1 + Math.exp(-gPhi * (mu - oppMu)));
    const score = typeof match.score === "number" ? match.score : 0.5;
    vDenom += gPhi * gPhi * expected * (1 - expected);
    deltaSum += gPhi * (score - expected);
  });

  const v = 1 / vDenom;
  const delta = v * deltaSum;
  const tau = 0.5;
  const a = Math.log(sigma * sigma);

  const f = (x) => {
    const expX = Math.exp(x);
    const num = expX * (delta * delta - phiStar * phiStar - v - expX);
    const den = 2 * (phiStar * phiStar + v + expX) ** 2;
    return num / den - (x - a) / (tau * tau);
  };

  let A = a;
  let B;
  if (delta * delta > phiStar * phiStar + v) {
    B = Math.log(delta * delta - phiStar * phiStar - v);
  } else {
    let k = 1;
    do {
      B = a - k * tau;
      k += 1;
    } while (f(B) < 0);
  }

  let fA = f(A);
  let fB = f(B);
  while (Math.abs(B - A) > 1e-6) {
    const C = A + (A - B) * (fA / (fB - fA));
    const fC = f(C);
    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA /= 2;
    }
    B = C;
    fB = fC;
  }

  const newSigma = Math.exp(A / 2);
  const phiPrime = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muPrime = mu + phiPrime * phiPrime * deltaSum;

  return {
    rating: roundTo(muPrime * scale + 1500, 2),
    rd: roundTo(clamp(phiPrime * scale, MIN_RD, MAX_RD), 2),
    volatility: clamp(newSigma, 0.02, 1.2),
  };
}

function createImageRecord({
  id,
  name,
  imageUrl,
  dataUrl = null,
  mimeType = null,
  tags = [],
  rating = 1500,
  rd = 260,
  volatility = DEFAULT_VOLATILITY,
  tierKey,
  stats = {},
  createdAt = Date.now(),
  lastPlayedAt = null,
  recentMatches = [],
  tierLog,
}) {
  const normalizedTags = Array.isArray(tags) ? tags : [];
  const normalizedStats = {
    wins: 0,
    losses: 0,
    draws: 0,
    totalDuels: 0,
    minisEntered: 0,
    placementDuels: 0,
    promotions: 0,
    demotions: 0,
    bestFinish: null,
    highestRating: rating,
    lowestRating: rating,
    currentStreak: "—",
    lastMode: "duel",
    lastSwissId: null,
    lastOutcome: null,
    lastRating: rating,
    lastRD: rd,
    lastOpponentId: null,
    lastUpdatedAt: createdAt,
    ...stats,
  };

  if (!normalizedStats.totalDuels) {
    normalizedStats.totalDuels =
      (normalizedStats.wins || 0) + (normalizedStats.losses || 0) + (normalizedStats.draws || 0);
  }
  if (normalizedStats.highestRating == null) normalizedStats.highestRating = rating;
  if (normalizedStats.lowestRating == null) normalizedStats.lowestRating = rating;

  const resolvedTierKey = tierKey || getTierByRating(rating);
  const baseTierLog =
    Array.isArray(tierLog) && tierLog.length
      ? tierLog
      : [
          {
            timestamp: createdAt,
            tier: resolvedTierKey,
            direction: "init",
            rating,
          },
        ];

  return {
    id,
    name,
    imageUrl: imageUrl || null,
    dataUrl,
    mimeType,
    tags: normalizedTags,
    rating,
    rd,
    volatility,
    tierKey: resolvedTierKey,
    tierIndex: getTierIndex(resolvedTierKey),
    stats: normalizedStats,
    createdAt,
    updatedAt: createdAt,
    lastPlayedAt,
    tierLog: baseTierLog,
    recentMatches: Array.isArray(recentMatches)
      ? recentMatches.slice(0, RECENT_MATCHES_LIMIT)
      : [],
  };
}


function normalizeImage(raw) {
  if (!raw || !raw.id) return null;
  return {
    ...createImageRecord({
      id: raw.id,
      name: raw.name || raw.title || "Untitled",
      imageUrl: raw.imageUrl || raw.dataUrl || null,
      dataUrl: typeof raw.dataUrl === "string" ? raw.dataUrl : null,
      mimeType: raw.mimeType || null,
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      rating: typeof raw.rating === "number" ? raw.rating : 1500,
      rd: typeof raw.rd === "number" ? raw.rd : 260,
      volatility: typeof raw.volatility === "number" ? raw.volatility : DEFAULT_VOLATILITY,
      tierKey: raw.tierKey || raw.tier || getTierByRating(raw.rating || 1500),
      stats: raw.stats || {},
      createdAt: raw.createdAt || Date.now(),
      lastPlayedAt: raw.lastPlayedAt || null,
      recentMatches: raw.recentMatches || [],
      tierLog: raw.tierLog || [],
    }),
    updatedAt: raw.updatedAt || raw.createdAt || Date.now(),
  };
}

function normalizeSwiss(raw) {
  if (!raw || !Array.isArray(raw.participants) || !Array.isArray(raw.rounds)) {
    return null;
  }
  const participants = raw.participants.map((participant) => ({
    id: participant.id,
    name: participant.name,
    seed: participant.seed || 0,
    seedRating: typeof participant.seedRating === "number" ? participant.seedRating : 1500,
    currentRating:
      typeof participant.currentRating === "number"
        ? participant.currentRating
        : participant.seedRating || 1500,
    rd: typeof participant.rd === "number" ? participant.rd : 260,
    tierKey: participant.tierKey || getTierByRating(participant.currentRating || 1500),
    wins: participant.wins || 0,
    losses: participant.losses || 0,
    draws: participant.draws || 0,
    points: participant.points || 0,
    opponents: Array.isArray(participant.opponents) ? participant.opponents : [],
    history: Array.isArray(participant.history) ? participant.history : [],
    hasBye: Boolean(participant.hasBye),
    buchholz: participant.buchholz || 0,
  }));

  const rounds = raw.rounds.map((round) => ({
    index: round.index,
    pairings: Array.isArray(round.pairings)
      ? round.pairings.map((pair) => ({
          id: pair.id,
          leftId: pair.leftId,
          rightId: pair.rightId ?? null,
          bye: Boolean(pair.bye),
          resolved: Boolean(pair.resolved || pair.bye),
          result: pair.result || (pair.bye ? "bye" : null),
          winnerId: pair.winnerId ?? (pair.bye ? pair.leftId : null),
          preRatings: pair.preRatings || null,
          expected: typeof pair.expected === "number" ? pair.expected : 0.5,
          ratingChange: pair.ratingChange || null,
          outcome: pair.outcome || null,
          tierChanges: pair.tierChanges || null,
          logId: pair.logId || null,
          timestamp: pair.timestamp || null,
        }))
      : [],
    standings: Array.isArray(round.standings) ? round.standings : null,
    completedAt: round.completedAt || null,
  }));

  const normalized = {
    id: raw.id || `swiss-${Date.now()}`,
    createdAt: raw.createdAt || Date.now(),
    status: raw.status || "in-progress",
    participants,
    rounds,
    currentRound: raw.currentRound || (rounds.length ? rounds[rounds.length - 1].index : 1),
    totalRounds: raw.totalRounds || Math.max(rounds.length, 3),
    awaitingAdvance: Boolean(raw.awaitingAdvance),
    latestStandings: raw.latestStandings || null,
    finalStandings: raw.finalStandings || null,
    completedAt: raw.completedAt || null,
    finalMatch: raw.finalMatch
      ? {
          id: raw.finalMatch.id || `final-${raw.id || Date.now()}`,
          leftId: raw.finalMatch.leftId,
          rightId: raw.finalMatch.rightId,
          resolved: Boolean(raw.finalMatch.resolved),
          result: raw.finalMatch.result || null,
          winnerId: raw.finalMatch.winnerId || null,
          expected:
            typeof raw.finalMatch.expected === "number" ? raw.finalMatch.expected : null,
          preRatings:
            raw.finalMatch.preRatings && typeof raw.finalMatch.preRatings === "object"
              ? { ...raw.finalMatch.preRatings }
              : null,
          ratingChange:
            raw.finalMatch.ratingChange && typeof raw.finalMatch.ratingChange === "object"
              ? { ...raw.finalMatch.ratingChange }
              : null,
          timestamp: raw.finalMatch.timestamp || null,
          logId: raw.finalMatch.logId || null,
        }
      : null,
    finalResult:
      raw.finalResult && typeof raw.finalResult === "object"
        ? { ...raw.finalResult }
        : null,
  };

  if (!normalized.latestStandings) {
    normalized.latestStandings = computeStandings(participants).standings;
  }

  return normalized;
}

function loadInitialState() {
  const libraryEntries = loadLibraryCatalog();
  const ratingLedger = loadRatingLedger();
  const baseline = synchronizeImagesWithLibrary([], libraryEntries);
  const baseImages = baseline.images.map((image) => mergeLedgerIntoImage(image, ratingLedger[image.id]));
  const basePlacement = buildPlacementQueueForImage(baseline.newIds[0], baseImages);

  const base = {
    images: baseImages,
    duelLog: [],
    swissHistory: [],
    activeSwiss: null,
    placementQueue: basePlacement,
    placementQueueRestored: false,
    selectedTag: "",
    miniSize: 8,
    libraryEntries,
    activeTab: "ranking",
    taggingMode: DEFAULT_TAGGING_MODE,
  };

  if (typeof window === "undefined") {
    return base;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return base;
    }

    const parsed = JSON.parse(raw);
    const savedImages = Array.isArray(parsed.images)
      ? parsed.images
          .map(normalizeImage)
          .map((image) => mergeLedgerIntoImage(image, ratingLedger[image.id]))
          .filter(Boolean)
      : [];
    const mergeResult = synchronizeImagesWithLibrary(savedImages, libraryEntries);
    const images = mergeResult.images;

    const duelLog = Array.isArray(parsed.duelLog)
      ? parsed.duelLog.slice(0, LOG_LIMIT)
      : base.duelLog;
    let swissHistory = Array.isArray(parsed.swissHistory)
      ? parsed.swissHistory.slice(0, HISTORY_LIMIT)
      : base.swissHistory;
    let activeSwiss = parsed.activeSwiss ? normalizeSwiss(parsed.activeSwiss) : null;

    const imagesById = images.reduce((acc, image) => {
      acc[image.id] = image;
      return acc;
    }, {});

    if (activeSwiss && activeSwiss.status === "awaiting-finish") {
      const finalStandings =
        activeSwiss.finalStandings || activeSwiss.latestStandings || computeStandings(activeSwiss.participants).standings;
      const completedAt = activeSwiss.completedAt || Date.now();
      const completedSwiss = {
        ...activeSwiss,
        status: "completed",
        completedAt,
        finalStandings,
        latestStandings: finalStandings,
      };
      const summary = createSwissSummary(completedSwiss, imagesById);
      if (summary) {
        swissHistory = [summary, ...swissHistory.filter((entry) => entry.id !== summary.id)].slice(0, HISTORY_LIMIT);
      }
      activeSwiss = null;
    }

    if (activeSwiss && (activeSwiss.status === "completed" || activeSwiss.completedAt)) {
      activeSwiss = null;
    }

    const imageIds = new Set(images.map((image) => image.id));
    let placementQueue = null;
    let placementQueueRestored = false;

    if (parsed.placementQueue && parsed.placementQueue.imageId && imageIds.has(parsed.placementQueue.imageId)) {
      const opponents = Array.isArray(parsed.placementQueue.opponents)
        ? parsed.placementQueue.opponents.filter(
            (id) => id && imageIds.has(id) && id !== parsed.placementQueue.imageId,
          )
        : [];
      if (opponents.length) {
        placementQueue = {
          imageId: parsed.placementQueue.imageId,
          opponents,
          currentIndex: Math.min(parsed.placementQueue.currentIndex || 0, opponents.length - 1),
          history: Array.isArray(parsed.placementQueue.history)
            ? parsed.placementQueue.history
            : [],
          createdAt: parsed.placementQueue.createdAt || Date.now(),
        };
        placementQueueRestored = true;
      }
    }

    if (!placementQueue && mergeResult.newIds.length) {
      placementQueue = buildPlacementQueueForImage(mergeResult.newIds[0], images);
      placementQueueRestored = false;
    }

    return {
      images,
      duelLog,
      swissHistory,
      activeSwiss,
      placementQueue,
      placementQueueRestored,
      selectedTag: typeof parsed.selectedTag === "string" ? parsed.selectedTag : base.selectedTag,
      miniSize: MINI_SIZE_OPTIONS.includes(parsed.miniSize) ? parsed.miniSize : base.miniSize,
      activeTab: sanitizeTabKey(parsed.activeTab),
      taggingMode: sanitizeTaggingMode(parsed.taggingMode),
      libraryEntries,
    };
  } catch (error) {
    console.warn("TierT: unable to restore saved state", error);
    return base;
  }
}

function selectSwissParticipants(images, size) {
  if (images.length <= size) {
    return images.slice();
  }
  const now = Date.now();
  const scored = images.map((image) => {
    const lastPlayed = image.lastPlayedAt ? (now - image.lastPlayedAt) / (1000 * 60 * 60) : 999;
    const uncertainty = image.rd || 0;
    const totalDuels = image.stats?.totalDuels || 0;
    const weight =
      (12 - Math.min(totalDuels, 12)) * 4 +
      Math.min(lastPlayed, 168) * 0.3 +
      uncertainty * 0.4 +
      (image.rating - 1500) / 80 +
      Math.random() * 5;
    return { image, weight };
  });

  scored.sort((a, b) => b.weight - a.weight);
  const selected = [];
  const used = new Set();

  for (const entry of scored) {
    if (selected.length >= size) break;
    selected.push(entry.image);
    used.add(entry.image.id);
  }

  const topRated = images.slice().sort((a, b) => b.rating - a.rating).slice(0, 3);
  for (const candidate of topRated) {
    if (selected.length >= size) break;
    if (!used.has(candidate.id)) {
      selected.push(candidate);
      used.add(candidate.id);
    }
  }

  const fallback = images.slice().sort((a, b) => b.rating - a.rating);
  let index = 0;
  while (selected.length < size && index < fallback.length) {
    const candidate = fallback[index];
    if (!used.has(candidate.id)) {
      selected.push(candidate);
      used.add(candidate.id);
    }
    index += 1;
  }

  return selected;
}

function generatePairings(participants, roundNumber) {
  const sorted = participants
    .slice()
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aDiff = (a.wins || 0) - (a.losses || 0);
      const bDiff = (b.wins || 0) - (b.losses || 0);
      if (bDiff !== aDiff) return bDiff - aDiff;
      if ((a.rd ?? 0) !== (b.rd ?? 0)) return (a.rd ?? 0) - (b.rd ?? 0);
      return a.seed - b.seed;
    });

  const used = new Set();
  const pairings = [];

  if (sorted.length % 2 === 1) {
    let byeCandidate = null;
    let bestScore = -Infinity;
    for (const player of sorted) {
      if (player.hasBye) continue;
      const candidateScore = -(player.points || 0) * 4 + (player.rd || 0);
      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        byeCandidate = player;
      }
    }
    if (!byeCandidate) {
      byeCandidate = sorted[sorted.length - 1];
    }
    if (byeCandidate) {
      pairings.push({
        id: `bye-${roundNumber}-${byeCandidate.id}`,
        leftId: byeCandidate.id,
        bye: true,
      });
      used.add(byeCandidate.id);
    }
  }

  for (const player of sorted) {
    if (used.has(player.id)) continue;
    let bestIndex = -1;
    let bestScore = Infinity;
    for (let i = 0; i < sorted.length; i += 1) {
      const opponent = sorted[i];
      if (used.has(opponent.id) || opponent.id === player.id) continue;
      const alreadyPlayed = Array.isArray(player.opponents)
        ? player.opponents.includes(opponent.id)
        : false;
      const recordGap = Math.abs((player.points || 0) - (opponent.points || 0));
      const ratingGap = Math.abs(
        (player.currentRating ?? player.seedRating ?? 1500) -
          (opponent.currentRating ?? opponent.seedRating ?? 1500)
      );
      const rdFactor = ((player.rd ?? 0) + (opponent.rd ?? 0)) / 2;
      const rematchPenalty = alreadyPlayed ? 400 : 0;
      const byePenalty = opponent.hasBye ? 300 : 0;
      const score =
        ratingGap - rdFactor * 0.35 + recordGap * 220 + rematchPenalty + byePenalty;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    if (bestIndex === -1) continue;
    const opponent = sorted[bestIndex];
    used.add(player.id);
    used.add(opponent.id);
    const leftFirst = Math.random() > 0.5;
    const leftId = leftFirst ? player.id : opponent.id;
    const rightId = leftFirst ? opponent.id : player.id;
    pairings.push({
      id: `pair-${roundNumber}-${player.id}-${opponent.id}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      leftId,
      rightId,
      bye: false,
    });
  }

  return pairings;
}

function prepareRound(participants, roundNumber, imagesById) {
  const clones = participants.map((participant) => ({
    ...participant,
    opponents: Array.isArray(participant.opponents)
      ? [...participant.opponents]
      : [],
    history: Array.isArray(participant.history)
      ? [...participant.history]
      : [],
  }));

  const pairings = generatePairings(clones, roundNumber);
  const participantMap = new Map(clones.map((participant) => [participant.id, participant]));

  const finalPairings = pairings.map((pair) => {
    if (pair.bye) {
      const player = participantMap.get(pair.leftId);
      if (player) {
        player.hasBye = true;
        player.wins += 1;
        player.points += 2;
        player.history = [
          ...player.history,
          {
            round: roundNumber,
            opponentId: null,
            result: "BYE",
            points: 2,
            ratingDelta: 0,
          },
        ];
      }
      return {
        ...pair,
        resolved: true,
        result: "bye",
        winnerId: pair.leftId,
      };
    }

    const left = participantMap.get(pair.leftId);
    const right = participantMap.get(pair.rightId);

    if (left && !left.opponents.includes(pair.rightId)) {
      left.opponents.push(pair.rightId);
    }
    if (right && !right.opponents.includes(pair.leftId)) {
      right.opponents.push(pair.leftId);
    }

    const leftImage = imagesById[pair.leftId];
    const rightImage = imagesById[pair.rightId];

    return {
      ...pair,
      resolved: false,
      result: null,
      preRatings:
        leftImage && rightImage
          ? {
              left: leftImage.rating,
              right: rightImage.rating,
              leftRd: leftImage.rd,
              rightRd: rightImage.rd,
            }
          : null,
      expected:
        leftImage && rightImage ? expectedScore(leftImage.rating, rightImage.rating) : 0.5,
    };
  });

  return { participants: clones, pairings: finalPairings };
}

function computeStandings(participants) {
  const map = new Map(participants.map((participant) => [participant.id, participant]));
  const computed = participants.map((participant) => {
    const buchholz = (participant.opponents || []).reduce((total, opponentId) => {
      const opponent = map.get(opponentId);
      return total + (opponent ? opponent.points || 0 : 0);
    }, 0);
    return {
      ...participant,
      buchholz,
    };
  });

  computed.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if ((b.buchholz || 0) !== (a.buchholz || 0)) return (b.buchholz || 0) - (a.buchholz || 0);
    if ((b.currentRating || 0) !== (a.currentRating || 0))
      return (b.currentRating || 0) - (a.currentRating || 0);
    return a.seed - b.seed;
  });

  const buchholzMap = {};
  computed.forEach((entry, index) => {
    entry.rank = index + 1;
    buchholzMap[entry.id] = entry.buchholz || 0;
  });

  return { standings: computed, buchholzMap };
}

function applySwissParticipantResult(participant, opponentId, score, resultData, roundNumber, logId) {
  const resultLabel = score === 1 ? "W" : score === 0 ? "L" : "D";
  const historyEntry = {
    round: roundNumber,
    opponentId,
    result: resultLabel,
    points: scoreToPoints(score),
    ratingDelta: roundTo(resultData.deltaRating, 2),
    tierChange: resultData.tierChange
      ? { key: resultData.tierChange.key, direction: resultData.tierChange.direction }
      : null,
    logId,
  };

  return {
    ...participant,
    wins: participant.wins + (score === 1 ? 1 : 0),
    losses: participant.losses + (score === 0 ? 1 : 0),
    draws: participant.draws + (score === 0.5 ? 1 : 0),
    points: participant.points + scoreToPoints(score),
    currentRating: resultData.image.rating,
    rd: resultData.image.rd,
    tierKey: resultData.image.tierKey,
    history: [...(participant.history || []), historyEntry].slice(-12),
  };
}

function updateSwissWithResult(prevSwiss, pairingId, resolution) {
  if (!prevSwiss) return prevSwiss;
  const roundIndex = prevSwiss.rounds.findIndex((round) => round.index === prevSwiss.currentRound);
  if (roundIndex === -1) return prevSwiss;
  const round = prevSwiss.rounds[roundIndex];
  const pairingIndex = round.pairings.findIndex((pair) => pair.id === pairingId);
  if (pairingIndex === -1) return prevSwiss;
  const pairing = round.pairings[pairingIndex];
  if (!pairing || pairing.resolved) return prevSwiss;

  const participants = prevSwiss.participants.map((participant) => {
    if (participant.id === pairing.leftId) {
      return applySwissParticipantResult(
        participant,
        pairing.rightId,
        resolution.leftOutcome,
        resolution.left,
        prevSwiss.currentRound,
        resolution.duelEntry.id,
      );
    }
    if (participant.id === pairing.rightId) {
      return applySwissParticipantResult(
        participant,
        pairing.leftId,
        resolution.rightOutcome,
        resolution.right,
        prevSwiss.currentRound,
        resolution.duelEntry.id,
      );
    }
    return participant;
  });

  const { standings, buchholzMap } = computeStandings(participants);
  const participantsWithBuchholz = participants.map((participant) => ({
    ...participant,
    buchholz: buchholzMap[participant.id] || 0,
  }));

  const updatedPairings = round.pairings.map((pair, index) => {
    if (index !== pairingIndex) return pair;
    return {
      ...pair,
      resolved: true,
      result: resolution.outcome,
      winnerId: resolution.winnerId,
      ratingChange: {
        left: resolution.left.deltaRating,
        right: resolution.right.deltaRating,
      },
      outcome: {
        left: resolution.leftOutcome,
        right: resolution.rightOutcome,
      },
      tierChanges: {
        left: resolution.left.tierChange,
        right: resolution.right.tierChange,
      },
      logId: resolution.duelEntry.id,
      timestamp: resolution.timestamp,
    };
  });

  const updatedRound = {
    ...round,
    pairings: updatedPairings,
  };

  let awaitingAdvance = prevSwiss.awaitingAdvance;
  let status = prevSwiss.status;
  let latestStandings = prevSwiss.latestStandings;

  const allResolved = updatedPairings.every((pair) => pair.resolved);
  if (allResolved) {
    awaitingAdvance = true;
    latestStandings = standings;
    updatedRound.completedAt = resolution.timestamp;
    updatedRound.standings = standings;
    const reachedFinalSwissRound = prevSwiss.currentRound >= prevSwiss.totalRounds;
    if (reachedFinalSwissRound) {
      if (prevSwiss.finalMatch && !prevSwiss.finalMatch.resolved) {
        status = prevSwiss.status;
      } else if (participantsWithBuchholz.length >= 2) {
        status = "awaiting-final";
      } else {
        status = "awaiting-finish";
      }
    } else {
      status = "between-rounds";
    }
  }

  const rounds = prevSwiss.rounds.map((entry, index) => (index === roundIndex ? updatedRound : entry));

  return {
    ...prevSwiss,
    participants: participantsWithBuchholz,
    rounds,
    awaitingAdvance,
    status,
    latestStandings,
  };
}

function createPlacementOpponents(newImageId, images, count = 5) {
  const pool = images.filter((image) => image.id !== newImageId);
  if (!pool.length) return [];

  const sortedByRating = pool.slice().sort((a, b) => b.rating - a.rating);
  const sortedByUncertainty = pool.slice().sort((a, b) => b.rd - a.rd);
  const picks = [];

  const pushCandidate = (candidate) => {
    if (!candidate) return;
    if (picks.some((entry) => entry.id === candidate.id)) return;
    picks.push(candidate);
  };

  pushCandidate(sortedByRating[0]);
  pushCandidate(sortedByRating[Math.floor(sortedByRating.length / 3)]);
  pushCandidate(sortedByRating[Math.floor((sortedByRating.length * 2) / 3)]);
  pushCandidate(sortedByRating[sortedByRating.length - 1]);
  pushCandidate(sortedByUncertainty[0]);

  let index = 1;
  while (picks.length < Math.min(count, pool.length) && index < sortedByUncertainty.length) {
    pushCandidate(sortedByUncertainty[index]);
    index += 1;
  }

  index = 0;
  while (picks.length < Math.min(count, pool.length) && index < sortedByRating.length) {
    pushCandidate(sortedByRating[index]);
    index += 1;
  }

  return picks.slice(0, Math.min(count, picks.length));
}

function determineTotalRounds(size) {
  if (size <= 4) return 3;
  if (size <= 8) return 4;
  if (size <= 16) return 5;
  return 5;
}

function createSwissMini(images, size, imagesById) {
  const trimmedSize = Math.max(2, Math.min(size, images.length));
  if (trimmedSize < 2) return null;

  const selected = selectSwissParticipants(images, trimmedSize);
  if (!selected.length) return null;

  const participants = selected.map((image, index) => ({
    id: image.id,
    name: image.name,
    seed: index + 1,
    seedRating: image.rating,
    currentRating: image.rating,
    rd: image.rd,
    tierKey: image.tierKey,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
    opponents: [],
    history: [],
    hasBye: false,
    buchholz: 0,
  }));

  const totalRounds = determineTotalRounds(participants.length);
  const { participants: seededParticipants, pairings } = prepareRound(participants, 1, imagesById);
  const { standings } = computeStandings(seededParticipants);
  const awaitingAdvance = pairings.every((pair) => pair.resolved);
  const status = awaitingAdvance
    ? totalRounds <= 1
      ? "awaiting-finish"
      : "between-rounds"
    : "in-progress";

  return {
    id: `swiss-${Date.now()}`,
    createdAt: Date.now(),
    status,
    totalRounds,
    currentRound: 1,
    awaitingAdvance,
    participants: seededParticipants,
    rounds: [
      {
        index: 1,
        pairings,
        standings: awaitingAdvance ? standings : null,
        completedAt: awaitingAdvance ? Date.now() : null,
      },
    ],
    latestStandings: standings,
    finalStandings: null,
    finalMatch: null,
    finalResult: null,
  };
}


function resolveDuelForImages(leftImage, rightImage, outcome, context = {}) {
  if (!leftImage || !rightImage) {
    return null;
  }

  const timestamp = Date.now();
  const normalizedOutcome = outcome === "left" || outcome === "right" ? outcome : "draw";
  const leftScore = normalizedOutcome === "left" ? 1 : normalizedOutcome === "right" ? 0 : 0.5;
  const rightScore = normalizedOutcome === "left" ? 0 : normalizedOutcome === "right" ? 1 : 0.5;

  const baseContext = {
    mode: context.mode || "duel",
    swissId: context.swissId || null,
    round: context.round ?? null,
    pairingId: context.pairingId || null,
  };

  const leftPeriods = computePeriodsElapsed(leftImage.lastPlayedAt, timestamp);
  const rightPeriods = computePeriodsElapsed(rightImage.lastPlayedAt, timestamp);

  const leftUpdate = updateGlickoPlayer(
    leftImage,
    [
      {
        rating: rightImage.rating,
        rd: rightImage.rd,
        score: leftScore,
      },
    ],
    leftPeriods,
  );

  const rightUpdate = updateGlickoPlayer(
    rightImage,
    [
      {
        rating: leftImage.rating,
        rd: leftImage.rd,
        score: rightScore,
      },
    ],
    rightPeriods,
  );

  const leftTierChange = resolveTierChange(leftImage.tierKey, leftUpdate.rating, leftUpdate.rd);
  const rightTierChange = resolveTierChange(rightImage.tierKey, rightUpdate.rating, rightUpdate.rd);

  const leftStats = updateImageStats(
    leftImage,
    leftScore,
    { ...baseContext, opponentId: rightImage.id, newRd: leftUpdate.rd },
    leftUpdate.rating,
    timestamp,
    leftTierChange,
  );
  const rightStats = updateImageStats(
    rightImage,
    rightScore,
    { ...baseContext, opponentId: leftImage.id, newRd: rightUpdate.rd },
    rightUpdate.rating,
    timestamp,
    rightTierChange,
  );

  const leftDelta = roundTo(leftUpdate.rating - leftImage.rating, 2);
  const rightDelta = roundTo(rightUpdate.rating - rightImage.rating, 2);

  const leftRecentEntry = {
    opponentId: rightImage.id,
    opponentName: rightImage.name,
    result: leftScore === 1 ? "W" : leftScore === 0 ? "L" : "D",
    delta: leftDelta,
    timestamp,
    mode: baseContext.mode,
    swissId: baseContext.swissId,
    round: baseContext.round,
  };
  const rightRecentEntry = {
    opponentId: leftImage.id,
    opponentName: leftImage.name,
    result: rightScore === 1 ? "W" : rightScore === 0 ? "L" : "D",
    delta: rightDelta,
    timestamp,
    mode: baseContext.mode,
    swissId: baseContext.swissId,
    round: baseContext.round,
  };

  const leftTierLog = leftTierChange.changed
    ? [...(leftImage.tierLog || []), {
        timestamp,
        tier: leftTierChange.key,
        direction: leftTierChange.direction,
        rating: leftUpdate.rating,
      }].slice(-10)
    : [...(leftImage.tierLog || [])];
  const rightTierLog = rightTierChange.changed
    ? [...(rightImage.tierLog || []), {
        timestamp,
        tier: rightTierChange.key,
        direction: rightTierChange.direction,
        rating: rightUpdate.rating,
      }].slice(-10)
    : [...(rightImage.tierLog || [])];

  const updatedLeft = {
    ...leftImage,
    rating: leftUpdate.rating,
    rd: leftUpdate.rd,
    volatility: leftUpdate.volatility,
    tierKey: leftTierChange.key,
    tierIndex: leftTierChange.index,
    stats: leftStats,
    updatedAt: timestamp,
    lastPlayedAt: timestamp,
    tierLog: leftTierLog,
    recentMatches: [leftRecentEntry, ...(leftImage.recentMatches || [])].slice(0, RECENT_MATCHES_LIMIT),
  };
  const updatedRight = {
    ...rightImage,
    rating: rightUpdate.rating,
    rd: rightUpdate.rd,
    volatility: rightUpdate.volatility,
    tierKey: rightTierChange.key,
    tierIndex: rightTierChange.index,
    stats: rightStats,
    updatedAt: timestamp,
    lastPlayedAt: timestamp,
    tierLog: rightTierLog,
    recentMatches: [rightRecentEntry, ...(rightImage.recentMatches || [])].slice(0, RECENT_MATCHES_LIMIT),
  };

  const winnerId = normalizedOutcome === "left" ? leftImage.id : normalizedOutcome === "right" ? rightImage.id : null;

  const duelEntry = {
    id: `duel-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp,
    leftId: leftImage.id,
    rightId: rightImage.id,
    leftName: leftImage.name,
    rightName: rightImage.name,
    leftScore,
    rightScore,
    outcome: normalizedOutcome,
    winnerId,
    leftDelta,
    rightDelta,
    leftRatingAfter: leftUpdate.rating,
    rightRatingAfter: rightUpdate.rating,
    context: baseContext,
    tierChanges: {
      left: leftTierChange.changed ? leftTierChange.direction : null,
      right: rightTierChange.changed ? rightTierChange.direction : null,
    },
  };

  return {
    timestamp,
    outcome: normalizedOutcome,
    winnerId,
    leftOutcome: leftScore,
    rightOutcome: rightScore,
    left: {
      image: updatedLeft,
      deltaRating: leftDelta,
      tierChange: leftTierChange.changed ? leftTierChange : null,
    },
    right: {
      image: updatedRight,
      deltaRating: rightDelta,
      tierChange: rightTierChange.changed ? rightTierChange : null,
    },
    duelEntry,
  };
}

function createSwissSummary(swiss, imagesById) {
  if (!swiss) return null;

  const standings = swiss.finalStandings || swiss.latestStandings || [];
  const enriched = standings.map((entry, index) => {
    const image = imagesById[entry.id];
    const fallbackRank = typeof entry.rank === "number" ? entry.rank : index + 1;
    return {
      id: entry.id,
      name: image?.name || entry.name,
      rating: image?.rating ?? entry.currentRating ?? entry.seedRating ?? 1500,
      tierKey: image?.tierKey || entry.tierKey || getTierByRating(entry.currentRating ?? 1500),
      wins: entry.wins,
      losses: entry.losses,
      draws: entry.draws,
      points: entry.points,
      buchholz: entry.buchholz || 0,
      rank: fallbackRank,
    };
  });

  const sorted = enriched
    .slice()
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if ((b.points ?? 0) !== (a.points ?? 0)) return (b.points ?? 0) - (a.points ?? 0);
      const aDiff = (a.wins || 0) - (a.losses || 0);
      const bDiff = (b.wins || 0) - (b.losses || 0);
      if (bDiff !== aDiff) return bDiff - aDiff;
      return a.name.localeCompare(b.name);
    });

  const resolvedFinal =
    swiss.finalMatch && swiss.finalMatch.resolved
      ? {
          leftId: swiss.finalMatch.leftId,
          rightId: swiss.finalMatch.rightId,
          winnerId: swiss.finalMatch.winnerId,
          result: swiss.finalMatch.result,
          timestamp: swiss.finalMatch.timestamp || swiss.completedAt || Date.now(),
        }
      : null;

  const championId = resolvedFinal?.winnerId || sorted[0]?.id || null;

  return {
    id: swiss.id,
    createdAt: swiss.createdAt,
    completedAt: swiss.completedAt || Date.now(),
    totalRounds: swiss.totalRounds,
    participants: sorted,
    size: sorted.length,
    winnerId: championId,
    championId,
    finalMatch: resolvedFinal,
    gallery: sorted.slice(0, 6).map((entry) => {
      const image = imagesById[entry.id];
      return {
        id: entry.id,
        rank: entry.rank,
        name: entry.name,
        preview: image?.dataUrl || image?.imageUrl || null,
      };
    }),
  };
}

function finalizeSwissMiniState(swiss, imagesById) {
  if (!swiss) {
    return { swiss: null, summary: null };
  }

  const participants = Array.isArray(swiss.participants) ? swiss.participants : [];
  const { standings, buchholzMap } = computeStandings(participants);
  const participantsWithBuchholz = participants.map((participant) => ({
    ...participant,
    buchholz: buchholzMap[participant.id] ?? participant.buchholz ?? 0,
  }));
  const completedAt = swiss.completedAt || Date.now();

  const finalizedSwiss = {
    ...swiss,
    participants: participantsWithBuchholz,
    status: "completed",
    awaitingAdvance: false,
    completedAt,
    finalStandings: standings,
    latestStandings: standings,
  };

  const summary = createSwissSummary(finalizedSwiss, imagesById);

  return { swiss: finalizedSwiss, summary };
}

function buildRankingData(images, selectedTag) {
  const global = images.slice().sort((a, b) => b.rating - a.rating);
  const tagsSet = new Set();
  global.forEach((image) => {
    (image.tags || []).forEach((tag) => tagsSet.add(tag));
  });

  const tags = Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  const filtered = selectedTag ? global.filter((image) => image.tags.includes(selectedTag)) : global;
  const perTier = TIER_RULES.map((tier) => ({
    tier,
    images: global.filter((image) => image.tierKey === tier.key),
  }));
  const tagLeaders = tags.map((tag) => ({
    tag,
    leaders: global.filter((image) => image.tags.includes(tag)).slice(0, 5),
  }));

  return {
    global,
    filtered,
    perTier,
    tags,
    tagLeaders,
  };
}

function getPreviewStyle(image) {
  if (!image) return {};
  if (image.dataUrl) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(8, 12, 28, 0.2), rgba(8, 12, 28, 0.85)), url(${image.dataUrl})`,
    };
  }

  if (image.imageUrl) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(8, 12, 28, 0.2), rgba(8, 12, 28, 0.85)), url(${image.imageUrl})`,
    };
  }
  const tierColor = TIER_LOOKUP[image.tierKey]?.color || colorFromString(image.id);
  return {
    background: createTierGradient(tierColor),
  };
}

function TierBadge({ tierKey }) {
  const tier = TIER_LOOKUP[tierKey] || TIER_RULES[0];
  return (
    <span className="tier-badge" style={{ backgroundColor: tier.color }}>
      {tier.label}
    </span>
  );
}

function DuelCard({
  leftImage,
  rightImage,
  disabled = false,
  expected = 0.5,
  contextLabel,
  onResolve,
  onViewImage,
}) {
  if (!leftImage || !rightImage) {
    return null;
  }

  return (
    <div className="duel-card">
      {contextLabel ? <div className="duel-context">{contextLabel}</div> : null}
      <div className="duel-stage">
        <button
          type="button"
          className="combatant"
          onClick={() => onResolve("left")}
          disabled={disabled}
        >
          <div className="combatant-media" style={getPreviewStyle(leftImage)}>
            <div className="combatant-overlay">
              <div className="combatant-meta">
                <TierBadge tierKey={leftImage.tierKey} />
                <h3>{leftImage.name}</h3>
                <p>{`Rating ${Math.round(leftImage.rating)} · RD ${Math.round(leftImage.rd)}`}</p>
                <p className="combatant-tags">{leftImage.tags.slice(0, 3).join(" · ")}</p>
              </div>
            </div>
          </div>
          <span className="combatant-callout">Win</span>
        </button>
        <button
          type="button"
          className="combatant"
          onClick={() => onResolve("right")}
          disabled={disabled}
        >
          <div className="combatant-media" style={getPreviewStyle(rightImage)}>
            <div className="combatant-overlay">
              <div className="combatant-meta">
                <TierBadge tierKey={rightImage.tierKey} />
                <h3>{rightImage.name}</h3>
                <p>{`Rating ${Math.round(rightImage.rating)} · RD ${Math.round(rightImage.rd)}`}</p>
                <p className="combatant-tags">{rightImage.tags.slice(0, 3).join(" · ")}</p>
              </div>
            </div>
          </div>
          <span className="combatant-callout">Win</span>
        </button>
      </div>
      <div className="duel-controls">
        <span className="expected-label">{`Expected ${Math.round(expected * 100)}%`}</span>
        <div className="duel-actions">
          <button
            type="button"
            className="ghost view-button"
            onClick={() => onViewImage?.(leftImage)}
            disabled={disabled}
          >
            View Left
          </button>
          <button
            type="button"
            className="ghost view-button"
            onClick={() => onViewImage?.(rightImage)}
            disabled={disabled}
          >
            View Right
          </button>
          <button
            type="button"
            onClick={() => onResolve("draw")}
            className="draw-button"
            disabled={disabled}
          >
            Draw
          </button>
        </div>
      </div>
    </div>
  );
}

function SwissMiniPanel({
  swiss,
  imagesById,
  onResolvePairing,
  onResolveFinal,
  onAdvanceRound,
  onFinish,
  onCancel,
  onViewImage,
}) {
  if (!swiss) return null;

  const currentRound = swiss.rounds.find((round) => round.index === swiss.currentRound);
  const finalMatch = swiss.finalMatch;
  const isFinalActive = swiss.status === "finals" && finalMatch && !finalMatch.resolved;
  const pendingPairing = !isFinalActive
    ? currentRound?.pairings?.find((pair) => !pair.resolved && !pair.bye)
    : null;
  const standings = swiss.latestStandings || computeStandings(swiss.participants).standings;
  const showSummary = swiss.status === "awaiting-finish" || swiss.status === "completed";
  const statusLabel = (() => {
    switch (swiss.status) {
      case "awaiting-final":
        return "awaiting finals";
      case "finals":
        return "finals";
      case "between-rounds":
        return "between rounds";
      case "awaiting-finish":
        return "ready to finalize";
      default:
        return swiss.status;
    }
  })();

  const renderPairingStatus = (pair) => {
    if (pair.bye) {
      const byeImage = imagesById[pair.leftId];
      return `${byeImage?.name || "Unknown"} receives a bye`;
    }
    const left = imagesById[pair.leftId];
    const right = imagesById[pair.rightId];
    const label = `${left?.name || "?"} vs ${right?.name || "?"}`;
    if (!pair.resolved) {
      return `${label} · pending`;
    }
    if (pair.outcome?.left === 0.5) {
      return `${label} · draw`;
    }
    const winner = pair.winnerId === pair.leftId ? left?.name : right?.name;
    return `${label} · ${winner || "winner"}`;
  };

  return (
    <section className="taste-t-panel swiss-panel">
      <header className="panel-header">
        <div>
          <h2>{isFinalActive ? "Swiss Finals" : `Swiss Mini · Round ${swiss.currentRound}`}</h2>
          <p className="panel-subtitle">
            {`${standings.length} images · ${swiss.totalRounds} rounds · ${statusLabel}`}
          </p>
        </div>
        <div className="panel-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            {swiss.status === "completed" ? "Close summary" : "Abandon"}
          </button>
          {swiss.awaitingAdvance && swiss.status === "awaiting-final" ? (
            <button type="button" onClick={onAdvanceRound}>
              Start finals
            </button>
          ) : null}
          {swiss.awaitingAdvance && swiss.status === "between-rounds" ? (
            <button type="button" onClick={onAdvanceRound}>
              Start Round {swiss.currentRound + 1}
            </button>
          ) : null}
          {swiss.awaitingAdvance && swiss.status === "awaiting-finish" ? (
            <button type="button" onClick={onFinish}>
              Finalize Mini
            </button>
          ) : null}
        </div>
      </header>
      {isFinalActive && finalMatch ? (
        <DuelCard
          leftImage={imagesById[finalMatch.leftId]}
          rightImage={imagesById[finalMatch.rightId]}
          expected={finalMatch.expected ?? expectedScore(
            imagesById[finalMatch.leftId]?.rating ?? 1500,
            imagesById[finalMatch.rightId]?.rating ?? 1500,
          )}
          contextLabel="Finale"
          onResolve={onResolveFinal}
          onViewImage={onViewImage}
        />
      ) : pendingPairing ? (
        <DuelCard
          leftImage={imagesById[pendingPairing.leftId]}
          rightImage={imagesById[pendingPairing.rightId]}
          expected={pendingPairing.expected}
          contextLabel={`Round ${swiss.currentRound}`}
          onResolve={(result) => onResolvePairing(pendingPairing.id, result)}
          onViewImage={onViewImage}
        />
      ) : (
        <div className="panel-placeholder">
          {swiss.status === "completed"
            ? "Swiss mini completed! Review the final standings below."
            : swiss.awaitingAdvance
            ? "All pairings resolved. Continue when ready."
            : "Awaiting next pairing..."}
        </div>
      )}
      {showSummary ? (
        <div className="panel-body final-standings">
          <div>
            <h3>Final Standings</h3>
            <table className="standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Points</th>
                  <th>Record</th>
                  <th>Buchholz</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.rank}</td>
                    <td>
                      <div className="standings-name">
                        <TierBadge tierKey={entry.tierKey || imagesById[entry.id]?.tierKey} />
                        <span>{imagesById[entry.id]?.name || entry.name}</span>
                      </div>
                    </td>
                    <td>{entry.points}</td>
                    <td>{formatRecord(entry.wins, entry.losses, entry.draws)}</td>
                    <td>{roundTo(entry.buchholz, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h3>{finalMatch?.resolved ? "Final Result" : "Latest Round"}</h3>
            {finalMatch?.resolved ? (
              <ul className="pairing-list final-outcome">
                <li>
                  {`${imagesById[finalMatch.leftId]?.name || "Left"} vs ${
                    imagesById[finalMatch.rightId]?.name || "Right"
                  } · ${
                    finalMatch.result === "draw"
                      ? "Draw"
                      : `${
                          finalMatch.winnerId === finalMatch.leftId
                            ? imagesById[finalMatch.leftId]?.name
                            : imagesById[finalMatch.rightId]?.name
                        } won`
                  }`}
                </li>
              </ul>
            ) : (
              <ul className="pairing-list">
                {currentRound?.pairings?.map((pair) => (
                  <li key={pair.id}>{renderPairingStatus(pair)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PlacementPanel({ queue, imagesById, onResolve, onCancel, onViewImage }) {
  if (!queue) return null;

  const image = imagesById[queue.imageId];
  const opponentId = queue.opponents[queue.currentIndex];
  const opponent = imagesById[opponentId];
  const progress = queue.opponents.length
    ? ((queue.currentIndex + (opponent ? 0 : 1)) / queue.opponents.length) * 100
    : 100;

  return (
    <section className="taste-t-panel placement-panel">
      <header className="panel-header">
        <div>
          <h2>Placement Duels</h2>
          <p className="panel-subtitle">
            {image ? image.name : "New image"} · {queue.currentIndex + 1} of {queue.opponents.length}
          </p>
        </div>
        <div className="panel-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </header>
      {image && opponent ? (
        <DuelCard
          leftImage={image}
          rightImage={opponent}
          expected={expectedScore(image.rating, opponent.rating)}
          contextLabel="Placement"
          onResolve={onResolve}
          onViewImage={onViewImage}
        />
      ) : (
        <div className="panel-placeholder">Placement complete!</div>
      )}
      <div className="placement-progress">
        <div className="placement-progress-bar" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
      <ul className="placement-history">
        {queue.history.map((entry) => {
          const opp = imagesById[entry.opponentId];
          return (
            <li key={entry.id}>
              <span>{opp?.name || "Opponent"}</span>
              <span>{entry.outcome}</span>
              <span>{formatDelta(entry.delta)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function TaggingPanel({
  image,
  previewSrc,
  mode,
  onModeChange,
  onAssignTag,
  onSkip,
  onViewImage,
  onRefreshLibrary,
  remaining,
  assignments,
}) {
  const triLabel = assignments.tri ? getTriLabelForKey(assignments.tri) : null;
  const renderModeToggle = () => (
    <div className="tagging-mode-toggle" role="tablist" aria-label="Tagging modes">
      {TAGGING_MODES.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`tagging-mode-button${mode === key ? " is-active" : ""}`}
          onClick={() => onModeChange(key)}
          aria-pressed={mode === key}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const renderOptionButtons = (options, activeValue, group) => (
    <div className="tagging-buttons">
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.key;
        const label =
          typeof option === "string"
            ? formatTagLabel(option)
            : option.label || formatTagLabel(option.key);
        const optionTags = typeof option === "string" ? null : option.tags;
        const isActive = activeValue === value;
        return (
          <button
            key={value}
            type="button"
            className={`tagging-option${isActive ? " is-active" : ""}`}
            onClick={() => onAssignTag(value, group, optionTags)}
            disabled={isActive}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const renderControls = () => {
    switch (mode) {
      case "tri":
        return (
          <div className="tagging-option-group">
            <h3>Form</h3>
            {renderOptionButtons(TRI_TAG_OPTIONS, assignments.tri, "tri")}
          </div>
        );
      case "quadrant":
        return (
          <div className="tagging-option-group">
            <h3>Quadrant</h3>
            {renderOptionButtons(QUADRANT_TAGS, assignments.quadrant, "quadrant")}
          </div>
        );
      case "dual":
      default:
        return (
          <>
            <div className="tagging-option-group">
              <h3>Gender</h3>
              {renderOptionButtons(DUAL_GENDER_TAGS, assignments.gender, "gender")}
            </div>
            <div className="tagging-option-group">
              <h3>Flow</h3>
              {renderOptionButtons(DUAL_FLOW_TAGS, assignments.flow, "flow")}
            </div>
          </>
        );
    }
  };

  return (
    <section className="taste-t-panel tagging-panel">
      <header className="panel-header">
        <div>
          <h2>Tag forge</h2>
          <p className="panel-subtitle">Quickly classify untagged library images.</p>
        </div>
        {renderModeToggle()}
      </header>
      {image ? (
        <div className="tagging-content">
          <div className="tagging-preview">
            {previewSrc ? (
              <img src={previewSrc} alt={image.name || "Library entry"} />
            ) : (
              <div className="tagging-preview-fallback">No preview available</div>
            )}
            <div className="tagging-preview-meta">
              <strong>{image.name || "Untitled"}</strong>
              <ul>
                <li>Gender · {assignments.gender || "—"}</li>
                <li>Flow · {assignments.flow || "—"}</li>
                <li>Tri · {triLabel || "—"}</li>
                <li>Quadrant · {assignments.quadrant || "—"}</li>
              </ul>
              <div className="tagging-preview-actions">
                {onViewImage ? (
                  <button type="button" className="taste-t-secondary" onClick={() => onViewImage(image)}>
                    View full size
                  </button>
                ) : null}
                <button type="button" className="ghost" onClick={onSkip}>
                  Skip image
                </button>
              </div>
              <p className="tagging-remaining">
                {remaining > 1
                  ? `${remaining} images still need a tag in this mode.`
                  : "This is the last image waiting for this tag."}
              </p>
            </div>
          </div>
          <div className="tagging-options">{renderControls()}</div>
        </div>
      ) : (
        <div className="tagging-empty">
          <h3>All caught up</h3>
          <p>
            Every image already has the necessary tags for the selected mode. Choose another mode or refresh the
            library to keep tagging.
          </p>
          <div className="tagging-empty-actions">
            <button type="button" className="taste-t-secondary" onClick={() => onModeChange("dual")}>
              Switch to Dual mode
            </button>
            {onRefreshLibrary ? (
              <button type="button" className="ghost" onClick={onRefreshLibrary}>
                Refresh library
              </button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}


function TasteT() {
  const initialState = useMemo(() => loadInitialState(), []);
  const [images, setImages] = useState(initialState.images);
  const [duelLog, setDuelLog] = useState(initialState.duelLog);
  const [swissHistory, setSwissHistory] = useState(initialState.swissHistory);
  const [activeSwiss, setActiveSwiss] = useState(initialState.activeSwiss);
  const [placementQueue, setPlacementQueue] = useState(initialState.placementQueue);
  const [selectedTag, setSelectedTag] = useState(initialState.selectedTag);
  const [miniSize, setMiniSize] = useState(initialState.miniSize || 8);
  const [libraryEntries, setLibraryEntries] = useState(initialState.libraryEntries);
  const [activeTab, setActiveTab] = useState(sanitizeTabKey(initialState.activeTab));
  const [taggingMode, setTaggingMode] = useState(sanitizeTaggingMode(initialState.taggingMode));
  const [mode, setMode] = useState(() => {
    if (initialState.activeSwiss) {
      return initialState.activeSwiss.status === "awaiting-finish" ? "lobby" : "swiss";
    }
    if (initialState.placementQueue && initialState.placementQueueRestored) return "placement";
    return "lobby";
  });
  const pendingPreviewRef = useRef(new Set());
  const [expandedImage, setExpandedImage] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [taggingImageId, setTaggingImageId] = useState(null);

  const imagesById = useMemo(() => {
    const map = {};
    images.forEach((image) => {
      map[image.id] = image;
    });
    return map;
  }, [images]);

  const libraryById = useMemo(() => {
    const map = {};
    (libraryEntries || []).forEach((entry) => {
      if (!entry) return;
      map[coerceLibraryId(entry.id)] = entry;
    });
    return map;
  }, [libraryEntries]);

  const rankingData = useMemo(() => buildRankingData(images, selectedTag), [images, selectedTag]);
  const availableTags = rankingData.tags;
  const hasImages = images.length > 0;
  const isRankingTab = activeTab === "ranking";
  const isTaggingTab = activeTab === "tagging";
  const canStartSwiss = hasImages && images.length >= 2;
  const placementImage = placementQueue ? imagesById[placementQueue.imageId] : null;
  const pendingPlacementRounds = placementQueue
    ? Math.max(placementQueue.opponents.length - placementQueue.currentIndex, 0)
    : 0;
  const showPlacementCallout =
    isRankingTab && mode === "lobby" && placementQueue && placementImage && pendingPlacementRounds > 0;
  const isPlaying = isRankingTab && (mode === "swiss" || mode === "placement");
  const canUndo = undoStack.length > 0;
  const swissHistoryPreview = useMemo(() => swissHistory.slice(0, 3), [swissHistory]);

  const getPreviewFor = useCallback(
    (id) => {
      if (!id) return null;
      const image = imagesById[id];
      if (image?.dataUrl) return image.dataUrl;
      if (image?.imageUrl) return image.imageUrl;
      const entry = libraryById[id];
      if (entry?.dataUrl) return entry.dataUrl;
      if (entry?.imageUrl) return entry.imageUrl;
      return null;
    },
    [imagesById, libraryById],
  );

  const taggingCandidates = useMemo(
    () => buildTaggingCandidates(images, taggingMode),
    [images, taggingMode],
  );

  useEffect(() => {
    if (!taggingCandidates.length) {
      setTaggingImageId(null);
      return;
    }
    setTaggingImageId((current) => {
      if (current && taggingCandidates.some((candidate) => candidate.id === current)) {
        return current;
      }
      const next = taggingCandidates[Math.floor(Math.random() * taggingCandidates.length)];
      return next ? next.id : null;
    });
  }, [taggingCandidates]);

  const taggingImage = taggingImageId ? imagesById[taggingImageId] : null;
  const taggingPreview = taggingImage ? getPreviewFor(taggingImage.id) : null;
  const taggingAssignments = useMemo(() => {
    const tags = Array.isArray(taggingImage?.tags) ? taggingImage.tags : [];
    const { gender, flow } = getDualStatusFromTags(tags);
    const tri = getTriAssignmentKeyFromTags(tags);
    const quadrant = QUADRANT_TAGS.find((tag) => tags.includes(tag)) || null;
    return { gender, flow, tri, quadrant };
  }, [taggingImage]);

  const createUndoState = useCallback(() => ({
    images: deepClone(images),
    duelLog: deepClone(duelLog),
    activeSwiss: deepClone(activeSwiss),
    placementQueue: deepClone(placementQueue),
    mode,
  }), [images, duelLog, activeSwiss, placementQueue, mode]);

  const pushUndoState = useCallback((snapshot) => {
    if (!snapshot) return;
    setUndoStack((current) => [snapshot, ...current].slice(0, UNDO_STACK_LIMIT));
  }, []);

  const persistLibraryTags = useCallback(
    (imageId, tags) => {
      if (typeof window === "undefined") return;
      const targetId = coerceLibraryId(imageId);
      if (!targetId) return;
      try {
        const entries = loadLibraryCatalog();
        let changed = false;
        const nextEntries = entries.map((entry) => {
          if (!entry) return entry;
          const entryId = coerceLibraryId(entry.id);
          if (!entryId || entryId !== targetId) {
            return entry;
          }
          const existingTags = normalizeLibraryTags(entry.tags);
          if (arraysEqual(existingTags, tags)) {
            return entry;
          }
          changed = true;
          return { ...entry, tags };
        });
        if (changed) {
          localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(nextEntries));
          setLibraryEntries(nextEntries);
        }
      } catch (error) {
        console.warn("TierT: unable to persist library tags", error);
      }
    },
    [setLibraryEntries],
  );

  const handleSelectTab = useCallback(
    (tab) => {
      const next = sanitizeTabKey(tab);
      if (next === "tagging" && isPlaying) {
        return;
      }
      setActiveTab((current) => (current === next ? current : next));
    },
    [isPlaying, setActiveTab],
  );

  const handleTaggingModeChange = useCallback(
    (nextMode) => {
      const sanitized = sanitizeTaggingMode(nextMode);
      setTaggingMode((current) => (current === sanitized ? current : sanitized));
      setTaggingImageId(null);
    },
    [setTaggingMode, setTaggingImageId],
  );

  const handleTaggingAssign = useCallback(
    (tag, group, comboTags = null) => {
      const targetId = taggingImageId;
      if (!targetId) return;
      const image = imagesById[targetId];
      if (!image) return;
      const baseTags = Array.isArray(image.tags) ? image.tags : [];
      let nextTags = baseTags.slice();
      let tagsToAdd = [tag];
      if (group === "gender") {
        nextTags = nextTags.filter((entry) => !DUAL_GENDER_TAGS.includes(entry));
      } else if (group === "flow") {
        nextTags = nextTags.filter((entry) => !DUAL_FLOW_TAGS.includes(entry));
      } else if (group === "tri") {
        nextTags = nextTags.filter((entry) => !ALL_TRI_TAGS.includes(entry));
        const triSet = Array.isArray(comboTags) && comboTags.length ? comboTags : TRI_TAG_OPTION_LOOKUP[tag]?.tags;
        tagsToAdd = Array.isArray(triSet) && triSet.length ? triSet : [];
      } else if (group === "quadrant") {
        nextTags = nextTags.filter((entry) => !QUADRANT_TAGS.includes(entry));
      }
      tagsToAdd.forEach((entry) => {
        if (entry && !nextTags.includes(entry)) {
          nextTags.push(entry);
        }
      });
      const sanitizedTags = normalizeLibraryTags(nextTags);
      const currentTags = normalizeLibraryTags(baseTags);
      if (arraysEqual(currentTags, sanitizedTags)) {
        return;
      }
      const now = Date.now();
      setImages((current) => {
        const index = current.findIndex((img) => img.id === targetId);
        if (index === -1) return current;
        const existing = normalizeLibraryTags(current[index].tags);
        if (arraysEqual(existing, sanitizedTags)) {
          return current;
        }
        const next = current.slice();
        next[index] = { ...current[index], tags: sanitizedTags, updatedAt: now };
        return next;
      });
      persistLibraryTags(targetId, sanitizedTags);
    },
    [imagesById, taggingImageId, persistLibraryTags, setImages],
  );

  const handleSkipTagging = useCallback(() => {
    if (!taggingCandidates.length) {
      setTaggingImageId(null);
      return;
    }
    const alternatives = taggingCandidates.filter((candidate) => candidate.id !== taggingImageId);
    const pool = alternatives.length ? alternatives : taggingCandidates;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setTaggingImageId(next ? next.id : null);
  }, [taggingCandidates, taggingImageId]);

  const handleViewImage = useCallback((image) => {
    if (!image) return;
    setExpandedImage(image);
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedImage(null);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack((current) => {
      if (!current.length) return current;
      const [latest, ...rest] = current;
      setImages(latest?.images ? deepClone(latest.images) : []);
      setDuelLog(latest?.duelLog ? deepClone(latest.duelLog) : []);
      setActiveSwiss(latest?.activeSwiss ? deepClone(latest.activeSwiss) : null);
      setPlacementQueue(latest?.placementQueue ? deepClone(latest.placementQueue) : null);
      setMode(latest?.mode || "lobby");
      return rest;
    });
    setExpandedImage(null);
  }, [setImages, setDuelLog, setActiveSwiss, setPlacementQueue, setMode, setExpandedImage]);

  useEffect(() => {
    if (!expandedImage || typeof window === "undefined") return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setExpandedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedImage]);

  const refreshLibrary = useCallback(() => {
    if (typeof window === "undefined") return;
    setLibraryEntries(loadLibraryCatalog());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let cancelled = false;
    const pending = pendingPreviewRef.current;
    const missing = images.filter((image) => !image.dataUrl && !pending.has(image.id));

    missing.forEach((image) => {
      pending.add(image.id);
      loadImageData(image.id)
        .then((dataUrl) => {
          pending.delete(image.id);
          if (!dataUrl || cancelled) return;
          setImages((current) => {
            const index = current.findIndex((img) => img.id === image.id);
            if (index === -1) return current;
            if (current[index].dataUrl === dataUrl) return current;
            const next = current.slice();
            next[index] = { ...current[index], dataUrl };
            return next;
          });
        })
        .catch(() => {
          pending.delete(image.id);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [images]);

  useEffect(() => {
    const result = synchronizeImagesWithLibrary(images, libraryEntries);
    if (result.changed) {
      setImages(result.images);
    }
    const effectiveImages = result.changed ? result.images : images;
    const availableIds = new Set(effectiveImages.map((image) => image.id));

    if (
      result.newIds.length &&
      (!placementQueue || !placementQueue.opponents.length || !availableIds.has(placementQueue.imageId))
    ) {
      const queue = buildPlacementQueueForImage(result.newIds[0], effectiveImages);
      if (queue) {
        setPlacementQueue(queue);
      }
    }
  }, [libraryEntries]);

  useEffect(() => {
    if (typeof window === "undefined" || !images.length) {
      return;
    }

    let baseEntries = libraryEntries;
    if (!Array.isArray(baseEntries) || !baseEntries.length) {
      try {
        const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            baseEntries = parsed;
          }
        }
      } catch (error) {
        console.warn("TierT: unable to inspect library storage", error);
      }
    }

    if (!Array.isArray(baseEntries) || !baseEntries.length) {
      return;
    }

    const { entries: nextEntries, changed } = mergeLibraryMetadataWithRatings(baseEntries, images);
    if (!changed) {
      if (baseEntries !== libraryEntries && Array.isArray(baseEntries)) {
        setLibraryEntries(baseEntries);
      }
      return;
    }

    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(nextEntries));
    } catch (error) {
      console.warn("TierT: unable to sync ratings to library", error);
    }

    setLibraryEntries(nextEntries);
  }, [images, libraryEntries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const ledger = createLedgerPayload(images);
      localStorage.setItem(RATING_LEDGER_KEY, JSON.stringify(ledger));
    } catch (error) {
      console.warn("TierT: unable to persist rating ledger", error);
    }
  }, [images]);

  useEffect(() => {
    if (!placementQueue) return;
    const availableIds = new Set(images.map((image) => image.id));
    if (!availableIds.has(placementQueue.imageId)) {
      setPlacementQueue(null);
      if (mode === "placement") {
        setMode("lobby");
      }
      return;
    }

    const filteredOpponents = placementQueue.opponents.filter(
      (id) => id !== placementQueue.imageId && availableIds.has(id),
    );

    if (!filteredOpponents.length) {
      setPlacementQueue(null);
      if (mode === "placement") {
        setMode("lobby");
      }
      return;
    }

    if (
      filteredOpponents.length !== placementQueue.opponents.length ||
      placementQueue.currentIndex >= filteredOpponents.length
    ) {
      setPlacementQueue((current) => {
        if (!current) return current;
        const nextIndex = Math.min(current.currentIndex, filteredOpponents.length - 1);
        return {
          ...current,
          opponents: filteredOpponents,
          currentIndex: Math.max(0, nextIndex),
        };
      });
    }
  }, [images, placementQueue, mode]);

  useEffect(() => {
    if (!activeSwiss) return;
    const availableIds = new Set(images.map((image) => image.id));
    const missingParticipant = activeSwiss.participants.some(
      (participant) => !availableIds.has(participant.id),
    );
    if (missingParticipant) {
      setActiveSwiss(null);
      if (mode === "swiss") {
        setMode("lobby");
      }
    }
  }, [images, activeSwiss, mode]);

  useEffect(() => {
    if (!selectedTag) return;
    if (!availableTags.includes(selectedTag)) {
      setSelectedTag("");
    }
  }, [availableTags, selectedTag]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload = prepareStateForStorage({
        images,
        duelLog,
        swissHistory,
        activeSwiss,
        placementQueue,
        selectedTag,
        miniSize,
        activeTab,
        taggingMode,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("TierT: unable to persist state", error);
    }
  }, [images, duelLog, swissHistory, activeSwiss, placementQueue, selectedTag, miniSize, activeTab, taggingMode]);

  const applyResolution = useCallback(
    (resolution) => {
      if (!resolution) {
        return;
      }

      setImages((current) => {
        let changed = false;
        const next = current.map((image) => {
          if (image.id === resolution.left.image.id) {
            changed = true;
            return resolution.left.image;
          }
          if (image.id === resolution.right.image.id) {
            changed = true;
            return resolution.right.image;
          }
          return image;
        });
        return changed ? next : current;
      });

      setDuelLog((current) => [resolution.duelEntry, ...current].slice(0, LOG_LIMIT));
    },
    [setImages, setDuelLog],
  );

  const handleStartSwiss = useCallback(() => {
    if (!canStartSwiss || mode !== "lobby") return;
    const size = Math.min(miniSize, images.length);
    const swiss = createSwissMini(images, size, imagesById);
    if (!swiss) return;

    const participantIds = new Set(swiss.participants.map((participant) => participant.id));
    setImages((current) =>
      current.map((image) => {
        if (!participantIds.has(image.id)) return image;
        const stats = {
          ...image.stats,
          minisEntered: (image.stats?.minisEntered || 0) + 1,
          lastMode: "swiss",
        };
        return { ...image, stats };
      }),
    );

    setActiveSwiss(swiss);
    setMode("swiss");
  }, [canStartSwiss, mode, miniSize, images, imagesById]);

  const handleResolvePairing = useCallback(
    (pairingId, outcome) => {
      const snapshot = createUndoState();
      let resolution = null;
      let resolved = false;

      setActiveSwiss((current) => {
        if (!current) return current;
        const round = current.rounds.find((entry) => entry.index === current.currentRound);
        if (!round) return current;
        const pairing = round.pairings.find((pair) => pair.id === pairingId);
        if (!pairing || pairing.bye || pairing.resolved) return current;

        const leftImage = imagesById[pairing.leftId];
        const rightImage = imagesById[pairing.rightId];
        if (!leftImage || !rightImage) {
          return current;
        }

        resolution = resolveDuelForImages(leftImage, rightImage, outcome, {
          mode: "swiss",
          swissId: current.id,
          round: current.currentRound,
          pairingId,
        });
        if (!resolution) {
          return current;
        }
        resolved = true;
        return updateSwissWithResult(current, pairingId, resolution);
      });

      if (resolved && resolution) {
        pushUndoState(snapshot);
        applyResolution(resolution);
      }
    },
    [imagesById, applyResolution, createUndoState, pushUndoState],
  );

  const handleAdvanceRound = useCallback(() => {
    setActiveSwiss((current) => {
      if (!current) return current;
      if (!current.awaitingAdvance) return current;

      if (current.status === "awaiting-final") {
        const { standings } = computeStandings(current.participants);
        if (standings.length < 2) {
          return {
            ...current,
            status: "awaiting-finish",
            awaitingAdvance: true,
            latestStandings: standings,
          };
        }

        const [first, second] = standings;
        const leftImage = imagesById[first.id];
        const rightImage = imagesById[second.id];
        const leftRating = leftImage?.rating ?? first.currentRating ?? first.seedRating ?? 1500;
        const rightRating = rightImage?.rating ?? second.currentRating ?? second.seedRating ?? 1500;

        return {
          ...current,
          finalMatch: {
            id: `final-${current.id}-${Date.now()}`,
            leftId: first.id,
            rightId: second.id,
            resolved: false,
            result: null,
            winnerId: null,
            expected: expectedScore(leftRating, rightRating),
            preRatings: { left: leftRating, right: rightRating },
            ratingChange: null,
            timestamp: null,
            logId: null,
          },
          status: "finals",
          awaitingAdvance: false,
          latestStandings: standings,
        };
      }

      const nextRoundNumber = current.currentRound + 1;
      if (nextRoundNumber > current.totalRounds) {
        return {
          ...current,
          status: "awaiting-finish",
        };
      }

      const { participants: nextParticipants, pairings } = prepareRound(
        current.participants,
        nextRoundNumber,
        imagesById,
      );
      const { standings } = computeStandings(nextParticipants);
      const awaitingAdvance = pairings.every((pair) => pair.resolved);
      const status = awaitingAdvance
        ? nextRoundNumber >= current.totalRounds
          ? "awaiting-finish"
          : "between-rounds"
        : "in-progress";

      return {
        ...current,
        participants: nextParticipants,
        rounds: [
          ...current.rounds,
          {
            index: nextRoundNumber,
            pairings,
            standings: awaitingAdvance ? standings : null,
            completedAt: awaitingAdvance ? Date.now() : null,
          },
        ],
        currentRound: nextRoundNumber,
        awaitingAdvance,
        status,
        latestStandings: standings,
      };
    });
  }, [imagesById]);

  const handleResolveFinal = useCallback(
    (outcome) => {
      const snapshot = createUndoState();
      let resolution = null;
      let resolved = false;
      let summary = null;
      let finalized = null;

      setActiveSwiss((current) => {
        if (!current || !current.finalMatch || current.finalMatch.resolved) {
          return current;
        }

        const { finalMatch } = current;
        const leftImage = imagesById[finalMatch.leftId];
        const rightImage = imagesById[finalMatch.rightId];
        if (!leftImage || !rightImage) {
          return current;
        }

        resolution = resolveDuelForImages(leftImage, rightImage, outcome, {
          mode: "swiss-final",
          swissId: current.id,
          round: current.totalRounds + 1,
          pairingId: finalMatch.id,
        });

        if (!resolution) {
          return current;
        }

        resolved = true;

        const participants = current.participants.map((participant) => {
          if (participant.id === finalMatch.leftId) {
            return applySwissParticipantResult(
              participant,
              finalMatch.rightId,
              resolution.leftOutcome,
              resolution.left,
              current.currentRound + 1,
              resolution.duelEntry.id,
            );
          }
          if (participant.id === finalMatch.rightId) {
            return applySwissParticipantResult(
              participant,
              finalMatch.leftId,
              resolution.rightOutcome,
              resolution.right,
              current.currentRound + 1,
              resolution.duelEntry.id,
            );
          }
          return participant;
        });

        const updatedSwiss = {
          ...current,
          finalMatch: {
            ...finalMatch,
            resolved: true,
            result: resolution.outcome,
            winnerId: resolution.winnerId,
            ratingChange: {
              left: resolution.left.deltaRating,
              right: resolution.right.deltaRating,
            },
            timestamp: resolution.timestamp,
            logId: resolution.duelEntry.id,
          },
          finalResult: {
            winnerId: resolution.winnerId,
            outcome: resolution.outcome,
            timestamp: resolution.timestamp,
          },
          participants,
        };

        const finalization = finalizeSwissMiniState(updatedSwiss, imagesById);
        summary = finalization.summary;
        finalized = finalization.swiss;

        return finalization.swiss;
      });

      if (resolved && resolution) {
        pushUndoState(snapshot);
        applyResolution(resolution);
      }

      if (summary) {
        setSwissHistory((current) => {
          const filtered = current.filter((entry) => entry.id !== summary.id);
          return [summary, ...filtered].slice(0, HISTORY_LIMIT);
        });
      }

      if (finalized && finalized.status === "completed") {
        setMode("lobby");
      }

      return summary;
    },
    [imagesById, applyResolution, createUndoState, pushUndoState, setSwissHistory, mode, setMode],
  );

  const finalizeCurrentSwiss = useCallback(() => {
    let summary = null;
    let finalized = null;
    setActiveSwiss((current) => {
      if (!current) return current;
      if (current.status !== "awaiting-finish" && current.status !== "completed") {
        return current;
      }
      if (current.finalMatch && !current.finalMatch.resolved) {
        return current;
      }

      const { swiss: completedSwiss, summary: completedSummary } = finalizeSwissMiniState(
        current,
        imagesById,
      );

      summary = completedSummary;
      finalized = completedSwiss;
      return null;
    });
    if (summary) {
      setSwissHistory((current) => {
        const filtered = current.filter((entry) => entry.id !== summary.id);
        return [summary, ...filtered].slice(0, HISTORY_LIMIT);
      });
    }
    if (finalized) {
      setMode("lobby");
    }
    return summary;
  }, [imagesById, setSwissHistory, setMode]);

  const handleFinishSwiss = useCallback(() => {
    finalizeCurrentSwiss();
  }, [finalizeCurrentSwiss]);

  useEffect(() => {
    if (!activeSwiss) return;
    if (!shouldFinalizeSwissStatus(activeSwiss.status)) {
      return;
    }
    finalizeCurrentSwiss();
  }, [activeSwiss, finalizeCurrentSwiss]);

  useEffect(() => {
    if (!activeSwiss) return;
    if (!isSwissSessionStale(activeSwiss)) {
      return;
    }
    setActiveSwiss(null);
    if (mode === "swiss") {
      setMode("lobby");
    }
  }, [activeSwiss, mode]);

  const handleCancelSwiss = useCallback(() => {
    setActiveSwiss(null);
    setMode("lobby");
  }, []);

  const handleEnterPlacement = useCallback(() => {
    if (!placementQueue) return;
    setMode("placement");
  }, [placementQueue]);

  const handleCancelPlacement = useCallback(() => {
    setMode("lobby");
  }, []);

  const handleResolvePlacement = useCallback(
    (outcome) => {
      if (!placementQueue) return;

      const snapshot = createUndoState();
      const queueImage = imagesById[placementQueue.imageId];
      const opponentId = placementQueue.opponents[placementQueue.currentIndex];
      const opponent = imagesById[opponentId];
      let completed = false;
      let historyEntry = null;
      let resolution = null;
      let advanced = false;

      if (queueImage && opponent) {
        resolution = resolveDuelForImages(queueImage, opponent, outcome, {
          mode: "placement",
        });
        if (resolution) {
          const delta =
            resolution.left.image.id === queueImage.id
              ? resolution.left.deltaRating
              : resolution.right.deltaRating;
          historyEntry = {
            id: resolution.duelEntry.id,
            opponentId,
            outcome: outcome === "left" ? "Win" : outcome === "right" ? "Loss" : "Draw",
            delta,
          };
        }
      } else {
        historyEntry = {
          id: `placement-${Date.now()}`,
          opponentId,
          outcome: "Skipped",
          delta: 0,
        };
      }

      setPlacementQueue((current) => {
        if (!current) return current;
        const nextHistory = historyEntry ? [...current.history, historyEntry].slice(-10) : current.history;
        const nextIndex = current.currentIndex + 1;
        if (nextIndex >= current.opponents.length) {
          completed = true;
          advanced = true;
          return null;
        }
        advanced = true;
        return {
          ...current,
          currentIndex: nextIndex,
          history: nextHistory,
        };
      });

      if (advanced) {
        pushUndoState(snapshot);
      }

      if (resolution) {
        applyResolution(resolution);
      }

      if (completed) {
        setMode("lobby");
      }
    },
    [placementQueue, imagesById, applyResolution, createUndoState, pushUndoState],
  );

  const hasActiveSwiss = isRankingTab && mode === "swiss" && activeSwiss;
  const hasPlacement = isRankingTab && mode === "placement" && placementQueue;
  const showRankingDashboard = isRankingTab && !hasActiveSwiss && !hasPlacement;
  const taggingRemaining = taggingCandidates.length;

  const topRankings = rankingData.filtered.slice(0, 6);
  const topTierSnapshots = rankingData.perTier.slice(0, 3);
  const recentDuels = duelLog.slice(0, 5);

  const expandedImageSrc = expandedImage?.dataUrl || expandedImage?.imageUrl;

  return (
    <div className={`taste-t-app${isPlaying ? " is-playing" : ""}`}>
      <div className="taste-t-frame">
        <div className="taste-t-tablist" role="tablist" aria-label="TasteT modes">
          {TASTET_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`taste-t-tab${activeTab === tab.key ? " is-active" : ""}`}
              onClick={() => handleSelectTab(tab.key)}
              aria-pressed={activeTab === tab.key}
              disabled={tab.key === "tagging" && isPlaying}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {isRankingTab && canUndo ? (
          <div className="taste-t-toolbar">
            <button type="button" className="ghost" onClick={handleUndo} disabled={!canUndo}>
              Undo last result
            </button>
          </div>
        ) : null}
        {hasActiveSwiss ? (
          <div className="taste-t-game">
            <SwissMiniPanel
              swiss={activeSwiss}
              imagesById={imagesById}
              onResolvePairing={handleResolvePairing}
              onResolveFinal={handleResolveFinal}
              onAdvanceRound={handleAdvanceRound}
              onFinish={handleFinishSwiss}
              onCancel={handleCancelSwiss}
              onViewImage={handleViewImage}
            />
          </div>
        ) : hasPlacement ? (
          <div className="taste-t-game">
            <PlacementPanel
              queue={placementQueue}
              imagesById={imagesById}
              onResolve={handleResolvePlacement}
              onCancel={handleCancelPlacement}
              onViewImage={handleViewImage}
            />
          </div>
        ) : showRankingDashboard ? (
          <div className="taste-t-dashboard">
            <section className="taste-t-overview-panel">
              <div className="taste-t-overview-header">
                <div>
                  <span className="taste-t-overview-tag">Swiss minis</span>
                  <h1>TierT</h1>
                  <p>
                    {hasImages
                      ? "Queue a Swiss mini to keep refining your favourites."
                      : "Add images in your Library to start ranking them."}
                  </p>
                </div>
                <div className="taste-t-overview-actions">
                  <label className="mini-size-control">
                    <span>Mini size</span>
                    <select value={miniSize} onChange={(event) => setMiniSize(Number(event.target.value))}>
                      {MINI_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="taste-t-primary"
                    onClick={handleStartSwiss}
                    disabled={!canStartSwiss || mode !== "lobby"}
                  >
                    Play mini
                  </button>
                  <button type="button" className="taste-t-secondary" onClick={refreshLibrary}>
                    Refresh library
                  </button>
                </div>
              </div>
              <div className="taste-t-overview-stats">
                <div className="taste-t-stat-card">
                  <span className="stat-label">Library images</span>
                  <strong>{images.length}</strong>
                  <p>{hasImages ? "Ready to rank" : "Visit the Library to add images."}</p>
                </div>
                <div className="taste-t-stat-card">
                  <span className="stat-label">Placements</span>
                  <strong>{pendingPlacementRounds}</strong>
                  <p>{placementQueue ? "Duels to settle your newest image." : "All images are placed."}</p>
                </div>
                <div className="taste-t-stat-card">
                  <span className="stat-label">Recent duels</span>
                  <strong>{duelLog.length}</strong>
                  <p>{duelLog.length ? "Tracked below in your duel log." : "Play a mini to build history."}</p>
                </div>
              </div>
              {!canStartSwiss ? (
                <p className="taste-t-hero-note">Add at least two images to start a Swiss mini.</p>
              ) : null}
              {showPlacementCallout ? (
                <div className="taste-t-placement-card">
                  <div>
                    <h2>Placement ready</h2>
                    <p>
                      {placementImage ? placementImage.name : "New image"} has {pendingPlacementRounds} duels remaining.
                    </p>
                  </div>
                  <button type="button" onClick={handleEnterPlacement}>
                    Start placement
                  </button>
                </div>
              ) : null}
            </section>
            <div className="taste-t-summary-column">
              <section className="taste-t-card taste-t-card--global">
                <header className="taste-t-card-header">
                  <div>
                    <h2>Global order</h2>
                    <p>
                      {selectedTag
                        ? `Filtering by ${selectedTag}`
                        : hasImages
                        ? "All images"
                        : "No images available"}
                    </p>
                  </div>
                  <select value={selectedTag} onChange={(event) => setSelectedTag(event.target.value)}>
                    <option value="">All tags</option>
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </header>
                {topRankings.length ? (
                  <ol className="taste-t-ranking-list">
                    {topRankings.map((image, index) => (
                      <li key={image.id}>
                        <span className="rank-index">#{index + 1}</span>
                        <div className="ranking-meta">
                          <h3>{image.name}</h3>
                          <p>
                            {`Rating ${Math.round(image.rating)} · RD ${Math.round(image.rd)} · ${formatRecord(
                              image.stats?.wins,
                              image.stats?.losses,
                              image.stats?.draws,
                            )}`}
                          </p>
                          <p className="ranking-tags">
                            #{image.tierKey} · {image.tags.slice(0, 2).join(" · ")}
                          </p>
                        </div>
                        <span className="rank-rating">{Math.round(image.rating)}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="taste-t-card-empty">
                    {hasImages
                      ? "No rankings match the selected tag."
                      : "Add images in your Library to begin ranking."}
                  </div>
                )}
              </section>
              <div className="taste-t-summary-grid">
                <section className="taste-t-card taste-t-card--tiers">
                  <header className="taste-t-card-header">
                    <div>
                      <h2>Tier snapshots</h2>
                      <p>Highlights from your recent placements.</p>
                    </div>
                  </header>
                  {topTierSnapshots.length ? (
                    <div className="tier-grid tier-grid--compact">
                      {topTierSnapshots.map(({ tier, images: tierImages }) => (
                        <div key={tier.key} className="tier-card">
                          <header style={{ borderColor: tier.color }}>
                            <h3>{tier.label}</h3>
                            <p>{tier.tagline}</p>
                          </header>
                          <ol>
                            {tierImages.slice(0, 3).map((image) => (
                              <li key={image.id}>
                                <span>{image.name}</span>
                                <span>{Math.round(image.rating)}</span>
                              </li>
                            ))}
                            {!tierImages.length ? <li className="empty">No images yet</li> : null}
                          </ol>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="taste-t-card-empty">Play a mini to build your tiers.</div>
                  )}
                </section>
                <section className="taste-t-card taste-t-card--activity">
                  <div className="taste-t-activity-group">
                    <h2>Recent duels</h2>
                    {recentDuels.length ? (
                      <ul className="taste-t-duel-list">
                        {recentDuels.map((entry) => (
                          <li key={entry.id}>
                            <div className="duel-names">
                              <strong>{entry.leftName}</strong>
                              <span>vs</span>
                              <strong>{entry.rightName}</strong>
                            </div>
                            <div className="duel-meta">
                              <span className="duel-outcome">
                                {entry.outcome === "draw"
                                  ? "Draw"
                                  : `${entry.winnerId === entry.leftId ? entry.leftName : entry.rightName} won`}
                              </span>
                              <span className="duel-delta">
                                {formatDelta(entry.leftDelta)} / {formatDelta(entry.rightDelta)}
                              </span>
                              <span className="duel-time">{formatRelativeTime(entry.timestamp)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="taste-t-card-empty">Play duels to populate your log.</div>
                    )}
                  </div>
                  <div className="taste-t-activity-group">
                    <h2>Swiss history</h2>
                    {swissHistoryPreview.length ? (
                      <ul className="taste-t-swiss-list">
                        {swissHistoryPreview.map((entry) => {
                          const winner =
                            entry.participants.find((participant) => participant.id === entry.championId) ||
                            entry.participants[0];
                          const size = entry.size || entry.participants.length;
                          return (
                            <li key={entry.id}>
                              <div className="swiss-summary">
                                <strong>{winner?.name || "—"}</strong>
                                <span>{` won a ${size}-image mini`}</span>
                              </div>
                              <div className="swiss-meta">
                                <span>{entry.totalRounds} rounds</span>
                                <span>·</span>
                                <span>{formatRelativeTime(entry.completedAt)}</span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="taste-t-card-empty">Finish a Swiss mini to see it logged here.</div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        ) : null}
        {isTaggingTab ? (
          <div className="taste-t-game taste-t-game--tagging">
            <TaggingPanel
              image={taggingImage}
              previewSrc={taggingPreview}
              mode={taggingMode}
              onModeChange={handleTaggingModeChange}
              onAssignTag={handleTaggingAssign}
              onSkip={handleSkipTagging}
              onViewImage={handleViewImage}
              onRefreshLibrary={refreshLibrary}
              remaining={taggingRemaining}
              assignments={taggingAssignments}
            />
          </div>
        ) : null}
      </div>
      {expandedImageSrc ? (
        <div className="taste-t-lightbox" role="dialog" aria-modal="true">
          <div className="lightbox-backdrop" onClick={handleCloseExpanded} />
          <div className="lightbox-content" role="document">
            <button type="button" className="ghost lightbox-close" onClick={handleCloseExpanded}>
              Close
            </button>
            <figure className="lightbox-figure">
              <img src={expandedImageSrc} alt={expandedImage?.name || "Selected image"} />
              <figcaption>
                <strong>{expandedImage?.name}</strong>
                <span>#{expandedImage?.tierKey}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      ) : null}
    </div>
  );
}


export default TasteT;
