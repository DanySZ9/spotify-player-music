const { ipcRenderer } = require("electron");
const lottie = require("lottie-web");

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

// Lottie: lottieIsAtPlay = true means icon is currently showing "play" (triangle)
// ⚠️ If the icon appears inverted, flip this initial value: false → true or true → false
let animationPlayPause = null;
let lottieIsAtPlay = false;

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

setTimeout(() => {
  if (!iconPlayPause) {
    console.error("Element .buttonPlay not found");
    return;
  }

  try {
    animationPlayPause = lottie.loadAnimation({
      container: iconPlayPause,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: "./icons/playPause.json",
    });
    console.log("Lottie animation loaded");
  } catch (error) {
    console.error("Error loading Lottie animation:", error);
  }
}, 500);

/**
 * Syncs the Lottie icon to match the actual isPlaying state.
 * Only animates if the icon is visually out of sync.
 */
function syncLottieIcon() {
  if (!animationPlayPause) return;

  const shouldShowPause = isPlaying; // playing → show pause icon so user can pause

  if (shouldShowPause && lottieIsAtPlay) {
    // Song is playing but icon shows play → animate to pause icon
    animationPlayPause.setDirection(-1);
    animationPlayPause.play();
    lottieIsAtPlay = false;
  } else if (!shouldShowPause && !lottieIsAtPlay) {
    // Song is paused but icon shows pause → animate to play icon
    animationPlayPause.setDirection(1);
    animationPlayPause.play();
    lottieIsAtPlay = true;
  }
  // Already in sync → do nothing
}

// ─────────────────────────────────────────────
//  TOKEN & POLLING
// ─────────────────────────────────────────────

ipcRenderer.on("spotify-token", (event, tokens) => {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  getCurrentlyPlaying();
  startPolling();
});

/**
 * Polling strategy:
 * - "fast" (3s): used right after a user action or when app regains focus,
 *                to quickly detect external pause/play/skip from other devices.
 * - "normal" (10s): standard background polling.
 */
function startPolling(mode = "normal") {
  if (pollingInterval) clearInterval(pollingInterval);
  const interval = mode === "fast" ? 3000 : 1000;
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
    fastPollTimeout = setTimeout(() => startPolling("normal"), 1000);
  } else {
    startPolling("normal");
  }
});

async function refreshAccessToken() {
  accessToken = await ipcRenderer.invoke("refresh-token", refreshToken);
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
      coverElement.src = "./default.jpg";
      bgElement.src = "./bgDefault.jpg";
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