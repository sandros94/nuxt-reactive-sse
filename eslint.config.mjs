// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/prefer-ts-expect-error': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'vue/max-attributes-per-line': ['error', {
        singleline: {
          max: 4,
        },
        multiline: {
          max: 1,
        },
      }],

      // Project specific overrides
    },
  },
)
