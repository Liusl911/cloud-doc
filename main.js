const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const AppWindow = require('./src/AppWindow')
const remote = require("@electron/remote/main") // remote 引用
remote.initialize()
const isDev = require('electron-is-dev')
const Store = require('electron-store')
Store.initRenderer();
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'Files Data' })
const menuTemplate = require('./src/menuTemplate')
const QiniuManager = require('./src/utils/QiniuManager')
const path = require('path')
const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')
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

    // 监听重命名文件
    ipcMain.on('rename-file', (event, data) => {
        const manager = createManager()
        manager.renameFile(data.oldKey, data.newKey).then(() => {
            mainWindow.webContents.send('active-file-uploaded')
        }).catch(() => {
            dialog.showErrorBox('云文件重命名失败', '请检查七牛云参数是否正确')
        })
    })

    // 监听删除文件
    ipcMain.on('delete-file', (event, data) => {
        const manager = createManager()
        manager.deleteFile(data.key).then(() => {
            dialog.showMessageBox({
                type: 'info',
                title: '文件删除成功',
                message: '文件删除成功'
            })
        }).catch(() => {
            dialog.showErrorBox('云文件删除失败', '请检查七牛云参数是否正确')
        })
    })

    // 监听选择文件，是否需要拉取七牛云文件
    ipcMain.on('download-file', (event, data) => {
        const manager = createManager()
        const filesObj = fileStore.get('files')
        const { key, id, path } = data
        manager.getStat(data.key).then((res) => {
            const serverUpdatedTime = Math.round(res.putTime / 10000)
            const localUpdatedTime = filesObj[id].updateAt
            if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
                console.log('new-file')
                manager.downloadFile(key, path).then(() => {
                    mainWindow.webContents.send('file-downloaded', { status: 'downloaded-success', id })
                })
            } else {
                console.log('no-new-file')
                mainWindow.webContents.send('file-downloaded', { status: 'no-new-success', id })
            }
        }, (err) => {
            console.log(err)
            if (err.statusCode === 612) {
                mainWindow.webContents.send('file-downloaded', { status: 'no-file', id })
            }
        })
    })

    // 监听全部同步至云端
    ipcMain.on('upload-all-to-qiniu', () => {
        mainWindow.webContents.send('loading-status', true)
        const manager = createManager()
        const filesObj = fileStore.get('files') || {}
        const uploadPromiseArr = Object.keys(filesObj).map(key => {
            const { title, path } = filesObj[key]
            return manager.uploadFile(`${title}.md`, path)
        })
        Promise.all(uploadPromiseArr).then(res => {
            dialog.showMessageBox({
                type: 'info',
                title: `成功上传了${res.length}个文件`,
                message: `成功上传了${res.length}个文件`,
            })
            mainWindow.webContents.send('files-uploaded')
        }).catch(() => {
            dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
        }).finally(() => {
            mainWindow.webContents.send('loading-status', false)
        })
    })

    // 监听从云端下载至本地
    ipcMain.on('download-all-to-local', () => {
        const manager = createManager()
        manager.filesListPrefix().then(res => {
            const cloudFilesList = res.items
            const filesObj = fileStore.get('files') || {}
            const filesArr = Object.values(filesObj)
            const keys = filesArr.map(item => {
                return `${item.title}.md`
            })
            const downloadPromiseArr = cloudFilesList.filter(item => {
                const keyIndex = keys.indexOf(item.key)
                if (keyIndex === -1) {
                    return true
                } else {
                    const serverUpdatedTime = Math.round(item.putTime / 10000)
                    const localUpdateAt = filesArr[keyIndex].updateAt
                    return ((serverUpdatedTime > localUpdateAt) || (!localUpdateAt))
                }
            }).map(item => {
                return manager.downloadFile(item.key, path.join(savedLocation, item.key))
            })
            return Promise.all(downloadPromiseArr)
        }).then(res => {
            console.log(res)
            dialog.showMessageBox({
                type: 'info',
                title: `成功下载了${res.length}个文件`,
                message: `成功下载了${res.length}个文件`
            })

            const downloadFilesArr = res.map(item => {
                return {
                    path: item.path,
                    title: path.basename(item.key, path.extname(item.key))
                }
            })
            mainWindow.webContents.send('files-all-downloaded', downloadFilesArr)
        }).catch(() => {
            dialog.showErrorBox('下载失败', '请检查七牛云参数是否正确')
        })
    })

})