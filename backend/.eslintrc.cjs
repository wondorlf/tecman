/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['.eslintrc.cjs', 'dist', 'node_modules'],
  rules: {
    // ── TypeScript ──────────────────────────────────────────────────────
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'warn',
    '@typescript-eslint/interface-name-prefix': 'off',

    // ── General ─────────────────────────────────────────────────────────
    'no-console': 'off', // NestJS uses console.log for bootstrap
    'no-debugger': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error',

    // ── Import (manual — sin plugin) ────────────────────────────────────
    'no-duplicate-imports': 'warn',
  },
};
