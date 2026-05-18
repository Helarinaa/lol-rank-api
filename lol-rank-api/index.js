import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const API_KEY = process.env.RIOT_API_KEY;
const REGION = "euw1";

app.get("/", (req, res) => {
  res.send("LoL Rank API is running");
});

app.get("/lolrank", async (req, res) => {
  const name = req.query.name;

  if (!name) return res.send("Nom manquant");

  try {
    // 1. Summoner info
    const summonerRes = await fetch(
      `https://${REGION}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}?api_key=${API_KEY}`
    );

    if (!summonerRes.ok) {
      return res.send("Invocateur introuvable");
    }

    const summoner = await summonerRes.json();

    // 2. Rank info
    const rankRes = await fetch(
      `https://${REGION}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}?api_key=${API_KEY}`
    );

    const ranks = await rankRes.json();

    const soloQ = ranks.find(r => r.queueType === "RANKED_SOLO_5x5");

    if (!soloQ) {
      return res.send(`${name} — Unranked`);
    }

    res.send(
      `${name} — ${soloQ.tier} ${soloQ.rank} ${soloQ.leaguePoints} LP`
    );

  } catch (err) {
    console.error(err);
    res.send("Erreur API Riot");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));