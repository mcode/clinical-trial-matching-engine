import React from 'react';

import TrialScopeEndpoint, { TrialScopeResult } from '../../trialscope';
import { ExportReactCSV } from '../ExportTrials/ExportReactCSV';
import { unpackMatchResults } from '../ExportTrials/ParseResults';

interface QueryViewerProperties {
  endpoint: TrialScopeEndpoint;
  defaultQuery?: string;
}

interface QueryViewerState {
  query: string;
  result: TrialScopeResult | null;
  error: Error | null;
}

export class QueryViewer extends React.Component<QueryViewerProperties, QueryViewerState> {
  state: QueryViewerState;

  constructor(props: QueryViewerProperties) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.runQuery = this.runQuery.bind(this);
    const defaultQuery = this.props.defaultQuery ? this.props.defaultQuery : '';
    this.state = { query: defaultQuery, result: null, error: null };
  }

  handleChange(event: React.SyntheticEvent) {
    this.setState({ query: (event.target as HTMLFormElement).value });
  }

  render() {
    let results;
    let exportable_results;
    if (this.state.result === null) {
      if (this.state.error === null) {
        results = <div>No results.</div>
      } else {
        results = <div>An error occurred:
          <pre>{this.state.error.toString()}</pre>
        </div>
      }
    } else {
      results = <pre>{JSON.stringify(this.state.result, null, 2)}</pre>
      exportable_results = unpackMatchResults(this.state.result);
    }
    return (
      <div>
        <textarea defaultValue={this.state.query} onChange={this.handleChange}></textarea>
        <button onClick={this.runQuery}>Run Query</button>
         { exportable_results &&
           <ExportReactCSV csvData={exportable_results} fileName={"trial_list.csv"}/>
         }
        {results}
      </div>
    );
  }

  runQuery() {
    this.props.endpoint.runQuery(this.state.query).then(results => {
      this.setState({ result: results, error: null });
    }).catch(error => {
      console.error('Error running query:');
      console.error(error);
      this.setState({ result: null, error: error })
    });
  }
}

export default QueryViewer;
