const express = require("express");
const fs = require("fs");
const path = require('path');
const cors = require("cors");
const {CombineJsonPlayers, getPlayerfromTeamInfo, addSalaryToPlayerObjects, getPlayerSalaries, getPlayersWithContracts2orLess, combineSalariesToTeam} = require("./players") // helper function to combine players into list from team json 
const data = require('./data/teamKeys.json'); // object that has, team: jsonfile team
const playersKeys = require("./data/playerKeys.json") // object that has, nbaId : jsonfile player
const {getTeamDataFromMiami} = require("./team")

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json());


app.listen(8000, () => {
  console.log('Connected to the database and listening on port 8000');
});

const underReviewFilePath = path.join(__dirname,"data", 'underReview.json');


// Note to self: because we have data in json we dont need to make functions async

// DATABASE IS BEST PRACTICE!! BECAUSE DATA IS SMALL THIS BACKEND IS FOR THE PURPOSE OF ASSISTING CONTENT MANAGEMENT


///// ROUTES FOR ACCESSING PLAYER or TEAM DATA

/** Get LIST OF PLAYERS + some data 
 * FROM TEAM DATA (i.e miamiHeat.json)
 * */ 
app.get('/teamPlayers/:id', function(req, res) {
  var val = data[req.params.id];
  if (val) {
    fs.readFile(__dirname + "/data/" + val, 'utf8', function(err, jsonData) {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      } else {
        const teamData = JSON.parse(jsonData);
        var players = CombineJsonPlayers(teamData)
        const salaries = getPlayerSalaries(teamData)

        players = addSalaryToPlayerObjects(salaries, players)
        res.status(200).send(players);
        console.log(`sent ${req.params.id} Data`)
      }
    });
  } else {
    res.status(404).send('Team not found');
  }
});



/** Get ONE PLAYER information using nbaId
 * FROM PLAYER DATA (i.e oladipo.json)
 *  */ 
app.get('/playerInfo/:id', function(req, res) {
    var val = playersKeys[req.params.id]
    if (val) {
        fs.readFile(__dirname + "/data/" + val, 'utf8', function(err, jsonData) {
          if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
          } else {
            const playerData = JSON.parse(jsonData);
            const {bio, contracts, scoutingReports, traditionalPerGame} = playerData
            const extractedData = {bio, contracts, scoutingReports, traditionalPerGame}
            res.status(200).send(extractedData);
          }
        });
      } else {
        res.status(404).send('Team not found');
      }
})



///// ROUTES FOR PLAYER REPORTS
const crypto = require('crypto');
function generateUniqueId() {
  const idBytes = crypto.randomBytes(8); // Generate 8 random bytes
  const uniqueId = idBytes.toString('hex'); // Convert the bytes to a hexadecimal string

  return uniqueId;
}

// Example usage

