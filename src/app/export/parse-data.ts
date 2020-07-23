import { ResearchStudySearchEntry } from '../services/search.service';

// This function converts the saved ResearchStudy resource into a data format that can be export to a .xlsx file
export const UnpackResearchStudyResults = (result: ResearchStudySearchEntry[]): object[] => {
  const data: object[] = [];

  data.push({ 'Match Count': result.length });

  result.forEach((trial) => {
    const mainRow = {};
    const sites = trial.getSites();

    mainRow['nctId'] = trial.nctId;
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
    mainRow['OverallContactEmail'] = trial.overallContactEmail;

    data.push(mainRow);

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
  });

  return data;
};
