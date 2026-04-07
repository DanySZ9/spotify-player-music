# Player Music with API Spotify

A small widget created with Electron that lets you see in real time the song that is playing in your Spotify app.

With this player music you can:
- P

## PREVIEW

<img width="626" height="324" alt="image" src="https://github.com/user-attachments/assets/d1be370c-46f1-4825-adbe-b0220b309221" />
<img width="627" height="332" alt="image" src="https://github.com/user-attachments/assets/ae8d5aa1-edfb-424e-9e4d-a6beab1d1b47" />

## Features

- Login with Spotify OAuth
- Automatic token renewal
- Playback control
- Show the currently song that is playing.
- Minimalist widget UI

## Tech Stack

- HTML / CSS / JavaScript
- Electron
- Node.js
- Axios
- Lootie Web
- Bootstrap Icons
- Spotify Web API

## Installation

To install the proyect you must to do the next steps:

1. Clone the repository

```bash
  git clone https://github.com/DanySZ9/Spotify-PlayerMusic.git
  cd Spotify-PlayerMusic
```

2. Install all the dependences of the project.

```bash
  npm install
```

3. Create a app in the dashboard page of Spotify for Developers. For this you must to create a new account or login with an existing account. Spotify for Developers page is the next link: https://developer.spotify.com

4. Add the basic information of your app and in "Redirect URIs" add http://127.0.0.1:3000/callback

5. When your app has been created you can find the "Client ID" and "Client secret ID". Copy this and add in the "main.js" of project (line 9 - 10)

6. Run the project

```bash
  npm start
```
