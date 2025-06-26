import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('sing-btn');
  if (!btn) {
    console.error('Sing button not found');
    return;
  }
  btn.addEventListener('click', async () => {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.error('No active tab');
      return;
    }
    const payload = {
      title: tab.title || '',
      url: tab.url || '',
      timestamp: new Date().toISOString(),
    };
    const { error } = await supabase.from('sing_logs').insert(payload);
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Logged song:', payload);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
  });
});
