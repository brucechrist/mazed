import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './profile-modal.css';
import profileImg from './assets/profile.png';

export default function ProfileModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <img className="profile-pic" src={profileImg} alt="Profile" />
        {email && <div className="profile-name">{email}</div>}
        {username && <div className="profile-username">@{username}</div>}
      </div>
    </div>
  );
}
