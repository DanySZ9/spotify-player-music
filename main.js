const { app, BrowserWindow, shell, ipcMain } = require('electron');
const express = require("express");
const axios = require("axios");

// Global reference to the window object
let window;

// Add your Spotify app credentials here, if you don't know how to get them, check the README.md
const CLIENT_ID = "YOUR CLIENT ID";
const CLIENT_SECRET = "YOUR CLIENT SECRET ID";
// Redirect URI must be the same as the one set in your Spotify app settings. For development, you can use http://127.0.0.1:3000/callback
const REDIRECT_URI = "http://127.0.0.1:3000/callback";

// Function to create the main application window
function createWindow() {
  window = new BrowserWindow({
    width: 600,
    height: 300,
    resizable: false,      
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  window.removeMenu();
  window.loadFile("index.html");
}

// Express app to handle Spotify OAuth callback
const authApp = express();
// Start the Express server to listen for the OAuth callback
function startAuthServer() {
  return new Promise(resolve => {
    const server = authApp.listen(3000, () => {
      resolve();
    });
    authApp.get("/callback", async (req, res) => {
      const code = req.query.code;
      res.send("Login complete, you can close this window.");
      const tokens = await getAccessToken(code);
      window.webContents.send("spotify-token", tokens);
      server.close();
    });
  });
}

// Function to exchange the authorization code for access and refresh tokens
async function getAccessToken(code) {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  return {
    access_token: response.data.access_token,
    refresh_token: response.data.refresh_token
  };
}

// Function to initiate the Spotify login process
async function loginSpotify() {
  await startAuthServer();

  const scope = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state"
  ].join(" ");

  const authURL =
    "https://accounts.spotify.com/authorize" +
    `?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&scope=${scope}` +
    `&redirect_uri=${REDIRECT_URI}`;

  shell.openExternal(authURL);
}

// When the Electron app is ready, it create the main window and starts the Spotify login process
app.whenReady().then(async () => {
  createWindow();
  await loginSpotify();
});

// Handle the "refresh-token" event from the renderer process to refresh the Spotify access token
ipcMain.handle("refresh-token", async (event, refreshToken) => {

  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    }
  );

  return response.data.access_token;
});