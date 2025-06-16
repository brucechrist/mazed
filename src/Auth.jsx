import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './auth.css';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Welcome</h2>
        <form onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="primary-btn">Sign In</button>
          <button type="button" className="secondary-btn" onClick={handleSignUp}>Sign Up</button>
          {errorMsg && <div className="auth-error">{errorMsg}</div>}
        </form>
      </div>
    </div>
  );
}
