import { supabaseClient } from './supabase.js';

async function logTab(tab) {
  const payload = {
    title: tab.title || '',
    url: tab.url || '',
    timestamp: new Date().toISOString(),
  };
  try {
    const { error } = await supabaseClient.from('tab_logs').insert(payload);
    if (error) console.error('Supabase error:', error);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

chrome.tabs.onActivated.addListener(async (info) => {
  const tab = await chrome.tabs.get(info.tabId);
  logTab(tab);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.status === 'complete') {
    logTab(tab);
  }
});
