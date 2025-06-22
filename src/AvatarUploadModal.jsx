import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import './note-modal.css';
import './avatar-upload-modal.css';

const BUCKET = 'avatars';

export default function AvatarUploadModal({ onClose, onUploaded }) {
  const inputRef = useRef(null);
  const [recents, setRecents] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.storage
        .from(BUCKET)
        .list(`${user.id}`, { limit: 5, sortBy: { column: 'created_at', order: 'desc' } });
      if (data) {
        const mapped = data.map((item) => {
          const path = `${user.id}/${item.name}`;
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
          return { path, url: urlData.publicUrl };
        });
        setRecents(mapped);
      }
    };
    load();
  }, []);

  const finish = async (path) => {
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id);
      onUploaded(path, urlData.publicUrl);
    }
  };

  const handleSelectRecent = async (path) => {
    await finish(path);
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, { upsert: true });
    if (!error) {
      await finish(filePath);
      onClose();
    }
    setUploading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal avatar-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-drop-area" onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading...' : 'Click to upload image'}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {recents.length > 0 && <div className="avatar-recents-header">Avatar recents</div>}
        <div className="recents-grid">
          {recents.map((r) => (
            <img
              key={r.path}
              className="recent-avatar"
              src={r.url}
              onClick={() => handleSelectRecent(r.path)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
