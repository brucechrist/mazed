const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const activeWindow = require('active-win');
const path = require('path');
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  const devServerURL = process.env.VITE_DEV_SERVER_URL;
  if (devServerURL) {
    mainWindow.loadURL(devServerURL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
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

ipcMain.handle('set-window-size', (_e, { width, height }) => {
  if (mainWindow) {
    mainWindow.setSize(Number(width), Number(height));
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
