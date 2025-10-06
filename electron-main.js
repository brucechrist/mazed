const { app, BrowserWindow, Menu, ipcMain, Tray, nativeImage, globalShortcut } = require('electron');
const activeWindow = require('active-win');
const path = require('path');
const fs = require('fs');
const os = require('os');
const fsp = fs.promises;
const { spawn } = require('child_process');
let mainWindow;
let tray;
let isQuitting = false;

const LIBRARY_DIR_NAME = 'LibraryStorage';
const LIBRARY_IMAGES_SUBDIR = 'images';
const MIME_EXTENSION_MAP = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
};

const extensionForMime = (mime) => {
  if (!mime || typeof mime !== 'string') {
    return 'bin';
  }
  const lower = mime.toLowerCase();
  if (MIME_EXTENSION_MAP[lower]) {
    return MIME_EXTENSION_MAP[lower];
  }
  const slash = lower.lastIndexOf('/');
  if (slash !== -1 && slash < lower.length - 1) {
    const subtype = lower.slice(slash + 1);
    if (subtype.includes('+')) {
      const [base] = subtype.split('+');
      if (base) return base.replace(/[^a-z0-9]/g, '') || 'bin';
    }
    return subtype.replace(/[^a-z0-9]/g, '') || 'bin';
  }
  return 'bin';
};

const parseDataUrlForSave = (dataUrl, hintedMime) => {
  if (typeof dataUrl !== 'string') {
    return null;
  }
  const match = /^data:([^;]+);base64,(.+)$/is.exec(dataUrl);
  if (match) {
    const [, mime, base64] = match;
    const mimeType = mime || hintedMime || 'application/octet-stream';
    const buffer = Buffer.from(base64, 'base64');
    return {
      encoding: 'base64',
      mimeType,
      extension: extensionForMime(mimeType),
      buffer,
    };
  }
  return {
    encoding: 'data-url',
    mimeType: hintedMime || 'text/plain',
    extension: 'txt',
    raw: dataUrl,
  };
};

const getLibraryBaseDir = () =>
  path.join(app.getPath('userData'), LIBRARY_DIR_NAME);
const getImagesDir = () =>
  path.join(getLibraryBaseDir(), LIBRARY_IMAGES_SUBDIR);
const getImageDir = (id) => path.join(getImagesDir(), String(id));
const getImageMetaPath = (id) => path.join(getImageDir(id), 'meta.json');

const ensureImagesDir = async () => {
  await fsp.mkdir(getImagesDir(), { recursive: true });
};

const removeDirectory = async (dir) => {
  try {
    if (fsp.rm) {
      await fsp.rm(dir, { recursive: true, force: true });
    } else {
      await fsp.rmdir(dir, { recursive: true });
    }
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      throw err;
    }
  }
};

const readJsonSafe = async (filePath) => {
  try {
    const text = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to read library image metadata', err);
    }
    return null;
  }
};

const findFallbackImageData = async (dir) => {
  try {
    const files = await fsp.readdir(dir);
    for (const name of files) {
      const filePath = path.join(dir, name);
      if (name.endsWith('.txt')) {
        return await fsp.readFile(filePath, 'utf8');
      }
      const buffer = await fsp.readFile(filePath);
      const ext = path.extname(name).slice(1).toLowerCase();
      const mimeType =
        Object.keys(MIME_EXTENSION_MAP).find(
          (key) => MIME_EXTENSION_MAP[key] === ext
        ) || `image/${ext || 'png'}`;
      const base64 = buffer.toString('base64');
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to read legacy library image', err);
    }
  }
  return null;
};

function findTrayIcon() {
  const candidates = [
    path.join(__dirname, 'src/assets/icons/mazed_logo_hd.png'),
    path.join(__dirname, 'src/assets/backgrounds/Viego_0.jpg'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const img = nativeImage.createFromPath(p);
        if (!img.isEmpty()) return img;
      }
    } catch {}
  }
  return nativeImage.createEmpty();
}

