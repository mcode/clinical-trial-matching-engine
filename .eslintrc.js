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
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
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
      files: ['*.component.html'],
        parser: '@angular-eslint/template-parser',
        plugins: ['@angular-eslint/template'],
        rules: {
          // ORIGINAL tslint.json -> "template-banana-in-box": true,
          '@angular-eslint/template/banana-in-a-box': 'error',

          // ORIGINAL tslint.json -> "template-no-negated-async": true,
          '@angular-eslint/template/no-negated-async': 'error',
        }
    },
    {
      files: ['*.component.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      plugins: ['@angular-eslint/template'],
      processor: '@angular-eslint/template/extract-inline-html',
    },
    {
      // Not actually sure this is correct, but pretty sure it's only loaded
      // from within Node
      files: ['e2e/protractor.conf.js'],
      env: {
        browser: false,
        protractor: true
      }
    }
  ]
};
