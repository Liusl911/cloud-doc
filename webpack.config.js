const path = require('path')

module.exports = {
    mode: 'none',
    target: 'electron-main',
    entry: './main.js',
    output: {
        path: path.resolve(__dirname, './build'),
        filename: 'main.js'
    },
    node: {
        __dirname: false
    }
}