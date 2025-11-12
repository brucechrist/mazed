import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import './library.css';
import { DEFAULT_COLORS, loadPalette } from './colorConfig.js';
import { extractDominantColor } from './dominantColor.js';
import { colorDiff } from './colorUtils.js';
import namer from 'color-namer';
import {
  deleteImageData,
  extractMimeType,
  loadImageData,
  storeImageData,
} from './assets/LibraryStorage';
import {
  deleteSoundData,
  loadSoundData,
  storeSoundData,
} from '../soundStorage.js';

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const generateVideoThumbnail = (dataUrl) =>
  new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    const cleanup = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.remove();
    };

    const handleError = () => {
      cleanup();
      resolve(null);
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const handleLoaded = () => {
      try {
        const width = video.videoWidth || 320;
        const height = video.videoHeight || Math.round((width * 9) / 16);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, width, height);
        const thumb = canvas.toDataURL('image/png');
        cleanup();
        resolve(thumb);
      } catch (err) {
        console.error('Failed to capture video thumbnail', err);
        handleError();
      }
    };

    video.addEventListener('loadeddata', handleLoaded, { once: true });
    video.addEventListener('error', handleError, { once: true });
    video.src = dataUrl;
    try {
      video.load();
    } catch {
      // Some browsers do not require explicit load for data URLs
    }
  });

const CATEGORY_TAGS = ['P', 'M', 'F', 'X'];
const CATEGORY_LABEL = CATEGORY_TAGS.join(' / ');
const GENDER_TAGS = ['♀', '♂'];
const QUALITY_TAGS = ['Good', 'Neutral', 'Bad'];
const POSITION_TAGS = ['TOP', 'MID', 'BASE'];
const POSITION_LABEL = POSITION_TAGS.join(' / ');

const ITEM_TYPE_INFO = {
  image: { label: 'Image', symbol: '🖼️' },
  word: { label: 'Word', symbol: '🔤' },
  sound: { label: 'Sound', symbol: '🔊' },
};

const SOUND_PRESET_TAGS = [
  ...CATEGORY_TAGS,
  ...GENDER_TAGS,
  ...QUALITY_TAGS,
  ...POSITION_TAGS,
];

const TRI_VIEW_CATEGORIES = [
  { id: 'form', label: 'Form' },
  { id: 'semi-formless', label: 'Semi-Formless' },
  { id: 'formless', label: 'Formless' },
];

const TRI_CATEGORY_IDS = TRI_VIEW_CATEGORIES.map((category) => category.id);

const TRI_CATEGORY_TO_TAG = {
  form: 'P',
  'semi-formless': 'M',
  formless: 'F',
};

const TRI_TAG_TO_CATEGORY = Object.entries(TRI_CATEGORY_TO_TAG).reduce(
  (acc, [category, tag]) => {
    acc[tag] = category;
    return acc;
  },
  {}
);

const TRI_PRESET_LOOKUP = (() => {
  const map = {};
  CATEGORY_TAGS.forEach((tag) => {
    map[tag.toLowerCase()] = tag;
  });
  Object.entries(TRI_CATEGORY_TO_TAG).forEach(([category, tag]) => {
    const normalized = category.toLowerCase();
    map[normalized] = tag;
    const collapsed = normalized.replace(/[\s_-]+/g, '');
    if (!map[collapsed]) {
      map[collapsed] = tag;
    }
  });
  return map;
})();

const resolveTriPresetTag = (value) => {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().toLowerCase();
  if (!normalized.length) return '';
  const collapsed = normalized.replace(/[\s_-]+/g, '');
  const dashed = normalized.replace(/[\s_]+/g, '-');
  return (
    TRI_PRESET_LOOKUP[normalized] ||
    TRI_PRESET_LOOKUP[collapsed] ||
    TRI_PRESET_LOOKUP[dashed] ||
    ''
  );
};

const DUAL_ROWS = ['Good', 'Neutral', 'Bad'];
const DUAL_COLUMNS = ['♀', '♂'];
const DUAL_ROW_ICONS = {
  Good: '▲',
  Neutral: '–',
  Bad: '▼',
};
const DUAL_ROW_LABELS = {
  Good: 'Good',
  Neutral: 'Neutral',
  Bad: 'Bad',
};
const DUAL_COLUMN_LABELS = {
  '♀': 'Feminine',
  '♂': 'Masculine',
};

const normalizeTriCategory = (value) =>
  TRI_CATEGORY_IDS.includes(value) ? value : null;

const normalizeTriOrder = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const buildTriIdLists = (items) => {
  const indexMap = new Map(items.map((item, idx) => [item.id, idx]));
  const buckets = {
    form: [],
    'semi-formless': [],
    formless: [],
    drawer: [],
  };

  items.forEach((img) => {
    const category = normalizeTriCategory(img.triCategory);
    if (category) {
      buckets[category].push({
        id: img.id,
        order: normalizeTriOrder(img.triOrder),
      });
    } else {
      buckets.drawer.push(img.id);
    }
  });

  const sortCategory = (entries) =>
    entries
      .slice()
      .sort((a, b) => {
        const orderA =
          typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const orderB =
          typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (indexMap.get(a.id) ?? 0) - (indexMap.get(b.id) ?? 0);
      })
      .map((entry) => entry.id);

  return {
    form: sortCategory(buckets.form),
    'semi-formless': sortCategory(buckets['semi-formless']),
    formless: sortCategory(buckets.formless),
    drawer: buckets.drawer
      .slice()
      .sort(
        (a, b) => (indexMap.get(a) ?? 0) - (indexMap.get(b) ?? 0)
      ),
  };
};

const parseSoundTags = (sound) => {
  const seen = new Set();
  const tags = [];
  const addTag = (value) => {
    const tag = sanitizeTag(value);
    if (!tag) return;
    const triPreset = resolveTriPresetTag(tag);
    const normalized = triPreset || tag;
    const lower = normalized.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    tags.push(normalized);
  };

  if (Array.isArray(sound?.tags)) {
    sound.tags.forEach(addTag);
  }

  if (typeof sound?.tag === 'string') {
    sound.tag.split(',').forEach(addTag);
    for (const preset of SOUND_PRESET_TAGS) {
      const regex = new RegExp(`\\b${preset}\\b`, 'i');
      if (regex.test(sound.tag)) {
        addTag(preset);
      }
    }
  }

  return tags.filter((tag) => {
    const lower = tag.toLowerCase();
    const matchingPresets = SOUND_PRESET_TAGS.filter((preset) =>
      new RegExp(`\\b${preset.toLowerCase()}\\b`).test(lower)
    );
    if (matchingPresets.length < 2) {
      return true;
    }
    const stripped = matchingPresets.reduce((acc, preset) => {
      const presetRegex = new RegExp(`\\b${preset.toLowerCase()}\\b`, 'gi');
      return acc.replace(presetRegex, '');
    }, lower);
    return stripped.trim().length > 0;
  });
};

const findPresetTag = (tags, presets) => {
  if (!Array.isArray(tags)) return '';
  for (const raw of tags) {
    const tag = sanitizeTag(raw);
    if (!tag) continue;
    const lower = tag.toLowerCase();
    const match = presets.find(
      (preset) => preset.toLowerCase() === lower
    );
    if (match) {
      return match;
    }
  }
  return '';
};

const findTriPresetTag = (tags) => {
  if (!Array.isArray(tags)) return '';
  for (const raw of tags) {
    const preset = resolveTriPresetTag(raw);
    if (preset) {
      return preset;
    }
  }
  return '';
};

const extractCustomSoundTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const custom = [];
  for (const raw of tags) {
    const tag = sanitizeTag(raw);
    if (!tag) continue;
    const lower = tag.toLowerCase();
    const triPreset = resolveTriPresetTag(tag);
    if (
      SOUND_PRESET_TAGS.some((preset) => preset.toLowerCase() === lower)
    ) {
      continue;
    }
    if (triPreset) {
      continue;
    }
    if (!custom.some((existing) => existing.toLowerCase() === lower)) {
      custom.push(tag);
    }
  }
  return custom;
};

const buildSoundTagsPayload = ({
  category = '',
  gender = '',
  quality = '',
  position = '',
  customInput = '',
} = {}) => {
  const tags = [];
  const pushTag = (value) => {
    const tag = sanitizeTag(value);
    if (!tag) return;
    const lower = tag.toLowerCase();
    if (tags.some((existing) => existing.toLowerCase() === lower)) {
      return;
    }
    tags.push(tag);
  };

  pushTag(category);
  pushTag(gender);
  pushTag(quality);
  pushTag(position);

  if (typeof customInput === 'string') {
    customInput.split(',').forEach(pushTag);
  }

  return canonicalizeTags(tags);
};

const getSoundMetadata = (sound) => {
  const tags = parseSoundTags(sound);
  const tagString = tags.join(', ');
  return {
    id: sound.id,
    title: sound.title || 'Untitled',
    thumbnail: sound.thumbnail || null,
    color: sound.color || '',
    mimeType: sound.mimeType || '',
    tags,
    tag: tagString,
  };
};

const hexToName = (hex) => {
  if (!hex) return '';
  try {
    return namer(hex).basic[0].name.toLowerCase();
  } catch {
    return hex;
  }
};

const QUADRANT_ORDER = ['IE', 'EE', 'II', 'EI'];

const sanitizeTag = (tag) => {
  if (typeof tag !== 'string') return null;
  const trimmed = tag.trim();
  return trimmed ? trimmed : null;
};

const canonicalizeTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const cleaned = [];
  tags.forEach((raw) => {
    const tag = sanitizeTag(raw);
    if (!tag) return;
    const lower = tag.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    cleaned.push(tag);
  });
  return cleaned;
};

const TMB_PRIORITY = POSITION_TAGS.map((tag) => tag.toLowerCase());

const getTmbPriority = (tags) => {
  if (!Array.isArray(tags)) {
    return TMB_PRIORITY.length;
  }

  let best = TMB_PRIORITY.length;
  for (const raw of tags) {
    const tag = sanitizeTag(raw);
    if (!tag) continue;
    const normalized = tag.toLowerCase();
    const index = TMB_PRIORITY.indexOf(normalized);
    if (index !== -1 && index < best) {
      best = index;
    }
  }

  return best;
};

const sortItemsByTmb = (items, getTags, getTitle = () => '') => {
  if (!Array.isArray(items)) {
    return [];
  }

  const originalOrder = new Map();
  items.forEach((item, index) => {
    originalOrder.set(item, index);
  });

  return items
    .slice()
    .sort((a, b) => {
      const priorityA = getTmbPriority(getTags(a));
      const priorityB = getTmbPriority(getTags(b));
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      const indexA = originalOrder.get(a) ?? 0;
      const indexB = originalOrder.get(b) ?? 0;
      if (indexA !== indexB) {
        return indexA - indexB;
      }

      const titleA = getTitle(a) || '';
      const titleB = getTitle(b) || '';
      return titleA.localeCompare(titleB);
    });
};

const buildImageTags = ({
  category = '',
  gender = '',
  quality = '',
  position = '',
  customTags = [],
} = {}) => {
  const tags = [];
  const pushTag = (value) => {
    const tag = sanitizeTag(value);
    if (!tag) return;
    const lower = tag.toLowerCase();
    if (tags.some((existing) => existing.toLowerCase() === lower)) {
      return;
    }
    tags.push(tag);
  };

  pushTag(category);
  pushTag(gender);
  pushTag(quality);
  pushTag(position);

  if (Array.isArray(customTags)) {
    customTags.forEach(pushTag);
  }

  return tags;
};

const extractCustomTags = (tags) => {
  if (!Array.isArray(tags)) return [];
  const custom = [];
  for (const raw of tags) {
    const tag = sanitizeTag(raw);
    if (!tag) continue;
    const lower = tag.toLowerCase();
    const triPreset = resolveTriPresetTag(tag);
    if (
      Boolean(triPreset) ||
      GENDER_TAGS.some((preset) => preset.toLowerCase() === lower) ||
      QUALITY_TAGS.some((preset) => preset.toLowerCase() === lower) ||
      POSITION_TAGS.some((preset) => preset.toLowerCase() === lower)
    ) {
      continue;
    }
    custom.push(tag);
  }
  return custom;
};

const normalizeImageTags = (tags) => {
  const cleaned = canonicalizeTags(tags);
  const category = findTriPresetTag(cleaned);
  const gender = findPresetTag(cleaned, GENDER_TAGS);
  const quality = findPresetTag(cleaned, QUALITY_TAGS);
  const position = findPresetTag(cleaned, POSITION_TAGS);
  const custom = extractCustomTags(cleaned);
  return buildImageTags({
    category,
    gender,
    quality,
    position,
    customTags: custom,
  });
};

const DEFAULT_HIDDEN_QUALITY = 'Bad';

const parseHiddenQualityPreference = (value) => {
  if (typeof value !== 'string') {
    return DEFAULT_HIDDEN_QUALITY;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_HIDDEN_QUALITY;
  }
  const match = QUALITY_TAGS.find(
    (tag) => tag.toLowerCase() === normalized
  );
  return match || DEFAULT_HIDDEN_QUALITY;
};

const tagsAreEqual = (a, b) => {
  if (!Array.isArray(a) && !Array.isArray(b)) {
    return true;
  }
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
};

const deriveTriCategoryFromTags = (tags) => {
  const preset = findTriPresetTag(tags);
  return preset ? TRI_TAG_TO_CATEGORY[preset] ?? null : null;
};

