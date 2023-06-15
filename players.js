const CombineJsonPlayers = (data) => {
    try {
      const extractedPlayers = [];
      data.depthChart.forEach((each) => {
        if (each) {
          each.players.forEach((player) => {
            if (player) {
              extractedPlayers.push(player);
            }
          });
        }
      });
  
      const updatedPlayers = extractedPlayers.map((object) => {
        const player = data.boxScorePerGame.find((p) => p.nbaId === object.nbaId);
  
        // Add attributes to the object
        return {
          ...object,
          ppg: player?.ppg,
          ast: player?.ast,
          reb: player?.reb,
          fgPercentage: player?.fgPercentage,
          mp: player?.mp,
          tov: player?.tov,
          age: player?.age, 
          gp: player?.gp, // more info
          gs: player?.gs,
          ftp: player?.ftp,
          fga: player?.fga,
          pf: player?.pf
        };
      });
  
      return updatedPlayers;
    } catch (error) {
      throw new Error(error);
    }
  };

  function getPlayerfromTeamInfo(id, data) {
    const depthChart = data.depthChart
    const playerStat = data.boxScorePerGame.find((p) => p.nbaId === id);
    var item = depthChart.find(function(element) {
      return element.players.find(player=> {
        if(player){
        return player.nbaId === id}})
    })
  
    if (item) {
      var playeInfo = item.players.find(person =>{
        if(person){
        return person.nbaId === id
        }
      })
      if (playeInfo){
       
        return {...playeInfo, 
          ppg: playerStat?.ppg,
          ast: playerStat?.ast,
          reb: playerStat?.reb,
          fgPercentage: playerStat?.fgPercentage,
          mp: playerStat?.mp,
          tov: playerStat?.tov,
          age: playerStat?.age, 
          gp: playerStat?.gp, // more info
          gs: playerStat?.gs,
          ftp: playerStat?.ftp,
          fga: playerStat?.fga,
          pf: playerStat?.pf}
      }
    }
  }

const getPlayerSalaries = (data) => {
  try{
    const listSalaryObjects = data.salaries
    return listSalaryObjects
  }catch (error){
    throw new Error(error)
  }
}


const addSalaryToPlayerObjects = (listSalaryObjects, playerObjs) => {
  try {
    if (playerObjs && playerObjs.nbaId && playerObjs !== null){
      listSalaryObjects.forEach(each => {
        if (each.nbaId === playerObjs.nbaId){
          playerObjs.capTotal = each.capTotal;
          playerObjs.age = each.age;
          playerObjs.agent = each.agent;
        }
      })
    return playerObjs
    }

    else {
    playerObjs?.forEach(player => {
      const matchingObj = listSalaryObjects.find(obj => obj.nbaId === player.nbaId);
      if (matchingObj) {
        player.capTotal = matchingObj.capTotal;
        player.age = matchingObj.age;
        player.agent = matchingObj.agent;
      }
    });
    return playerObjs}
  } catch (error) {
    throw new Error(error);
  }
};


//nba teams data
// for each :
//      make attribute that is list of players 

//result is list of players
const getPlayersWithContracts2orLess = (listSalaryObjects) => {
  const validPlayers = listSalaryObjects?.filter(each => each.cap3 === 0 && each.nbaId !== null)
  return validPlayers
}

const combineSalariesToTeam = (teams, salaries) => {
  try{
  return teams.map(team => {
    if (salaries[0].team === team.team) {
      return {...team, upcoming: salaries};
    }
    else return team

  })

}
  catch(error) {
    throw new Error(error)
  }
}

  
  module.exports = {combineSalariesToTeam, CombineJsonPlayers, getPlayerfromTeamInfo, addSalaryToPlayerObjects, getPlayerSalaries, getPlayersWithContracts2orLess };
  