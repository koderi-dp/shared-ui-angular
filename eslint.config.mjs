import angular from 'angular-eslint'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

/** Flat ESLint config: typescript-eslint plus angular-eslint for code and templates. */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**', '.angular/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'ko', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'ko', style: 'camelCase' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  // `button[koButton]` is a component on a native element, so it takes an attribute selector.
  {
    files: ['projects/ui/src/lib/primitives/button.component.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'ko', style: 'camelCase' },
      ],
    },
  },
  // Inside the library, imports are relative within an entry point and `@koderi-dp/ui` across
  // entry points. The `@/*` alias belongs to the showcase and does not exist for consumers.
  {
    files: ['projects/ui/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@/',
              message: 'Use a relative import or @koderi-dp/ui.',
            },
          ],
        },
      ],
    },
  },
  // The primary entry point must never import itself or a secondary entry point: circular.
  {
    files: ['projects/ui/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@/',
              message: 'Use a relative import.',
            },
            {
              regex: '^@koderi-dp/ui(/|$)',
              message:
                'The primary entry point must not import itself or a secondary entry point.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
  },
  // Disable rules that conflict with Prettier formatting.
  prettier
)
