import { ResearchStudySearchEntry, Facility } from '../services/search.service';

export const UnpackResearchStudyResults= (result: ResearchStudySearchEntry[]): object[] => {

  const data: object[] = [];

  data.push({'Match Count': result.length});

  result.forEach(trial => {
    const mainRow = {};
    const sites: Facility[] = trial.sites;

    mainRow["nctId"] = trial.nctId;
    mainRow["Title"] = trial.title;
    mainRow["OverallStatus"] = trial.overallStatus;
    mainRow["Phase"] = trial.phase;
    mainRow["Conditions"] = trial.conditions;
    mainRow["StudyType"] = trial.studyType;
    mainRow["Description"] = trial.description;
    mainRow["DetailedDescription"] = trial.detailedDescription;
    mainRow["Criteria"] = trial.criteria;
    mainRow["Sponsor"] = trial.sponsor;
    mainRow["OverallContact"] = trial.overallContact;
    mainRow["OverallContactPhone"] = trial.overallContactPhone;
    mainRow["OverallContactEmail"] = trial.overallContactEmail;

    data.push(mainRow);

    Object.keys(sites).forEach( index => {
      let siteRow = {};
      siteRow["Facility"] = sites[index]["facility"];
      if (sites[index]["contactPhone"]) {
        siteRow["Phone"] = sites[index]["contactPhone"];
      }
      if (sites[index]["contactEmail"]) {
        siteRow["Email"] = sites[index]["contactEmail"];
      }
      data.push(siteRow);
    });

  });

  return data;
};
