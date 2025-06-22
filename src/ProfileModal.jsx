import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import AvatarUploadModal from './AvatarUploadModal.jsx';
import './note-modal.css';
import './profile-modal.css';

const placeholderImg =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'120'%20height%3D'120'%3E%3Crect%20width%3D'120'%20height%3D'120'%20rx%3D'60'%20fill%3D'%23444'%2F%3E%3Ctext%20x%3D'60'%20y%3D'78'%20font-size%3D'60'%20text-anchor%3D'middle'%20fill%3D'%23aaa'%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E";

const BUCKET = 'avatars';

export default function ProfileModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [imgSrc, setImgSrc] = useState(placeholderImg);
  const [showMenu, setShowMenu] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email);
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUsername(profile.username);
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchAvatar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const stored = localStorage.getItem(`avatarUrl_${user.id}`);
      if (stored) {
        setImgSrc(stored);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (profile?.avatar_url) {
        const { data: downloadData } = await supabase.storage
          .from(BUCKET)
          .download(profile.avatar_url);
        if (downloadData) {
          const url = URL.createObjectURL(downloadData);
          setImgSrc(url);
          localStorage.setItem(`avatarUrl_${user.id}`, url);
        } else {
          const { data } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(profile.avatar_url);
          setImgSrc(data.publicUrl);
          localStorage.setItem(`avatarUrl_${user.id}`, data.publicUrl);
        }
        localStorage.setItem(`avatarPath_${user.id}`, profile.avatar_url);
      }
    };
    fetchAvatar();
  }, []);

  const handleUploadComplete = (_, url) => {
    setImgSrc(url);
  };

  return (
    <div className="modal-overlay profile-overlay" onClick={onClose}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="avatar-container">
          <img className="profile-pic" src={imgSrc} alt="Profile" />
          <div className="avatar-edit" onClick={() => setShowMenu(!showMenu)}>✏️</div>
          {showMenu && (
            <div className="avatar-menu">
              <div
                className="avatar-menu-item"
                onClick={() => {
                  setShowMenu(false);
                  setShowUpload(true);
                }}
              >
                Modify profile picture
              </div>
            </div>
          )}
        </div>
        {email && <div className="profile-name">{email}</div>}
        {username && <div className="profile-username">@{username}</div>}
      </div>
      {showUpload && (
        <AvatarUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploadComplete}
        />
      )}
    </div>
  );
}
