import vitest from '@vitest/eslint-plugin'
import accessibility from 'eslint-plugin-vuejs-accessibility'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(...accessibility.configs['flat/recommended'], {
  files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
  rules: {
    eqeqeq: ['error', 'smart'],
    'object-shorthand': 'error',
    'no-else-return': 'error',
    'no-nested-ternary': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    'import/no-extraneous-dependencies': ['error', { includeTypes: true, devDependencies: ['test/**', 'scripts/**', 'config/**', '*.config.*', 'nuxt.config.ts', 'content.config.ts', 'eslint.config.mjs', 'app/router.options.ts'] }],
    'import/order': ['error', { groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'], alphabetize: { order: 'asc' } }],
    '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: 'always' }],
    '@stylistic/max-statements-per-line': ['error', { max: 2 }],
    '@typescript-eslint/no-unused-vars': ['error', {
      args: 'all',
      argsIgnorePattern: '^_'
    }]
  }
}, {
  files: ['**/*.vue'],
  rules: {
    'vue/block-lang': ['error', { script: { lang: 'ts' } }],
    'vue/component-api-style': ['error', ['script-setup']],
    'vue/define-macros-order': ['error', { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'] }],
    'vue/html-button-has-type': 'error',
    'vue/no-template-target-blank': 'error',
    'vue/define-props-declaration': ['error', 'type-based'],
    'vue/max-attributes-per-line': ['error', { singleline: { max: 4 }, multiline: { max: 1 } }]
  }
}, {
  files: ['test/**'],
  rules: {
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off'
  }
}, {
  files: ['test/**/*.spec.ts'],
  plugins: { vitest },
  rules: {
    ...vitest.configs.recommended.rules,
    'vitest/valid-expect': ['error', { maxArgs: 2 }]
  }
})
