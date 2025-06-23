import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './auth.css';

export default function Auth() {
  const [mode, setMode] = useState('signin');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    if (data?.user) {
      const cleanName = username.trim().toLowerCase();
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email,
          username: cleanName,
          avatar_url: null,
          resources: 0,
          streaks: 0,
          stats: [5, 5, 5, 5],
        });
      localStorage.setItem(`username_${data.user.id}`, cleanName);
    }
    setErrorMsg(null);
    setMode('signin');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    let usedEmail = identifier.trim();

    if (!usedEmail.includes('@')) {
      // identifier is likely a username, resolve it to an email first
      const lookup = usedEmail.toLowerCase();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('email')
        .ilike('username', lookup)
        .single();
      if (error || !profile) {
        setErrorMsg('Invalid login credentials');
        return;
      }
      usedEmail = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: usedEmail,
      password,
    });
    if (error) {
      setErrorMsg(error.message);
      return;
    }

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
        localStorage.setItem(
          `username_${user.id}`,
          profile.username.toLowerCase()
        );
      }
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
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
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
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <button type="submit" className="primary-btn">Create Account</button>
            <button type="button" className="secondary-btn" onClick={() => setMode('signin')}>Back to Sign In</button>
            {errorMsg && <div className="auth-error">{errorMsg}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
