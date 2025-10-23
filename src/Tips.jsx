import React, { useEffect, useMemo, useState } from 'react';
import './placeholder-app.css';
import './tips.css';

const STORAGE_KEY = 'tipsAppEntries';

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function Tips({ onBack }) {
  const [tips, setTips] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to parse stored tips', error);
      return [];
    }
  });
  const [headline, setHeadline] = useState('');
  const [tipText, setTipText] = useState('');
  const [person, setPerson] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState([]);
  const [images, setImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tips));
  }, [tips]);

  const hasFormContent = useMemo(() => {
    return (
      headline.trim() !== '' ||
      tipText.trim() !== '' ||
      person.trim() !== '' ||
      links.length > 0 ||
      images.length > 0
    );
  }, [headline, tipText, person, links, images]);

  const resetForm = () => {
    setHeadline('');
    setTipText('');
    setPerson('');
    setLinkInput('');
    setLinks([]);
    setImages([]);
    setErrorMessage('');
  };

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) {
      return;
    }
    setLinks((prev) => {
      if (prev.includes(trimmed)) {
        return prev;
      }
      return [...prev, trimmed];
    });
    setLinkInput('');
  };

  const handleRemoveLink = (link) => {
    setLinks((prev) => prev.filter((item) => item !== link));
  };

  const handleImageUpload = async (event) => {
    const fileList = Array.from(event.target.files || []);
    if (!fileList.length) return;

    const readers = fileList
      .filter((file) => file.type.startsWith('image/'))
      .map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ id: createId(), url: reader.result, name: file.name });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          })
      );

    const uploaded = await Promise.all(readers);
    setImages((prev) => [...prev, ...uploaded.filter(Boolean)]);
    event.target.value = '';
  };

  const handleRemoveImage = (id) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const handleSaveTip = () => {
    if (!tipText.trim()) {
      setErrorMessage('Write at least one helpful insight before saving.');
      return;
    }

    const newTip = {
      id: createId(),
      headline: headline.trim(),
      text: tipText.trim(),
      person: person.trim(),
      links: links.map((value) => value.trim()),
      images: images.map((image) => ({ ...image })),
      createdAt: new Date().toISOString(),
    };

    setTips((prev) => [newTip, ...prev]);
    resetForm();
  };

  const handleDeleteTip = (id) => {
    setTips((prev) => prev.filter((tip) => tip.id !== id));
  };

  return (
    <div className="placeholder-app tips-app">
      <div className="tips-header">
        <button className="back-button" onClick={onBack}>
          Back
        </button>
        <div className="tips-title-group">
          <h2>Tips</h2>
          <p className="tips-subtitle">
            Capture the advice you would share, along with the people and visuals that inspire it.
          </p>
        </div>
      </div>

      <div className="tips-form">
        <label className="tips-field">
          <span>Headline (optional)</span>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Summarize your tip in a few words"
          />
        </label>

        <label className="tips-field">
          <span>Tip</span>
          <textarea
            value={tipText}
            onChange={(e) => setTipText(e.target.value)}
            placeholder="Write the advice you would give"
            rows={4}
          />
        </label>

        <div className="tips-inline">
          <label className="tips-field">
            <span>Who is this about?</span>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              placeholder="Add a name or group"
            />
          </label>

          <label className="tips-field">
            <span>Add a link</span>
            <div className="tips-link-input">
              <input
                type="url"
                value={linkInput}
                placeholder="https://example.com"
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLink();
                  }
                }}
              />
              <button type="button" className="tips-secondary-button" onClick={handleAddLink}>
                Add link
              </button>
            </div>
          </label>
        </div>

        {links.length > 0 && (
          <ul className="tips-link-list">
            {links.map((link) => (
              <li key={link}>
                <a href={link} target="_blank" rel="noopener noreferrer">
                  {link}
                </a>
                <button
                  type="button"
                  className="tips-icon-button"
                  onClick={() => handleRemoveLink(link)}
                  aria-label="Remove link"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <label className="tips-field">
          <span>Add images</span>
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
        </label>

        {images.length > 0 && (
          <div className="tips-image-previews">
            {images.map((image) => (
              <div key={image.id} className="tips-image-preview">
                <img src={image.url} alt={image.name || 'Attached'} />
                <button
                  type="button"
                  className="tips-icon-button"
                  onClick={() => handleRemoveImage(image.id)}
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {errorMessage && <div className="tips-error">{errorMessage}</div>}

        <div className="tips-actions">
          <button
            type="button"
            className="tips-primary-button"
            onClick={handleSaveTip}
            disabled={!hasFormContent || !tipText.trim()}
          >
            Save tip
          </button>
          <button
            type="button"
            className="tips-secondary-button"
            onClick={resetForm}
            disabled={!hasFormContent}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="tips-list">
        {tips.length === 0 ? (
          <p className="tips-empty">No tips saved yet. Start by writing your first insight above.</p>
        ) : (
          tips.map((tip) => (
            <article key={tip.id} className="tip-card">
              <header className="tip-card-header">
                <div>
                  <h3>{tip.headline || 'Untitled tip'}</h3>
                  <p className="tip-card-person">
                    {tip.person ? `About: ${tip.person}` : 'About: Everyone'}
                  </p>
                </div>
                <button
                  type="button"
                  className="tips-icon-button"
                  onClick={() => handleDeleteTip(tip.id)}
                  aria-label="Delete tip"
                >
                  Delete
                </button>
              </header>
              <p className="tip-card-text">{tip.text}</p>
              {tip.links.length > 0 && (
                <ul className="tip-card-links">
                  {tip.links.map((link) => (
                    <li key={link}>
                      <a href={link} target="_blank" rel="noopener noreferrer">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {tip.images.length > 0 && (
                <div className="tip-card-images">
                  {tip.images.map((image) => (
                    <img key={image.id} src={image.url} alt={image.name || 'Tip attachment'} />
                  ))}
                </div>
              )}
              <footer className="tip-card-footer">
                <time dateTime={tip.createdAt}>
                  {new Date(tip.createdAt).toLocaleString()}
                </time>
              </footer>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
