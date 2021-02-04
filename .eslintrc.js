/*
This file is based off of the eslint configuration in
https://github.com/angular-eslint/angular-eslint/blob/master/packages/integration-tests/fixtures/angular-cli-workspace/.eslintrc.js
*/
module.exports = {
  env: {
    browser: true,
    node: true
  },
  overrides: [
    {
      files: ['*.ts'],
      "parserOptions": {
        "project": [
          "tsconfig.app.json",
          "tsconfig.spec.json",
          "e2e/tsconfig.json"
        ],
        "createDefaultProgram": true
      },
      extends: [
        "plugin:@angular-eslint/recommended",
        // This is required if you use inline templates in Components
        "plugin:@angular-eslint/template/process-inline-templates",
        'plugin:prettier/recommended'
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: 'tsconfig.json'
      },
      plugins: [
        '@typescript-eslint',
        '@typescript-eslint/tslint',
        '@angular-eslint'
      ]
    },
    {
      "files": ["*.html"],
      "extends": ["plugin:@angular-eslint/template/recommended"],
      "rules": {
        /**
         * Any template/HTML related rules you wish to use/reconfigure over and above the
         * recommended set provided by the @angular-eslint project would go here.
         */
      }
    }
  ]
};
