import React, { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { supabase } from './supabaseClient';
import './note-modal.css';
import './avatar-upload-modal.css';
import './auth.css';

const BUCKET = 'avatars';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

async function getCroppedImg(imageSrc, crop) {
  const img = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg');
  });
}

export default function AvatarUploadModal({ onClose, onUploaded }) {
  const inputRef = useRef(null);
  const [recents, setRecents] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [fileObj, setFileObj] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState(null);

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id);
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const finalUrl = urlData.publicUrl;
    localStorage.setItem(`avatarPath_${user.id}`, path);
    localStorage.setItem(`avatarUrl_${user.id}`, finalUrl);
    onUploaded(path, finalUrl);
  };

  const handleSelectRecent = async (path) => {
    await finish(path);
    onClose();
  };

  const handleCropComplete = (_, area) => {
    setCroppedArea(area);
  };

  const handleCropCancel = () => {
    URL.revokeObjectURL(imageSrc);
    if (fileObj) {
      // release file object reference
      setFileObj(null);
    }
    setImageSrc(null);
    setCroppedArea(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedArea) return;
    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }
    const safeName = fileObj
      ? fileObj.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      : 'avatar.jpg';
    const filePath = `${user.id}/${Date.now()}-${safeName}`;
    const blob = await getCroppedImg(imageSrc, croppedArea);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, {
        upsert: true,
        cacheControl: '3600',
        contentType: 'image/jpeg',
      });
    if (error) {
      console.error('Avatar upload failed', error);
      setErrorMsg(error.message);
      setUploading(false);
      return;
    }
    await finish(filePath);
    setUploading(false);
    handleCropCancel();
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileObj(file);
    setImageSrc(url);
    inputRef.current.value = '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal avatar-upload-modal" onClick={(e) => e.stopPropagation()}>
      {imageSrc ? (
        <div className="crop-wrapper">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
          <input
            className="zoom-slider"
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <div className="crop-actions">
            <button className="secondary-btn" onClick={handleCropCancel}>
              Cancel
            </button>
            <button className="primary-btn" onClick={handleCropSave}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="avatar-drop-area" onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading...' : 'Click to upload image'}
          </div>
          {errorMsg && <div className="upload-error">{errorMsg}</div>}
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
        </>
      )}
      </div>
    </div>
  );
}
