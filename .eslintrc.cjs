const isCI = !!process.env.CI

module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: isCI ? '' : '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    ...(isCI ? [] : ['plugin:prettier/recommended']),
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
}
