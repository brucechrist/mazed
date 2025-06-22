import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './world.css';

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newFriendId, setNewFriendId] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
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
      setFriends(data.filter((f) => f.status === 'accepted'));
      setRequests(data.filter((f) => f.status === 'pending' && f.friend_id === id));
    }
  };

  const sendRequest = async () => {
    if (!newFriendId || !userId) return;
    await supabase
      .from('friendships')
      .insert({ user_id: userId, friend_id: newFriendId, status: 'pending' });
    setNewFriendId('');
    fetchFriendships(userId);
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
        {friends.map((f) => {
          const id = f.user_id === userId ? f.friend_id : f.user_id;
          return (
            <div key={f.user_id + f.friend_id} className="quest-banner">
              <div className="quest-info">
                <div className="quest-name">{id}</div>
                <div className="quest-quadrant">{f.status}</div>
              </div>
            </div>
          );
        })}
      </div>
      <h4>Requests</h4>
      <div className="quest-list">
        {requests.map((r) => (
          <div key={r.user_id} className="quest-banner">
            <div className="quest-info">
              <div className="quest-name">{r.user_id}</div>
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
          placeholder="Friend user id"
          value={newFriendId}
          onChange={(e) => setNewFriendId(e.target.value)}
        />
        <button className="accept-button" onClick={sendRequest}>
          Send
        </button>
      </div>
      {userId && (
        <div style={{ marginTop: '4px', fontSize: '0.9em' }}>
          Your ID: {userId}
        </div>
      )}
    </div>
  );
}