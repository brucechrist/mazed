import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './auth.css';

function EyeShow() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.5868 13.7788C5.36623 15.5478 8.46953 17.9999 12.0002 17.9999C15.5308 17.9999 18.6335 15.5478 20.413 13.7788C20.8823 13.3123 21.1177 13.0782 21.2671 12.6201C21.3738 12.2933 21.3738 11.7067 21.2671 11.3799C21.1177 10.9218 20.8823 10.6877 20.413 10.2211C18.6335 8.45208 15.5308 6 12.0002 6C8.46953 6 5.36623 8.45208 3.5868 10.2211C3.11714 10.688 2.88229 10.9216 2.7328 11.3799C2.62618 11.7067 2.62618 12.2933 2.7328 12.6201C2.88229 13.0784 3.11714 13.3119 3.5868 13.7788Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12C10 13.1046 10.8954 14 12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12Z"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeHide() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.99989 4L19.9999 20M16.4999 16.7559C15.1473 17.4845 13.6185 17.9999 11.9999 17.9999C8.46924 17.9999 5.36624 15.5478 3.5868 13.7788C3.1171 13.3119 2.88229 13.0784 2.7328 12.6201C2.62619 12.2933 2.62616 11.7066 2.7328 11.3797C2.88233 10.9215 3.11763 10.6875 3.58827 10.2197C4.48515 9.32821 5.71801 8.26359 7.17219 7.42676M19.4999 14.6335C19.8329 14.3405 20.138 14.0523 20.4117 13.7803L20.4146 13.7772C20.8832 13.3114 21.1182 13.0779 21.2674 12.6206C21.374 12.2938 21.3738 11.7068 21.2672 11.38C21.1178 10.9219 20.8827 10.6877 20.4133 10.2211C18.6338 8.45208 15.5305 6 11.9999 6C11.6624 6 11.3288 6.02241 10.9999 6.06448M13.3228 13.5C12.9702 13.8112 12.5071 14 11.9999 14C10.8953 14 9.99989 13.1046 9.99989 12C9.99989 11.4605 10.2135 10.9711 10.5608 10.6113"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    const userInput = identifier.trim();
    let { error } = await supabase.auth.signInWithPassword({
      email: userInput,
      password,
    });

    if (error && !userInput.includes('@')) {
      // maybe the user entered a username; resolve it to an email and retry
      const lookup = userInput.toLowerCase();
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', lookup)
        .maybeSingle();
      if (profile?.email) {
        ({ error } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
        }));
      }
    }

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
                {showPassword ? <EyeHide /> : <EyeShow />}
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
                {showPassword ? <EyeHide /> : <EyeShow />}
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