const isWindows = process.platform === 'win32';
const UNITY_RUNTIME_SEGMENTS = ['runtime', 'win', 'UnityPlayer'];
const UNITY_CONFIG_FILE = 'unity.config.json';
const UNITY_EMBEDDER_NAME = isWindows ? 'UnityEmbedder.exe' : 'UnityEmbedder';

let unityProcess = null;
let unityMounted = false;
let unityLastRect = null;
let unityConfigCache = null;
let unityResizeTimer = null;
let unityActiveTitle = null;
let unityHostWindow = null;
let unityHostHandle = null;
let unityHostLastRect = null;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function resolveUnpackedPath(...segments) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app.asar.unpacked', ...segments);
  }
  return path.join(__dirname, ...segments);
}

async function readJsonSafeLocal(filePath) {
  try {
    const raw = await fsp.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to read JSON file', filePath, err);
    }
    return null;
  }
}

async function resolveUnityConfig() {
  if (!isWindows) return null;
  if (unityConfigCache) return unityConfigCache;

  const runtimeDir = resolveUnpackedPath(...UNITY_RUNTIME_SEGMENTS);
  try {
    const stat = await fsp.stat(runtimeDir);
    if (!stat.isDirectory()) {
      return null;
    }
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to access Unity runtime directory', err);
    }
    return null;
  }

  const cfg = (await readJsonSafeLocal(path.join(runtimeDir, UNITY_CONFIG_FILE))) || {};
  let exeName = cfg.exe || cfg.executable;
  const args = Array.isArray(cfg.args) ? cfg.args : [];
  const rawTitles = [];
  const addTitle = (value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (rawTitles.some((existing) => existing.toLowerCase() === lower)) {
      return;
    }
    rawTitles.push(trimmed);
  };

  if (typeof exeName !== 'string' || !exeName.trim()) {
    try {
      const files = await fsp.readdir(runtimeDir);
      const ignore = new Set(['unityembedder.exe', 'unitycrashhandler64.exe']);
      const candidate = files.find((name) => {
        if (!name.toLowerCase().endsWith('.exe')) return false;
        return !ignore.has(name.toLowerCase());
      });
      if (!candidate) {
        return null;
      }
      exeName = candidate;
    } catch (err) {
      console.error('Failed to list Unity runtime directory', err);
      return null;
    }
  }

  const exePath = path.isAbsolute(exeName) ? exeName : path.join(runtimeDir, exeName);
  try {
    await fsp.access(exePath);
  } catch (err) {
    console.error('Unity executable not found', exePath, err);
    return null;
  }

  addTitle(cfg.title);
  if (Array.isArray(cfg.titles)) {
    for (const candidate of cfg.titles) {
      addTitle(candidate);
    }
  }
  if (rawTitles.length === 0) {
    addTitle(path.parse(exePath).name);
  }

  const titles = [];
  const seen = new Set();
  const devSuffix = ' (Development Build)';
  const pushTitle = (value) => {
    if (typeof value !== 'string' || !value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const lower = trimmed.toLowerCase();
    if (seen.has(lower)) return;
    seen.add(lower);
    titles.push(trimmed);
  };

  for (const title of rawTitles) {
    pushTitle(title);
  }

  for (const title of rawTitles) {
    if (title.toLowerCase().endsWith(devSuffix.toLowerCase())) {
      pushTitle(title.slice(0, -devSuffix.length));
    } else {
      pushTitle(`${title}${devSuffix}`);
    }
  }

  unityConfigCache = { runtimeDir, exePath, args, titles };
  return unityConfigCache;
}

async function ensureUnityProcess() {
  if (unityProcess && !unityProcess.killed) {
    return unityProcess;
  }
  const config = await resolveUnityConfig();
  if (!config) {
    throw new Error('Unity runtime not found.');
  }
  try {
    unityProcess = spawn(config.exePath, config.args || [], {
      cwd: path.dirname(config.exePath),
      windowsHide: true,
      stdio: 'ignore',
    });
  } catch (err) {
    unityProcess = null;
    throw err;
  }

  unityProcess.once('exit', () => {
    unityProcess = null;
    unityMounted = false;
    unityActiveTitle = null;
    destroyUnityHostWindow();
  });
  unityProcess.once('error', (err) => {
    console.error('Unity process error', err);
    unityProcess = null;
    unityMounted = false;
    unityActiveTitle = null;
    destroyUnityHostWindow();
  });
  return unityProcess;
}

