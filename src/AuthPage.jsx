import React, { useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUp, setSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (signUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      if (data.user) {
        await supabase
          .from('profiles')
          .insert({ id: data.user.id });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>{signUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit}>
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
        {error && <div className="error">{error}</div>}
        <button type="submit">{signUp ? 'Sign Up' : 'Sign In'}</button>
      </form>
      <button onClick={() => setSignUp((s) => !s)}>
        {signUp ? 'Have an account? Sign In' : 'Need an account? Sign Up'}
      </button>
    </div>
  );
}
