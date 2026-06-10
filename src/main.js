require("dotenv").config({ quiet: true });

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path")
require("dotenv").config({
  path: path.join(process.resourcesPath, ".env")
})

const { startCallbackServer } = require("./callbackServer");
const { refreshAccessToken, getCurrentTrackRequest } = require("./spotifyApi");
const { getAuthUrl } = require("./spotifyAuth"); // FIX: quitado exchangeCodeForToken (no se usaba)

// FIX: renombrado "window" → "mainWindow" para no colisionar con el global window del browser
let mainWindow;
let accessToken = null;
let refreshToken = null;
let tokenExpirationTime = null;

// Function to create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 300,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      // FIX: eliminadas las líneas duplicadas inseguras (nodeIntegration: true / contextIsolation: false)
      // Ahora solo existen los valores correctos y seguros:
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.removeMenu();
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(() => {
  createWindow();
  startCallbackServer(setTokens);
});

ipcMain.handle("spotify-login", async () => {
  const authUrl = getAuthUrl();
  await shell.openExternal(authUrl);
});

ipcMain.handle("spotify-current-track", async () => {
  const token = await ensureValidToken();
  if (!token) return null;
  return await getCurrentTrackRequest(token);
});

// FIX: agregado handler para "refresh-token" que renderer.js invoca
ipcMain.handle("refresh-token", async (_event, rt) => {
  const data = await refreshAccessToken(rt);
  if (data?.access_token) {
    accessToken = data.access_token;
    tokenExpirationTime = Date.now() + data.expires_in * 1000;
    return data.access_token;
  }
  return null;
});

function setTokens({ accessToken: at, refreshToken: rt, expiresIn }) {
  accessToken = at;
  refreshToken = rt;
  tokenExpirationTime = Date.now() + expiresIn * 1000;

  console.log("Spotify tokens saved!");

  // FIX: enviar tokens al renderer para que pueda hacer fetch directo a la API de Spotify
  if (mainWindow) {
    mainWindow.webContents.send("spotify-token", {
      access_token: at,
      refresh_token: rt,
    });
  }
}

async function ensureValidToken() {
  if (!accessToken) return null;

  const isExpired = Date.now() > tokenExpirationTime - 60000;

  if (isExpired) {
    console.log("Refreshing Spotify token...");
    const data = await refreshAccessToken(refreshToken);
    accessToken = data.access_token;
    tokenExpirationTime = Date.now() + data.expires_in * 1000;
  }

  return accessToken;
}