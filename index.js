import express from "express";
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 Riot API Key (Render ENV)
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// 🌍 Région EUW (modifiable)
const REGION = "euw1";
const REGION_ACCOUNT = "europe";

// 🧠 Test route (pour vérifier que Render marche)
app.get("/", (req, res) => {
  res.send("LOL Rank API is running");
});

// 🎮 Route Wizebot /rank
app.get("/rank/:gameName/:tagLine", async (req, res) => {
  try {
    const { gameName, tagLine } = req.params;

    if (!RIOT_API_KEY) {
      return res.status(500).json({
        error: "RIOT_API_KEY manquante dans les variables Render"
      });
    }

    // 1️⃣ Get PUUID (Riot ID system)
    const accountUrl = `https://${REGION_ACCOUNT}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${tagLine}`;

    const account = await axios.get(accountUrl, {
      headers: { "X-Riot-Token": RIOT_API_KEY }
    });

    const puuid = account.data.puuid;

    // 2️⃣ Get summoner info
    const summoner = await axios.get(
      `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY }
      }
    );

    const summonerId = summoner.data.id;

    // 3️⃣ Get ranked info
    const league = await axios.get(
      `https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: { "X-Riot-Token": RIOT_API_KEY }
      }
    );

    const soloQ = league.data.find(
      (q) => q.queueType === "RANKED_SOLO_5x5"
    );

    // 🟡 Unranked case
    if (!soloQ) {
      return res.json({
        name: `${gameName}#${tagLine}`,
        rank: "UNRANKED",
        lp: 0,
        wins: 0,
        losses: 0
      });
    }

    // 🟢 Success response
    return res.json({
      name: `${gameName}#${tagLine}`,
      rank: `${soloQ.tier} ${soloQ.rank}`,
      lp: soloQ.leaguePoints,
      wins: soloQ.wins,
      losses: soloQ.losses
    });

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);

    return res.status(500).json({
      error: "Impossible de récupérer les données Riot",
      details: error.response?.data || error.message
    });
  }
});

// 🚀 Start server (IMPORTANT pour Render)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});