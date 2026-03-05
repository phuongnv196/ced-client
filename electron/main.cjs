const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const isDev = process.env.NODE_ENV === 'development';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

// Robust Native Request Engine (Postman-like)
ipcMain.handle('send-native-request', async (event, config) => {
  try {
    const userHeaders = { ...config.headers };

    // 1. Clean up restricted headers that browser might have injected if leaked
    // 2. FORCE Identity encoding to prevent Brotli/Gzip decompression issues causing garbage text or 400s
    Object.keys(userHeaders).forEach(k => {
      const kl = k.toLowerCase();
      if (kl === 'accept-encoding' || kl === 'host' || kl === 'connection' || kl.startsWith('sec-')) {
        delete userHeaders[k];
      }
    });

    userHeaders['Accept-Encoding'] = 'identity';
    if (!userHeaders['Accept']) userHeaders['Accept'] = '*/*';
    if (!userHeaders['User-Agent']) userHeaders['User-Agent'] = 'PostmanRuntime/7.36.0';

    const axiosConfig = {
      method: config.method,
      url: config.url,
      headers: userHeaders,
      params: config.params,
      validateStatus: () => true,
      responseType: 'arraybuffer', // Receive raw bytes natively
      maxRedirects: 10,
      timeout: 30000
    };

    console.log(`[IPC Request] Native Node calling: ${config.method} ${config.url}`);

    // Body Mapping
    if (config.body && config.method !== 'GET') {
      if (config.bodyType === 'json') {
        axiosConfig.data = config.body;
      } else if (config.bodyType === 'form-data') {
        const fd = new FormData();
        for (const [key, value] of Object.entries(config.body)) {
          if (value && value.buffer && value.fileName) {
            fd.append(key, Buffer.from(value.buffer), { filename: value.fileName, contentType: value.mime });
          } else {
            fd.append(key, value);
          }
        }
        axiosConfig.data = fd;
        Object.assign(axiosConfig.headers, fd.getHeaders());
      } else if (config.bodyType === 'x-www-form-urlencoded') {
        axiosConfig.data = new URLSearchParams(config.body).toString();
      } else if (config.bodyType === 'binary' && config.body.buffer) {
        axiosConfig.data = Buffer.from(config.body.buffer);
      } else {
        axiosConfig.data = config.body;
      }
    }

    const response = await axios(axiosConfig);

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data // Directly send the Buffer
    };
  } catch (error) {
    console.error('[IPC Request Failed]:', error.message);
    return {
      success: false,
      error: error.message || 'Network Error'
    };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
