const getTeamDataFromMiami = (data) => {
    try{
        const nbaTeamData = data.stats // list of reg and playoff stats
        const regSeasonTeamData = nbaTeamData.filter(each=> each?.seasonType === "Regular")
        if (regSeasonTeamData) {
            return regSeasonTeamData;
        }
    } catch (error) {
        throw new Error(error)
    }
}

const getMiamiSalariesFromMiam = (data) => {
    try{
    const salaries = data.salaries // list of obj, salaries
    return salaries
    } catch(error) {
        throw new Errror(error)
    }
}
module.exports = {getTeamDataFromMiami}