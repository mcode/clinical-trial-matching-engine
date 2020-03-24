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
    recursiveUnpacking(data, trial);

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
    let subsequent:object[] = [];

    Object.keys(trial).forEach( field => {
      if ( typeof trial[field] !== "object" ) {
        let value = trial[field]
        if (field === "conditions"){
          value = clearPunctuation(value)
        }
        mainRow[field] = value;
      } else {
        subsequent.push(trial[field]);
      }
    });

    data.push(mainRow);
    subsequent.forEach( complex_field => {
      Object.keys(complex_field).forEach( index => {
        data.push(complex_field[index])
      });
    });

  });

  return data;
}

const recursiveUnpacking = (data, unravel) => {

  let mainRow:object = {};
  let subsequent:object[] = [];

  console.log(unravel)

  Object.keys(unravel).forEach( field => {
    if ( typeof unravel[field] === "object" && unravel[field] !== null) {
      subsequent.push(unravel[field]);
    } else {
      let value = unravel[field]
      if (field === "conditions"){ // value.includes("\"")
        value = clearPunctuation(value)
      }
      mainRow[field] = value;
    }
  });

  data.push(mainRow);
  if (subsequent.length === 0){
    return;
  } else {
    subsequent.forEach( complex_field => {
      Object.keys(complex_field).forEach( index => {
        let num_test = Number(index)
        if (!isNaN(num_test) && typeof complex_field[index] === "object") { // object is an array
          recursiveUnpacking(data, complex_field[index])
        } else { // object is an object
          recursiveUnpacking(data, complex_field)
        }

      });
    });
  }

}

/*
export const sample_trial_results = () => {

  let data:object[] = [];
  data.push({"Match Count" : sample["data"]["baseMatches"]["totalCount"]});
  sample["data"]["baseMatches"]["edges"].forEach( node => {

    let trial = node["node"]
    let conditions = clearPunctuation(trial["conditions"])

    data.push({"nctId" : trial["nctId"], "title" : trial["title"], "conditions" : conditions,
               "gender" : trial["gender"], "phase" : trial["phase"], "minimumAge" : trial["minimumAge"],
               "maximumAge" : trial["maximumAge"]});

    trial["sites"].forEach( site => {

      data.push({"facility" : site["facility"], "contactName" : site["contactName"],
      "contactEmail" : site["contactEmail"], "contactPhone" : site["contactPhone"], "latitude" : site["latitude"],
      "longitude" : site["longitude"]})

    });
  });
  return data;
}
*/
