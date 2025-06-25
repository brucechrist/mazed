import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './world.css';

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newFriendName, setNewFriendName] = useState('');
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUsername(profile.username);
        }
        fetchFriendships(user.id);
      }
    };
    load();
  }, []);

  const fetchFriendships = async (id) => {
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${id},friend_id.eq.${id}`);
    if (data) {
      const otherIds = data.map((f) => (f.user_id === id ? f.friend_id : f.user_id));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', otherIds);
      const idMap = {};
      profiles?.forEach((p) => {
        idMap[p.id] = p.username;
      });
      setFriends(
        data
          .filter((f) => f.status === 'accepted')
          .map((f) => ({
            ...f,
            name: idMap[f.user_id === id ? f.friend_id : f.user_id],
          }))
      );
      setRequests(
        data
          .filter((f) => f.status === 'pending' && f.friend_id === id)
          .map((f) => ({ ...f, name: idMap[f.user_id] }))
      );
    }
  };

  const sendRequest = async () => {
    if (!newFriendName || !userId) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', newFriendName)
      .single();
    if (profile) {
      await supabase
        .from('friendships')
        .insert({ user_id: userId, friend_id: profile.id, status: 'pending' });
      setNewFriendName('');
      fetchFriendships(userId);
    }
  };

  const acceptRequest = async (requesterId) => {
    if (!userId) return;
    await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('user_id', requesterId)
      .eq('friend_id', userId);
    fetchFriendships(userId);
  };

  return (
    <div>
      <h4>Friends</h4>
      <div className="quest-list">
        {friends.map((f) => (
          <div key={f.user_id + f.friend_id} className="quest-banner">
            <div className="quest-info">
              <div className="quest-name">{f.name}</div>
              <div className="quest-quadrant">{f.status}</div>
            </div>
          </div>
        ))}
      </div>
      <h4>Requests</h4>
      <div className="quest-list">
        {requests.map((r) => (
          <div key={r.user_id} className="quest-banner">
            <div className="quest-info">
              <div className="quest-name">{r.name}</div>
            </div>
            <button className="accept-button" onClick={() => acceptRequest(r.user_id)}>
              ✔
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
        <input
          className="note-title"
          placeholder="Friend username"
          value={newFriendName}
          onChange={(e) => setNewFriendName(e.target.value)}
        />
        <button className="accept-button" onClick={sendRequest}>
          Send
        </button>
      </div>
      {username && (
        <div style={{ marginTop: '4px', fontSize: '0.9em' }}>
          Your username: {username}
        </div>
      )}
    </div>
  );
}