function killUnityProcess() {
  if (unityProcess && !unityProcess.killed) {
    try {
      unityProcess.kill();
    } catch (err) {
      console.error('Failed to kill Unity process', err);
    }
  }
  unityProcess = null;
  unityMounted = false;
  unityActiveTitle = null;
  destroyUnityHostWindow();
}

function readWindowHandle(win) {
  if (!win) return null;
  try {
    const buf = win.getNativeWindowHandle();
    if (!buf) return null;
    if (typeof buf.readBigUInt64LE === 'function' && buf.length >= 8) {
      return buf.readBigUInt64LE(0).toString();
    }
    if (typeof buf.readUInt32LE === 'function' && buf.length >= 4) {
      return BigInt(buf.readUInt32LE(0)).toString();
    }
  } catch (err) {
    console.error('Failed to read native window handle', err);
  }
  return null;
}

function destroyUnityHostWindow() {
  if (unityHostWindow && !unityHostWindow.isDestroyed()) {
    try {
      unityHostWindow.destroy();
    } catch (err) {
      console.error('Failed to destroy Unity host window', err);
    }
  }
  unityHostWindow = null;
  unityHostHandle = null;
  unityHostLastRect = null;
}

function ensureUnityHostWindow() {
  if (!isWindows || !mainWindow) return null;
  if (unityHostWindow && !unityHostWindow.isDestroyed()) {
    return unityHostWindow;
  }
  unityHostWindow = new BrowserWindow({
    parent: mainWindow,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    backgroundColor: '#00000000',
  });
  unityHostWindow.setMenuBarVisibility(false);
  unityHostWindow.setAlwaysOnTop(true, 'screen-saver');
  unityHostWindow.on('closed', () => {
    unityHostWindow = null;
    unityHostHandle = null;
    unityHostLastRect = null;
  });
  unityHostHandle = readWindowHandle(unityHostWindow);
  return unityHostWindow;
}

function getUnityHostWindowHandle() {
  const hostWindow = ensureUnityHostWindow();
  if (!hostWindow) return null;
  if (!unityHostHandle) {
    unityHostHandle = readWindowHandle(hostWindow);
  }
  return unityHostHandle;
}

function applyUnityHostBounds() {
  if (!isWindows || !mainWindow || !unityHostLastRect) return;
  const width = Math.max(0, Math.floor(unityHostLastRect.width));
  const height = Math.max(0, Math.floor(unityHostLastRect.height));
  if (width <= 0 || height <= 0) {
    if (unityHostWindow && !unityHostWindow.isDestroyed()) {
      unityHostWindow.hide();
    }
    return;
  }
  const contentBounds = mainWindow.getContentBounds();
  const x = Math.floor(contentBounds.x + Math.floor(unityHostLastRect.left));
  const y = Math.floor(contentBounds.y + Math.floor(unityHostLastRect.top));
  const hostWindow = ensureUnityHostWindow();
  if (!hostWindow) return;
  hostWindow.setBounds({ x, y, width, height });
  hostWindow.setAlwaysOnTop(true, 'screen-saver');
  if (!hostWindow.isVisible()) {
    hostWindow.showInactive();
  } else {
    try {
      hostWindow.moveTop();
    } catch {}
  }
}

function updateUnityHostFromRect(rect) {
  const normalizedHostRect = normalizeRect(rect);
  if (!normalizedHostRect) {
    return null;
  }
  unityHostLastRect = normalizedHostRect;
  applyUnityHostBounds();
  return normalizedHostRect;
}

async function resolveEmbedderPath() {
  const embedderPath = resolveUnpackedPath('native', UNITY_EMBEDDER_NAME);
  try {
    await fsp.access(embedderPath);
    return embedderPath;
  } catch (err) {
    console.error('Unity embedder executable missing', embedderPath, err);
    return null;
  }
}

