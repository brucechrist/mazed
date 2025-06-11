const { app, BrowserWindow } = require('electron');
const path = require('path');

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
  return defaultSize;
}

function createWindow() {
  const win = new BrowserWindow({
    ...getWindowSize(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const devServerURL = process.env.VITE_DEV_SERVER_URL;
  if (devServerURL) {
    win.loadURL(devServerURL);
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
