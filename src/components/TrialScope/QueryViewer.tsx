import React from 'react';

// For now dump all the query stuff in here

// At some point this type may be extended into an interface with actual
// properties that are known to exist
type TrialScopeResult = { };

class TrialScopeEndpoint {
  token: string;
  endpoint: URL;

  constructor(token: string, endpoint: URL) {
    this.token = token;
    this.endpoint = endpoint;
  }

  runQuery(query: string): Promise<TrialScopeResult> {
    return new Promise<TrialScopeResult>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.onreadystatechange = (event) => {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status === 200) {
            try {
              let json = JSON.parse(request.responseText);
              if (typeof json === 'object') {
                resolve(json as TrialScopeResult);
              }
            } catch (ex) {
              reject(ex);
            }
          } else {
            reject(new Error(`Error from server: ${request.status} ${request.statusText}`));
          }
        }
      };
      console.log(`Running query ${query}...`);
      request.open('POST', this.endpoint.toString());
      request.setRequestHeader('Content-Type', 'application/json');
      request.setRequestHeader('Authorization', `Bearer ${this.token}`);
      request.send(JSON.stringify({ query: query }));
    });
  }
}

interface QueryViewerProperties {
  token: string;
  endpoint: string | URL;
}

interface QueryViewerState {
  query: string;
  result: TrialScopeResult | null;
  error: Error | null;
}

export class QueryViewer extends React.Component<QueryViewerProperties, QueryViewerState> {
  state: QueryViewerState;
  endpoint: TrialScopeEndpoint;

  constructor(props: QueryViewerProperties) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.runQuery = this.runQuery.bind(this);
    let endpoint = props.endpoint;
    if (typeof endpoint === 'string') {
      endpoint = new URL(endpoint);
    }
    this.endpoint = new TrialScopeEndpoint(props.token, endpoint);
    this.state = { query: '', result: null, error: null };
  }

  handleChange(event: React.SyntheticEvent) {
    this.setState({ query: (event.target as HTMLFormElement).value });
  }

  render() {
    let results;
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
    }
    return (
      <div>
        <textarea defaultValue={this.state.query} onChange={this.handleChange}></textarea>
        <button onClick={this.runQuery}>Run Query</button>
        {results}
      </div>
    );
  }

  runQuery() {
    this.endpoint.runQuery(this.state.query).then(results => {
      this.setState({ result: results, error: null });
    }).catch(error => {
      console.error('Error running query:');
      console.error(error);
      this.setState({ result: null, error: error })
    });
  }
}

export default QueryViewer;
