const DB_NAME = 'mazed-library-images';
const STORE_NAME = 'images';
let dbPromise = null;

const DATA_URL_REGEX = /^data:([^;]+);base64,/i;

const getElectronAPI = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  const api = window.electronAPI;
  if (!api) {
    return null;
  }
  const { saveLibraryImage, loadLibraryImage, deleteLibraryImage } = api;
  if (
    typeof saveLibraryImage === 'function' &&
    typeof loadLibraryImage === 'function' &&
    typeof deleteLibraryImage === 'function'
  ) {
    return { saveLibraryImage, loadLibraryImage, deleteLibraryImage };
  }
  return null;
};

const openDatabase = () => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      let request;
      try {
        request = window.indexedDB.open(DB_NAME, 1);
      } catch (err) {
        console.error('Image storage open threw', err);
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
        console.error('Image storage open failed', request.error);
        resolve(null);
      };
    });
  }
  return dbPromise;
};

const storeWithIndexedDB = async (id, dataUrl) => {
  const db = await openDatabase();
  if (!db) return false;
  if (!dataUrl) {
    return deleteWithIndexedDB(id);
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error('Failed to store image data', tx.error);
        resolve(false);
      };
      store.put(dataUrl, String(id));
    } catch (err) {
      console.error('Image storage put failed', err);
      resolve(false);
    }
  });
};

const loadWithIndexedDB = async (id) => {
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
        console.error('Failed to load image data', request.error);
        resolve(null);
      };
    } catch (err) {
      console.error('Image storage read failed', err);
      resolve(null);
    }
  });
};

const deleteWithIndexedDB = async (id) => {
  const db = await openDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        console.error('Failed to delete image data', tx.error);
        resolve(false);
      };
      store.delete(String(id));
    } catch (err) {
      console.error('Image storage delete failed', err);
      resolve(false);
    }
  });
};

const storeWithElectron = async (id, dataUrl, mimeType) => {
  const api = getElectronAPI();
  if (!api) return undefined;
  try {
    const result = await api.saveLibraryImage(id, dataUrl ?? null, mimeType ?? null);
    return result;
  } catch (err) {
    console.error('Electron image save failed', err);
    return false;
  }
};

const loadWithElectron = async (id) => {
  const api = getElectronAPI();
  if (!api) return undefined;
  try {
    return await api.loadLibraryImage(id);
  } catch (err) {
    console.error('Electron image load failed', err);
    return null;
  }
};

const deleteWithElectron = async (id) => {
  const api = getElectronAPI();
  if (!api) return undefined;
  try {
    return await api.deleteLibraryImage(id);
  } catch (err) {
    console.error('Electron image delete failed', err);
    return false;
  }
};

export const extractMimeType = (dataUrl) => {
  if (typeof dataUrl !== 'string') return null;
  const match = DATA_URL_REGEX.exec(dataUrl);
  return match ? match[1] : null;
};

export async function storeImageData(id, dataUrl, mimeType) {
  if (typeof id === 'undefined') return false;
  const electronResult = await storeWithElectron(id, dataUrl, mimeType);
  if (typeof electronResult === 'boolean') {
    if (electronResult) {
      return true;
    }
    // fall back to IndexedDB if electron storage failed
  } else if (electronResult) {
    return true;
  }
  return storeWithIndexedDB(id, dataUrl);
}

export async function loadImageData(id) {
  if (typeof id === 'undefined') return null;
  const electronResult = await loadWithElectron(id);
  if (typeof electronResult === 'string') {
    return electronResult;
  }
  if (electronResult === null) {
    return null;
  }
  return loadWithIndexedDB(id);
}

export async function deleteImageData(id) {
  if (typeof id === 'undefined') return false;
  const electronResult = await deleteWithElectron(id);
  if (typeof electronResult === 'boolean') {
    if (electronResult) {
      return true;
    }
    // fallback to IndexedDB if electron deletion failed
  }
  return deleteWithIndexedDB(id);
}
