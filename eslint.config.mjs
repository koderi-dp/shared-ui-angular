import angular from 'angular-eslint'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

/** Flat ESLint config: typescript-eslint plus angular-eslint for code and templates. */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/**',
      'reference/**',
      '.angular/**',
    ],
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
    files: ['src/ui/primitives/button.component.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: ['element', 'attribute'], prefix: 'ko', style: 'camelCase' },
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
