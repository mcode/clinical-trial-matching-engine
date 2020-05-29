import { Trial } from '../trialscope';

const clearPunctuation = (entry: string) => entry.replace(/"/g, '');

export const UnpackMatchResults = (result: Partial<Trial>[]) => {

  const data: object[] = [];
  // let resultType = Object.keys(result["data"]).includes("baseMatches") ? "baseMatches" : "advancedMatches";
  // Don't know if it's a base match or an advanced match (no match quality)

  data.push({'Match Count': result.length});

  result.forEach(trial => {
    const mainRow = {};
    let sites: object = {};
    const blackList = ['advancedMatchConditions', 'armGroups', 'interventions'];

    // if (resultType === "advancedMatches") {
    //   let quality = match.matchQuality;
    //   mainRow = {"Match Quality" : quality};
    // }

    Object.keys(trial).forEach( field => {
      if (field === 'conditions') {
        let value = trial[field];
        value = clearPunctuation(value);
        mainRow[field] = value;
      } else if (field === 'meshTerms') {
        const termsList = trial[field].join(', ');
        mainRow[field] = termsList;
      } else if (field === 'sites') {
        sites = trial[field];
      } else if (!blackList.includes(field)) {
        mainRow[field] = trial[field];
      }
    });

    data.push(mainRow);

    Object.keys(sites).forEach( index => {
      data.push(sites[index]);
    });

  });

  return data;
};
