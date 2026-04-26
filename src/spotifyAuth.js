const querystring = require("querystring");

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

const scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming",
];

function getAuthUrl() {
  return (
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id,
      scope: scopes.join(" "),
      redirect_uri,
    })
  );
}

async function exchangeCodeForToken(code) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: querystring.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri,
    }),
  });

  return response.json();
}

module.exports = { getAuthUrl, exchangeCodeForToken };