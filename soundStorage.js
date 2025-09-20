const DB_NAME = 'mazed-library';
const STORE_NAME = 'sounds';
let dbPromise = null;

function openDatabase() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      let request;
      try {
        request = window.indexedDB.open(DB_NAME, 1);
      } catch (err) {
        console.error('Sound storage open threw', err);
        resolve(null);
        return;
      }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('Sound storage open failed', request.error);
        resolve(null);
      };
    });
  }
  return dbPromise;
}

export async function storeSoundData(id, dataUrl) {
  if (!dataUrl) {
    return deleteSoundData(id);
  }
  const db = await openDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error('Failed to store sound data', tx.error);
        resolve(false);
      };
      store.put(dataUrl, String(id));
    } catch (err) {
      console.error('Sound storage put failed', err);
      resolve(false);
    }
  });
}

export async function loadSoundData(id) {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(String(id));
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        console.error('Failed to load sound data', request.error);
        resolve(null);
      };
    } catch (err) {
      console.error('Sound storage read failed', err);
      resolve(null);
    }
  });
}

export async function deleteSoundData(id) {
  const db = await openDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error('Failed to delete sound data', tx.error);
        resolve(false);
      };
      store.delete(String(id));
    } catch (err) {
      console.error('Sound storage delete failed', err);
      resolve(false);
    }
  });
}
