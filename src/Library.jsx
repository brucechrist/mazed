import React, { useEffect, useRef, useState } from 'react';
import './library.css';
import { DEFAULT_COLORS, loadPalette } from './colorConfig.js';
import { extractDominantColor } from './dominantColor.js';
import { colorDiff } from './colorUtils.js';
import namer from 'color-namer';

const hexToName = (hex) => {
  if (!hex) return '';
  try {
    return namer(hex).basic[0].name.toLowerCase();
  } catch {
    return hex;
  }
};

const QUADRANT_ORDER = ['IE', 'EE', 'II', 'EI'];

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

export default function Library({ onBack }) {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menu, setMenu] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [palette, setPalette] = useState(DEFAULT_COLORS);
  const [sortMode, setSortMode] = useState('none'); // 'none', 'color', 'title', 'date'
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [originalImages, setOriginalImages] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const gridRef = useRef(null);

  const [words, setWords] = useState([]);
  const [wordInput, setWordInput] = useState('');
  const [sounds, setSounds] = useState([]);
  const [soundModal, setSoundModal] = useState(null);
  const [soundTitle, setSoundTitle] = useState('');
  const [soundThumb, setSoundThumb] = useState(null);
  const [soundColor, setSoundColor] = useState('');
  const [soundTag, setSoundTag] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [soundMenu, setSoundMenu] = useState(null);
  const [editingSoundId, setEditingSoundId] = useState(null);
  const [soundThumbPreview, setSoundThumbPreview] = useState(null);

  const calcSpan = (el) => {
    if (!el) return;
    const grid = gridRef.current || el.parentNode;
    if (!grid) return;
    const styles = getComputedStyle(grid);
    const rowHeight = parseInt(styles.getPropertyValue('grid-auto-rows')) || 1;
    const rowGap = parseInt(styles.getPropertyValue('row-gap')) || 0;
    if (!rowHeight) return;

    const img = el.querySelector('img, .sound-placeholder');
    if (!img) return;

    let height;
    if (img.tagName === 'IMG' && img.naturalWidth) {
      const width = el.clientWidth || img.naturalWidth;
      height = (img.naturalHeight / img.naturalWidth) * width;
    } else {
      const width = el.clientWidth;
      height = width; // assume square for non-image placeholders
    }

    const span = Math.ceil((height + rowGap) / (rowHeight + rowGap));
    el.style.gridRowEnd = `span ${span}`;
  };

  const recalcSpans = () => {
    document
      .querySelectorAll('.image-grid')
      .forEach((grid) =>
        Array.from(grid.children).forEach((child) => calcSpan(child))
      );
  };

  // Load saved images from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mazedImages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setImages(
          Array.isArray(parsed)
            ? parsed.map((img) => ({ span: img.span || 1, ...img }))
            : []
        );
      } catch (e) {
        console.error('Failed to parse saved images', e);
      }
    }
  }, []);

  // Load saved words and sounds from localStorage on mount
  useEffect(() => {
    const savedWords = localStorage.getItem('mazedWords');
    if (savedWords) {
      try {
        setWords(JSON.parse(savedWords));
      } catch (e) {
        console.error('Failed to parse saved words', e);
      }
    }
    const savedSounds = localStorage.getItem('mazedSounds');
    if (savedSounds) {
      try {
        setSounds(JSON.parse(savedSounds));
      } catch (e) {
        console.error('Failed to parse saved sounds', e);
      }
    }
  }, []);

  const saveImages = (imgs) => {
    setImages(imgs);
    localStorage.setItem('mazedImages', JSON.stringify(imgs));
  };

  const saveWords = (w) => {
    setWords(w);
    localStorage.setItem('mazedWords', JSON.stringify(w));
  };

  const saveSounds = (s) => {
    setSounds(s);
    localStorage.setItem('mazedSounds', JSON.stringify(s));
  };

  useEffect(() => {
    recalcSpans();
  }, [images, sounds]);

  useEffect(() => {
    window.addEventListener('resize', recalcSpans);
    return () => window.removeEventListener('resize', recalcSpans);
  }, []);

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
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

    const deleteImage = (id) => {
    const updated = images.filter((img) => img.id !== id);
    saveImages(updated);
  };

  const deleteSound = (id) => {
    const updated = sounds.filter((s) => s.id !== id);
    saveSounds(updated);
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
      const updated = images.map((img) =>
        img.id === id ? { ...img, ...updates } : img
      );
    saveImages(updated);
    const next = updated.find((i) => i.id === id);
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
          tags: imgTags,
          quadrants: [],
          color: hex,
          dataUrl: result,
          width: imgEl.width,
          height: imgEl.height,
          span: 1,
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
        setSoundModal(reader.result);
        setSoundTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
        setSoundThumb(null);
        setSoundThumbPreview(null);
        setSoundColor('');
        setSoundTag('');
        setEditingSoundId(null);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!wordInput.trim()) return;
    const newWord = { id: Date.now(), text: wordInput.trim() };
    const updated = [...words, newWord];
    saveWords(updated);
    setWordInput('');
  };

  const saveDroppedSound = () => {
    if (!soundModal) return;
    const create = (thumbData) => {
      const newSound = {
        id: editingSoundId || Date.now(),
        title: soundTitle || 'Untitled',
        dataUrl: soundModal,
        thumbnail: thumbData || null,
        color: soundColor,
        tag: soundTag,
      };
      const updated = editingSoundId
        ? sounds.map((s) => (s.id === editingSoundId ? newSound : s))
        : [...sounds, newSound];
      saveSounds(updated);
      setSoundModal(null);
      setSoundTitle('');
      setSoundThumb(null);
      setSoundThumbPreview(null);
      setSoundColor('');
      setSoundTag('');
      setEditingSoundId(null);
    };
    if (soundThumb) {
      const reader2 = new FileReader();
      reader2.onload = () => create(reader2.result);
      reader2.readAsDataURL(soundThumb);
    } else {
      create(soundThumbPreview);
    }
  };

  const renderImageCard = (img) => {
    const span = img.span || 1;
    return (
        <div
          key={img.id}
          className="image-card"
          style={{ gridColumnEnd: `span ${span}` }}
          draggable={sortMode !== 'title' && sortMode !== 'date'}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ id: img.id, x: e.clientX, y: e.clientY });
          }}
          onClick={() => setLightbox(img)}
          ref={calcSpan}
          onDragStart={
            sortMode !== 'title' && sortMode !== 'date'
              ? () => setDraggedId(img.id)
              : undefined
          }
          onDragOver={
            sortMode !== 'title' && sortMode !== 'date'
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
            sortMode !== 'title' && sortMode !== 'date'
              ? (e) => {
                  if (e.dataTransfer.files?.length) {
                    handleDrop(e);
                    return;
                  }
                  e.preventDefault();
                  if (draggedId && draggedId !== img.id) {
                    moveImage(draggedId, img.id);
                  }
                  setDraggedId(null);
                }
              : undefined
          }
          onDragEnd={
            sortMode !== 'title' && sortMode !== 'date'
              ? () => setDraggedId(null)
              : undefined
          }
        >
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
            calcSpan(e.target.parentNode);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setMenu({ id: img.id, x: e.clientX, y: e.clientY });
          }}
          onClick={() => setLightbox(img)}
        />
        <div className="image-overlay">
          <h3>
            <span
              className="color-dot"
              style={{ background: img.color }}
            ></span>
            {img.title}
          </h3>
        </div>
        </div>
      );
    };

  const renderSoundCard = (snd) => (
    <div
      key={snd.id}
      className="image-card sound-card"
      ref={calcSpan}
      onContextMenu={(e) => {
        e.preventDefault();
        setSoundMenu({ id: snd.id, x: e.clientX, y: e.clientY });
      }}
    >
      {snd.thumbnail ? (
        <img src={snd.thumbnail} alt={snd.title} draggable={false} />
      ) : (
        <div className="sound-placeholder">♪</div>
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
        {snd.tag && <span className="tag">{snd.tag}</span>}
        <audio
          controls
          src={snd.dataUrl}
          className="sound-player"
        ></audio>
      </div>
    </div>
  );

  return (
    <div
      className={`library-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && <div className="drop-overlay">Upload Media</div>}
      {uploading && <div className="upload-status">Uploading…</div>}
      <div className="library-manager">
        <div className="library-header">
          <button onClick={onBack} className="back-button">
            Back
          </button>
          <h2>Library</h2>
          <div className="sort-dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSortMenuOpen((o) => !o);
              }}
              className="sort-button"
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
              </div>
            )}
          </div>
        </div>
        <div className="library-tabs">
          <button
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={activeTab === 'images' ? 'active' : ''}
            onClick={() => setActiveTab('images')}
          >
            Images
          </button>
          <button
            className={activeTab === 'words' ? 'active' : ''}
            onClick={() => setActiveTab('words')}
          >
            Words
          </button>
          <button
            className={activeTab === 'sounds' ? 'active' : ''}
            onClick={() => setActiveTab('sounds')}
          >
            Sounds
          </button>
        </div>
        {(activeTab === 'all' || activeTab === 'images') && (
          sortMode === 'color' ? (
            <div className="color-groups">
              {palette.map((c) => {
                const groupImgs = images.filter((img) => img.color === c);
                  const groupSounds = sounds.filter((s) => s.color === c);
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
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
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
              {activeTab === 'all' && sounds.length > 0 && (
                <div className="color-group">
                  <h3 className="color-title" style={{ color: '#fff' }}>
                    Sounds
                  </h3>
                      <div style={{ width: '100%', overflow: 'hidden' }}>
                        <div
                          className="image-grid"
                          style={{
                            gridTemplateColumns: 'repeat(auto-fill, minmax(800px, 1fr))',
                          }}
                        >
                        {sounds.map((s, i) => renderSoundCard(s, images.length + i))}
                      </div>
                    </div>
                </div>
              )}
            </div>
          ) : (
                <div style={{ width: '100%', overflow: 'hidden' }}>
                  <div
                    ref={gridRef}
                    className="image-grid"
                    style={{
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    }}
                    onDragOver={
                    sortMode !== 'title' && sortMode !== 'date'
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
                    sortMode !== 'title' && sortMode !== 'date'
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
                  {(
                    activeTab === 'all'
                      ? [...images.map((img) => ({ type: 'image', item: img })),
                        ...sounds.map((s) => ({ type: 'sound', item: s }))]
                        .sort((a, b) => a.item.id - b.item.id)
                        .map(({ type, item }) =>
                          type === 'image'
                            ? renderImageCard(item)
                            : renderSoundCard(item)
                        )
                      : images.map((img) => renderImageCard(img))
                  )}
                </div>
              </div>
          )
        )}
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
              {words.map((w) => (
                <li key={w.id}>{w.text}</li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'sounds' && (
          <div className="sound-section">
              <div style={{ width: '100%', overflow: 'hidden' }}>
                <div
                  className="image-grid"
                  style={{
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  }}
                >
                  {sounds.map((s) => renderSoundCard(s))}
                </div>
              </div>
          </div>
        )}
        {soundModal && (
          <div className="sound-modal" onClick={() => setSoundModal(null)}>
            <div
              className="sound-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <audio controls src={soundModal}></audio>
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
              <input
                type="text"
                value={soundTag}
                onChange={(e) => setSoundTag(e.target.value)}
                placeholder="Tag"
              />
              <div className="sound-modal-actions">
                <button
                  onClick={() => {
                    setSoundModal(null);
                    setSoundTitle('');
                    setSoundThumb(null);
                    setSoundThumbPreview(null);
                    setSoundColor('');
                    setSoundTag('');
                    setEditingSoundId(null);
                  }}
                >
                  Cancel
                </button>
                <button onClick={saveDroppedSound}>Save</button>
              </div>
            </div>
          </div>
        )}
        {soundMenu && (
          <div
            className="context-menu"
            style={{ left: soundMenu.x, top: soundMenu.y }}
          >
            <button
              onClick={() => {
                const snd = sounds.find((s) => s.id === soundMenu.id);
                if (snd) {
                  setSoundModal(snd.dataUrl);
                  setSoundTitle(snd.title);
                  setSoundThumb(null);
                  setSoundThumbPreview(snd.thumbnail || null);
                  setSoundColor(snd.color || '');
                  setSoundTag(snd.tag || '');
                  setEditingSoundId(snd.id);
                }
                setSoundMenu(null);
              }}
            >
              Edit
            </button>
            <button
              onClick={() => {
                deleteSound(soundMenu.id);
                setSoundMenu(null);
              }}
            >
              Delete
            </button>
          </div>
        )}
        {menu && (
          <div className="context-menu" style={{ left: menu.x, top: menu.y }}>
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
                  <div className="tag-list">
                    {lightbox.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="tag"
                        onClick={() => {
                          const nt = lightbox.tags.filter((_, i) => i !== idx);
                          updateImage(lightbox.id, { tags: nt });
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
                          const nt = [...(lightbox.tags || []), tagInput.trim()];
                          updateImage(lightbox.id, { tags: nt });
                          setTagInput('');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="zoom-indicator">
                {Math.round(lightboxZoom * 100)}%
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
