// ─────────────────────────────────────────────
//  SCREENS — Login / Player
// ─────────────────────────────────────────────

const loginScreen = document.getElementById("login-screen");
const playerScreen = document.getElementById("player-screen");

function showPlayer() {
  loginScreen.classList.add("hidden");
  playerScreen.classList.remove("hidden");
  // Inicializar Lottie aquí, cuando el contenedor ya es visible
  initLottie();
}

document.getElementById("loginBtn").addEventListener("click", async () => {
  await window.spotify.login();
});

// Cuando main.js confirma el login, cambia a la pantalla del player
window.spotify.onToken((tokens) => {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  showPlayer();
  getCurrentlyPlaying();
  startPolling();
});

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────

let accessToken = null;
let refreshToken = null;
let deviceId = null;
let progressMs = 0;
let durationMs = 0;
let isPlaying = false;
let pollingInterval = null;
let isDragging = false;
let fastPollTimeout = null;

// Estado del ícono play/pause (manejado con SVG inline)

// ─────────────────────────────────────────────
//  DOM REFERENCES
// ─────────────────────────────────────────────

const coverElement = document.getElementById("cover");
const bgElement = document.getElementById("bg-img");
const songElement = document.getElementById("song-name");
const artistElement = document.getElementById("artist-name");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.getElementById("progress-container");
const progressThumb = document.getElementById("progress-thumb");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const iconPlayPause = document.querySelector(".buttonPlay");

// ─────────────────────────────────────────────
//  LOTTIE ANIMATION
// ─────────────────────────────────────────────

// El JSON se pasa como objeto (animationData) en lugar de path,
// porque en Electron con file:// el fetch del JSON puede fallar.
const LOTTIE_DATA = {"v":"5.6.5","fr":30,"ip":0,"op":8,"w":32,"h":32,"nm":"play-pause","ddd":0,"assets":[],"layers":[{"ddd":0,"ind":1,"ty":4,"nm":"play-pause","sr":1,"ks":{"o":{"a":0,"k":100,"ix":11},"r":{"a":0,"k":0,"ix":10},"p":{"a":0,"k":[16,16,0],"ix":2},"a":{"a":0,"k":[12,12,0],"ix":1},"s":{"a":0,"k":[100,100,100],"ix":6}},"ao":0,"shapes":[{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":1,"k":[{"i":{"x":0.833,"y":0.833},"o":{"x":0.167,"y":0.167},"t":0,"s":[{"i":[[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-2,-8],[2,-8],[2,0],[2,8],[-2,8]],"c":true}]},{"t":8,"s":[{"i":[[0,0],[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0],[0,0]],"v":[[-3.062,-9],[-3,-9],[11.062,0],[-3.062,9],[-3.062,9.062]],"c":true}]}],"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0,0,0,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":2,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[8,12],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":0,"k":[100,100],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":0,"k":100,"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"left rectangle","np":2,"cix":2,"bm":0,"ix":1,"mn":"ADBE Vector Group","hd":false},{"ty":"gr","it":[{"ind":0,"ty":"sh","ix":1,"ks":{"a":0,"k":{"i":[[0,0],[0,0],[0,0],[0,0]],"o":[[0,0],[0,0],[0,0],[0,0]],"v":[[-2,-8],[2,-8],[2,8],[-2,8]],"c":true},"ix":2},"nm":"Path 1","mn":"ADBE Vector Shape - Group","hd":false},{"ty":"st","c":{"a":0,"k":[0,0,0,1],"ix":3},"o":{"a":0,"k":100,"ix":4},"w":{"a":0,"k":2,"ix":5},"lc":2,"lj":2,"bm":0,"nm":"Stroke 1","mn":"ADBE Vector Graphic - Stroke","hd":false},{"ty":"tr","p":{"a":0,"k":[16,12],"ix":2},"a":{"a":0,"k":[0,0],"ix":1},"s":{"a":1,"k":[{"i":{"x":[0.667,0.667],"y":[1,1]},"o":{"x":[0.333,0.333],"y":[0,0]},"t":0,"s":[100,100]},{"t":8,"s":[0,0]}],"ix":3},"r":{"a":0,"k":0,"ix":6},"o":{"a":1,"k":[{"i":{"x":[0.667],"y":[1]},"o":{"x":[0.333],"y":[0]},"t":0,"s":[100]},{"t":4,"s":[0]}],"ix":7},"sk":{"a":0,"k":0,"ix":4},"sa":{"a":0,"k":0,"ix":5},"nm":"Transform"}],"nm":"right rectangle","np":2,"cix":2,"bm":0,"ix":2,"mn":"ADBE Vector Group","hd":false}],"ip":0,"op":8,"st":0,"bm":0}],"markers":[]};

