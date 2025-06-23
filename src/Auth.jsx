import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './auth.css';

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    if (data?.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email,
          username,
          avatar_url: null,
          resources: 0,
          streaks: 0,
          stats: [5, 5, 5, 5],
        });
      localStorage.setItem(`username_${data.user.id}`, username);
    }
    setErrorMsg(null);
    setMode('signin');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    let usedEmail = identifier;
    let { error } = await supabase.auth.signInWithPassword({
      email: usedEmail,
      password,
    });
    if (error) {
      // maybe identifier is a username
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .single();
      if (profile?.email) {
        usedEmail = profile.email;
        ({ error } = await supabase.auth.signInWithPassword({
          email: usedEmail,
          password,
        }));
      }
    }
    if (error) {
      setErrorMsg(error.message);
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
        if (profile?.username) {
          localStorage.setItem(`username_${user.id}`, profile.username);
        }
      }
      setErrorMsg(null);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome</h2>
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <input
              type="text"
              placeholder="Username or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="primary-btn">Sign In</button>
            <button type="button" className="secondary-btn" onClick={() => setMode('signup')}>Sign Up</button>
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" className="primary-btn">Create Account</button>
            <button type="button" className="secondary-btn" onClick={() => setMode('signin')}>Back to Sign In</button>
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
