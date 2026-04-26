const querystring = require("querystring");

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;

async function refreshAccessToken(refreshToken) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  return response.json();
}

async function getCurrentTrackRequest(token) {
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (res.status === 204) return null;

  return res.json();
}

// FIX: había dos module.exports — el primero era sobreescrito por el segundo,
//      haciendo que refreshAccessToken no se exportara correctamente.
module.exports = { refreshAccessToken, getCurrentTrackRequest };