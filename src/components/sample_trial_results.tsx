import advSample from './adv_test_data.json';
import sample from './test_data.json';

const clearPunctuation = (entry:string) => {

  while (entry.includes("\"")) {
    entry = entry.replace("\"", "")
  }

  return entry;
}

export const unpackBaseMatchResults = () => {
  let data:object[] = [];
  data.push({"Match Count" : sample.data.baseMatches.totalCount});
  sample.data.baseMatches.edges.forEach( match => {

    let trial = match.node
    let mainRow:object = {};
    let sites:object = {};
    let blackList = ["advancedMatchConditions", "armGroups", "interventions"];

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

export const unpackAdvancedMatchResults = () => {
  let data:object[] = [];
  data.push({"Match Count" : advSample.data.advancedMatches.totalCount});
  advSample.data.advancedMatches.edges.forEach( match => {

    let trial = match.node
    let quality = match.matchQuality

    let mainRow:object = {"Match Quality" : quality};
    let sites:object = {};

    Object.keys(trial).forEach( field => {
      if ( field === "conditions") {
        let value = trial[field]
         value = clearPunctuation(value)
        mainRow[field] = value;
      } else if (field === "sites") {
        sites = trial[field];
      } else {
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
