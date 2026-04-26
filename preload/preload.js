const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("spotify", {
  login: () => ipcRenderer.invoke("spotify-login"),
  getTrack: () => ipcRenderer.invoke("spotify-current-track"),

  // FIX: expuesto para que renderer.js pueda escuchar el token sin usar ipcRenderer directo
  onToken: (callback) => ipcRenderer.once("spotify-token", (_event, tokens) => callback(tokens)),

  // FIX: expuesto para que renderer.js pueda refrescar el token sin usar ipcRenderer directo
  refreshToken: (refreshToken) => ipcRenderer.invoke("refresh-token", refreshToken),
});