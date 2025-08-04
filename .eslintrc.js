module.exports = {
  root: true,

  env: {
    node: true,
    webextensions: true
  },

  'extends': [
    'plugin:vue/essential',
    'eslint:recommended'
  ],

  parserOptions: {
    parser: 'babel-eslint'
  },
  rules: {
    'no-console': 'off', // Allow console logs in all environments for extension debugging
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)'
      ],
      env: {
        jest: true
      }
    }
  ]
}
