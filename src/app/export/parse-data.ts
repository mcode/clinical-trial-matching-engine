import { ResearchStudySearchEntry } from '../services/search.service';

const annotatedTrials = ['NCT03190967',
                         'NCT02643303',
                         'NCT03289039',
                         'NCT02531932',
                         'NCT02955394',
                         'NCT03237572',
                         'NCT00897702',
                         'NCT02788981',
                         'NCT03219476',
                         'NCT02900469',
                         'NCT02684032',
                         'NCT03344536',
                         'NCT03377387',
                         'NCT03393845',
                         'NCT04039230',
                         'NCT03765983',
                         'NCT03990896',
                         'NCT03483012',
                         'NCT03959891',
                         'NCT03641755',
                         'NCT03643861',
                         'NCT03473639',
                         'NCT02482376',
                         'NCT03964532',
                         'NCT01980823',
                         'NCT02626507',
                         'NCT03847168',
                         'NCT03112590',
                         'NCT03130439',
                         'NCT02764541',
                         'NCT03054363',
                         'NCT01376505',
                         'NCT03742986',
                         'NCT03573648',
                         'NCT03632941',
                         'NCT03043794',
                         'NCT03143894',
                         'NCT02999477',
                         'NCT04038489',
                         'NCT03980509'
];

// This function converts the saved ResearchStudy resource into a data format that can be export to a .xlsx file
export const UnpackResearchStudyResults = (result: ResearchStudySearchEntry[]): object[] => {
  const data: object[] = [];

  data.push({ 'Match Count': result.length });

  result.forEach((trial) => {
    if (annotatedTrials.includes(trial.nctId)) {
      const mainRow = {};
      const sites = trial.getSites();

    const mainRow = {};
    const sites = trial.getSites();

    mainRow['nctId'] = trial.nctId;
    if (trial.search && trial.search.score != null) {
      mainRow['MatchLikelihood'] = trial.matchLikelihood;
    }
    mainRow['Title'] = trial.title;
    mainRow['OverallStatus'] = trial.overallStatus;
    mainRow['Phase'] = trial.phase;
    mainRow['Conditions'] = trial.conditions;
    mainRow['StudyType'] = trial.studyType;
    mainRow['Description'] = trial.description;
    mainRow['DetailedDescription'] = trial.detailedDescription;
    mainRow['Criteria'] = trial.criteria;
    mainRow['Sponsor'] = trial.sponsor;
    mainRow['OverallContact'] = trial.overallContact;
    mainRow['OverallContactPhone'] = trial.overallContactPhone;

      data.push(mainRow);
      /*
      Object.keys(sites).forEach((index) => {
        const siteRow = {};
        siteRow['Facility'] = sites[index]['name'];
        if (Array.isArray(sites[index]['telecom'])) {
          for (const telecom of sites[index].telecom) {
            if (telecom.system === 'phone') {
              siteRow['Phone'] = telecom.value;
            } else if (telecom.system === 'email') {
              siteRow['Email'] = telecom.value;
            }
          }
        }
        data.push(siteRow);
      });
      */
    }
  });

  return data;
};
