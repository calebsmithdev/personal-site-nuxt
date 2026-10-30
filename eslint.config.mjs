import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
  rules: {
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
    'vue/max-attributes-per-line': ['error', { singleline: { max: 4 }, multiline: { max: 1 } }]
  }
})