async function runUnityEmbedder(args) {
  const embedder = await resolveEmbedderPath();
  if (!embedder) {
    return 1;
  }
  return new Promise((resolve) => {
    const child = spawn(embedder, args, {
      cwd: path.dirname(embedder),
      windowsHide: true,
      stdio: 'ignore',
    });
    child.on('error', (err) => {
      console.error('Unity embedder failed', err);
      resolve(1);
    });
    child.on('exit', (code) => {
      resolve(typeof code === 'number' ? code : 1);
    });
  });
}

async function embedUnity(rect) {
  if (
    !rect ||
    typeof rect.width === 'undefined' ||
    typeof rect.height === 'undefined' ||
    typeof rect.left === 'undefined' ||
    typeof rect.top === 'undefined'
  ) {
    throw new Error('Invalid Unity mount rectangle');
  }
  const config = await resolveUnityConfig();
  if (!config) {
    throw new Error('Unity runtime is missing.');
  }
  await ensureUnityProcess();

  const mountRect = updateUnityHostFromRect(rect);
  if (!mountRect) {
    throw new Error('Invalid Unity mount rectangle');
  }

  const width = Math.max(0, Math.floor(mountRect.width));
  const height = Math.max(0, Math.floor(mountRect.height));
  const left = Math.floor(mountRect.left);
  const top = Math.floor(mountRect.top);

  if (width <= 0 || height <= 0) {
    throw new Error('Unity mount rectangle has no area.');
  }

  const hostHandle = getUnityHostWindowHandle();
  if (!hostHandle) {
    throw new Error('Failed to obtain host window handle.');
  }

  const titles = Array.isArray(config.titles) && config.titles.length > 0 ? config.titles : [];
  if (titles.length === 0) {
    throw new Error('Unity configuration is missing window titles.');
  }
  unityActiveTitle = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    for (const title of titles) {
      const code = await runUnityEmbedder([
        'embed',
        title,
        hostHandle,
        String(width),
        String(height),
      ]);
      if (code === 0) {
        unityMounted = true;
        unityLastRect = { left, top, width, height };
        unityActiveTitle = title;
        return true;
      }
    }
    await delay(400);
  }
  destroyUnityHostWindow();
  return false;
}

function orderedUnityTitles(config) {
  if (!config || !Array.isArray(config.titles) || config.titles.length === 0) {
    return [];
  }
  if (!unityActiveTitle) {
    return config.titles;
  }
  const lowerActive = unityActiveTitle.toLowerCase();
  const ordered = [];
  const seen = new Set();
  for (const title of config.titles) {
    const lower = title.toLowerCase();
    if (seen.has(lower)) continue;
    if (lower === lowerActive) {
      ordered.unshift(title);
      seen.add(lower);
    }
  }
  for (const title of config.titles) {
    const lower = title.toLowerCase();
    if (seen.has(lower)) continue;
    ordered.push(title);
    seen.add(lower);
  }
  return ordered;
}

function normalizeRect(rect) {
  if (!rect || typeof rect !== 'object') {
    return null;
  }
  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };
  const left = toNumber(rect.left);
  const top = toNumber(rect.top);
  const width = Math.max(0, toNumber(rect.width));
  const height = Math.max(0, toNumber(rect.height));
  return { left, top, width, height };
}

function scheduleUnityResize(rect) {
  const resizeRect = updateUnityHostFromRect(rect);
  if (!resizeRect) {
    return;
  }
  unityLastRect = resizeRect;
  if (!unityMounted) {
    return;
  }
  if (unityResizeTimer) {
    clearTimeout(unityResizeTimer);
  }
  unityResizeTimer = setTimeout(() => {
    unityResizeTimer = null;
    (async () => {
      const config = await resolveUnityConfig();
      if (!config) return;
      const orderedTitles = orderedUnityTitles(config);
      if (orderedTitles.length === 0) return;
      const width = Math.max(0, Math.floor(unityLastRect.width));
      const height = Math.max(0, Math.floor(unityLastRect.height));
      if (width <= 0 || height <= 0) {
        return;
      }
      for (const title of orderedTitles) {
        const code = await runUnityEmbedder([
          'resize',
          title,
          String(width),
          String(height),
        ]);
        if (code === 0) {
          if (!unityActiveTitle || unityActiveTitle.toLowerCase() !== title.toLowerCase()) {
            unityActiveTitle = title;
          }
          return;
        }
      }
      console.warn('Unity resize command failed for all configured titles');
    })().catch((err) => {
      console.error('Unity resize failed', err);
    });
  }, 120);
}

