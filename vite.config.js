// for Vite Config Intellisense
// cf. https://vitejs.dev/config/#config-intellisense
/** @type {import('vite').UserConfig} */

export default {
    root: './src',
    envDir: '../',

    server: {
        port: 3000,
        host: true,
    },

    preview: {
        port: 3030
    },

    build: {
        emptyOutDir: true,
        outDir: '../dist',
        // sourcemap: true,
        cssCodeSplit: true,
        lib: {
            entry: './js/solar-widget.js',
            name: 'SolarWidget',
            // the proper extensions will be added
            fileName: 'solar-widget',
            formats: ['es']
        }
    }
}