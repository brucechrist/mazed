import React, { useEffect, useRef, useState } from 'react';
import './image-gallery.css';

const EMPTY_DRAG_IMAGE =
  typeof document !== 'undefined'
    ? (() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        return canvas;
      })()
    : null;

export default function ImageGallery({ onBack }) {
  const [images, setImages] = useState([]);
  const [view, setView] = useState('home'); // 'home' or 'gallery'
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menu, setMenu] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [zoom, setZoom] = useState(() => {
    const savedZoom = parseFloat(localStorage.getItem('galleryZoom'));
    return Number.isFinite(savedZoom) ? savedZoom : 0.35;
  });
  const maxZoom = 1;
  const filePickerRef = useRef(null);
  const gridRef = useRef(null);
  const [dragItem, setDragItem] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

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
    if (lightbox) setLightboxZoom(1);
  }, [lightbox]);

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

  const processFile = (fileObj, imgTitle = '', imgTags = []) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const imgEl = new Image();
      imgEl.onload = () => {
        const newImage = {
          id: Date.now(),
          title: imgTitle,
          tags: imgTags,
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
          <div className="image-grid" ref={gridRef}>
            {images.map((img) => {
              const displayWidth = img.width * zoom;
              const displayHeight = img.height * zoom;
              const isDraggingItem = dragItem?.id === img.id;
              const cardStyle = {
                width: displayWidth,
                height: displayHeight,
                ...(isDraggingItem
                  ? {
                      position: 'absolute',
                      left: dragItem.x - dragItem.offsetX,
                      top: dragItem.y - dragItem.offsetY,
                      zIndex: 1000,
                      pointerEvents: 'none',
                    }
                  : {}),
              };
              return (
                <React.Fragment key={img.id}>
                  {isDraggingItem && (
                    <div
                      className="image-card placeholder"
                      style={{ width: displayWidth, height: displayHeight }}
                    />
                  )}
                  <div
                    className={`image-card${isDraggingItem ? ' dragging-card' : ''}`}
                    style={cardStyle}
                    draggable
                    onDragStart={(e) => {
                      const rect = gridRef.current.getBoundingClientRect();
                      setDragItem({
                        id: img.id,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        offsetX: e.nativeEvent.offsetX,
                        offsetY: e.nativeEvent.offsetY,
                        width: displayWidth,
                        height: displayHeight,
                      });
                      if (EMPTY_DRAG_IMAGE) {
                        e.dataTransfer.setDragImage(EMPTY_DRAG_IMAGE, 0, 0);
                      }
                    }}
                    onDrag={(e) => {
                      if (!dragItem) return;
                      const rect = gridRef.current.getBoundingClientRect();
                      setDragItem((d) => ({
                        ...d,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      }));
                    }}
                    onDragEnd={() => {
                      setDragItem(null);
                      setDragOverId(null);
                    }}
                    onDragOver={(e) => {
                      if (!dragItem || img.id === dragItem.id) return;
                      e.preventDefault();
                      if (dragOverId !== img.id) {
                        moveImage(dragItem.id, img.id);
                        setDragOverId(img.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setMenu({ id: img.id, x: e.clientX, y: e.clientY });
                    }}
                    onClick={() => setLightbox(img)}
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.title}
                      draggable={false}
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
                    />
                    <div className="image-overlay">
                      <h3>{img.title}</h3>
                    </div>
                  </div>
                </React.Fragment>
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
          {lightbox && (
            <div className="lightbox" onClick={() => setLightbox(null)}>
              <div
                className="lightbox-inner"
                onClick={(e) => e.stopPropagation()}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
