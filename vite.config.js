// vite.config.js
/** @type {import('vite').UserConfig} */

export default {
    // config options
    root: './src',
    envDir: '../',

    server: {
        port: 3000,
        host: true,
    },

    preview: {
        port: 3030
    },

    plugins: [
        // legacy({
        //     targets: ['defaults', 'not IE 11']
        // }),
    ],

    // empêche esbuild de minifier les noms des fonctions,
    esbuild: {
        keepNames: true
    },

    build: {
        emptyOutDir: true,
        outDir: '../dist',
        sourcemap: true,
    }
}