import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './note-modal.css';
import './profile-modal.css';

const placeholderImg =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAABx6D+YAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAGcSURBVHja7NqxTtNAEMbx2xMsBYbiKOBSIviCSiVkZLFmyh0cYbiPvIzAm8gEmko0RsrGTvytOHnTi4/cRnMQfJ3NnMNjTTOnP1tjNzhklVsxZmS7+wJJr4WLvm1H7S6BT6X2nr1kudhfMDcbY3WhtnoVnoVYyu0Mbh3YqfTp5GrQbrXajAV9BpurFexfp4G+1iGP70D873wVfT9DflPVfRR0/xuv1F6lcdw5fX3VXkl4K16YU9OSXCHVsJT4Yoe6AGXdZEPqthlxq7YlbtJ9RHltcgv1QylV0MkdUMQ9txD43tZOtVN6OymwNdrGzWcbGdKd541H1yqf66iPYdR6ffBNdbSwWW/6IG2DZUY5pcVrjQ9E+bTGHRB1Rz77LQfr+fpDWajD6E7VmPxq2Jbq+Qq1H4xZc4qRp/GrmZ+bs6MKP2jul9jeqL/d/4FS1VnEae6ofum6vmwqsY1sp6kW5jWdUtp2I7q9tShwtfvnyO4F+E0qK/eJ2dNTD/96qRRhnPySnLdS2mPp9wkegdtqMOdsagH3a8Kv6SjEwDWNpUhyLg8a9YBdrq1Ipw1prcf9A6tcAayggVpNP46Yq7SVF+WMstaDDuVXqlViGWuANlD818r4rmU1MseilV2nNf4u1cMGkcIvY/XVRRYP4seU8eB4/ZsJJtjLTkRdg2hrG5NBrcL2q9t7frDb1Ab2KlZ6jrHctvM9S80uADwvvPA7zFk45lHAAAAAElFTkSuQmCC';

const BUCKET = 'avatars';

export default function ProfileModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [imgSrc, setImgSrc] = useState(placeholderImg);
  const [uploading, setUploading] = useState(false);

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      if (profile?.avatar_url) {
        const { data } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(profile.avatar_url);
        setImgSrc(data.publicUrl);
      }
    };
    fetchAvatar();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { upsert: true });
    if (!error) {
      await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', user.id);
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      setImgSrc(data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="modal-overlay profile-overlay" onClick={onClose}>
      <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <label htmlFor="avatar-upload">
          <img className="profile-pic" src={imgSrc} alt="Profile" />
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {email && <div className="profile-name">{email}</div>}
        {username && <div className="profile-username">@{username}</div>}
      </div>
    </div>
  );
}
