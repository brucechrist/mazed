import React, { useEffect, useRef, useState } from 'react';
import { supabaseClient } from './supabaseClient';
import AvatarUploadModal from './AvatarUploadModal.jsx';
import './note-modal.css';
import './profile-modal.css';

const placeholderImg =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20width%3D'120'%20height%3D'120'%3E%3Crect%20width%3D'120'%20height%3D'120'%20rx%3D'60'%20fill%3D'%23444'%2F%3E%3Ctext%20x%3D'60'%20y%3D'78'%20font-size%3D'60'%20text-anchor%3D'middle'%20fill%3D'%23aaa'%3E%3F%3C%2Ftext%3E%3C%2Fsvg%3E";

const BUCKET = 'avatars';

export default function ProfileModal({ onClose, onAvatarUpdated }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [imgSrc, setImgSrc] = useState(placeholderImg);
  const [showMenu, setShowMenu] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;
      setEmail(user.email);

      const stored = localStorage.getItem(`username_${user.id}`);
      if (stored) {
        setUsername(stored);
      } else {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (profile?.username) {
          const clean = profile.username.toLowerCase();
          setUsername(clean);
          localStorage.setItem(`username_${user.id}`, clean);
        }
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchAvatar = async () => {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) return;

      const storedPath = localStorage.getItem(`avatarPath_${user.id}`);
      if (storedPath) {
        const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(storedPath);
        setImgSrc(data.publicUrl);
      } else {
        const storedUrl = localStorage.getItem(`avatarUrl_${user.id}`);
        if (storedUrl) setImgSrc(storedUrl);
      }

      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (profile?.avatar_url) {
        const { data } = supabaseClient.storage
          .from(BUCKET)
          .getPublicUrl(profile.avatar_url);
        setImgSrc(data.publicUrl);
        localStorage.setItem(`avatarPath_${user.id}`, profile.avatar_url);
        localStorage.setItem(`avatarUrl_${user.id}`, data.publicUrl);
      }
    };
    fetchAvatar();
  }, []);

  const handleUploadComplete = (_, url) => {
    setImgSrc(url);
    if (onAvatarUpdated) onAvatarUpdated(_, url);
  };

  const handleUsernameSave = async () => {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user || !newUsername) return;
    const clean = newUsername.trim().toLowerCase();
    const { error } = await supabaseClient
      .from('profiles')
      .update({ username: clean })
      .eq('id', user.id);
    if (!error) {
      setUsername(clean);
      localStorage.setItem(`username_${user.id}`, clean);
      setShowUsernamePrompt(false);
    }
  };

  const handleSignOut = async () => {
    if (window.electronAPI?.setWindowSize) {
      window.electronAPI.setWindowSize(1600, 900);
    }
    await supabaseClient.auth.signOut();
    if (onClose) onClose();
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
        {username ? (
          <div className="profile-name">@{username}</div>
        ) : (
          <>
            {email && <div className="profile-name">{email}</div>}
            <div className="get-username-line">
              <button className="get-username-btn" onClick={() => setShowUsernamePrompt(true)}>
                Get username
              </button>
            </div>
          </>
        )}
        <div className="disconnect-line">
          <button className="disconnect-btn" onClick={handleSignOut}>Disconnect</button>
        </div>
      </div>
      {showUpload && (
        <AvatarUploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploadComplete}
        />
      )}
      {showUsernamePrompt && (
        <div className="modal-overlay" onClick={() => setShowUsernamePrompt(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <input
              className="note-title"
              placeholder="Choose a username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            <div className="actions">
              <button className="save-button" onClick={handleUsernameSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
