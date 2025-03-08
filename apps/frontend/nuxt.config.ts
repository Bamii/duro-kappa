// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt'],
    // css: ['~/public/main.css'],
    nitro: {
        preset: 'node-server',
        // preset: "./preset",
    },
    routeRules: {
        '/api/v1/**': { proxy: 'http://localhost:4005/api/v1/**' },
    },
    compatibilityDate: '2024-08-17',
    // tailwindcss: {
    //     cssPath: "./public/styles.css"
    // },
    // build: {
    //     postcss: {
    //         postcssOptions: {
    //             plugins: {
    //                 tailwindcss: {},
    //                 autoprefixer: {},
    //             },
    //         },
    //     },
    // },
    //   build: {
    //     // extend (config, { isDev, isClient }) {
    //     //   config.resolve.alias.vue = 'vue/dist/vue.common' // required for vue runtime compiler
    //     // },
    //     html: {
    //       minify: {
    //         decodeEntities: false // @see nuxt-protected-mailto
    //       }
    //     },

    //     extractCSS: {
    //       ignoreOrder: true
    //     },
    //     optimization: {
    //       splitChunks: {
    //         cacheGroups: {
    //           styles: {
    //             name: 'styles',
    //             test: /\.(css|vue)$/,
    //             chunks: 'all',
    //             enforce: true
    //           }
    //         }
    //       }
    //     },
    //     postcssOptions: {
    //       // Add plugin names as key and arguments as value
    //       // Install them before as dependencies with npm or yarn
    //       plugins: {
    //         // Disable a plugin by passing false as value
    //         'postcss-import': {},
    //         'tailwindcss/nesting': {},
    //         autoprefixer: {}
    //       }
    //     }
    //   }
})
