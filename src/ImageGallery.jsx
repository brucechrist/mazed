import React, { useEffect, useState } from 'react';
import './image-gallery.css';

export default function ImageGallery({ onBack }) {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);
  const [view, setView] = useState('home'); // 'home' or 'gallery'

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

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newImage = {
        id: Date.now(),
        title,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        dataUrl: reader.result,
      };
      const updated = [...images, newImage];
      saveImages(updated);
      setTitle('');
      setTags('');
      setFile(null);
      e.target.reset();
    };
    reader.readAsDataURL(file);
  };

  const handleUrl = async () => {
    const url = window.prompt('Enter image URL');
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const newImage = {
          id: Date.now(),
          title: '',
          tags: [],
          dataUrl: reader.result,
        };
        const updated = [...images, newImage];
        saveImages(updated);
        setView('gallery');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Failed to load image', err);
    }
  };

  return (
    <div className="image-gallery-container">
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
            <div className="option-list">
              <button className="option-card url" onClick={handleUrl}>
                <span className="icon">🔗</span>
                <span className="text">Edit from URL</span>
                <span className="arrow">→</span>
              </button>
              <button
                className="option-card upload"
                onClick={() => setView('gallery')}
              >
                <span className="icon">🖼️</span>
                <span className="text">Edit Uploaded Images</span>
                <span className="arrow">→</span>
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
          <form className="image-upload-form" onSubmit={handleUpload}>
            <label className="file-input-label">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                required
              />
              {file ? file.name : 'Select Image'}
            </label>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <button type="submit">Upload</button>
          </form>
          <div className="image-grid">
            {images.map((img) => (
              <div key={img.id} className="image-card">
                <img src={img.dataUrl} alt={img.title} />
                <div className="image-overlay">
                  <h3>{img.title}</h3>
                  {img.tags.length > 0 && (
                    <div className="tags">
                      {img.tags.map((t) => (
                        <span key={t} className="tag">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
