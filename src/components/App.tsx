import React, { FC, useState, useEffect } from 'react';

import Header from 'components/Header';
import Navigation from 'components/Navigation';

import logo from '../logo.svg';
import { getPatientRecord } from '../utils/fhirExtract';
import { FHIRClientProvider } from './FHIRClient';
import { PatientProvider } from './PatientProvider';
import PatientRecord from './PatientRecord/PatientRecord';
import config from 'utils/ConfigManager';

import TrialScopeEndpoint from '../trialscope';
import QueryViewer from './TrialScope/QueryViewer';

interface AppProps {
  client: any; // TODO: fhirclient.Client
}

const trialscopeURL = process.env.REACT_APP_TRIALSCOPE_ENDPOINT ? new URL(process.env.REACT_APP_TRIALSCOPE_ENDPOINT) : null;
const trialscopeToken = process.env.REACT_APP_TRIALSCOPE_TOKEN;
if (trialscopeToken === null)
  throw new Error("Missing TrialScope API token. Please define REACT_APP_TRIALSCOPE_TOKEN in the appropriate env.local file.");

const endpoint = new TrialScopeEndpoint(trialscopeToken!, trialscopeURL);

const defaultQuery = `{
  baseMatches(
    conditions: [BRAIN_TUMOR],
    baseFilters: {
      coordinates: {latitude: 40.713216, longitude: -75.7496572}
      travelRadius: 300
    }
  ) {
    totalCount
    edges{
      node{
        title
      }
    }
  }
}`;

const App: FC<AppProps> = ({ client }) => {
  const [patientRecords, setPatientRecords] = useState<Array<any>>([]);

  /*useEffect(() => {
    getPatientRecord(client).then((records: Array<any>) => {
      setPatientRecords(records);
    });
  }, [client]);*/

  return (
    <FHIRClientProvider client={client}>
      <PatientProvider>
        <div>
          <Header logo={logo} title={config.get('appName', 'SMART App')} />
          <Navigation />
        </div>

        <div>{`Fetched ${patientRecords.length} resources`}</div>
        <QueryViewer endpoint={endpoint} defaultQuery={defaultQuery} />
      </PatientProvider>
    </FHIRClientProvider>
  );
};

export default App;