let animationPlayPause = null;
let lottieIsAtPlay = false; // false = mostrando pausa (barras), true = mostrando play (triángulo)

function initLottie() {
  if (!iconPlayPause) {
    console.error("Element .buttonPlay not found");
    return;
  }
  animationPlayPause = lottie.loadAnimation({
    container: iconPlayPause,
    renderer: "svg",
    loop: false,
    autoplay: false,
    animationData: LOTTIE_DATA, // objeto directo, sin fetch
  });
  // Ir al frame final (estado pause=barras) para empezar en pausa
  animationPlayPause.goToAndStop(7, true);
  lottieIsAtPlay = false;
}

/**
 * Sincroniza la animación Lottie con el estado real de reproducción.
 * frame 0 = play (triángulo) | frame 7 = pause (barras)
 */
function syncLottieIcon() {
  if (!animationPlayPause) return;

  if (isPlaying && !lottieIsAtPlay) {
    // Estaba en pause, animar hacia play (dirección inversa: 7→0)
    animationPlayPause.setDirection(-1);
    animationPlayPause.play();
    lottieIsAtPlay = true;
  } else if (!isPlaying && lottieIsAtPlay) {
    // Estaba en play, animar hacia pause (dirección normal: 0→7)
    animationPlayPause.setDirection(1);
    animationPlayPause.play();
    lottieIsAtPlay = false;
  }
}

// ─────────────────────────────────────────────
//  TOKEN & POLLING
// ─────────────────────────────────────────────

// onToken se maneja arriba en la sección SCREENS al recibir el login

/**
 * Polling strategy:
 * - "fast" (3s): used right after a user action or when app regains focus,
 *                to quickly detect external pause/play/skip from other devices.
 * - "normal" (10s): standard background polling.
 */
function startPolling(mode = "normal") {
  if (pollingInterval) clearInterval(pollingInterval);
  const interval = mode === "fast" ? 3000 : 10000; // FIX: "normal" era 1000ms (muy agresivo), ahora 10s
  pollingInterval = setInterval(getCurrentlyPlaying, interval);
}

/**
 * External pause/play detection via Page Visibility API.
 * When the window regains focus, poll immediately and switch to fast mode
 * for 30s to catch any changes made from another device while hidden.
 */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    getCurrentlyPlaying();
    startPolling("fast");

    if (fastPollTimeout) clearTimeout(fastPollTimeout);
    fastPollTimeout = setTimeout(() => startPolling("normal"), 30000); // FIX: era 1000ms, debe ser 30s
  } else {
    startPolling("normal");
  }
});

async function refreshAccessToken() {
  // FIX: usar window.spotify.refreshToken (expuesto por preload) en lugar de ipcRenderer directo
  const newToken = await window.spotify.refreshToken(refreshToken);
  if (newToken) accessToken = newToken;
}

// ─────────────────────────────────────────────
//  DEVICE MANAGEMENT
// ─────────────────────────────────────────────

async function getActiveDevice() {
  try {
    const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
      headers: { Authorization: "Bearer " + accessToken },
    });

    if (res.status === 401) {
      await refreshAccessToken();
      return getActiveDevice();
    }

    const data = await res.json();

    if (!data.devices || data.devices.length === 0) {
      songElement.textContent = "There's no device available.";
      artistElement.textContent =
        "Please open Spotify on your phone or computer.";
      coverElement.src = "./default.jpg";
      bgElement.src = "./bgDefault.jpg";
      return;
    }

    const active = data.devices.find((d) => d.is_active);
    if (active) deviceId = active.id;
  } catch (err) {
    console.error("Error getting active device:", err);
  }
}

// ─────────────────────────────────────────────
//  SPOTIFY API HELPERS
// ─────────────────────────────────────────────

async function spotifyFetch(url, method = "PUT") {
  if (!accessToken || !deviceId) return null;

  const res = await fetch(
    `https://api.spotify.com/v1/me/player/${url}?device_id=${deviceId}`,
    { method, headers: { Authorization: "Bearer " + accessToken } },
  );

  if (res.status === 404) deviceId = null;

  return res;
}

async function seekTo(ms) {
  if (!accessToken || !deviceId) return;

  await fetch(
    `https://api.spotify.com/v1/me/player/seek?position_ms=${ms}&device_id=${deviceId}`,
    { method: "PUT", headers: { Authorization: "Bearer " + accessToken } },
  );
}

// ─────────────────────────────────────────────
//  CURRENTLY PLAYING
// ─────────────────────────────────────────────