const mergeTriCategoryIntoTags = (tags, triCategory) => {
  const categoryTag = triCategory ? TRI_CATEGORY_TO_TAG[triCategory] ?? '' : '';
  const cleaned = canonicalizeTags(tags);
  return buildImageTags({
    category: categoryTag,
    gender: findPresetTag(cleaned, GENDER_TAGS),
    quality: findPresetTag(cleaned, QUALITY_TAGS),
    position: findPresetTag(cleaned, POSITION_TAGS),
    customTags: extractCustomTags(cleaned),
  });
};

const syncTriCategoryWithTags = (tags, triCategory) => {
  const normalizedTags = normalizeImageTags(tags);
  const normalizedCategory = normalizeTriCategory(triCategory);
  const tagDerived = deriveTriCategoryFromTags(normalizedTags);

  if (normalizedCategory) {
    if (tagDerived !== normalizedCategory) {
      return {
        tags: mergeTriCategoryIntoTags(normalizedTags, normalizedCategory),
        triCategory: normalizedCategory,
      };
    }
    return {
      tags: normalizedTags,
      triCategory: normalizedCategory,
    };
  }

  return {
    tags: normalizedTags,
    triCategory: tagDerived,
  };
};

function QuadrantPicker({ value = [], onChange }) {
  const main = value[0];
  const sub = value[1];
  const handle = (outer, inner) => {
    if (main === outer && sub === inner) {
      onChange([]);
    } else {
      onChange([outer, inner]);
    }
  };
  return (
    <div className="quadrant-grid">
      {QUADRANT_ORDER.map((outer) => (
        <div
          key={outer}
          className={`quadrant-outer${main === outer ? ' selected' : ''}`}
        >
          {QUADRANT_ORDER.map((inner) => (
            <div
              key={outer + '-' + inner}
              className={`quadrant-inner${
                main === outer && sub === inner ? ' selected' : ''
              }`}
                onClick={() => handle(outer, inner)}
              />
            ))}
          </div>
      ))}
    </div>
  );
}

