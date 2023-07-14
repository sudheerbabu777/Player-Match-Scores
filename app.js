const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializationDBAndServer();

const conventArray = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const conventArrayMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
    *
    FROM 
    player_details;`;
  const dbPlayer = await db.all(getPlayersQuery);
  response.send(dbPlayer.map((eachItem) => conventArray(eachItem)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
    *
    FROM 
    player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(conventArray(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerName = "sudheer" } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
    UPDATE 
      player_details
    SET 
      player_name= "${playerName}"
    WHERE player_id = ${playerId};`;
  const player = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
    *
    FROM
    match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(conventArrayMatch(match));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT 
    match_details.match_id AS matchId,
    match_details.match,
    match_details.year
    FROM
    match_details LEFT JOIN player_match_score ON player_match_score.match_id = match_details.match_id
   WHERE player_match_score.player_id = ${playerId};`;
  const match = await db.all(getMatchQuery);
  response.send(match);
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM
    player_details LEFT JOIN player_match_score ON player_match_score.player_id = player_details.player_id
   WHERE player_match_score.match_id = ${matchId};`;
  const match = await db.all(getMatchQuery);
  response.send(match);
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM
    player_details LEFT JOIN player_match_score ON player_match_score.player_id = player_details.player_id
   WHERE player_details.player_id = ${playerId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

module.exports = app;
