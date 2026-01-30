import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
    // add more generic rulesets here, such as:
    // js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        rules: {
            // TypeScript правила
            'no-unused-vars': 'off',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-explicit-any': 'warn',

            // Vue правила
            'vue/html-indent': ['error', 4],
            'vue/script-setup-uses-vars': 'error',
            'vue/multi-word-component-names': 'off',

            // Базовые правила
            semi: 'error',
            indent: ['error', 4],
            quotes: ['error', 'single'],
            'comma-dangle': ['error', 'always-multiline']
        },

        files: ['**/*.{ts,vue}'],

        languageOptions: {
            sourceType: 'module',
            globals: {
                ...globals.browser
            }
        }
    }
]