function createTray() {
  if (tray) return tray;
  const icon = findTrayIcon();
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (!mainWindow) return;
        mainWindow.show();
        if (process.platform === 'darwin') app.dock && app.dock.show();
      },
    },
    {
      label: 'Hide',
      click: () => {
        if (!mainWindow) return;
        if (process.platform === 'darwin') app.hide();
        else mainWindow.hide();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('Mazed');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      if (process.platform === 'darwin') app.hide();
      else mainWindow.hide();
    } else {
      mainWindow.show();
      if (process.platform === 'darwin') app.dock && app.dock.show();
    }
  });
  return tray;
}

function createWindow() {
  const startHidden = shouldStartHidden();
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    resizable: false,
    movable: true,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'src/assets/icons/mazed_logo_hd.png'),
    show: !startHidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.center();

  // Intercept close: hide to tray instead of quitting
  mainWindow.on('close', (e) => {
    if (isQuitting) return;
    e.preventDefault();
    if (process.platform === 'darwin') app.hide();
    else mainWindow.hide();
  });

  mainWindow.on('move', () => {
    applyUnityHostBounds();
  });
  mainWindow.on('resize', () => {
    applyUnityHostBounds();
  });
  mainWindow.on('minimize', () => {
    if (unityHostWindow && !unityHostWindow.isDestroyed()) {
      unityHostWindow.hide();
    }
  });
  mainWindow.on('restore', () => {
    applyUnityHostBounds();
  });
  mainWindow.on('hide', () => {
    if (unityHostWindow && !unityHostWindow.isDestroyed()) {
      unityHostWindow.hide();
    }
  });
  mainWindow.on('show', () => {
    applyUnityHostBounds();
  });
  mainWindow.on('closed', () => {
    destroyUnityHostWindow();
    mainWindow = null;
  });

  const devServerURL = process.env.VITE_DEV_SERVER_URL;
  if (devServerURL) {
    mainWindow.loadURL(devServerURL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  if (!startHidden) {
    // Ensure shown when not starting hidden
    mainWindow.once('ready-to-show', () => {
      if (!mainWindow) return;
      mainWindow.show();
    });
  }

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Home',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('go-home');
          },
        },
        {
          label: 'Disconnect',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('disconnect');
          },
        },
        { role: 'quit' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  let last = null;
  const poll = async () => {
    if (!mainWindow) return;
    try {
      const win = await activeWindow();
      if (!win) return;
      const now = Date.now();
      const appName = win.owner && win.owner.name ? win.owner.name : 'Unknown';
      const title = win.title || '';
      if (!last) {
        last = { app: appName, title, start: now };
        return;
      }
      if (title !== last.title || appName !== last.app) {
        mainWindow.webContents.send('activity', { ...last, end: now });
        last = { app: appName, title, start: now };
      }
    } catch {}
  };
  setInterval(poll, 10000);
}

function showMainWindow() {
  if (!mainWindow) {
    createWindow();
  }
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }
  if (process.platform === 'darwin') app.dock && app.dock.show();
  mainWindow.focus();
}

function hideMainWindow() {
  if (!mainWindow) return;
  if (process.platform === 'darwin') app.hide();
  else mainWindow.hide();
}

function toggleMainWindow() {
  if (!mainWindow || !mainWindow.isVisible()) {
    showMainWindow();
  } else {
    hideMainWindow();
  }
}