function VideoPreview({ src, poster, title }) {
  const videoRef = useRef(null);
  const hasPlayedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const playPromise = video.play();
    if (playPromise?.then) {
      playPromise
        .then(() => {
          hasPlayedRef.current = true;
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    } else {
      hasPlayedRef.current = true;
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback((reset = false) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    if (reset && hasPlayedRef.current) {
      try {
        video.currentTime = 0;
      } catch {
        // ignore errors when resetting time
      }
      hasPlayedRef.current = false;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => () => pause(), [pause]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      try {
        video.load();
      } catch {
        // Ignore load errors so we can still show the poster once available
      }
    }
    hasPlayedRef.current = false;
    pause(false);
  }, [src, poster, pause]);

  const ensurePlaying = useCallback(
    (event) => {
      event.stopPropagation();
      if (!isPlaying) {
        play();
      }
    },
    [isPlaying, play]
  );

  const handleMouseEnter = useCallback(
    (event) => {
      ensurePlaying(event);
    },
    [ensurePlaying]
  );

  const handleMouseLeave = useCallback(
    (event) => {
      event.stopPropagation();
      pause(true);
    },
    [pause]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        if (isPlaying) {
          pause(true);
        } else {
          play();
        }
      }
    },
    [isPlaying, pause, play]
  );

  const handleBlur = useCallback(() => {
    pause(true);
  }, [pause]);

  const label = title ? `Preview video ${title}` : 'Preview video';

  return (
    <div
      className={`video-preview${isPlaying ? ' playing' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={ensurePlaying}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      role="button"
      tabIndex={0}
      aria-label={label}
    >
      <video
        key={poster || src}
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        preload="metadata"
        playsInline
        muted
        loop
      />
      {!poster && (
        <div className="video-fallback" aria-hidden="true">
          🎬
        </div>
      )}
    </div>
  );
}

export default function Library({ onBack }) {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menu, setMenu] = useState(null);
  const menuRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [lightbox, setLightbox] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [palette, setPalette] = useState(DEFAULT_COLORS);
  const [sortMode, setSortMode] = useState('none'); // 'none', 'color', 'title', 'date', 'rating', 'tmb', 'random'
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [libraryTheme, setLibraryTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('libraryTheme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        return storedTheme;
      }
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      ) {
        return 'light';
      }
    }
    return 'dark';
  });
  const [libraryView, setLibraryView] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedView = localStorage.getItem('libraryView');
      if (storedView === 'tri' || storedView === 'quadrants' || storedView === 'dual') {
        return storedView;
      }
    }
    return 'classic';
  });
  const [originalImages, setOriginalImages] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [triDraggingId, setTriDraggingId] = useState(null);
  const [triActiveZone, setTriActiveZone] = useState(null);
  const [dualActiveCell, setDualActiveCell] = useState(null);

  const saveSequenceRef = useRef(0);
  const lastSavedImagesRef = useRef(new Map());

  const [zoom, setZoom] = useState(
    () => parseFloat(localStorage.getItem('libraryZoom')) || 0.5
  );

  const [words, setWords] = useState([]);
  const [wordInspector, setWordInspector] = useState(null);
  const [wordTextDraft, setWordTextDraft] = useState('');
  const [wordTagInput, setWordTagInput] = useState('');
  const [wordInput, setWordInput] = useState('');
  const [sounds, setSounds] = useState([]);
  const [soundModal, setSoundModal] = useState(null);
  const [soundTitle, setSoundTitle] = useState('');
  const [soundThumb, setSoundThumb] = useState(null);
  const [soundColor, setSoundColor] = useState('');
  const [soundCategory, setSoundCategory] = useState('');
  const [soundGender, setSoundGender] = useState('');
  const [soundQuality, setSoundQuality] = useState('');
  const [soundPosition, setSoundPosition] = useState('');
  const [soundCustomTags, setSoundCustomTags] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [soundMenu, setSoundMenu] = useState(null);
  const soundMenuRef = useRef(null);
  const [soundMenuPosition, setSoundMenuPosition] = useState({ x: 0, y: 0 });
  const [editingSoundId, setEditingSoundId] = useState(null);
  const [soundThumbPreview, setSoundThumbPreview] = useState(null);
  const [soundMimeType, setSoundMimeType] = useState('');
  const [hideQualityImages, setHideQualityImages] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hideQualityImages');
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return false;
  });
  const [hiddenQuality, setHiddenQuality] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hideQualitySelection');
      if (stored) {
        return parseHiddenQualityPreference(stored);
      }
    }
    return DEFAULT_HIDDEN_QUALITY;
  });

  const filteredImages = hideQualityImages
    ? images.filter(
        (img) => findPresetTag(img.tags, QUALITY_TAGS) !== hiddenQuality
      )
    : images;

  const displayedWords = useMemo(
    () =>
      sortMode === 'tmb'
        ? sortItemsByTmb(
            words,
            (word) => word?.tags,
            (word) => (typeof word?.text === 'string' ? word.text : '')
          )
        : words,
    [sortMode, words]
  );

  const displayedSounds = useMemo(
    () =>
      sortMode === 'tmb'
        ? sortItemsByTmb(
            sounds,
            (sound) => sound?.tags,
            (sound) => (typeof sound?.title === 'string' ? sound.title : '')
          )
        : sounds,
    [sortMode, sounds]
  );

  const soundModalMime =
    soundMimeType || (soundModal ? extractMimeType(soundModal) : '') || '';
  const soundModalIsVideo = soundModalMime.startsWith('video/');

  const imageCount = filteredImages.length;
  const wordCount = displayedWords.length;
  const soundCount = displayedSounds.length;
  const totalCount = imageCount + wordCount + soundCount;

  const ratingSummary = useMemo(() => {
    if (!images.length) {
      return new Map();
    }

    const annotated = images.map((img) => ({
      id: img.id,
      title: typeof img.title === 'string' ? img.title : '',
      rating: typeof img.rating === 'number' ? img.rating : null,
      wins: img.stats?.wins ?? 0,
      totalDuels: img.stats?.totalDuels ?? 0,
      lastPlayedAt: img.lastPlayedAt ?? 0,
    }));

    const rankedEntries = annotated
      .filter((entry) => entry.rating != null)
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (b.totalDuels !== a.totalDuels) return b.totalDuels - a.totalDuels;
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.lastPlayedAt !== a.lastPlayedAt) return b.lastPlayedAt - a.lastPlayedAt;
        return a.title.localeCompare(b.title);
      });

    const summary = new Map();
    rankedEntries.forEach((entry, index) => {
      summary.set(entry.id, {
        rank: index + 1,
        rating: entry.rating,
      });
    });

    annotated.forEach((entry) => {
      if (!summary.has(entry.id)) {
        summary.set(entry.id, {
          rank: null,
          rating: entry.rating,
        });
      }
    });

    return summary;
  }, [images]);

  // Restore masonry spans by normalizing stored images to their natural size
  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    let cancelled = false;

    const readDimensions = (dataUrl) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => resolve({ width: undefined, height: undefined });
        img.src = dataUrl;
      });

    const runQueue = (items, worker, concurrency = 4) => {
      if (!items.length) return Promise.resolve();
      let pointer = 0;
      const workers = Math.min(concurrency, items.length);
      const tasks = Array.from({ length: workers }, async () => {
        while (!cancelled) {
          const currentIndex = pointer;
          if (currentIndex >= items.length) {
            break;
          }
          pointer += 1;
          try {
            await worker(items[currentIndex]);
          } catch (err) {
            console.error('Library hydration task failed', err);
          }
        }
      });
      return Promise.all(tasks);
    };

    const scheduleIdle = (task) => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === 'function') {
        const handle = window.requestIdleCallback(() => {
          if (!cancelled) task();
        });
        return () => {
          if (typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(handle);
          }
        };
      }
      const timeout = window.setTimeout(() => {
        if (!cancelled) task();
      }, 16);
      return () => window.clearTimeout(timeout);
    };

    const hydrateImages = async () => {
      const saved = localStorage.getItem('mazedImages');
      if (!saved) return;

      let parsed;
      try {
        parsed = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved images', e);
        return;
      }

      if (!Array.isArray(parsed)) return;

      const storageStatus = new Map();
      const normalized = [];
      const loadQueue = [];
      const measureQueue = [];

      parsed.forEach((entry) => {
        if (!entry || typeof entry.id === 'undefined') {
          return;
        }

        const base = { ...entry };
        const { tags: normalizedTags, triCategory } = syncTriCategoryWithTags(
          base.tags,
          base.triCategory
        );
        const triOrder = normalizeTriOrder(base.triOrder);
        base.tags = normalizedTags;
        base.triCategory = triCategory;
        base.triOrder = triOrder;

        const dataUrl =
          typeof base.dataUrl === 'string' && base.dataUrl.length
            ? base.dataUrl
            : null;
        const mimeType = base.mimeType || (dataUrl ? extractMimeType(dataUrl) : null);

        delete base.dataUrl;

        const image = {
          ...base,
          dataUrl,
          mimeType,
        };

        storageStatus.set(image.id, !entry.dataUrl);
        normalized.push(image);

        if (!dataUrl) {
          loadQueue.push({
            id: image.id,
            width: image.width,
            height: image.height,
            mimeType: image.mimeType,
          });
        } else if (!image.width || !image.height) {
          measureQueue.push({
            id: image.id,
            dataUrl,
          });
        }
      });

      if (cancelled || !normalized.length) {
        return;
      }

      setImages(normalized);

      lastSavedImagesRef.current = new Map(
        normalized.map((img) => [
          img.id,
          {
            dataUrl:
              typeof img.dataUrl === 'string' && img.dataUrl.length
                ? img.dataUrl
                : null,
            mimeType: img.mimeType || null,
            stored: storageStatus.get(img.id) ?? false,
          },
        ])
      );

      const ensureDimensions = async ({ id, dataUrl }) => {
        if (!dataUrl) return;
        const { width, height } = await readDimensions(dataUrl);
        if (cancelled || (!width && !height)) {
          return;
        }
        setImages((current) => {
          let changed = false;
          const next = current.map((img) => {
            if (img.id !== id) return img;
            const nextWidth = width || img.width;
            const nextHeight = height || img.height;
            if (nextWidth === img.width && nextHeight === img.height) {
              return img;
            }
            changed = true;
            return {
              ...img,
              width: nextWidth,
              height: nextHeight,
            };
          });
          return changed ? next : current;
        });
      };

      const loadStoredImage = async ({ id, width, height, mimeType }) => {
        const dataUrl = await loadImageData(id);
        if (cancelled) return;

        if (!dataUrl) {
          setImages((current) => current.filter((img) => img.id !== id));
          const ref = lastSavedImagesRef.current;
          if (ref) {
            ref.delete(id);
          }
          return;
        }

        let resolvedWidth = width;
        let resolvedHeight = height;
        if (!resolvedWidth || !resolvedHeight) {
          const dims = await readDimensions(dataUrl);
          if (dims.width) resolvedWidth = dims.width;
          if (dims.height) resolvedHeight = dims.height;
        }
        const resolvedMime = mimeType || extractMimeType(dataUrl) || null;

        if (cancelled) return;

        setImages((current) => {
          let changed = false;
          const next = current.map((img) => {
            if (img.id !== id) return img;
            changed = true;
            return {
              ...img,
              dataUrl,
              mimeType: resolvedMime,
              width: resolvedWidth || img.width,
              height: resolvedHeight || img.height,
            };
          });
          return changed ? next : current;
        });

        const ref = lastSavedImagesRef.current;
        if (ref) {
          ref.set(id, {
            dataUrl,
            mimeType: resolvedMime,
            stored: true,
          });
        }
      };

      const initialBatch = loadQueue.splice(0, 8);
      if (initialBatch.length) {
        runQueue(initialBatch, loadStoredImage, Math.min(4, initialBatch.length));
      }

      if (loadQueue.length) {
        scheduleIdle(() => {
          runQueue(loadQueue, loadStoredImage, 2);
        });
      }

      if (measureQueue.length) {
        scheduleIdle(() => {
          runQueue(measureQueue, ensureDimensions, 2);
        });
      }
    };

    hydrateImages();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load saved words and sounds from localStorage on mount
  useEffect(() => {
    const savedWords = localStorage.getItem('mazedWords');
    if (savedWords) {
      try {
        const parsed = JSON.parse(savedWords);
        if (Array.isArray(parsed)) {
          let changed = false;
          const validEntries = parsed.filter(
            (entry) => entry && typeof entry.id !== 'undefined',
          );
          if (validEntries.length !== parsed.length) {
            changed = true;
          }
          const normalized = validEntries.map((entry) => {
            const text =
              typeof entry.text === 'string' ? entry.text : '';
            if (text !== entry.text) {
              changed = true;
            }
            const tags = normalizeImageTags(entry.tags);
            if (!tagsAreEqual(tags, entry.tags)) {
              changed = true;
            }
            const createdAt =
              typeof entry.createdAt === 'number'
                ? entry.createdAt
                : typeof entry.id === 'number'
                ? entry.id
                : Date.now();
            if (createdAt !== entry.createdAt) {
              changed = true;
            }
            return {
              ...entry,
              text,
              tags,
              createdAt,
            };
          });
          setWords(normalized);
          if (changed) {
            try {
              localStorage.setItem(
                'mazedWords',
                JSON.stringify(normalized),
              );
            } catch (err) {
              console.error('Failed to persist normalized words', err);
            }
          }
        } else {
          setWords([]);
        }
      } catch (e) {
        console.error('Failed to parse saved words', e);
      }
    }

    let cancelled = false;

    const loadSavedSounds = async () => {
      const savedSounds = localStorage.getItem('mazedSounds');
      if (!savedSounds) return;
      let parsed;
      try {
        parsed = JSON.parse(savedSounds);
      } catch (e) {
        console.error('Failed to parse saved sounds', e);
        return;
      }
      if (!Array.isArray(parsed)) return;

      const loaded = [];
      let metadataNeedsUpdate = false;
      const thumbnailPromises = [];

      for (const entry of parsed) {
        if (!entry || typeof entry.id === 'undefined') continue;
        const base = getSoundMetadata(entry);
        let dataUrl = entry.dataUrl;
        let stored = true;

        if (dataUrl) {
          stored = await storeSoundData(entry.id, dataUrl);
          if (stored) {
            metadataNeedsUpdate = true;
          }
        } else {
          dataUrl = await loadSoundData(entry.id);
        }

        if (!dataUrl && entry.dataUrl) {
          dataUrl = entry.dataUrl;
        }

        if (!dataUrl) continue;

        const resolvedMime =
          base.mimeType || extractMimeType(dataUrl) || entry.mimeType || '';
        if (resolvedMime && resolvedMime !== base.mimeType) {
          metadataNeedsUpdate = true;
        }
        const enrichedBase = { ...base, mimeType: resolvedMime };
        if (resolvedMime.startsWith('video/') && !enrichedBase.thumbnail) {
          const promise = generateVideoThumbnail(dataUrl).then((thumb) => {
            if (!thumb) {
              return false;
            }
            enrichedBase.thumbnail = thumb;
            return true;
          });
          thumbnailPromises.push(promise);
        }

        loaded.push({ base: enrichedBase, dataUrl, stored });
      }

      if (cancelled) return;

      const toSoundList = () =>
        loaded.map(({ base, dataUrl }) => ({ ...base, dataUrl }));

      const persistMetadata = () => {
        const metadata = loaded.map(({ base, stored, dataUrl }) =>
          stored ? base : { ...base, dataUrl }
        );
        try {
          localStorage.setItem('mazedSounds', JSON.stringify(metadata));
        } catch (err) {
          console.error('Failed to update sound metadata', err);
        }
      };

      setSounds(toSoundList());

      if (metadataNeedsUpdate) {
        persistMetadata();
      }

      if (thumbnailPromises.length) {
        Promise.all(thumbnailPromises).then((results) => {
          if (cancelled) return;
          const generatedAny = results.some(Boolean);
          if (!generatedAny) {
            return;
          }
          setSounds(toSoundList());
          persistMetadata();
        });
      }
    };

    loadSavedSounds();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveImages = (imgs) => {
    const normalized = imgs.map((img) => {
      const { tags: normalizedTags, triCategory } = syncTriCategoryWithTags(
        img.tags,
        img.triCategory
      );
      const mimeType = img.mimeType || extractMimeType(img.dataUrl) || null;
      const triOrder = normalizeTriOrder(img.triOrder);
      return {
        ...img,
        tags: normalizedTags,
        mimeType,
        triCategory,
        triOrder,
      };
    });
    setImages(normalized);

    if (typeof window === 'undefined') {
      const snapshot = new Map();
      normalized.forEach((img) => {
        const previous = lastSavedImagesRef.current.get(img.id);
        snapshot.set(img.id, {
          dataUrl: img.dataUrl,
          mimeType: img.mimeType,
          stored: previous?.stored ?? false,
        });
      });
      lastSavedImagesRef.current = snapshot;
      return normalized;
    }

    const sequence = (saveSequenceRef.current += 1);
    const previous = lastSavedImagesRef.current || new Map();
    (async () => {
      try {
        if (!normalized.length) {
          if (saveSequenceRef.current === sequence) {
            localStorage.setItem('mazedImages', JSON.stringify([]));
            lastSavedImagesRef.current = new Map();
          }
          return;
        }

        const tasks = [];
        const taskIndex = new Map();

        normalized.forEach((img, idx) => {
          const prev = previous.get(img.id);
          const prevStored = prev?.stored ?? false;
          const prevDataUrl = prev?.dataUrl;
          const prevMime = prev?.mimeType;
          const hasData = typeof img.dataUrl === 'string' && img.dataUrl.length > 0;
          const needsStore =
            hasData &&
            (!prevStored || prevDataUrl !== img.dataUrl || prevMime !== img.mimeType);
          if (needsStore) {
            taskIndex.set(idx, tasks.length);
            tasks.push(storeImageData(img.id, img.dataUrl, img.mimeType));
          }
        });

        const results = tasks.length ? await Promise.all(tasks) : [];
        const storedStatuses = normalized.map((img, idx) => {
          const resultIdx = taskIndex.get(idx);
          if (typeof resultIdx === 'number') {
            const outcome = results[resultIdx];
            return outcome || typeof outcome === 'undefined';
          }
          const prev = previous.get(img.id);
          return prev?.stored ?? false;
        });

        const metadata = normalized.map((img, idx) => {
          const { dataUrl, ...meta } = img;
          return storedStatuses[idx] ? meta : { ...meta, dataUrl };
        });

        if (saveSequenceRef.current === sequence) {
          try {
            localStorage.setItem('mazedImages', JSON.stringify(metadata));
          } catch (err) {
            console.error('Failed to update images metadata', err);
          }
          const nextMap = new Map();
          normalized.forEach((img, idx) => {
            nextMap.set(img.id, {
              dataUrl: img.dataUrl,
              mimeType: img.mimeType,
              stored: storedStatuses[idx],
            });
          });
          lastSavedImagesRef.current = nextMap;
        }
      } catch (err) {
        console.error('Failed to save images metadata', err);
        if (saveSequenceRef.current === sequence) {
          try {
            localStorage.setItem('mazedImages', JSON.stringify(normalized));
          } catch (fallbackErr) {
            console.error('Failed to fallback save images', fallbackErr);
          }
          const fallbackMap = new Map();
          normalized.forEach((img) => {
            fallbackMap.set(img.id, {
              dataUrl: img.dataUrl,
              mimeType: img.mimeType,
              stored: false,
            });
          });
          lastSavedImagesRef.current = fallbackMap;
        }
      }
    })();

    return normalized;
  };

  const saveWords = (w) => {
    setWords(w);
    localStorage.setItem('mazedWords', JSON.stringify(w));
  };

  const handleWordDragStart = useCallback((event, wordText) => {
    if (!event?.dataTransfer) {
      return;
    }

    const textPayload = typeof wordText === 'string' ? wordText : '';
    event.dataTransfer.setData('text/plain', textPayload);
    event.dataTransfer.effectAllowed = 'copy';
  }, []);

  const saveSounds = async (list) => {
    const metadataOnly = list.map(getSoundMetadata);
    const results = list.length
      ? await Promise.all(
          list.map((sound) => storeSoundData(sound.id, sound.dataUrl))
        )
      : [];

    const payload =
      list.length === 0
        ? metadataOnly
        : metadataOnly.map((meta, idx) => {
            const stored = results[idx];
            if (stored || typeof stored === 'undefined') {
              return meta;
            }
            const dataUrl = list[idx]?.dataUrl;
            return dataUrl ? { ...meta, dataUrl } : meta;
          });

    try {
      localStorage.setItem('mazedSounds', JSON.stringify(payload));
    } catch (err) {
      console.error('Failed to save sounds', err);
      throw err;
    }

    setSounds(list);
    return results;
  };

  const updateWord = (id, updates) => {
    if (!updates || typeof updates !== 'object') {
      return;
    }
    let hasUpdate = false;
    let nextWord = null;
    const nextWords = words.map((word) => {
      if (word.id !== id) {
        return word;
      }
      const payload = { ...updates };
      if ('text' in payload) {
        const nextText =
          typeof payload.text === 'string' ? payload.text.trim() : '';
        payload.text = nextText || word.text || '';
      }
      if ('tags' in payload) {
        payload.tags = normalizeImageTags(payload.tags);
      }
      if ('createdAt' in payload) {
        payload.createdAt =
          typeof payload.createdAt === 'number'
            ? payload.createdAt
            : word.createdAt;
      }
      nextWord = { ...word, ...payload };
      if (!hasUpdate) {
        hasUpdate = JSON.stringify(nextWord) !== JSON.stringify(word);
      }
      return nextWord;
    });
    if (!nextWord) {
      return;
    }
    if (hasUpdate) {
      saveWords(nextWords);
    }
    setWordInspector((current) =>
      current && current.id === id ? nextWord : current
    );
  };

  const deleteWord = (id) => {
    const updated = words.filter((word) => word.id !== id);
    if (updated.length === words.length) {
      return;
    }
    saveWords(updated);
    setWordInspector((current) =>
      current && current.id === id ? null : current
    );
  };

  const openWordInspector = (word) => {
    if (!word) {
      return;
    }
    const target =
      typeof word === 'object'
        ? word
        : words.find((entry) => entry.id === word) || null;
    if (!target) {
      return;
    }
    setWordInspector(target);
  };

  const handleThemeChange = (nextTheme) => {
    setLibraryTheme(nextTheme);
    setSettingsOpen(false);
    setSortMenuOpen(false);
  };

  useEffect(() => {
    localStorage.setItem('libraryZoom', zoom);
  }, [zoom]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('libraryTheme', libraryTheme);
    }
  }, [libraryTheme]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('libraryView', libraryView);
    }
  }, [libraryView]);
  const maxZoom = 1; // max 100% of native size
  const colWidth = 250 * zoom;
  const rowHeight = 1; // finer base row height for masonry grid
  const gridGap = 20; // keep in sync with .image-grid gap in CSS

  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) => {
          const next = z + (e.deltaY < 0 ? 0.1 : -0.1);
          return Math.min(maxZoom, Math.max(0.1, next));
        });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [maxZoom]);

  useEffect(() => {
    if (lightbox) {
      setLightboxZoom(1);
      setTitleInput(lightbox.title || '');
      setDescInput(lightbox.description || '');
      setTagInput('');
      setEditingTitle(false);
    }
  }, [lightbox?.id]);

  useEffect(() => {
    if (wordInspector) {
      setWordTextDraft(wordInspector.text || '');
      setWordTagInput('');
    } else {
      setWordTextDraft('');
      setWordTagInput('');
    }
  }, [wordInspector?.id]);

  useEffect(() => {
    if (!wordInspector) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setWordInspector(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [wordInspector]);

  useEffect(() => {
    if (!lightbox) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) {
        return;
      }

      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
        return;
      }

      const target = event.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (filteredImages.length <= 1) {
        return;
      }

      const currentIndex = filteredImages.findIndex(
        (img) => img.id === lightbox.id,
      );

      if (currentIndex === -1) {
        return;
      }

      event.preventDefault();

      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex =
        (currentIndex + direction + filteredImages.length) %
        filteredImages.length;
      const nextImage = filteredImages[nextIndex];

      if (nextImage && nextImage.id !== lightbox.id) {
        setLightbox(nextImage);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredImages, lightbox, setLightbox]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'hideQualityImages',
        hideQualityImages ? 'true' : 'false'
      );
      localStorage.setItem('hideQualitySelection', hiddenQuality);
      localStorage.removeItem('hideShadowImages');
      localStorage.removeItem('hideShadowOrientation');
    }
    if (
      hideQualityImages &&
      lightbox &&
      findPresetTag(lightbox.tags, QUALITY_TAGS) === hiddenQuality
    ) {
      setLightbox(null);
    }
  }, [hideQualityImages, hiddenQuality, lightbox]);

  useLayoutEffect(() => {
    if (!menu || !menuRef.current || typeof window === 'undefined') {
      return;
    }
    const rect = menuRef.current.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;
    const padding = 8;
    let nextX = menu.x;
    let nextY = menu.y;
    if (nextX + rect.width + padding > innerWidth) {
      nextX = Math.max(padding, innerWidth - rect.width - padding);
    }
    if (nextY + rect.height + padding > innerHeight) {
      nextY = Math.max(padding, innerHeight - rect.height - padding);
    }
    if (nextX < padding) nextX = padding;
    if (nextY < padding) nextY = padding;
    setMenuPosition((prev) =>
      prev.x === nextX && prev.y === nextY ? prev : { x: nextX, y: nextY }
    );
  }, [menu]);

  useLayoutEffect(() => {
    if (!soundMenu || !soundMenuRef.current || typeof window === 'undefined') {
      return;
    }
    const rect = soundMenuRef.current.getBoundingClientRect();
    const { innerWidth, innerHeight } = window;
    const padding = 8;
    let nextX = soundMenu.x;
    let nextY = soundMenu.y;
    if (nextX + rect.width + padding > innerWidth) {
      nextX = Math.max(padding, innerWidth - rect.width - padding);
    }
    if (nextY + rect.height + padding > innerHeight) {
      nextY = Math.max(padding, innerHeight - rect.height - padding);
    }
    if (nextX < padding) nextX = padding;
    if (nextY < padding) nextY = padding;
    setSoundMenuPosition((prev) =>
      prev.x === nextX && prev.y === nextY
        ? prev
        : { x: nextX, y: nextY }
    );
  }, [soundMenu]);

  useEffect(() => {
    loadPalette().then(setPalette);
    const handler = () => {
      loadPalette().then(setPalette);
    };
    window.addEventListener('storage', handler);
    window.addEventListener('palette-change', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('palette-change', handler);
    };
  }, []);

  useEffect(() => {
    const close = () => {
      setMenu(null);
      setSoundMenu(null);
      setSortMenuOpen(false);
      setSettingsOpen(false);
      setViewMenuOpen(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const deleteImage = (id) => {
    const updated = images.filter((img) => img.id !== id);
    saveImages(updated);
    if (typeof window !== 'undefined') {
      deleteImageData(id);
    }
  };

  const deleteSound = async (id) => {
    const updated = sounds.filter((s) => s.id !== id);
    try {
      await saveSounds(updated);
    } catch (err) {
      console.error('Failed to update sounds', err);
      return;
    }
    await deleteSoundData(id);
  };

  const openImageContextMenu = (event, imageId) => {
    event.preventDefault();
    const { clientX, clientY } = event;
    setMenu({ id: imageId, x: clientX, y: clientY });
    setMenuPosition({ x: clientX, y: clientY });
  };

  const openSoundContextMenu = (event, soundId) => {
    event.preventDefault();
    const { clientX, clientY } = event;
    setSoundMenu({ id: soundId, x: clientX, y: clientY });
    setSoundMenuPosition({ x: clientX, y: clientY });
  };

  const moveImage = (fromId, toId) => {
    const fromIndex = images.findIndex((img) => img.id === fromId);
    const toIndex = images.findIndex((img) => img.id === toId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    saveImages(updated);
  };

  const updateImage = (id, updates) => {
    const currentImage = images.find((img) => img.id === id) || null;
    let payload = updates;

    if (updates && typeof updates === 'object') {
      if ('dataUrl' in updates) {
        const mimeType =
          updates.mimeType || extractMimeType(updates.dataUrl) || null;
        payload = { ...payload, mimeType };
      }

      if ('tags' in updates) {
        const { tags: normalizedTags, triCategory } = syncTriCategoryWithTags(
          updates.tags,
          updates.triCategory
        );
        const previousCategory = normalizeTriCategory(currentImage?.triCategory);
        const nextCategory = normalizeTriCategory(triCategory);
        payload = {
          ...payload,
          tags: normalizedTags,
          triCategory: nextCategory,
          triOrder:
            previousCategory && previousCategory === nextCategory
              ? currentImage?.triOrder ?? null
              : null,
        };
      } else if ('triCategory' in updates) {
        const nextCategory = normalizeTriCategory(updates.triCategory);
        payload = {
          ...payload,
          triCategory: nextCategory,
          tags: mergeTriCategoryIntoTags(
            'tags' in updates ? updates.tags : currentImage?.tags,
            nextCategory
          ),
          triOrder: nextCategory ? currentImage?.triOrder ?? null : null,
        };
      }

      if ('triOrder' in updates) {
        payload = {
          ...payload,
          triOrder: normalizeTriOrder(updates.triOrder),
        };
      }
    }

    const updated = images.map((img) =>
      img.id === id ? { ...img, ...payload } : img
    );

    const normalized = saveImages(updated);
    const next = normalized.find((i) => i.id === id);
    if (next) setLightbox(next);
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return [
      (bigint >> 16) & 255,
      (bigint >> 8) & 255,
      bigint & 255,
    ];
  };


  const rgbToHsl = ([r, g, b]) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [h, s, l];
  };

  const computeDominantColor = (dataUrl) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(extractDominantColor(data));
      };
      img.src = dataUrl;
    });

  const detectPaletteColor = async (dataUrl) => {
    const dom = await computeDominantColor(dataUrl);
    const [, s, l] = rgbToHsl(dom);
    const paletteRgb = palette.map(hexToRgb);
    let target = dom;
    if (s < 0.2) {
      target = l < 0.5 ? [0, 0, 0] : [255, 255, 255];
    }
    let bestIndex = 0;
    let min = Infinity;
    paletteRgb.forEach((p, i) => {
      const d = colorDiff(target, p);
      if (d < min) {
        min = d;
        bestIndex = i;
      }
    });
    const hex = palette[bestIndex];
    return { hex, name: hexToName(hex) };
  };

  const sortImages = (sorted, mode) => {
    if (sortMode === 'none') {
      setOriginalImages(images);
    }
    saveImages(sorted);
    setSortMode(mode);
  };

  const sortByTitle = () => {
    const sorted = [...images].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '')
    );
    sortImages(sorted, 'title');
  };

  const sortByDate = () => {
    const sorted = [...images].sort((a, b) => a.id - b.id);
    sortImages(sorted, 'date');
  };

  const sortByRating = () => {
    const sorted = [...images].sort((a, b) => {
      const ratingA = typeof a.rating === 'number' ? a.rating : -Infinity;
      const ratingB = typeof b.rating === 'number' ? b.rating : -Infinity;
      if (ratingB !== ratingA) return ratingB - ratingA;
      const duelsA = a.stats?.totalDuels ?? 0;
      const duelsB = b.stats?.totalDuels ?? 0;
      if (duelsB !== duelsA) return duelsB - duelsA;
      const winsA = a.stats?.wins ?? 0;
      const winsB = b.stats?.wins ?? 0;
      if (winsB !== winsA) return winsB - winsA;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
    sortImages(sorted, 'rating');
  };

  const sortByTmb = () => {
    const sorted = sortItemsByTmb(
      images,
      (img) => img?.tags,
      (img) => (typeof img?.title === 'string' ? img.title : '')
    );
    sortImages(sorted, 'tmb');
  };

  const shuffleImages = () => {
    const shuffled = [...images];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    sortImages(shuffled, 'random');
  };

  const resetSort = () => {
    if (sortMode !== 'none' && originalImages.length) {
      saveImages(originalImages);
    }
    setSortMode('none');
    setOriginalImages([]);
  };

  const autoSortByColor = async () => {
    const updated = await Promise.all(
      images.map(async (img) => {
        const { hex, name } = await detectPaletteColor(img.dataUrl);
        return { ...img, color: hex, title: name };
      })
    );
    const sorted = [...updated].sort(
      (a, b) => palette.indexOf(a.color) - palette.indexOf(b.color)
    );
    sortImages(sorted, 'color');
  };

  const processFile = (fileObj, imgTitle = '', imgTags = []) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result;
      const imgEl = new Image();
      imgEl.onload = async () => {
        const { hex, name } = await detectPaletteColor(result);
        const newImage = {
          id: Date.now(),
          title: imgTitle || name,
          description: '',
          tags: normalizeImageTags(imgTags),
          quadrants: [],
          color: hex,
          dataUrl: result,
          mimeType: extractMimeType(result) || null,
          width: imgEl.naturalWidth,
          height: imgEl.naturalHeight,
        };
        const updated = [...images, newImage];
        saveImages(updated);
      };
      imgEl.src = result;
    };
    reader.readAsDataURL(fileObj);
  };

  const uploadToServer = async (fileObj) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', fileObj);
      await fetch('/upload', { method: 'POST', body: form });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const isFileDrag = (e) => {
    const types = Array.from(e.dataTransfer?.types || []);
    return types.includes('Files') || types.includes('text/uri-list');
  };

  const handleDragOver = (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    let droppedFile = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!droppedFile) {
      const url =
        e.dataTransfer.getData('text/uri-list') ||
        e.dataTransfer.getData('text/plain');
      if (url) {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          droppedFile = new File([blob], 'dropped-image', {
            type: blob.type || 'image/png',
          });
        } catch (err) {
          console.error('Failed to fetch dropped image', err);
          return;
        }
      }
    }
    if (!droppedFile) return;

    const ext = droppedFile.name.toLowerCase().split('.').pop();
    const soundExts = ['mp3', 'mp4', 'wav', 'aiff', 'm4a'];
    const isSound =
      droppedFile.type.startsWith('audio/') ||
      droppedFile.type.startsWith('video/') ||
      soundExts.includes(ext);

    if (droppedFile.type.startsWith('image/')) {
      uploadToServer(droppedFile);
      processFile(droppedFile);
    } else if (isSound) {
      uploadToServer(droppedFile);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setSoundModal(result);
        setSoundTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
        setSoundThumb(null);
        setSoundThumbPreview(null);
        setSoundColor('');
        setSoundCategory('');
        setSoundGender('');
        setSoundQuality('');
        setSoundPosition('');
        setSoundCustomTags('');
        setEditingSoundId(null);
        const detectedMime =
          droppedFile.type || extractMimeType(result) || '';
        setSoundMimeType(detectedMime);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!wordInput.trim()) return;
    const timestamp = Date.now();
    const newWord = {
      id: timestamp,
      text: wordInput.trim(),
      tags: buildImageTags({}),
      createdAt: timestamp,
    };
    const updated = [...words, newWord];
    saveWords(updated);
    setWordInput('');
  };

  const saveDroppedSound = async () => {
    if (!soundModal) return;
    try {
      const thumbData = soundThumb
        ? await readFileAsDataURL(soundThumb)
        : soundThumbPreview;

      const tags = buildSoundTagsPayload({
        category: soundCategory,
        gender: soundGender,
        quality: soundQuality,
        position: soundPosition,
        customInput: soundCustomTags,
      });
      const tagString = tags.join(', ');
      const mimeType = soundMimeType || extractMimeType(soundModal) || '';
      const isVideo = mimeType.startsWith('video/');

      let finalThumb = thumbData || null;
      if (!finalThumb && isVideo) {
        finalThumb = await generateVideoThumbnail(soundModal);
      }

      const newSound = {
        id: editingSoundId || Date.now(),
        title: soundTitle || 'Untitled',
        dataUrl: soundModal,
        thumbnail: finalThumb,
        color: soundColor,
        mimeType,
        tags,
        tag: tagString,
      };
      const updated = editingSoundId
        ? sounds.map((s) => (s.id === editingSoundId ? newSound : s))
        : [...sounds, newSound];

      await saveSounds(updated);

      resetSoundModalState();
    } catch (err) {
      console.error('Failed to save sound', err);
    }
  };

  const openSoundModalForEdit = (snd) => {
    if (!snd) return;
    const tags = parseSoundTags(snd);
    setSoundModal(snd.dataUrl);
    setSoundTitle(snd.title || '');
    setSoundThumb(null);
    setSoundThumbPreview(snd.thumbnail || null);
    setSoundColor(snd.color || '');
    setSoundCategory(findPresetTag(tags, CATEGORY_TAGS));
    setSoundGender(findPresetTag(tags, GENDER_TAGS));
    setSoundQuality(findPresetTag(tags, QUALITY_TAGS));
    setSoundPosition(findPresetTag(tags, POSITION_TAGS));
    setSoundCustomTags(extractCustomSoundTags(tags).join(', '));
    setEditingSoundId(snd.id);
    setSoundMimeType(snd.mimeType || extractMimeType(snd.dataUrl) || '');
  };

  const resetSoundModalState = () => {
    setSoundModal(null);
    setSoundTitle('');
    setSoundThumb(null);
    setSoundThumbPreview(null);
    setSoundColor('');
    setSoundCategory('');
    setSoundGender('');
    setSoundQuality('');
    setSoundPosition('');
    setSoundCustomTags('');
    setEditingSoundId(null);
    setSoundMimeType('');
  };

  const getMasonrySpan = (targetHeight) => {
    if (!targetHeight || Number.isNaN(targetHeight)) return 1;
    return Math.max(
      1,
      Math.ceil((targetHeight + gridGap) / (rowHeight + gridGap))
    );
  };

  const renderImageCard = (img, options = {}) => {
    const { disableReorderDrop = false, forceDraggable = false } = options;
    const canDrag =
      forceDraggable ||
      (sortMode !== 'title' &&
        sortMode !== 'date' &&
        sortMode !== 'rating' &&
        sortMode !== 'tmb');
    const allowInternalReorder =
      canDrag &&
      !disableReorderDrop &&
      sortMode !== 'title' &&
      sortMode !== 'date' &&
      sortMode !== 'rating' &&
      sortMode !== 'tmb';
    const scaledHeight =
      img.width && img.height
        ? (img.height / img.width) * colWidth
        : colWidth;
    const span = getMasonrySpan(scaledHeight);
    const isLoaded = Boolean(img.dataUrl);
    const placeholderHeight = Math.max(scaledHeight, colWidth * 0.75);
    const ratingInfo = ratingSummary.get(img.id);
    const hasRating = ratingInfo && typeof ratingInfo.rating === 'number';
    const typeInfo = ITEM_TYPE_INFO.image;
    return (
      <div
        key={img.id}
        className={`image-card${isLoaded ? '' : ' loading'}`}
        style={{ gridRowEnd: `span ${span}` }}
        data-item-type="image"
        data-pretty-symbol={typeInfo.symbol}
        draggable={canDrag}
        onContextMenu={(e) => openImageContextMenu(e, img.id)}
        onClick={isLoaded ? () => setLightbox(img) : undefined}
        onDragStart={
          sortMode !== 'title' &&
          sortMode !== 'date' &&
          sortMode !== 'rating' &&
          sortMode !== 'tmb'
            ? (event) => {
                setDraggedId(img.id);
                if (event.dataTransfer) {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData(
                    'application/x-library-image-id',
                    String(img.id)
                  );
                  event.dataTransfer.setData('text/plain', String(img.id));
                }
              }
            : undefined
        }
        onDragOver={
          canDrag
            ? (event) => {
                if (event.dataTransfer?.files?.length) {
                  handleDragOver(event);
                } else if (allowInternalReorder) {
                  event.preventDefault();
                }
              }
            : undefined
        }
        onDrop={
          canDrag
            ? (event) => {
                if (event.dataTransfer?.files?.length) {
                  handleDrop(event);
                  return;
                }
                if (allowInternalReorder) {
                  event.preventDefault();
                  if (draggedId && draggedId !== img.id) {
                    moveImage(draggedId, img.id);
                  }
                }
              }
            : undefined
        }
        onDragEnd={
          sortMode !== 'title' &&
          sortMode !== 'date' &&
          sortMode !== 'rating' &&
          sortMode !== 'tmb'
            ? () => {
                setDraggedId(null);
                setDualActiveCell(null);
              }
            : undefined
        }
      >
        {isLoaded ? (
          <img
            draggable={false}
            src={img.dataUrl}
            alt={img.title}
            onLoad={(e) => {
              const w = e.target.naturalWidth;
              const h = e.target.naturalHeight;
              if (w !== img.width || h !== img.height) {
                const updated = images.map((i) =>
                  i.id === img.id ? { ...i, width: w, height: h } : i
                );
                saveImages(updated);
                if (lightbox && lightbox.id === img.id) {
                  setLightbox((l) => ({ ...l, width: w, height: h }));
                }
              }
            }}
            onContextMenu={(e) => openImageContextMenu(e, img.id)}
            onClick={() => setLightbox(img)}
          />
        ) : (
          <div
            className="image-loading"
            style={{ minHeight: `${Math.round(placeholderHeight)}px` }}
            role="status"
            aria-label="Loading image"
          >
            <div className="image-loading-spinner" aria-hidden="true" />
            <span className="image-loading-text">Loading…</span>
          </div>
        )}
        <div className="image-overlay">
          <h3>
            <span
              className="color-dot"
              style={{ background: img.color }}
            ></span>
            {img.title}
          </h3>
          {hasRating ? (
            <p className="image-meta">
              {ratingInfo.rank ? (
                <span className="image-meta-rank">#{ratingInfo.rank}</span>
              ) : null}
              <span className="image-meta-elo">
                {`${Math.round(ratingInfo.rating)} Elo`}
              </span>
            </p>
          ) : (
            <p className="image-meta image-meta-unranked">Unranked</p>
          )}
        </div>
      </div>
    );
  };

  const renderSoundCard = (snd, width = colWidth) => {
    const span = getMasonrySpan(width);
    const typeInfo = ITEM_TYPE_INFO.sound;
    const mimeType = snd.mimeType || extractMimeType(snd.dataUrl) || '';
    const isVideo = mimeType.startsWith('video/');
    const placeholderIcon = isVideo ? '🎬' : '♪';
    return (
      <div
        key={snd.id}
        className="image-card sound-card"
        style={{ gridRowEnd: `span ${span}` }}
        data-item-type="sound"
        data-pretty-symbol={typeInfo.symbol}
        onContextMenu={(e) => openSoundContextMenu(e, snd.id)}
        role="button"
        tabIndex={0}
        aria-label={`Edit sound ${snd.title || 'clip'}`}
        onClick={() => openSoundModalForEdit(snd)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openSoundModalForEdit(snd);
          }
        }}
      >
        {isVideo ? (
          <VideoPreview src={snd.dataUrl} poster={snd.thumbnail} title={snd.title} />
        ) : snd.thumbnail ? (
          <img src={snd.thumbnail} alt={snd.title} draggable={false} />
        ) : (
          <div className="sound-placeholder">{placeholderIcon}</div>
        )}
        <div className="image-overlay">
          <h3>
            {snd.color && (
              <span
                className="color-dot"
                style={{ background: snd.color }}
              ></span>
            )}
            {snd.title}
          </h3>
          {isVideo ? null : (
            <audio
              controls
              src={snd.dataUrl}
              className="sound-player"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            ></audio>
          )}
        </div>
      </div>
    );
  };

  const triAssignments = useMemo(() => {
    const empty = TRI_CATEGORY_IDS.reduce(
      (acc, id) => ({ ...acc, [id]: [] }),
      {}
    );
    if (!images.length) {
      return { categories: empty, drawer: [] };
    }
    const lists = buildTriIdLists(images);
    const imageMap = new Map(images.map((img) => [img.id, img]));
    const categories = { ...empty };
    TRI_CATEGORY_IDS.forEach((id) => {
      const ids = lists[id] || [];
      categories[id] = ids
        .map((imageId) => imageMap.get(imageId))
        .filter(Boolean);
    });
    const drawer = (lists.drawer || [])
      .map((imageId) => imageMap.get(imageId))
      .filter(Boolean);
    return { categories, drawer };
  }, [images]);

  const quadrantAssignments = useMemo(() => {
    const groups = QUADRANT_ORDER.reduce((acc, primary) => {
      acc[primary] = {
        core: [],
        subs: QUADRANT_ORDER.reduce((subAcc, secondary) => {
          subAcc[secondary] = [];
          return subAcc;
        }, {}),
      };
      return acc;
    }, {});

    const unassigned = [];

    filteredImages.forEach((img) => {
      const quadrants = Array.isArray(img.quadrants) ? img.quadrants : [];
      const [primary, secondary] = quadrants;
      const normalizedPrimary = QUADRANT_ORDER.includes(primary)
        ? primary
        : null;
      const normalizedSecondary = QUADRANT_ORDER.includes(secondary)
        ? secondary
        : null;

      if (!normalizedPrimary) {
        unassigned.push(img);
        return;
      }

      const target = groups[normalizedPrimary];
      if (normalizedSecondary && normalizedSecondary !== normalizedPrimary) {
        target.subs[normalizedSecondary].push(img);
      } else {
        target.core.push(img);
      }
    });

    return { groups, unassigned };
  }, [filteredImages]);

  const dualAssignments = useMemo(() => {
    const layout = DUAL_ROWS.reduce((acc, row) => {
      acc[row] = DUAL_COLUMNS.reduce((columnAcc, column) => {
        columnAcc[column] = [];
        return columnAcc;
      }, {});
      return acc;
    }, {});

    const unassigned = [];

    filteredImages.forEach((img) => {
      const gender = findPresetTag(img.tags, GENDER_TAGS);
      const quality = findPresetTag(img.tags, QUALITY_TAGS);
      const normalizedGender = DUAL_COLUMNS.includes(gender) ? gender : '';
      const normalizedQuality = DUAL_ROWS.includes(quality) ? quality : '';

      if (!normalizedGender || !normalizedQuality) {
        unassigned.push(img);
        return;
      }

      layout[normalizedQuality][normalizedGender].push(img);
    });

    return { layout, unassigned };
  }, [filteredImages]);

  const isFileTransfer = (dataTransfer) => {
    if (!dataTransfer) return false;
    if (dataTransfer.files && dataTransfer.files.length > 0) {
      return true;
    }
    const types = Array.isArray(dataTransfer.types)
      ? dataTransfer.types
      : Array.from(dataTransfer.types || []);
    return types.includes('Files');
  };

  const updateTriPlacement = (imageId, targetCategory, targetIndex) => {
    const lists = buildTriIdLists(images);
    const categories = {
      form: [...lists.form],
      'semi-formless': [...lists['semi-formless']],
      formless: [...lists.formless],
    };
    const drawer = [...lists.drawer];

    const removeFromList = (list) => {
      const idx = list.indexOf(imageId);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    };

    Object.values(categories).forEach(removeFromList);
    removeFromList(drawer);

    const insertInto = (list) => {
      if (!Array.isArray(list)) return;
      const safeIndex =
        typeof targetIndex === 'number'
          ? Math.max(0, Math.min(targetIndex, list.length))
          : list.length;
      list.splice(safeIndex, 0, imageId);
    };

    if (targetCategory && categories[targetCategory]) {
      insertInto(categories[targetCategory]);
    } else {
      insertInto(drawer);
    }

    const placement = new Map();
    TRI_CATEGORY_IDS.forEach((id) => {
      const list = categories[id] || [];
      list.forEach((entryId, idx) => {
        placement.set(entryId, {
          category: id,
          order: idx,
        });
      });
    });
    drawer.forEach((entryId) => {
      placement.set(entryId, { category: null, order: null });
    });

    const updated = images.map((img) => {
      const nextPlacement = placement.get(img.id);
      if (!nextPlacement) {
        return img;
      }
      const nextCategory = nextPlacement.category;
      const nextOrder = normalizeTriOrder(nextPlacement.order);
      const currentCategory = normalizeTriCategory(img.triCategory);
      const currentOrder = normalizeTriOrder(img.triOrder);
      const categoryChanged = currentCategory !== nextCategory;
      const orderChanged = currentOrder !== nextOrder;
      if (categoryChanged || orderChanged) {
        return {
          ...img,
          triCategory: nextCategory,
          triOrder: nextOrder,
          tags: categoryChanged
            ? mergeTriCategoryIntoTags(img.tags, nextCategory)
            : img.tags,
        };
      }
      return img;
    });

    saveImages(updated);
  };

  const findImageIdFromDragData = (raw) => {
    if (typeof raw !== 'string' || !raw) return null;
    const match = images.find((img) => String(img.id) === raw);
    return match ? match.id : null;
  };

  const handleTriDragOverZone = (event, zoneId) => {
    if (isFileTransfer(event.dataTransfer)) {
      handleDragOver(event);
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    setTriActiveZone((prev) => (prev === zoneId ? prev : zoneId));
  };

  const handleTriDrop = (event, categoryId, index) => {
    if (isFileTransfer(event.dataTransfer)) {
      handleDrop(event);
      setTriActiveZone(null);
      setTriDraggingId(null);
      return;
    }
    event.preventDefault();
    const raw =
      event.dataTransfer?.getData('application/x-library-tri-image') ||
      event.dataTransfer?.getData('text/plain');
    let resolvedId = findImageIdFromDragData(raw);
    if (resolvedId === null || typeof resolvedId === 'undefined') {
      resolvedId = triDraggingId ?? null;
    }
    if (resolvedId === null || typeof resolvedId === 'undefined') {
      setTriActiveZone(null);
      setTriDraggingId(null);
      return;
    }
    updateTriPlacement(resolvedId, categoryId, index);
    setTriActiveZone(null);
    setTriDraggingId(null);
  };

  const getDualCellKey = (row, column) => `${row}::${column}`;

  const resolveDualDragImageId = (event) => {
    const raw =
      event.dataTransfer?.getData('application/x-library-image-id') ||
      event.dataTransfer?.getData('text/plain');
    let resolvedId = findImageIdFromDragData(raw);
    if (resolvedId === null || typeof resolvedId === 'undefined') {
      resolvedId = draggedId ?? null;
    }
    return resolvedId === null || typeof resolvedId === 'undefined'
      ? null
      : resolvedId;
  };

  const handleDualDragOverCell = (event, row, column) => {
    if (isFileTransfer(event.dataTransfer)) {
      handleDragOver(event);
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const key = getDualCellKey(row, column);
    setDualActiveCell((prev) => (prev === key ? prev : key));
  };

  const handleDualDragLeaveCell = (event, row, column) => {
    if (isFileTransfer(event.dataTransfer)) {
      handleDragLeave(event);
      return;
    }
    event.preventDefault();
    const key = getDualCellKey(row, column);
    setDualActiveCell((prev) => (prev === key ? null : prev));
  };

  const handleDualDragOverUnassigned = (event) => {
    if (isFileTransfer(event.dataTransfer)) {
      handleDragOver(event);
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    setDualActiveCell((prev) => (prev === 'unassigned' ? prev : 'unassigned'));
  };

  const handleDualDragLeaveUnassigned = (event) => {
    if (isFileTransfer(event.dataTransfer)) {
      handleDragLeave(event);
      return;
    }
    event.preventDefault();
    setDualActiveCell((prev) => (prev === 'unassigned' ? null : prev));
  };

  const updateDualPlacement = (imageId, targetGender, targetQuality) => {
    const image = images.find((img) => img.id === imageId);
    if (!image) return;
    const category = findPresetTag(image.tags, CATEGORY_TAGS);
    const custom = extractCustomTags(image.tags);
    const gender = GENDER_TAGS.includes(targetGender) ? targetGender : '';
    const quality = QUALITY_TAGS.includes(targetQuality) ? targetQuality : '';
    const position = findPresetTag(image.tags, POSITION_TAGS);
    const nextTags = buildImageTags({
      category,
      gender,
      quality,
      position,
      customTags: custom,
    });
    updateImage(imageId, { tags: nextTags });
  };

  const handleDualDropOnCell = (event, row, column) => {
    if (isFileTransfer(event.dataTransfer)) {
      handleDrop(event);
      setDualActiveCell(null);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const resolvedId = resolveDualDragImageId(event);
    setDualActiveCell(null);
    if (resolvedId === null) {
      return;
    }
    updateDualPlacement(resolvedId, column, row);
    setDraggedId(null);
  };

  const handleDualDropOnUnassigned = (event) => {
    if (isFileTransfer(event.dataTransfer)) {
      handleDrop(event);
      setDualActiveCell(null);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const resolvedId = resolveDualDragImageId(event);
    setDualActiveCell(null);
    if (resolvedId === null) {
      return;
    }
    updateDualPlacement(resolvedId, '', '');
    setDraggedId(null);
  };

  const renderTriTile = (img, categoryId = null, index = null) => {
    const isLoaded = Boolean(img.dataUrl);
    const zoneId = categoryId || 'drawer';
    const title = img.title || 'Untitled';
    return (
      <div
        key={img.id}
        className={`tri-image-tile${
          triDraggingId === img.id ? ' dragging' : ''
        }`}
        draggable
        onDragStart={(e) => {
          setTriDraggingId(img.id);
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData(
              'application/x-library-tri-image',
              String(img.id)
            );
          }
        }}
        onDragEnd={() => {
          setTriDraggingId(null);
          setTriActiveZone(null);
        }}
        onDrop={(e) => {
          e.stopPropagation();
          handleTriDrop(e, categoryId, index);
        }}
        onDragOver={(e) => {
          handleTriDragOverZone(e, zoneId);
        }}
        onContextMenu={(e) => openImageContextMenu(e, img.id)}
        onClick={isLoaded ? () => setLightbox(img) : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && isLoaded) {
            e.preventDefault();
            setLightbox(img);
          }
        }}
        aria-label={`View ${title}`}
        title={title}
      >
        {isLoaded ? (
          <img src={img.dataUrl} alt={title} draggable={false} />
        ) : (
          <div className="tri-image-placeholder" role="status">
            <div className="image-loading-spinner" aria-hidden="true" />
            <span className="image-loading-text">Loading…</span>
          </div>
        )}
        <div className="tri-image-label">
          {img.color && (
            <span className="color-dot" style={{ background: img.color }} />
          )}
          <span className="tri-image-title">{title}</span>
        </div>
      </div>
    );
  };

  const renderTriView = () => {
    const drawerImages = triAssignments.drawer;
    const message = images.length
      ? 'Drag images from the drawer into a category to lock them in place.'
      : 'Upload images to start sorting them into Form, Semi-Formless, and Formless.';
    return (
      <div className="tri-view">
        <p className="tri-instructions">{message}</p>
        <div className="tri-columns">
          {TRI_VIEW_CATEGORIES.map(({ id, label }) => {
            const items = triAssignments.categories[id] || [];
            return (
              <div
                key={id}
                className={`tri-column${
                  triActiveZone === id ? ' active-drop' : ''
                }`}
              >
                <div className="tri-column-header">
                  <h3>{label}</h3>
                  <span className="tri-column-count">{items.length}</span>
                </div>
                <div
                  className={`tri-column-body${
                    triActiveZone === id ? ' active-drop' : ''
                  }`}
                  onDragOver={(e) => handleTriDragOverZone(e, id)}
                  onDrop={(e) => handleTriDrop(e, id)}
                >
                  {items.length ? (
                    items.map((img, index) => renderTriTile(img, id, index))
                  ) : (
                    <div className="tri-column-empty">Drop images here</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="tri-drawer">
          <div className="tri-drawer-header">
            <span>Library Drawer</span>
            <span className="tri-drawer-count">{drawerImages.length}</span>
          </div>
          <div
            className={`tri-drawer-body${
              triActiveZone === 'drawer' ? ' active-drop' : ''
            }`}
            onDragOver={(e) => handleTriDragOverZone(e, 'drawer')}
            onDrop={(e) => handleTriDrop(e, null)}
          >
            {drawerImages.length ? (
              drawerImages.map((img, index) => renderTriTile(img, null, index))
            ) : (
              <div className="tri-drawer-empty">
                Images you add appear here until you place them in a category.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQuadrantView = () => {
    const gridStyle = {
      gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
      gridAutoRows: `${rowHeight}px`,
      gap: `${gridGap}px`,
    };

    const hasContent =
      QUADRANT_ORDER.some((primary) => {
        const group = quadrantAssignments.groups[primary];
        if (!group) return false;
        const secondaryCount = QUADRANT_ORDER.reduce(
          (sum, secondary) => sum + group.subs[secondary].length,
          0
        );
        return group.core.length > 0 || secondaryCount > 0;
      }) || quadrantAssignments.unassigned.length > 0;

    if (!hasContent) {
      return (
        <div className="quadrant-view-empty">
          <p>
            Assign quadrants to your library images from the lightbox to see
            them organized here.
          </p>
        </div>
      );
    }

    return (
      <div className="quadrant-view">
        {QUADRANT_ORDER.map((primary) => {
          const group = quadrantAssignments.groups[primary];
          const total = group
            ? group.core.length +
              QUADRANT_ORDER.reduce(
                (sum, secondary) => sum + group.subs[secondary].length,
                0
              )
            : 0;
          return (
            <section key={primary} className="quadrant-column">
              <header className="quadrant-column-header">
                <h3>{`Quadrant ${primary}`}</h3>
                <span className="quadrant-count">{total}</span>
              </header>
              <div className="quadrant-column-body">
                {group && total > 0 ? (
                  <>
                    {group.core.length > 0 && (
                      <div className="quadrant-group">
                        <h4 className="quadrant-group-label">Core</h4>
                        <div style={{ width: '100%', overflow: 'hidden' }}>
                          <div className="image-grid" style={gridStyle}>
                            {group.core.map((img) => renderImageCard(img))}
                          </div>
                        </div>
                      </div>
                    )}
                    {QUADRANT_ORDER.map((secondary) => {
                      const items = group.subs[secondary];
                      if (!items.length) return null;
                      return (
                        <div key={secondary} className="quadrant-group">
                          <h4 className="quadrant-group-label">{`${primary} → ${secondary}`}</h4>
                          <div style={{ width: '100%', overflow: 'hidden' }}>
                            <div className="image-grid" style={gridStyle}>
                              {items.map((img) => renderImageCard(img))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="quadrant-group-empty">
                    No images assigned to this quadrant yet.
                  </div>
                )}
              </div>
            </section>
          );
        })}
        {quadrantAssignments.unassigned.length > 0 && (
          <section className="quadrant-column">
            <header className="quadrant-column-header">
              <h3>Unassigned</h3>
              <span className="quadrant-count">{quadrantAssignments.unassigned.length}</span>
            </header>
            <div className="quadrant-column-body">
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <div className="image-grid" style={gridStyle}>
                  {quadrantAssignments.unassigned.map((img) =>
                    renderImageCard(img)
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  };

  const renderDualView = () => {
    const gridStyle = {
      gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
      gridAutoRows: `${rowHeight}px`,
      gap: `${gridGap}px`,
    };

    const hasContent =
      DUAL_ROWS.some((row) =>
        DUAL_COLUMNS.some(
          (column) => dualAssignments.layout[row][column].length > 0,
        ),
      ) || dualAssignments.unassigned.length > 0;

    if (!hasContent) {
      return (
        <div className="dual-view-empty">
          <p>
            Tag your images with a gender (♂ or ♀) and a quality (Good, Neutral,
            Bad) from the lightbox to see them on the Dual board.
          </p>
        </div>
      );
    }

    const columnTotals = DUAL_COLUMNS.reduce((acc, column) => {
      acc[column] = DUAL_ROWS.reduce(
        (sum, row) => sum + dualAssignments.layout[row][column].length,
        0,
      );
      return acc;
    }, {});

    const rowTotals = DUAL_ROWS.reduce((acc, row) => {
      acc[row] = DUAL_COLUMNS.reduce(
        (sum, column) => sum + dualAssignments.layout[row][column].length,
        0,
      );
      return acc;
    }, {});

    return (
      <div className="dual-view">
        <div className="dual-grid">
          <div className="dual-grid-corner" aria-hidden="true" />
          {DUAL_COLUMNS.map((column) => (
            <div
              key={column}
              className={`dual-column-header ${
                column === '♂' ? 'dual-column-masculine' : 'dual-column-feminine'
              }`}
            >
              <span className="dual-column-icon" aria-hidden="true">
                {column}
              </span>
              <div className="dual-column-labels">
                <span className="dual-column-name">{DUAL_COLUMN_LABELS[column]}</span>
                <span className="dual-count" aria-label={`${DUAL_COLUMN_LABELS[column]} images`}>
                  {columnTotals[column]}
                </span>
              </div>
            </div>
          ))}
          {DUAL_ROWS.map((row) => (
            <React.Fragment key={row}>
              <div className={`dual-row-header dual-row-${row.toLowerCase()}`}>
                <span className="dual-row-icon" aria-hidden="true">
                  {DUAL_ROW_ICONS[row]}
                </span>
                <div className="dual-row-labels">
                  <span className="dual-row-name">{DUAL_ROW_LABELS[row]}</span>
                  <span className="dual-count" aria-label={`${DUAL_ROW_LABELS[row]} images`}>
                    {rowTotals[row]}
                  </span>
                </div>
              </div>
              {DUAL_COLUMNS.map((column) => {
                const key = `${row}-${column}`;
                const items = dualAssignments.layout[row][column];
                return (
                  <div
                    key={key}
                    className={`dual-cell dual-column-${
                      column === '♂' ? 'masculine' : 'feminine'
                    } dual-row-${row.toLowerCase()}`}
                  >
                    {items.length ? (
                      <div style={{ width: '100%', overflow: 'hidden' }}>
                        <div className="image-grid" style={gridStyle}>
                          {items.map((img) => renderImageCard(img))}
                        </div>
                      </div>
                    ) : (
                      <div className="dual-cell-empty">No images yet</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
        {dualAssignments.unassigned.length > 0 && (
          <section className="dual-unassigned">
            <header className="dual-unassigned-header">
              <h3>Unassigned</h3>
              <span className="dual-count" aria-label="Unassigned images">
                {dualAssignments.unassigned.length}
              </span>
            </header>
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <div className="image-grid" style={gridStyle}>
                {dualAssignments.unassigned.map((img) => renderImageCard(img))}
              </div>
            </div>
            <p className="dual-unassigned-help">
              Add a gender (♂ or ♀) and a quality (Good, Neutral, Bad) tag from
              the lightbox to place these images on the board.
            </p>
          </section>
        )}
      </div>
    );
  };

  const lightboxCategory = findPresetTag(lightbox?.tags, CATEGORY_TAGS);
  const lightboxGender = findPresetTag(lightbox?.tags, GENDER_TAGS);
  const lightboxQuality = findPresetTag(lightbox?.tags, QUALITY_TAGS);
  const lightboxPosition = findPresetTag(lightbox?.tags, POSITION_TAGS);
  const lightboxCustomTags = extractCustomTags(lightbox?.tags);

  const composeImageTags = ({
    category = lightboxCategory,
    gender = lightboxGender,
    quality = lightboxQuality,
    position = lightboxPosition,
    customTags = lightboxCustomTags,
  } = {}) =>
    buildImageTags({
      category,
      gender,
      quality,
      position,
      customTags,
    });

  const wordCategory = findPresetTag(wordInspector?.tags, CATEGORY_TAGS);
  const wordGender = findPresetTag(wordInspector?.tags, GENDER_TAGS);
  const wordQuality = findPresetTag(wordInspector?.tags, QUALITY_TAGS);
  const wordPosition = findPresetTag(wordInspector?.tags, POSITION_TAGS);
  const wordCustomTags = extractCustomTags(wordInspector?.tags);

  const composeWordTags = ({
    category = wordCategory,
    gender = wordGender,
    quality = wordQuality,
    position = wordPosition,
    customTags = wordCustomTags,
  } = {}) =>
    buildImageTags({
      category,
      gender,
      quality,
      position,
      customTags,
    });

  const wordActiveTags = normalizeImageTags(wordInspector?.tags);

  return (
    <div
      className={`library-container ${
        isDragging ? 'dragging' : ''
      } ${libraryTheme === 'light' ? 'light-mode' : 'dark-mode'} library-view-${libraryView}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && <div className="drop-overlay">Upload Media</div>}
      {uploading && <div className="upload-status">Uploading…</div>}
      <div className="library-manager">
        <div className="library-header">
          <button onClick={onBack} className="back-button" type="button">
            Back
          </button>
          <h2>Library</h2>
          <div className="library-actions">
            <div className="library-view-selector">
              <button
                type="button"
                className={`library-view-button${
                  viewMenuOpen ? ' open' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMenuOpen((open) => !open);
                  setSettingsOpen(false);
                  setSortMenuOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={viewMenuOpen}
              >
                View
              </button>
              {viewMenuOpen && (
                <div
                  className="library-view-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={libraryView === 'classic' ? 'active' : ''}
                    onClick={() => {
                      setLibraryView('classic');
                      setViewMenuOpen(false);
                    }}
                  >
                    <span>Classic</span>
                    {libraryView === 'classic' && (
                      <span
                        className="library-view-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={libraryView === 'tri' ? 'active' : ''}
                    onClick={() => {
                      setLibraryView('tri');
                      setViewMenuOpen(false);
                    }}
                  >
                    <span>Tri</span>
                    {libraryView === 'tri' && (
                      <span
                        className="library-view-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={libraryView === 'quadrants' ? 'active' : ''}
                    onClick={() => {
                      setLibraryView('quadrants');
                      setViewMenuOpen(false);
                    }}
                  >
                    <span>Quadrants</span>
                    {libraryView === 'quadrants' && (
                      <span
                        className="library-view-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={libraryView === 'dual' ? 'active' : ''}
                    onClick={() => {
                      setLibraryView('dual');
                      setViewMenuOpen(false);
                    }}
                  >
                    <span>Dual</span>
                    {libraryView === 'dual' && (
                      <span
                        className="library-view-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
            <div className="library-settings">
              <button
                type="button"
                className={`library-settings-button${
                  settingsOpen ? ' open' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSettingsOpen((open) => !open);
                  setSortMenuOpen(false);
                }}
                aria-label="Library settings"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                  className="library-settings-icon"
                >
                  <path
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.532-.918 3.31.86 2.392 2.392a1.724 1.724 0 0 0 1.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.918 1.532-.86 3.31-2.392 2.392a1.724 1.724 0 0 0-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.532.918-3.31-.86-2.392-2.392a1.724 1.724 0 0 0-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.918-1.532.86-3.31 2.392-2.392a1.724 1.724 0 0 0 2.573-1.066Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              {settingsOpen && (
                <div
                  className="library-settings-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={libraryTheme === 'light' ? 'active' : ''}
                    onClick={() => handleThemeChange('light')}
                  >
                    <span>Light mode</span>
                    {libraryTheme === 'light' && (
                      <span
                        className="library-settings-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={libraryTheme === 'dark' ? 'active' : ''}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <span>Dark mode</span>
                    {libraryTheme === 'dark' && (
                      <span
                        className="library-settings-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                  </button>
                  <div
                    className={`library-settings-hide-row${
                      hideQualityImages ? ' active' : ''
                    }`}
                  >
                    <button
                      type="button"
                      className={`library-settings-quality-toggle${
                        hiddenQuality === 'Bad' ? '' : ' flipped'
                      }`}
                      onClick={() =>
                        setHiddenQuality((prev) =>
                          prev === 'Bad' ? 'Good' : 'Bad'
                        )
                      }
                      aria-pressed={hiddenQuality === 'Good'}
                      aria-label={`Switch to hiding ${
                        hiddenQuality === 'Bad' ? 'Good' : 'Bad'
                      } images`}
                      title={`Switch to hiding ${
                        hiddenQuality === 'Bad' ? 'Good' : 'Bad'
                      } images`}
                    >
                      ⇄
                    </button>
                    <button
                      type="button"
                      className={`library-settings-hide-toggle${
                        hideQualityImages ? ' active' : ''
                      }`}
                      onClick={() => setHideQualityImages((prev) => !prev)}
                    >
                      <span>{`Hide ${hiddenQuality}`}</span>
                      {hideQualityImages && (
                        <span
                          className="library-settings-check"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="sort-dropdown">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSortMenuOpen((o) => !o);
                  setSettingsOpen(false);
                }}
                className="sort-button"
                type="button"
              >
                Order
              </button>
              {sortMenuOpen && (
                <div
                  className="sort-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      resetSort();
                      setSortMenuOpen(false);
                    }}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => {
                      sortByTitle();
                      setSortMenuOpen(false);
                    }}
                  >
                    Title
                  </button>
                  <button
                    onClick={() => {
                      sortByDate();
                      setSortMenuOpen(false);
                    }}
                  >
                    Date Added
                  </button>
                  <button
                    onClick={() => {
                      autoSortByColor();
                      setSortMenuOpen(false);
                    }}
                  >
                    Color
                  </button>
                  <button
                    onClick={() => {
                      sortByRating();
                      setSortMenuOpen(false);
                    }}
                  >
                    Elo (High → Low)
                  </button>
                  <button
                    onClick={() => {
                      sortByTmb();
                      setSortMenuOpen(false);
                    }}
                  >
                    TMB (Top → Mid → Base)
                  </button>
                  <button
                    onClick={() => {
                      shuffleImages();
                      setSortMenuOpen(false);
                    }}
                  >
                    Random
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="library-tabs">
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            All ({totalCount})
          </button>
          <button
            className={activeTab === 'images' ? 'active' : ''}
            onClick={() => setActiveTab('images')}
          >
            Images ({imageCount})
          </button>
          <button
            className={activeTab === 'words' ? 'active' : ''}
            onClick={() => setActiveTab('words')}
          >
            Words ({wordCount})
          </button>
          <button
            className={activeTab === 'sounds' ? 'active' : ''}
            onClick={() => setActiveTab('sounds')}
          >
            Sounds ({soundCount})
          </button>
        </div>
        {(activeTab === 'all' || activeTab === 'images') &&
          (libraryView === 'tri'
            ? renderTriView()
            : libraryView === 'quadrants'
            ? renderQuadrantView()
            : libraryView === 'dual'
            ? renderDualView()
            : sortMode === 'color'
            ? (
              <div className="color-groups">
                {palette.map((c) => {
                  const groupImgs = filteredImages.filter((img) => img.color === c);
                  const groupSounds = displayedSounds.filter((s) => s.color === c);
                  if (!groupImgs.length && !groupSounds.length) return null;
                  return (
                    <div key={c} className="color-group">
                      <h3 className="color-title" style={{ color: c }}>
                        {hexToName(c)}
                      </h3>
                        <div style={{ width: '100%', overflow: 'hidden' }}>
                          <div
                            className="image-grid"
                            style={{
                              gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
                              gridAutoRows: `${rowHeight}px`,
                              gap: `${gridGap}px`,
                            }}
                            onDragOver={(e) => {
                            if (e.dataTransfer.files?.length) {
                              handleDragOver(e);
                            } else {
                              e.preventDefault();
                            }
                          }}
                          onDrop={(e) => {
                            if (e.dataTransfer.files?.length) {
                              handleDrop(e);
                              return;
                            }
                            e.preventDefault();
                            if (draggedId) {
                              const updated = images.filter((img) => img.id !== draggedId);
                              const moved = images.find((img) => img.id === draggedId);
                              if (moved) {
                                moved.color = c;
                                moved.title = hexToName(c);
                                updated.push(moved);
                                saveImages(updated);
                              }
                              setDraggedId(null);
                            }
                          }}
                        >
                          {groupImgs.map((img) => renderImageCard(img))}
                          {activeTab === 'all' &&
                            groupSounds.map((s) => renderSoundCard(s))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activeTab === 'all' && displayedSounds.length > 0 && (
                  <div className="color-group">
                    <h3 className="color-title" style={{ color: '#fff' }}>
                      Sounds
                    </h3>
                        <div style={{ width: '100%', overflow: 'hidden' }}>
                          <div
                            className="image-grid"
                            style={{
                              gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
                              gridAutoRows: `${rowHeight}px`,
                              gap: `${gridGap}px`,
                            }}
                          >
                          {displayedSounds.map((s) => renderSoundCard(s))}
                        </div>
                      </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="image-grid"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
                  gridAutoRows: `${rowHeight}px`,
                  gap: `${gridGap}px`,
                }}
                onDragOver={
                  sortMode !== 'title' &&
                  sortMode !== 'date' &&
                  sortMode !== 'rating' &&
                  sortMode !== 'tmb'
                    ? (e) => {
                        if (e.dataTransfer.files?.length) {
                          handleDragOver(e);
                        } else {
                          e.preventDefault();
                        }
                      }
                    : undefined
                }
                  onDrop={
                    sortMode !== 'title' &&
                    sortMode !== 'date' &&
                    sortMode !== 'rating' &&
                    sortMode !== 'tmb'
                      ? (e) => {
                          if (e.dataTransfer.files?.length) {
                            handleDrop(e);
                            return;
                          }
                          e.preventDefault();
                          if (draggedId) {
                            const fromIndex = images.findIndex(
                              (img) => img.id === draggedId
                            );
                            if (fromIndex !== -1) {
                              const updated = [...images];
                              const [moved] = updated.splice(fromIndex, 1);
                              updated.push(moved);
                              saveImages(updated);
                            }
                            setDraggedId(null);
                          }
                        }
                      : undefined
                  }
                  >
                    {activeTab === 'all'
                      ? (() => {
                          const combined = [
                            ...filteredImages.map((img) => ({
                              type: 'image',
                              item: img,
                            })),
                            ...displayedSounds.map((s) => ({
                              type: 'sound',
                              item: s,
                            })),
                          ];
                          const ordered =
                            sortMode === 'date'
                              ? combined
                                  .slice()
                                  .sort((a, b) => a.item.id - b.item.id)
                              : sortMode === 'tmb'
                              ? sortItemsByTmb(
                                  combined,
                                  ({ item }) => item?.tags,
                                  ({ item }) => {
                                    if (typeof item?.title === 'string') {
                                      return item.title;
                                    }
                                    if (typeof item?.text === 'string') {
                                      return item.text;
                                    }
                                    return '';
                                  }
                                )
                              : combined;
                          return ordered.map(({ type, item }) =>
                            type === 'image'
                              ? renderImageCard(item)
                              : renderSoundCard(item)
                          );
                        })()
                      : filteredImages.map((img) => renderImageCard(img))}
                  </div>
              ))}
        {(activeTab === 'all' || activeTab === 'words') && (
          <div className="word-section">
            {activeTab === 'words' && (
              <form onSubmit={handleAddWord} className="word-form">
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder="Add word or sentence"
                />
                <button type="submit">Add</button>
              </form>
            )}
            <ul className="word-list">
              {displayedWords.map((w) => {
                const typeInfo = ITEM_TYPE_INFO.word;
                return (
                  <li key={w.id} className="word-item">
                    <button
                      type="button"
                      className="word-card"
                      data-item-type="word"
                      data-pretty-symbol={typeInfo.symbol}
                      draggable
                      onDragStart={(event) => handleWordDragStart(event, w.text)}
                      onClick={() => openWordInspector(w)}
                    >
                      <span className="word-card-text">{w.text || 'Untitled'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {libraryView === 'tri' && activeTab === 'all' && displayedSounds.length > 0 && (
          <div className="sound-section tri-sound-section">
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <div
                className="image-grid"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
                  gridAutoRows: `${rowHeight}px`,
                  gap: `${gridGap}px`,
                }}
              >
                {displayedSounds.map((s) => renderSoundCard(s))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'sounds' && (
          <div className="sound-section">
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <div
                className="image-grid"
                style={{
                  gridTemplateColumns: `repeat(auto-fill, ${colWidth}px)`,
                  gridAutoRows: `${rowHeight}px`,
                  gap: `${gridGap}px`,
                }}
              >
                {displayedSounds.map((s) => renderSoundCard(s))}
              </div>
            </div>
          </div>
        )}
        {soundModal && (
          <div className="sound-modal" onClick={resetSoundModalState}>
            <div
              className="sound-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {soundModalIsVideo ? (
                <video
                  controls
                  src={soundModal}
                  className="sound-modal-preview"
                  playsInline
                ></video>
              ) : (
                <audio
                  controls
                  src={soundModal}
                  className="sound-modal-preview"
                ></audio>
              )}
              <input
                type="text"
                value={soundTitle}
                onChange={(e) => setSoundTitle(e.target.value)}
                placeholder="Title"
              />
                {soundThumbPreview && (
                  <img
                    src={soundThumbPreview}
                    alt="Thumbnail preview"
                    className="sound-thumb-preview"
                  />
                )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0] || null;
                  setSoundThumb(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setSoundThumbPreview(reader.result);
                    reader.readAsDataURL(file);
                  } else {
                    setSoundThumbPreview(null);
                  }
                }}
              />
              <div className="color-list">
                {palette.map((c, idx) => (
                  <button
                    key={idx}
                    className={`color-circle${
                      soundColor === c ? ' selected' : ''
                    }`}
                    style={{ background: c }}
                    onClick={() =>
                      setSoundColor(soundColor === c ? '' : c)
                    }
                  />
                ))}
              </div>
              <div className="sound-tag-section">
                <span className="sound-tag-heading">Tags</span>
                <div className="sound-tag-group">
                  <span className="sound-tag-subheading">{CATEGORY_LABEL}</span>
                  <div className="sound-tag-row">
                    {CATEGORY_TAGS.map((tag) => {
                      const selected = soundCategory === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`sound-tag-button${
                            selected ? ' selected' : ''
                          }`}
                          onClick={() =>
                            setSoundCategory(selected ? '' : tag)
                          }
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sound-tag-group">
                  <span className="sound-tag-subheading">Gender</span>
                  <div className="sound-tag-row">
                    {GENDER_TAGS.map((tag) => {
                      const selected = soundGender === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`sound-tag-button${
                            selected ? ' selected' : ''
                          }`}
                          onClick={() =>
                            setSoundGender(selected ? '' : tag)
                          }
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sound-tag-group">
                  <span className="sound-tag-subheading">Quality</span>
                  <div className="quality-toggle sound-quality-toggle">
                    {QUALITY_TAGS.map((tag) => {
                      const selected = soundQuality === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`quality-level${
                            selected ? ' selected' : ''
                          }`}
                          onClick={() =>
                            setSoundQuality(selected ? '' : tag)
                          }
                          aria-pressed={selected}
                          title={tag}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="sound-tag-group">
                  <span className="sound-tag-subheading">{POSITION_LABEL}</span>
                  <div className="sound-tag-row vertical">
                    {POSITION_TAGS.map((tag) => {
                      const selected = soundPosition === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          className={`sound-tag-button${
                            selected ? ' selected' : ''
                          }`}
                          onClick={() =>
                            setSoundPosition(selected ? '' : tag)
                          }
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input
                  type="text"
                  value={soundCustomTags}
                  onChange={(e) => setSoundCustomTags(e.target.value)}
                  placeholder="Additional tags (comma separated)"
                />
              </div>
              <div className="sound-modal-actions">
                <button onClick={resetSoundModalState}>
                  Cancel
                </button>
                <button onClick={saveDroppedSound}>Save</button>
              </div>
            </div>
          </div>
        )}
        {soundMenu && (
          <div
            ref={soundMenuRef}
            className="context-menu"
            style={{ left: soundMenuPosition.x, top: soundMenuPosition.y }}
          >
            <button
              onClick={() => {
                const snd = sounds.find((s) => s.id === soundMenu.id);
                if (snd) {
                  openSoundModalForEdit(snd);
                }
                setSoundMenu(null);
              }}
            >
              Edit
            </button>
            <button
              onClick={async () => {
                try {
                  await deleteSound(soundMenu.id);
                } finally {
                  setSoundMenu(null);
                }
              }}
            >
              Delete
            </button>
          </div>
        )}
        {wordInspector && (
          <div
            className="word-inspector-backdrop"
            onClick={() => setWordInspector(null)}
          >
            <div
              className="word-inspector-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="word-inspector-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="word-inspector-header">
                <div className="word-inspector-heading">
                  <h1 id="word-inspector-title">
                    {wordInspector.text || 'Untitled'}
                  </h1>
                  <p className="word-inspector-meta">
                    Added{' '}
                    {wordInspector.createdAt
                      ? new Date(wordInspector.createdAt).toLocaleString()
                      : 'recently'}
                  </p>
                </div>
                <button
                  type="button"
                  className="word-inspector-close"
                  onClick={() => setWordInspector(null)}
                  aria-label="Close word details"
                >
                  ×
                </button>
              </div>
              <label className="word-inspector-field">
                <span>Word or phrase</span>
                <input
                  type="text"
                  value={wordTextDraft}
                  onChange={(e) => setWordTextDraft(e.target.value)}
                  onBlur={() =>
                    updateWord(wordInspector.id, { text: wordTextDraft })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      updateWord(wordInspector.id, { text: wordTextDraft });
                    }
                  }}
                />
              </label>
              <section className="word-inspector-section">
                <h2>Tags</h2>
                <div className="tag-controls">
                  <div className="tag-control-group">
                    <span className="tag-control-label">{CATEGORY_LABEL}</span>
                    <div className="tag-control-options">
                      {CATEGORY_TAGS.map((tag) => {
                        const selected = wordCategory === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`tag-toggle-button${
                              selected ? ' selected' : ''
                            }`}
                            onClick={() => {
                              const nextCategory = selected ? '' : tag;
                              const nextTags = composeWordTags({
                                category: nextCategory,
                              });
                              updateWord(wordInspector.id, { tags: nextTags });
                            }}
                            aria-pressed={selected}
                            title={`Set tag ${tag}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="tag-control-group">
                    <span className="tag-control-label">Gender</span>
                    <div className="tag-control-options">
                      {GENDER_TAGS.map((tag) => {
                        const selected = wordGender === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`tag-toggle-button${
                              selected ? ' selected' : ''
                            }`}
                            onClick={() => {
                              const nextGender = selected ? '' : tag;
                              const nextTags = composeWordTags({
                                gender: nextGender,
                              });
                              updateWord(wordInspector.id, { tags: nextTags });
                            }}
                            aria-pressed={selected}
                            title={`Set tag ${tag}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="tag-control-group">
                    <span className="tag-control-label">Quality</span>
                    <div className="quality-toggle">
                      {QUALITY_TAGS.map((tag) => {
                        const selected = wordQuality === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`quality-level${
                              selected ? ' selected' : ''
                            }`}
                            onClick={() => {
                              const nextQuality = selected ? '' : tag;
                              const nextTags = composeWordTags({
                                quality: nextQuality,
                              });
                              updateWord(wordInspector.id, { tags: nextTags });
                            }}
                            aria-pressed={selected}
                            title={tag}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="tag-control-group">
                    <span className="tag-control-label">{POSITION_LABEL}</span>
                    <div className="tag-control-options vertical">
                      {POSITION_TAGS.map((tag) => {
                        const selected = wordPosition === tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            className={`tag-toggle-button${
                              selected ? ' selected' : ''
                            }`}
                            onClick={() => {
                              const nextPosition = selected ? '' : tag;
                              const nextTags = composeWordTags({
                                position: nextPosition,
                              });
                              updateWord(wordInspector.id, { tags: nextTags });
                            }}
                            aria-pressed={selected}
                            title={`Set tag ${tag}`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="word-inspector-active-tags">
                  {wordActiveTags.map((tag) => (
                    <span
                      key={`${wordInspector.id}-${tag}`}
                      className="tag"
                    >
                      {tag}
                    </span>
                  ))}
                  {!wordActiveTags.length && (
                    <span className="word-inspector-meta">No tags yet.</span>
                  )}
                </div>
                <div className="tag-list">
                  {wordCustomTags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="tag"
                      onClick={() => {
                        const nextCustom = wordCustomTags.filter(
                          (_, i) => i !== idx
                        );
                        const nextTags = composeWordTags({
                          customTags: nextCustom,
                        });
                        updateWord(wordInspector.id, { tags: nextTags });
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                  <input
                    type="text"
                    value={wordTagInput}
                    placeholder="Add custom tag"
                    onChange={(e) => setWordTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && wordTagInput.trim()) {
                        const nextCustom = [
                          ...wordCustomTags,
                          wordTagInput.trim(),
                        ];
                        const nextTags = composeWordTags({
                          customTags: nextCustom,
                        });
                        updateWord(wordInspector.id, { tags: nextTags });
                        setWordTagInput('');
                      }
                    }}
                  />
                </div>
              </section>
              <div className="word-inspector-actions">
                <button
                  type="button"
                  className="word-inspector-delete"
                  onClick={() => {
                    const confirmDelete =
                      typeof window === 'undefined'
                        ? true
                        : window.confirm('Delete this word?');
                    if (confirmDelete) {
                      deleteWord(wordInspector.id);
                    }
                  }}
                >
                  Delete word
                </button>
              </div>
            </div>
          </div>
        )}
        {menu && (
          <div
            ref={menuRef}
            className="context-menu"
            style={{ left: menuPosition.x, top: menuPosition.y }}
          >
            <button
              onClick={() => {
                deleteImage(menu.id);
                setMenu(null);
              }}
            >
              Delete
            </button>
          </div>
        )}
        {lightbox && (
          <div className="lightbox" onClick={() => setLightbox(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <div
                className="lightbox-inner"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    setLightboxZoom((z) => {
                      const next = z + (e.deltaY < 0 ? 0.1 : -0.1);
                      return Math.min(5, Math.max(0.1, next));
                    });
                  }
                }}
              >
                <img
                  src={lightbox.dataUrl}
                  alt={lightbox.title}
                  style={{
                    width: lightbox.width * lightboxZoom,
                    height: lightbox.height * lightboxZoom,
                  }}
                />
              </div>
              <div className="lightbox-info">
                  {editingTitle ? (
                    <input
                      type="text"
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onBlur={() => {
                        updateImage(lightbox.id, { title: titleInput });
                        setEditingTitle(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          updateImage(lightbox.id, { title: titleInput });
                          setEditingTitle(false);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <h1 onClick={() => setEditingTitle(true)}>
                      {lightbox.title || 'Untitled'}
                    </h1>
                  )}
                  <div className="lightbox-stats">
                    {(() => {
                      const info = ratingSummary.get(lightbox.id);
                      if (!info || typeof info.rating !== 'number') {
                        return (
                          <span className="lightbox-unranked">
                            Unranked in TasteT
                          </span>
                        );
                      }
                      return (
                        <>
                          {info.rank ? (
                            <span className="lightbox-rank">Rank #{info.rank}</span>
                          ) : null}
                          <span className="lightbox-elo">
                            {`${Math.round(info.rating)} Elo`}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <textarea
                    value={descInput}
                    placeholder="Description"
                    onChange={(e) => setDescInput(e.target.value)}
                    onBlur={() => updateImage(lightbox.id, { description: descInput })}
                  />
                  <div className="quad-section">
                    <QuadrantPicker
                      value={lightbox.quadrants || []}
                      onChange={(q) => updateImage(lightbox.id, { quadrants: q })}
                    />
                  </div>
                  <div className="color-section">
                    <div className="color-list">
                      {palette.map((c, idx) => (
                        <button
                          key={idx}
                          className={`color-circle${
                            lightbox.color === c ? ' selected' : ''
                          }`}
                          style={{ background: c }}
                          title={hexToName(c)}
                          onClick={() => {
                            const nc = lightbox.color === c ? '' : c;
                            const updates = { color: nc };
                            if (nc) updates.title = hexToName(nc);
                            updateImage(lightbox.id, updates);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="tag-controls">
                    <div className="tag-control-group">
                      <span className="tag-control-label">{CATEGORY_LABEL}</span>
                      <div className="tag-control-options">
                        {CATEGORY_TAGS.map((tag) => {
                          const selected = lightboxCategory === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`tag-toggle-button${
                                selected ? ' selected' : ''
                              }`}
                              onClick={() => {
                                const nextCategory = selected ? '' : tag;
                                const nextTags = composeImageTags({
                                  category: nextCategory,
                                });
                                updateImage(lightbox.id, { tags: nextTags });
                              }}
                              aria-pressed={selected}
                              title={`Set tag ${tag}`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="tag-control-group">
                      <span className="tag-control-label">Gender</span>
                      <div className="tag-control-options">
                        {GENDER_TAGS.map((tag) => {
                          const selected = lightboxGender === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`tag-toggle-button${
                                selected ? ' selected' : ''
                              }`}
                              onClick={() => {
                                const nextGender = selected ? '' : tag;
                                const nextTags = composeImageTags({
                                  gender: nextGender,
                                });
                                updateImage(lightbox.id, { tags: nextTags });
                              }}
                              aria-pressed={selected}
                              title={`Set tag ${tag}`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="tag-control-group">
                      <span className="tag-control-label">Quality</span>
                      <div className="quality-toggle">
                        {QUALITY_TAGS.map((tag) => {
                          const selected = lightboxQuality === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`quality-level${
                                selected ? ' selected' : ''
                              }`}
                              onClick={() => {
                                const nextQuality = selected ? '' : tag;
                                const nextTags = composeImageTags({
                                  quality: nextQuality,
                                });
                                updateImage(lightbox.id, { tags: nextTags });
                              }}
                              aria-pressed={selected}
                              title={tag}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="tag-control-group">
                      <span className="tag-control-label">{POSITION_LABEL}</span>
                      <div className="tag-control-options vertical">
                        {POSITION_TAGS.map((tag) => {
                          const selected = lightboxPosition === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`tag-toggle-button${
                                selected ? ' selected' : ''
                              }`}
                              onClick={() => {
                                const nextPosition = selected ? '' : tag;
                                const nextTags = composeImageTags({
                                  position: nextPosition,
                                });
                                updateImage(lightbox.id, { tags: nextTags });
                              }}
                              aria-pressed={selected}
                              title={`Set tag ${tag}`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="tag-list">
                    {lightboxCustomTags.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="tag"
                        onClick={() => {
                          const nextCustom = lightboxCustomTags.filter(
                            (_, i) => i !== idx
                          );
                          const nextTags = composeImageTags({
                            customTags: nextCustom,
                          });
                          updateImage(lightbox.id, { tags: nextTags });
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      placeholder="Add tag"
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          const nextCustom = [
                            ...lightboxCustomTags,
                            tagInput.trim(),
                          ];
                          const nextTags = composeImageTags({
                            customTags: nextCustom,
                          });
                          updateImage(lightbox.id, { tags: nextTags });
                          setTagInput('');
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="zoom-indicator">
                  {Math.round(lightboxZoom * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
