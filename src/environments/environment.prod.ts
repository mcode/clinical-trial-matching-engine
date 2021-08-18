export const environment: {
  production: boolean;
  stubFHIR?: boolean;
  stubSearch?: boolean;
  stubSearchResults?: boolean;
  servers: { name: string; url: string }[];
} = {
  production: true,
  servers: [
    { name: 'Clinical Trials', url: 'http://clinicaltrialsmatchinghost.eba-tmeqgwpw.us-east-1.elasticbeanstalk.com' }
  ]
};