function registerGlobalShortcuts() {
  const platform = process.platform;
  const candidatesByPlatform = {
    win32: ['Shift+`'],
    darwin: ['Shift+`', 'Shift+~'],
  };
  const candidates = candidatesByPlatform[platform] || ['Shift+`'];
  const tried = [];
  for (const acc of candidates) {
    tried.push(acc);
    try {
      if (globalShortcut.register(acc, () => toggleMainWindow())) {
        return;
      }
      console.warn(`Global shortcut registration failed for: ${acc}`);
    } catch (err) {
      console.warn(`Error registering global shortcut ${acc}`, err);
    }
  }
  console.warn(
    `Failed to register a global shortcut to toggle Mazed. Tried: ${tried.join(', ')}`
  );
}

ipcMain.removeHandler('set-window-size');
ipcMain.handle('set-window-size', (_e, { width, height }) => {
  if (mainWindow) {
    mainWindow.setSize(Number(width), Number(height));
    mainWindow.center();
  }
});

ipcMain.removeHandler('toggle-window');
ipcMain.handle('toggle-window', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  } else {
    mainWindow.minimize();
  }
});

ipcMain.removeHandler('close-window');
ipcMain.handle('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

const palettePath = path.join(__dirname, 'palette.json');
ipcMain.removeHandler('read-palette');
ipcMain.handle('read-palette', async () => {
  try {
    const text = await fs.promises.readFile(palettePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return [];
  }
});

ipcMain.removeHandler('write-palette');
ipcMain.handle('write-palette', async (_e, colors) => {
  if (!Array.isArray(colors)) return false;
  try {
    await fs.promises.writeFile(
      palettePath,
      JSON.stringify(colors, null, 2) + '\n',
      'utf8'
    );
    return true;
  } catch {
    return false;
  }
});

ipcMain.removeHandler('library-save-image');
ipcMain.handle('library-save-image', async (_event, payload) => {
  const { id, dataUrl, mimeType } = payload || {};
  if (typeof id === 'undefined') {
    return false;
  }
  try {
    await ensureImagesDir();
    const targetDir = getImageDir(id);

    if (!dataUrl) {
      await removeDirectory(targetDir);
      return true;
    }

    const parsed = parseDataUrlForSave(dataUrl, mimeType);
    if (!parsed) {
      return false;
    }

    await removeDirectory(targetDir);
    await fsp.mkdir(targetDir, { recursive: true });

    let fileName;
    if (parsed.encoding === 'base64') {
      fileName = `image.${parsed.extension}`;
      await fsp.writeFile(path.join(targetDir, fileName), parsed.buffer);
    } else {
      fileName = 'image.txt';
      await fsp.writeFile(path.join(targetDir, fileName), parsed.raw, 'utf8');
    }

    const meta = {
      mimeType: parsed.mimeType,
      encoding: parsed.encoding,
      extension: parsed.extension,
      fileName,
      savedAt: Date.now(),
    };

    await fsp.writeFile(
      getImageMetaPath(id),
      JSON.stringify(meta, null, 2) + '\n',
      'utf8'
    );
    return true;
  } catch (err) {
    console.error('Failed to save library image', err);
    return false;
  }
});

ipcMain.removeHandler('library-load-image');
ipcMain.handle('library-load-image', async (_event, id) => {
  if (typeof id === 'undefined') {
    return null;
  }
  try {
    const dir = getImageDir(id);
    const meta = await readJsonSafe(getImageMetaPath(id));
    if (!meta) {
      return await findFallbackImageData(dir);
    }

    const fileName = meta.fileName || `image.${meta.extension || 'bin'}`;
    const filePath = path.join(dir, fileName);

    if (meta.encoding === 'data-url') {
      return await fsp.readFile(filePath, 'utf8');
    }

    const buffer = await fsp.readFile(filePath);
    const type = meta.mimeType || 'application/octet-stream';
    const base64 = buffer.toString('base64');
    return `data:${type};base64,${base64}`;
  } catch (err) {
    if (err && err.code !== 'ENOENT') {
      console.error('Failed to load library image', err);
    }
    return null;
  }
});

ipcMain.removeHandler('library-delete-image');
ipcMain.handle('library-delete-image', async (_event, id) => {
  if (typeof id === 'undefined') {
    return false;
  }
  try {
    const dir = getImageDir(id);
    await removeDirectory(dir);
    return true;
  } catch (err) {
    console.error('Failed to delete library image', err);
    return false;
  }
});

ipcMain.handle('unity:mount', async (_event, rect) => {
  if (!isWindows) {
    return { ok: false, error: 'Unity embedding is only supported on Windows.' };
  }
  try {
    const success = await embedUnity(rect || {});
    if (!success) {
      return { ok: false, error: 'Failed to locate the Unity window.' };
    }
    return { ok: true };
  } catch (err) {
    console.error('Unity mount failed', err);
    return { ok: false, error: err?.message || 'Unity mount failed.' };
  }
});

ipcMain.handle('unity:hide', async () => {
  if (!isWindows) return false;
  const config = await resolveUnityConfig();
  if (!config) return false;
  const titles = orderedUnityTitles(config);
  for (const title of titles) {
    const code = await runUnityEmbedder(['hide', title]);
    if (code === 0) {
      unityMounted = false;
      unityActiveTitle = title;
      destroyUnityHostWindow();
      return true;
    }
  }
  return false;
});

ipcMain.handle('unity:quit', async () => {
  if (isWindows) {
    const config = await resolveUnityConfig();
    if (config) {
      const titles = orderedUnityTitles(config);
      for (const title of titles) {
        const code = await runUnityEmbedder(['hide', title]);
        if (code === 0) {
          unityActiveTitle = title;
          break;
        }
      }
    }
  }
  killUnityProcess();
  return true;
});

ipcMain.on('unity:panel-resize', (_event, rect) => {
  if (!isWindows) return;
  scheduleUnityResize(rect);
});

app.whenReady().then(createWindow);
app.whenReady().then(() => {
  createTray();
});

// Enable auto launch at login and start hidden when supported
app.whenReady().then(() => enableAutoLaunch());
// Register global hotkeys to toggle show/hide (like Steam): Shift + `
app.whenReady().then(() => registerGlobalShortcuts());

app.on('before-quit', () => {
  isQuitting = true;
  killUnityProcess();
});

// Ensure shortcuts are released on quit
app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
  } catch {}
});