async function getCurrentlyPlaying() {
  if (!accessToken) return;
  if (!deviceId) await getActiveDevice();

  try {
    const res = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: { Authorization: "Bearer " + accessToken },
      },
    );

    if (res.status === 204) {
      songElement.textContent = "There's no song playing";
      artistElement.textContent = "";
      coverElement.src = "images/default.jpg";
      bgElement.src = "images/bgDefault.jpg";
      return;
    }

    if (res.status === 401) {
      await refreshAccessToken();
      return getCurrentlyPlaying();
    }

    const data = await res.json();
    renderSong(data);
  } catch (err) {
    console.error("Error getting currently playing:", err);
  }
}

function renderSong(data) {
  const track = data.item;
  const albumImg = track.album.images[0].url;

  coverElement.src = albumImg;
  bgElement.src = albumImg;
  songElement.textContent = track.name;
  artistElement.textContent = track.artists.map((a) => a.name).join(", ");

  // Don't override progress while user is dragging the thumb
  if (!isDragging) {
    progressMs = data.progress_ms;
    durationMs = track.duration_ms;
    durationEl.textContent = formatTime(durationMs);
    updateProgressBar();
  }

  // Detect external state change (pause/play from another device)
  const newIsPlaying = data.is_playing;
  if (newIsPlaying !== isPlaying) {
    isPlaying = newIsPlaying;
    syncLottieIcon();
  }
}

// ─────────────────────────────────────────────
//  PROGRESS BAR
// ─────────────────────────────────────────────

function updateProgressBar() {
  if (!durationMs) return;
  const percent = (progressMs / durationMs) * 100;
  progressBar.style.width = percent + "%";
  if (progressThumb) progressThumb.style.left = percent + "%";
  currentTimeEl.textContent = formatTime(progressMs);
}

// Local timer — ticks every second while playing
setInterval(() => {
  if (isPlaying && !isDragging && progressMs < durationMs) {
    progressMs += 1000;
    updateProgressBar();
  }
}, 1000);

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

// ─────────────────────────────────────────────
//  PROGRESS BAR — CLICK & DRAG
// ─────────────────────────────────────────────

function getPercentFromMouse(e) {
  const rect = progressContainer.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  return Math.max(0, Math.min(1, percent));
}

progressContainer.addEventListener("click", async (e) => {
  if (isDragging) return;
  const percent = getPercentFromMouse(e);
  const newPosition = Math.floor(durationMs * percent);
  progressMs = newPosition;
  updateProgressBar();
  await seekTo(newPosition);
});

if (progressThumb) {
  progressThumb.addEventListener("mousedown", (e) => {
    isDragging = true;
    progressThumb.classList.add("dragging");
    e.preventDefault();
    e.stopPropagation();
  });
}

document.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  const percent = getPercentFromMouse(e);
  progressMs = Math.floor(durationMs * percent);
  updateProgressBar();
});

document.addEventListener("mouseup", async () => {
  if (!isDragging) return;
  isDragging = false;
  if (progressThumb) progressThumb.classList.remove("dragging");
  await seekTo(progressMs);
});

// ─────────────────────────────────────────────
//  PLAYER CONTROLS
// ─────────────────────────────────────────────

iconPlayPause.addEventListener("click", async () => {
  if (!animationPlayPause) return;
  const wasPlaying = isPlaying;
  const action = wasPlaying ? "pause" : "play";

  // Optimistic update: change state and icon immediately
  isPlaying = !wasPlaying;
  syncLottieIcon();

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/${action}?device_id=${deviceId}`,
      { method: "PUT", headers: { Authorization: "Bearer " + accessToken } },
    );

    if (res && !res.ok && res.status !== 204) {
      isPlaying = wasPlaying;
      syncLottieIcon();
    }
  } catch (err) {
    isPlaying = wasPlaying;
    syncLottieIcon();
    console.error("Error toggling playback:", err);
  }
});

nextBtn.addEventListener("click", async () => {
  await spotifyFetch("next", "POST");
  setTimeout(getCurrentlyPlaying, 800);
  startPolling("fast");
  if (fastPollTimeout) clearTimeout(fastPollTimeout);
  fastPollTimeout = setTimeout(() => startPolling("normal"), 15000);
});

prevBtn.addEventListener("click", async () => {
  await spotifyFetch("previous", "POST");
  setTimeout(getCurrentlyPlaying, 800);
  startPolling("fast");
  if (fastPollTimeout) clearTimeout(fastPollTimeout);
  fastPollTimeout = setTimeout(() => startPolling("normal"), 15000);
});