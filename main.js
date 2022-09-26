const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const AppWindow = require('./src/AppWindow')
const remote = require("@electron/remote/main") // remote 引用
remote.initialize()
const isDev = require('electron-is-dev')
const Store = require('electron-store')
Store.initRenderer();
const menuTemplate = require('./src/menuTemplate')
const settingsStore = new Store({ name: 'Settings' })
const QiniuManager = require('./src/utils/QiniuManager')
const path = require('path')

let mainWindow, settingsWindow

// 实例化 QiniuManager
const createManager = () => {
    const accessKey = settingsStore.get('accessKey')
    const secretKey = settingsStore.get('secretKey')
    const bucketName = settingsStore.get('bucketName')
    return new QiniuManager(accessKey, secretKey, bucketName)
}

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
    remote.enable(mainWindow.webContents)
    mainWindow.on('closed', () => {
        mainWindow = null
    })

    // set the menu
    let menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)

    // 监听设置打开
    ipcMain.on('open-settings-window', () => {
        const settingsWindowConfig = {
            width: 500,
            height: 400,
            parent: mainWindow,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            }
        }
        const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
        settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
        settingsWindow.removeMenu()
        remote.enable(settingsWindow.webContents)
        settingsWindow.on('closed', () => {
            settingsWindow = null
        })
    })

    // 监听保存设置
    ipcMain.on('config-is-saved', () => {
        let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
        const switchItems = (toggle => {
            [1, 2, 3].forEach(number => {
                qiniuMenu.submenu.items[number].enabled = toggle
            })
        })
        const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
        if (qiniuIsConfiged) {
            switchItems(true)
        } else {
            switchItems(false)
        }

    })

    // 监听自动云同步
    ipcMain.on('upload-file', (event, data) => {
        const manager = createManager()
        manager.uploadFile(data.key, data.path).then(data => {
            console.log('上传成功', data)
            mainWindow.webContents.send('active-file-uploaded')
        }).catch(() => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
        })
    })


})