// Keep app running in tray even when all windows closed
app.on('window-all-closed', () => {
  // Do not quit to allow tray persistence; typical macOS behavior keeps app running
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
    if (process.platform === 'darwin') app.dock && app.dock.show();
  } else {
    createWindow();
  }
});

function shouldStartHidden() {
  try {
    // CLI flag or env var override
    if (process.argv.includes('--hidden') || process.env.MAZED_START_HIDDEN === '1') {
      return true;
    }
    if (typeof app.getLoginItemSettings === 'function') {
      const s = app.getLoginItemSettings();
      if (s && (s.wasOpenedAsHidden || s.wasOpenedAtLogin)) {
        return true;
      }
    }
  } catch {}
  return false;
}

async function enableAutoLaunch() {
  try {
    if (process.platform === 'darwin' || process.platform === 'win32') {
      // Configure OS login items
      if (typeof app.setLoginItemSettings === 'function') {
        app.setLoginItemSettings({
          openAtLogin: true,
          openAsHidden: true,
        });
      }
      return;
    }

    // Linux: create XDG autostart .desktop if packaged
    if (process.platform === 'linux' && app.isPackaged) {
      const autostartDir = path.join(os.homedir(), '.config', 'autostart');
      const desktopPath = path.join(autostartDir, 'mazed.desktop');
      await fsp.mkdir(autostartDir, { recursive: true });
      const execPath = process.execPath;
      const desktop = `[
Desktop Entry]
Type=Application
Version=1.0
Name=Mazed
Comment=Mazed background helper
Exec=\"${execPath}\" --hidden
X-GNOME-Autostart-enabled=true
NoDisplay=true
Terminal=false
`; 
      await fsp.writeFile(desktopPath, desktop, 'utf8');
    }
  } catch (err) {
    // Non-fatal if auto-launch setup fails
    console.error('Auto-launch setup failed', err);
  }
}
