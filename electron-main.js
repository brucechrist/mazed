const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

 codex/ajouter-prise-en-charge-de-plusieurs-tailles
let mainWindow;

const allowedSizes = [
  [1024, 575],
  [1280, 720],
  [1600, 900],
  [1920, 1080],
];

function configPath() {
  return path.join(app.getPath('userData'), 'window-size.json');
}

function readSavedWindowSize() {
  try {
    const data = fs.readFileSync(configPath(), 'utf-8');
    const parsed = JSON.parse(data);
    if (
      parsed &&
      Number.isInteger(parsed.width) &&
      Number.isInteger(parsed.height)
    ) {
      return parsed;
    }
  } catch (err) {
    // ignore
  }
  return null;
}

function saveWindowSize(size) {
  try {
    fs.writeFileSync(configPath(), JSON.stringify(size));
  } catch (err) {
    // ignore
  }
}

function parseEnvSize() {
  const sizeEnv = process.env.APP_SIZE;
  if (sizeEnv) {
    const match = sizeEnv.match(/^(\d+)x(\d+)$/);
    if (match) {
      const width = parseInt(match[1], 10);
      const height = parseInt(match[2], 10);
      if (allowedSizes.some(([w, h]) => w === width && h === height)) {
        return { width, height };
      }
    }
  }
  return null;
}

function getWindowSize() {
  const defaultSize = { width: 800, height: 600 };
  const envSize = parseEnvSize();
  if (envSize) return envSize;
  const saved = readSavedWindowSize();
  if (saved) return saved;

function getWindowSize() {
  const defaultSize = { width: 800, height: 600 };
  const sizeEnv = process.env.APP_SIZE;
  if (!sizeEnv) {
    return defaultSize;
  }
  const match = sizeEnv.match(/^(\d+)x(\d+)$/);
  if (!match) {
    return defaultSize;
  }
  const width = parseInt(match[1], 10);
  const height = parseInt(match[2], 10);
  // Allow only predefined sizes for now
  const allowed = [
    [1024, 575],
    [1280, 720],
    [1600, 900],
    [1920, 1080],
  ];
  if (allowed.some(([w, h]) => w === width && h === height)) {
    return { width, height };
  }
 alpha
  return defaultSize;
}

function createWindow() {
 codex/ajouter-prise-en-charge-de-plusieurs-tailles
  mainWindow = new BrowserWindow({

  const win = new BrowserWindow({
 alpha
    ...getWindowSize(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const devServerURL = process.env.VITE_DEV_SERVER_URL;
  if (devServerURL) {
    mainWindow.loadURL(devServerURL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

ipcMain.handle('set-window-size', (_event, width, height) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
    saveWindowSize({ width, height });
  }
});

ipcMain.handle('get-saved-window-size', () => {
  return readSavedWindowSize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
