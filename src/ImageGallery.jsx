import React, { useEffect, useState } from 'react';
import './image-gallery.css';

export default function ImageGallery({ onBack }) {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);

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

  return (
    <div className="image-gallery-container">
      <div className="image-gallery-header">
        <button onClick={onBack} className="back-button">Back</button>
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
  );
}
