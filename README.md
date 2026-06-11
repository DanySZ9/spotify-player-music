<p align="center">
  <h1 align="center">🎵 Player Music with Spotify API 🎵</h1>
  <p align="center">A real-time Spotify widget built with Electron — control your music without leaving your desktop.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spotify_API-1ED760?style=for-the-badge&logo=spotify&logoColor=black" />
  <img src="https://img.shields.io/badge/Electron-41-47848F?style=for-the-badge&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/DanySZ9/Spotify-PlayerMusic?style=for-the-badge" />
  <img src="https://img.shields.io/github/forks/DanySZ9/Spotify-PlayerMusic?style=for-the-badge" />
  <img src="https://img.shields.io/github/last-commit/DanySZ9/Spotify-PlayerMusic?style=for-the-badge" />
</p>

---

## Preview

<p align="center">
  <img width="626" height="328" alt="Login screen" src="https://github.com/user-attachments/assets/d88d54c7-6c2b-4dc5-91e4-b22d74688c2b" />
  <img width="626" height="324" alt="Now playing" src="https://github.com/user-attachments/assets/d1be370c-46f1-4825-adbe-b0220b309221" />
  <img width="626" height="332" alt="Player controls" src="https://github.com/user-attachments/assets/ae8d5aa1-edfb-424e-9e4d-a6beab1d1b47" />
</p>

---

## Features

- 🔐 Login with Spotify OAuth 2.0
- 🔄 Automatic token renewal — no re-login needed
- ▶️ Full playback control — play, pause, skip, and go back
- ⏩ Seek through the current track in real time
- 🎵 Displays current song, artist and album art
- 🪟 Minimalist always-on-top widget UI

---

## Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
  <img src="https://img.shields.io/badge/Spotify_API-1ED760?style=for-the-badge&logo=spotify&logoColor=black" />
</p>

| Technology | Role |
|------------|------|
| **Electron** | Desktop app shell — renders the widget as a native window |
| **Node.js** | Runtime for the main process and OAuth server |
| **Spotify Web API** | Fetches current playback state and controls |
| **Axios** | HTTP client for API requests |
| **Lottie Web** | Animations in the widget UI |
| **Bootstrap Icons** | Icon set used throughout the interface |
| **Express** | Local server that handles the OAuth callback |

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- A [Spotify account](https://www.spotify.com) (free or premium)

### Steps

**1. Clone the repository**
```bash
git clone https://github.com/DanySZ9/spotify-player-music
cd spotify-player-music
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up your Spotify app**

<details>
<summary>How to get your Spotify credentials</summary>

1. Go to [Spotify for Developers](https://developer.spotify.com) and log in.
2. Click **Create app** and fill in the basic info.
3. Under **Redirect URIs**, add: `http://127.0.0.1:8888/callback`
4. Save and open your app — you'll find the **Client ID** and **Client Secret** on the dashboard.

</details>

**4. Configure environment variables**
```bash
cp .env.example .env
```
Then open `.env` and fill in your credentials:
