// This is the Karma configuration used by the CI build. It's almost identical
// expect it disables some coverage reporters as unnecessary for the CI build.
// This works by loading the "original" Karma config, passing it a fake method
// to receive the original config JSON, altering it, and then passing it to the
// actual Karma config.

module.exports = function (config) {
  // Grab the original configuration
  const parentModule = require('./karma.conf');
  let parentConfig;
  parentModule({ set: (conf) => {
    parentConfig = conf;
  }});
  // Our only change is the reporters
  parentConfig.coverageReporter.reporters = [
    { type: 'lcovonly' }
  ];
  config.set(parentConfig);
}
