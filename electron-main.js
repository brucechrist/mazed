const { app, BrowserWindow, Menu, ipcMain, Tray, nativeImage, globalShortcut } = require('electron');
const activeWindow = require('active-win');
const path = require('path');
const fs = require('fs');
const os = require('os');
const fsp = fs.promises;
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
