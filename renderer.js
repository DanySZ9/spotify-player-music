const { ipcRenderer } = require("electron");
const lottie = require('lottie-web');

// Variables to store Spotify tokens, device ID, song progress and state

let accessToken = null;
let refreshToken = null;
let deviceId = null;
let progressMs = 0;
let durationMs = 0;
let isPlaying = false;

const coverElement = document.getElementById("cover");
const bgElement = document.getElementById("bg-img");
const songElement = document.getElementById("song-name");
const artistElement = document.getElementById("artist-name");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const progressBar = document.getElementById("progress-bar");
const progressContainer = document.getElementById("progress-container");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");

// Create variable for control play/pause animation with bodymovin library
let iconPlayPause = document.querySelector('.buttonPlay');

// Get token by main.js
ipcRenderer.on("spotify-token", (event, tokens) => {
    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    getCurrentlyPlaying();
    setInterval(getCurrentlyPlaying, 5000);
});

// Get active Spotify device to control playback
async function getActiveDevice() {
    try {
        const res = await fetch("https://api.spotify.com/v1/me/player/devices", {
            headers: { Authorization: "Bearer " + accessToken }
        });

        if (res.status === 401) {
            await refreshAccessToken();
            return getActiveDevice();
        }

        const data = await res.json();

        if (!data.devices || data.devices.length === 0) {
            songElement.textContent = "There's any device available.";
            artistElement.textContent = "Please open Spotify on your phone or computer.";
            coverElement.src = "./default.jpg";
            bgElement.src = "./bgDefault.jpg";
            return;
        }

        const active = data.devices.find(d => d.is_active);
        if (active) deviceId = active.id;

    } catch (err) {
        console.error("Error to get active device:", err);
    }
}

// Function to make requests to Spotify API for play/pause, next and previous actions in player music.
async function spotifyFetch(url, method = "PUT") {
    if (!accessToken || !deviceId) return;

    await fetch(`https://api.spotify.com/v1/me/player/${url}?device_id=${deviceId}`, {
        method: method,
        headers: { Authorization: "Bearer " + accessToken }
    });
}

// Get currently playing song
async function getCurrentlyPlaying() {
    if (!accessToken) return;

    await getActiveDevice();

    try {
        const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            headers: { Authorization: "Bearer " + accessToken }
        });

        if (res.status === 204) {
            songElement.textContent = "There's any song playing";
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
        console.error(err);
    }
}

// Render song info in the player music
function renderSong(data) {
    const track = data.item;
    const albumImg = track.album.images[0].url;

    coverElement.src = albumImg;
    bgElement.src = albumImg;
    songElement.textContent = track.name;
    artistElement.textContent = track.artists.map(a => a.name).join(", ");
    isPlaying = data.is_playing;
    progressMs = data.progress_ms;
    durationMs = track.duration_ms;
    durationEl.textContent = formatTime(durationMs);
    currentTimeEl.textContent = formatTime(progressMs);

    updateProgressBar();
}

// Function to update the progress of the song that is currently playing.
function updateProgressBar() {
    const percent = (progressMs / durationMs) * 100;
    progressBar.style.width = percent + "%";
    currentTimeEl.textContent = formatTime(progressMs);
}
setInterval(() => {
    if (isPlaying && progressMs < durationMs) {
        progressMs += 1000;
        updateProgressBar();
    }
}, 1000);

// Convert ms → mm:ss (00:00) format
function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

// Seek song by clicking in the progress bar
progressContainer.addEventListener("click", async (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newPosition = Math.floor(durationMs * percent);

    await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${newPosition}&device_id=${deviceId}`, {
        method: "PUT",
        headers: { Authorization: "Bearer " + accessToken }
    });

    progressMs = newPosition;
    updateProgressBar();
});

// Create play/pause animation
let animationPlayPause = null;
var directionMenu = 1;

// Cargar animación con delay para asegurar que el elemento está listo
setTimeout(() => {
    if (!iconPlayPause) {
        console.error("No se encontró el elemento .buttonPlay");
        return;
    }
    
    try {
        animationPlayPause = lottie.loadAnimation({
            container: iconPlayPause,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: './icons/playPause.json'
        });
        console.log("Animación Lottie cargada correctamente");
    } catch (error) {
        console.error("Error al cargar animación Lottie:", error);
    }
}, 500);

// Actions of the button play/pause with the animation of lottie library
iconPlayPause.addEventListener('click', async () => {
    if(!animationPlayPause) {
        console.error("Animación no está lista");
        return;
    }
    
    if(isPlaying) {
        await spotifyFetch("pause");
        animationPlayPause.setDirection(directionMenu);
        animationPlayPause.play();
        directionMenu = -directionMenu;
    } else {
        await spotifyFetch("play");
        animationPlayPause.setDirection(directionMenu);
        animationPlayPause.play();
        directionMenu = -directionMenu;
    }
});

// Actions of the buttons next and previous with a delay to update the song
nextBtn.addEventListener("click", async () => {
    await spotifyFetch("next", "POST");
    setTimeout(getCurrentlyPlaying, 800);
});
prevBtn.addEventListener("click", async () => {
    await spotifyFetch("previous", "POST");
    setTimeout(getCurrentlyPlaying, 800);
});

// Function to refresh access token when it expires using the refresh token abtained in the login process
async function refreshAccessToken() {
    accessToken = await ipcRenderer.invoke("refresh-token", refreshToken);
}