const express = require("express");
const { exchangeCodeForToken } = require("./spotifyAuth");

function startCallbackServer(setTokens) {
  const app = express();

  app.get("/callback", async (req, res) => {
    const code = req.query.code;

    try {
      const data = await exchangeCodeForToken(code);

      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      });

      res.send("Login successful! You can close this tab.");
    } catch (err) {
      res.send("Error getting tokens");
    }
  });

  app.listen(8888, () => console.log("Callback server running on port 8888"));
}

module.exports = { startCallbackServer };