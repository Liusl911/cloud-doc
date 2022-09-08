const { app, BrowserWindow, Menu } = require('electron')
// remote 引用
const remote = require("@electron/remote/main")
remote.initialize()
const isDev = require('electron-is-dev')
const Store = require('electron-store');
Store.initRenderer();
const menuTemplate = require('./src/menuTemplate')
let mainWindow

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1080,
        height: 680,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })
    remote.enable(mainWindow.webContents)
    const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl'
    mainWindow.loadURL(urlLocation)

    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)
})