const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const AppWindow = require('./src/AppWindow')
const remote = require("@electron/remote/main") // remote 引用
remote.initialize()
const isDev = require('electron-is-dev')
const Store = require('electron-store');
Store.initRenderer();
const menuTemplate = require('./src/menuTemplate')
const path = require('path')

let mainWindow, settingsWindow

app.on('ready', () => {

    const mainWindowConfig = {
        width: 1080,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    }

    const urlLocation = isDev ? 'http://localhost:3000' : 'dummyurl'
    mainWindow = new AppWindow(mainWindowConfig, urlLocation)
    mainWindow.on('closed', () => {
        mainWindow = null
    })
    remote.enable(mainWindow.webContents)

    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 400,
            parent: mainWindow
        }
        const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
        settingsWindow.on('closed', () => {
            settingsWindow = null
        })
    })

    // set the menu
    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)

})