app.post('/playerInfo/:id/addReport', function(req, res) {
    const playerId = req.params.id;
    const { date, scout, event, report } = req.body;
    const val = playersKeys[playerId]; // Assuming playersKeys is a valid object mapping player IDs to file names
  
    if (val) {
      const filePath = path.join(__dirname, 'data', val);
  
      fs.readFile(filePath, 'utf8', function(err, jsonData) {
        if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
          return;
        }
  
        const playerData = JSON.parse(jsonData);
        const { scoutingReports, ...restData } = playerData;
  
        const newScoutingReportId = `${date.replace(' ', '-')}_${event.replace(' ', '-')}`;
        const id = generateUniqueId()
        // Create a new scouting report object
        const newScoutingReport = {
          index: scoutingReports.length + 1, // Set the desired index for the new scouting report
          id: id,
          date,
          scout,
          dxId: playerId,
          player: restData.bio.name, // Set the player's name
          event,
          report,
          team: restData.bio.currentTeam, // Set the team name
        };
  
        const updatedPlayerData = {
          ...restData,
          scoutingReports: [newScoutingReport, ...scoutingReports], // Add the new scouting report at the beginning of the array
        };
  
        // Write the updated player data back to the file
        fs.writeFile(filePath, JSON.stringify(updatedPlayerData), 'utf8', function(err) {
          if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
          } else {
            res.status(200).send('Scouting report added successfully');
          }
        });
      });
    } else {
      res.status(404).send('Player not found');
    }
  });


  app.delete('/playerInfo/:id/deleteReport/:noteID', async function(req, res) {
    const playerId = req.params.id;
    const noteId = req.params.noteID;
    const val = playersKeys[playerId]; // Assuming playersKeys is a valid object mapping player IDs to file names
  
    if (val) {
      const filePath = path.join(__dirname, 'data', val);
  
      try {
        const jsonData = await fs.promises.readFile(filePath, 'utf8');
        const playerData = JSON.parse(jsonData);
        const { scoutingReports, ...restData } = playerData;
  
        // Find the index of the note to be deleted
        const noteIndex = scoutingReports.findIndex((note) => note.id === noteId);
  
        if (noteIndex === -1) {
          res.status(404).send('Note not found');
          return;
        }
  
        // Remove the note from the array
        scoutingReports.splice(noteIndex, 1);
  
        const updatedPlayerData = {
          ...restData,
          scoutingReports: scoutingReports, // Update the scoutingReports array without the deleted note
        };
  
        await fs.promises.writeFile(filePath, JSON.stringify(updatedPlayerData), 'utf8');
  
        res.status(200).send('Scouting report deleted successfully');
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    } else {
      res.status(404).send('Player not found');
    }
  });
  


// ROUTES FOR ACCESSING LIST OF PLAYERS IN FRONT OFFICE REVIEW

  // Route to get all reviewed players
  app.get('/underReview', (req, res) => {
    fs.readFile(underReviewFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
      }
  
      const underReviewData = JSON.parse(data);
      res.status(200).json(underReviewData);
    });
  });
  
  function hasOnlyTwoAttribute(obj) {
    return Object.keys(obj).length === 2;
  }

  // Route to add a player to the under review list
  app.post('/underReview/addPlayer', (req, res) => {
    const fromPlayerProfile = hasOnlyTwoAttribute(req.body)
    if(fromPlayerProfile){
        const {team, playerId } = req.body;
        fs.readFile(path.join(__dirname,"data",data[team]),'utf8', (err, datas) => {
          if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
          }
      
          const teamInfo = JSON.parse(datas);
          var player = getPlayerfromTeamInfo(playerId, teamInfo)
          const salaries = getPlayerSalaries(teamInfo)
          player = addSalaryToPlayerObjects(salaries, player)

          if (player){
          fs.readFile(underReviewFilePath, 'utf8', (err, data) => {
            if (err) {
              console.error(err);
              res.status(500).send('Internal Server Error');
              return;
            }
      
            const underReviewData = JSON.parse(data);
            
            // Add the player ID to the under review list
            underReviewData.playerUnderReview.push(player);

            fs.writeFile(underReviewFilePath, JSON.stringify(underReviewData), 'utf8', (err) => {
              if (err) {
                console.error(err);
                res.status(500).send('Internal Server Error');
              } else {

                res.status(200).send(player);
              }
            });
          })};
        });
    }else{
    const { player } = req.body;
  


    fs.readFile(underReviewFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
      }

      const underReviewData = JSON.parse(data);
      
      // Add the player ID to the under review list
      underReviewData.playerUnderReview.push(player);
  
      fs.writeFile(underReviewFilePath, JSON.stringify(underReviewData), 'utf8', (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
        } else {
          res.status(200).send('Player added to under review list');
        }
      });
    });
  }
}
  );
  
  // Route to remove a player from the under review list
  app.delete('/underReview/removePlayer/:playerId', (req, res) => {
    const { playerId } = req.params;
  
    fs.readFile(underReviewFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
        return;
      }
  
      const underReviewData = JSON.parse(data);
  
      // Remove the player ID from the under review list
      underReviewData.playerUnderReview = underReviewData.playerUnderReview.filter(player => player.nbaId
        != playerId);
  
      fs.writeFile(underReviewFilePath, JSON.stringify(underReviewData), 'utf8', (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Internal Server Error');
        } else {
          res.status(200).send('Player removed from under review list');
        }
      });
    });
  });

/// DATA IS TAKEN FROM MIAMI JSON FILE WOULD TYPICALLY BE SEPerate per team
// ROUTES TO ACCESS TEAM DATA FROM JSON
app.get('/nbaTeamsData', function(req, res) {
 
  try {
    fs.readFile(__dirname + '/data/' + `${data["MIA"]}`, 'utf8', function(err, jsonData) {
      if (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
      } else {
        const jdata = JSON.parse(jsonData);
        var salaries = getPlayerSalaries(jdata)
        let lstSalaries2less = getPlayersWithContracts2orLess(salaries)
        var nbaTeamsData = getTeamDataFromMiami(jdata);

        if(lstSalaries2less){
        const newTeamsData = combineSalariesToTeam(nbaTeamsData, lstSalaries2less)
        res.status(200).send(newTeamsData);
      }
        else{
          res.status(200).send(nbaTeamsData);
        }
      }
    });
  } catch (error) {
    res.status(500).send({ error: 'Error reading data' });
  }
});