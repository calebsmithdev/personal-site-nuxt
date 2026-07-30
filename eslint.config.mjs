import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      args: 'all',
      argsIgnorePattern: '^_'
    }],
    'vue/no-v-html': 'off'
  }
})
