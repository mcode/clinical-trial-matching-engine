// At some point this type may be extended into an interface with actual
// properties that are known to exist
export type TrialScopeResult = { };

export default class TrialScopeEndpoint {
  token: string;
  endpoint: URL;
  constructor(token: string, endpoint?: URL | null) {
    this.token = token;
    this.endpoint = endpoint ? endpoint : new URL("https://clinicaltrialconnect.dev/graphql");
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
            }
            catch (ex) {
              reject(ex);
            }
          }
          else {
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
