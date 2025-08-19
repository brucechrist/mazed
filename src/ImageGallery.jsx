import React, { useEffect, useMemo, useRef, useState } from 'react';
import './image-gallery.css';

export default function ImageGallery({ onBack }) {
  const [images, setImages] = useState([]);
  const [view, setView] = useState('home'); // 'home' or 'gallery'
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menu, setMenu] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [zoom, setZoom] = useState(
    () => Number(localStorage.getItem('galleryZoom')) || 0.35
  );
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const filePickerRef = useRef(null);
  const dragIndex = useRef(null);
  const gridRef = useRef(null);
  const dragItem = useRef(null);
  const dragPlaceholder = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragMoveListener = useRef(null);

  // Load saved images from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mazedImages');
    if (saved) {
      try {
        setImages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved images', e);
      }
    }
  }, []);

  const saveImages = (imgs) => {
    setImages(imgs);
    localStorage.setItem('mazedImages', JSON.stringify(imgs));
  };

  useEffect(() => {
    localStorage.setItem('galleryZoom', zoom);
  }, [zoom]);

  const maxZoom = 1; // max 100% of native size


  useEffect(() => {
    if (view !== 'gallery') return;
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
  }, [view, maxZoom]);

  useEffect(() => {
    localStorage.setItem('galleryZoom', zoom);
  }, [zoom]);

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

    const close = () => setMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const deleteImage = (id) => {
    const updated = images.filter((img) => img.id !== id);
    saveImages(updated);
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

  const resetDrag = () => {
    if (dragMoveListener.current) {
      // Use dragover events so the actual element follows the pointer
      window.removeEventListener('dragover', dragMoveListener.current);
      dragMoveListener.current = null;
    }
    if (dragPlaceholder.current) {
      dragPlaceholder.current.remove();
      dragPlaceholder.current = null;
    }
    if (dragItem.current) {
      dragItem.current.classList.remove('dragging-card');
      dragItem.current.style.position = '';
      dragItem.current.style.left = '';
      dragItem.current.style.top = '';
      dragItem.current.style.zIndex = '';
      dragItem.current.style.pointerEvents = '';
      dragItem.current = null;
    }
  };

  const processFile = (fileObj, imgTitle = '', imgTags = []) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const imgEl = new Image();
      imgEl.onload = () => {
        const newImage = {
          id: Date.now(),
          title: imgTitle,
          description: '',
          tags: imgTags,
          quadrants: [],
          dataUrl: result,
          width: imgEl.width,
          height: imgEl.height,
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

  const handleDrop = async (e) => {
    e.preventDefault();
    if (view !== 'home') return;
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
    if (!droppedFile || !droppedFile.type.startsWith('image/')) return;
    await uploadToServer(droppedFile);
    processFile(droppedFile);
  };

  return (
    <div
      className={`image-gallery-container ${isDragging ? 'dragging' : ''}`}
      onDragOver={(e) => {
        if (view !== 'home') return;
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragEnter={(e) => {
        if (view !== 'home') return;
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (view !== 'home') return;
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={view === 'home' ? handleDrop : undefined}
    >
      {isDragging && view === 'home' && (
        <div className="drop-overlay">Upload Image</div>
      )}
      {uploading && <div className="upload-status">Uploading…</div>}
      {view === 'home' ? (
        <div className="gallery-home">
          <div className="top-bar">
            <button className="brand" onClick={onBack}>MZ</button>
            <input
              className="search-input"
              type="text"
              placeholder="What will you imagine?"
            />
            <button className="submit-edit">Submit Edit</button>
            <button className="view-all" onClick={() => setView('gallery')}>
              View All →
            </button>
          </div>
          <aside className="side-bar">
            <button>Move / Resize</button>
            <button>Paint</button>
            <button>Smart Select</button>
          </aside>
          <main className="home-main">
            <input
              type="file"
              accept="image/*"
              ref={filePickerRef}
              style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files[0];
                if (f) {
                  setView('gallery');
                  await uploadToServer(f);
                  processFile(f);
                  e.target.value = '';
                }
              }}
            />
            <div className="option-list">
              <button
                className="option-card computer"
                onClick={() => filePickerRef.current?.click()}
              >
                <span className="icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </span>
                <span className="text">Upload from Computer</span>
                <span className="arrow">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
              <button
                className="option-card upload"
                onClick={() => setView('gallery')}
              >
                <span className="icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </span>
                <span className="text">Edit Uploaded Images</span>
                <span className="arrow">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </main>
        </div>
      ) : (
        <div className="gallery-manager">
          <div className="image-gallery-header">
            <button onClick={() => setView('home')} className="back-button">
              Back
            </button>
            <h2>Image Library</h2>
          </div>
          <div
            ref={gridRef}
            className="image-grid"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragIndex.current;
              if (from == null) {
                resetDrag();
                return;
              }
              const updated = [...images];
              const [moved] = updated.splice(from, 1);
              updated.push(moved);
              saveImages(updated);
              dragIndex.current = null;
              resetDrag();
            }}
          >
            {images.map((img, index) => {
              const displayWidth = img.width * zoom;
              const displayHeight = img.height * zoom;
              return (
                <div
                  key={img.id}
                  className="image-card"
                  draggable
                  style={{ width: displayWidth, height: displayHeight }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({ id: img.id, x: e.clientX, y: e.clientY });
                  }}
                  onClick={() => setLightbox(img)}
                  onDragStart={(e) => {
                    dragIndex.current = index;
                    dragItem.current = e.currentTarget;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const gridRect = gridRef.current.getBoundingClientRect();
                    dragOffset.current = {
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    };
                    e.dataTransfer.setDragImage(new Image(), 0, 0);
                    e.dataTransfer.setData('text/plain', '');
                    const ph = document.createElement('div');
                    ph.className = 'image-card placeholder';
                    ph.style.width = `${rect.width}px`;
                    ph.style.height = `${rect.height}px`;
                    dragPlaceholder.current = ph;
                    e.currentTarget.parentNode.insertBefore(ph, e.currentTarget);
                    e.currentTarget.classList.add('dragging-card');
                    e.currentTarget.style.width = `${rect.width}px`;
                    e.currentTarget.style.height = `${rect.height}px`;
                    e.currentTarget.style.position = 'absolute';
                    e.currentTarget.style.left = `${rect.left - gridRect.left}px`;
                    e.currentTarget.style.top = `${rect.top - gridRect.top}px`;
                    e.currentTarget.style.zIndex = '1000';
                    e.currentTarget.style.pointerEvents = 'none';
                    dragMoveListener.current = (event) => {
                      event.preventDefault();
                      const gridRect2 = gridRef.current.getBoundingClientRect();
                      const x =
                        event.clientX - dragOffset.current.x - gridRect2.left;
                      const y =
                        event.clientY - dragOffset.current.y - gridRect2.top;
                      if (dragItem.current) {
                        dragItem.current.style.left = `${x}px`;
                        dragItem.current.style.top = `${y}px`;
                      }
                    };
                    // Listen on dragover so we get continuous mouse positions
                    window.addEventListener('dragover', dragMoveListener.current);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = dragIndex.current;
                    if (from == null || from === index) {
                      resetDrag();
                      return;
                    }
                    const updated = [...images];
                    const [moved] = updated.splice(from, 1);
                    updated.splice(index, 0, moved);
                    saveImages(updated);
                    dragIndex.current = null;
                    resetDrag();
                  }}
                  onDragEnd={(e) => {
                    dragIndex.current = null;
                    resetDrag();
                  }}>
                  {/* ensure the image tag is self-closing to avoid build errors */}
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
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenu({ id: img.id, x: e.clientX, y: e.clientY });
                    }}
                    onClick={() => setLightbox(img)}
                  />
                  <div className="image-overlay">
                    <h3>{img.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
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
          {!lightbox && (
            <div className="zoom-indicator">{Math.round(zoom * 100)}%</div>
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
                    <div className="quad-header">
                      <h2>Quads</h2>
                      {(lightbox.quadrants?.length || 0) < 2 && (
                        <button
                          className="add-quad-btn"
                          onClick={() => {
                            const nq = [...(lightbox.quadrants || []), ''];
                            updateImage(lightbox.id, { quadrants: nq });
                          }}
                        >
                          +
                        </button>
                      )}
                    </div>
                    <div className="quad-list">
                      {(lightbox.quadrants && lightbox.quadrants.length > 0
                        ? lightbox.quadrants
                        : ['']
                      ).map((q, idx) => (
                        <select
                          key={idx}
                          value={q}
                          className={`quad-select ${q ? 'quad-' + q : ''}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            let nq = [...(lightbox.quadrants || [])];
                            if (val === '') {
                              nq.splice(idx, 1);
                            } else {
                              nq[idx] = val;
                            }
                            updateImage(lightbox.id, { quadrants: nq });
                          }}
                        >
                          <option value=""></option>
                          <option value="II">II</option>
                          <option value="IE">IE</option>
                          <option value="EI">EI</option>
                          <option value="EE">EE</option>
                        </select>
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
