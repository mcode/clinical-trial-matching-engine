//import advSample from './adv_test_data.json';
import baseSample from './test_data.json';

const clearPunctuation = (entry:string) => {

  while (entry.includes("\"")) {
    entry = entry.replace("\"", "")
  }

  return entry;
}

export const unpackMatchResults = () => {

  let sample = baseSample;
  let data:object[] = [];
  let resultType = Object.keys(sample["data"]).includes("baseMatches") ? "baseMatches" : "advancedMatches";

  data.push({"Match Count" : sample["data"][resultType]["totalCount"]});

  sample["data"][resultType]["edges"].forEach( match => {

    let trial = match.node;
    let mainRow = {};
    let sites:object = {};
    let blackList = ["advancedMatchConditions", "armGroups", "interventions"];

    if (resultType === "advancedMatches") {
      let quality = match.matchQuality;
      mainRow = {"Match Quality" : quality};
     }

    Object.keys(trial).forEach( field => {
      if ( field === "conditions") {
        let value = trial[field];
        value = clearPunctuation(value);
        mainRow[field] = value;
      } else if (field === "meshTerms") {
        let termsList = trial[field].join(", ");
        mainRow[field] = termsList;
      } else if (field === "sites") {
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
}
