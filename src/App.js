import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import ButtonBtn from './components/ButtonBtn';
import TabList from './components/TabList';
import Loader from './components/loader';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr, timestampToString } from './utils/helper';
import fileHelper from './utils/fileHelper';
import useIpcRenderer from './hooks/useIpcRenderer';


// node.js modules
const { join, basename, extname, dirname } = window.require('path');
const remote = window.require('@electron/remote'); // remote的引入需下载依赖
const { ipcRenderer } = window.require('electron')
const Store = window.require('electron-store');
const settingsStore = new Store({ name: 'Settings' })
const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key)) // 七牛云是否设置以及是否勾选云同步
const fileStore = new Store({ name: 'Files Data' });
const saveFilesToStore = (files) => {
  // 不需要将files的所有字段存进去，比如body，isnew等等
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, title, path, createdAt, isSynced, updateAt } = file
    result[id] = {
      id,
      title,
      path,
      createdAt,
      isSynced,
      updateAt
    }
    return result
  }, {})
  fileStore.set('files', filesStoreObj)
}

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unSavedFileIds, setUnSavedFileIds] = useState([])
  const [activedFileId, setActivedFileId] = useState('')
  const [searchFiles, setSearchFiles] = useState([])
  const [keyWords, setKeyWords] = useState('')
  const [loading, setLoading] = useState(false)
  const filesArr = objToArr(files)
  const openedFiles = openedFileIds.map(openId => {
    return files[openId]
  })
  const activedFile = files[activedFileId]
  const fileListArr = (searchFiles.length > 0 || (keyWords.length > 0 && searchFiles.length === 0)) ? searchFiles : filesArr
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')

  const fileClick = (fileId) => {
    if (files[fileId].isnew) return
    // 选择文件
    setActivedFileId(fileId)
    // open列表如果不存在，则添加到open列表
    if (!openedFileIds.includes(fileId)) {
      setOpenedFileIds([...openedFileIds, fileId])
    }
    const { id, title, isLoaded, path } = files[fileId]
    if (!isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        fileHelper.readFile(path).then((value) => {
          const newFile = { ...files[fileId], body: value, isLoaded: true }
          setFiles({ ...files, [fileId]: newFile })
        }).catch(err => {
          alert(err)
          // 删除文件
          const { [fileId]: value, ...afterDelete } = files
          setFiles(afterDelete)
          saveFilesToStore(afterDelete)
          // 关闭opened文件
          tabClose(fileId)
        })
      }
    }
  }
  const tabClick = (fileId) => {
    // 选择文件
    setActivedFileId(fileId)
  }
  const tabClose = (fileId) => {
    // 过滤掉已关闭的fileId
    const restFileIds = openedFileIds.filter(id => id !== fileId)
    setOpenedFileIds(restFileIds)
    // 当选中的文件被关闭，重置选中的文件
    if (restFileIds.length > 0 && !restFileIds.includes(activedFileId)) {
      setActivedFileId(restFileIds[0])
    } else if (restFileIds.length === 0) {
      setActivedFileId('')
    }
  }
  const updateFileName = (fileId, value, isnew) => {
    // 新建文件或更新标题
    const newPath = isnew ? join(savedLocation, `${value}.md`) : join(dirname(files[fileId].path), `${value}.md`)
    const modifiedFile = { ...files[fileId], title: value, isnew: false, path: newPath }
    const newFiles = { ...files, [fileId]: modifiedFile }
    if (isnew) {
      fileHelper.writeFile(newPath, files[fileId].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[fileId].path
      const oldValue = files[fileId].title
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (getAutoSync()) {
          ipcRenderer.send('rename-file', { oldKey: `${oldValue}.md`, newKey: `${value}.md` })
        }
      })
    }
  }
  const deleteFile = (fileId) => {
    if (files[fileId].isnew) {
      // 删除文件
      const { [fileId]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      const { path, title } = files[fileId]
      fileHelper.deleteFile(path).then(() => {
        // 删除文件
        const { [fileId]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        // 关闭opened文件
        tabClose(fileId)
        if (getAutoSync()) {
          ipcRenderer.send('delete-file', { key: `${title}.md` })
        }
      })
    }
  }
  const fileSearch = (keyWords) => {
    const newFiles = filesArr.filter(file => file.title.includes(keyWords))
    setSearchFiles(newFiles)
    setKeyWords(keyWords)
  }
  const createFile = () => {
    if (filesArr.find(file => file.isnew)) return
    const newId = uuidv4()
    const newFiles = {
      id: newId,
      title: '',
      body: '## 请输出 MarkDown 内容',
      createdAt: new Date().getTime(),
      isnew: true,
      path: ''
    }
    setFiles({ ...files, [newId]: newFiles })
  }
  const contentChange = (fileId, value) => {
    if (value !== files[fileId].body) {
      // 更新内容
      const newFile = { ...files[fileId], body: value }
      setFiles({ ...files, [fileId]: newFile })
      // 添加未保存状态
      if (!unSavedFileIds.includes(fileId)) {
        setUnSavedFileIds([...unSavedFileIds, fileId])
      }
    }
  }
  const saveContentFn = () => {
    const { path, body, title } = activedFile
    fileHelper.writeFile(path, body).then(() => {
      setUnSavedFileIds(unSavedFileIds.filter(id => id !== activedFileId))
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', { key: `${title}.md`, path })
      }
    })
  }
  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: '导入文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Markdown files', extensions: ['md'] }
      ]
    }).then((result) => {
      // 去重
      const filteredPaths = result.filePaths.filter(path => {
        const isAdded = Object.values(files).find(file => {
          return file.path === path
        })
        return !isAdded
      })
      // 将path转化为files所需的格式
      // [{id, title, path}]
      const importFilesArr = filteredPaths.map(path => {
        return {
          id: uuidv4(),
          title: basename(path, extname(path)),
          path
        }
      })
      // flatten转化
      const newFiles = { ...files, ...flattenArr(importFilesArr) }
      // setFiles && saveStore
      setFiles(newFiles)
      saveFilesToStore(newFiles)
      if (importFilesArr.length > 0) {
        remote.dialog.showMessageBox({
          type: 'info',
          title: '提示',
          message: `成功导入了${importFilesArr.length}个文件`
        })
      }
    })
  }

  // 上传至云端
  const activeFileUploaded = () => {
    const { id } = activedFile
    const modifiedFile = { ...files[id], isSynced: true, updateAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  // 从云端下载
  const activeFileDownloaded = (event, message) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then((value) => {
      let newFile
      if (message.status === 'downloaded-success') {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updateAt: new Date().getTime() }
      } else {
        newFile = { ...files[id], body: value, isLoaded: true }
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    }).catch(err => {
      alert(err)
      // 删除文件
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
      saveFilesToStore(afterDelete)
      // 关闭opened文件
      tabClose(id)
    })
  }

  // 全部同步至云端
  const fileUploaded = () => {
    const uploadedTime = new Date().getTime()
    const newFiles = objToArr(files).reduce((result, file) => {
      result[file.id] = {
        ...files[file.id],
        isSynced: true,
        updateAt: uploadedTime
      }
      return result
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  // 从云端下载至本地
  const filesAllDownloaded = (event, data) => {
    const currentFiles = { ...files }
    const currentFilesArr = objToArr(files)
    const downloadedTime = new Date().getTime()
    const newFiles = data.reduce((resultObj, file) => {
      const { title, path } = file
      const currentFile = currentFilesArr.find(item => item.title === title)
      if (currentFile) {
        // 下载的文件已存在于本地
        const { id } = currentFile
        const updatedItem = {
          ...currentFile,
          isSynced: true,
          updateAt: downloadedTime
        }
        return {
          ...resultObj,
          [id]: updatedItem
        }
      } else {
        // 下载的文件不存在于本地
        const newId = uuidv4()
        const newItem = {
          id: newId,
          title: title,
          createdAt: downloadedTime,
          path: path,
          isSynced: true,
          updateAt: downloadedTime
        }
        return {
          ...resultObj,
          [newId]: newItem
        }
      }
    }, { ...currentFiles })
    setFiles(newFiles)
    saveFilesToStore(newFiles)
    if (activedFileId !== '') {
      const fileItem = files[activedFileId]
      const { path } = fileItem
      fileHelper.readFile(path).then((value) => {
        const newFile = {
          ...fileItem,
          body: value
        }
        let newFiles = { ...files, [activedFileId]: newFile }
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }

  // 菜单
  useIpcRenderer({
    'create-new-file': createFile,
    'import-file': importFiles,
    'save-edit-file': saveContentFn,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'loading-status': (event, status) => { setLoading(status) },
    'files-uploaded': fileUploaded,
    'files-all-downloaded': filesAllDownloaded
  })

  return (
    <div className="App container-fluid px-0">
      {loading &&
        <Loader />
      }
      <div className='row g-0'>
        <div className='col-4 left-panel'>
          <FileSearch
            title="My Document"
            onFileSearch={fileSearch}
          />
          <FileList
            files={fileListArr}
            onFileClick={fileClick}
            onSaveEdit={updateFileName}
            onFileDelete={deleteFile}
          />
          <div className='row g-0 button-group'>
            <div className='col'>
              <div className='d-grid gap-2'>
                <ButtonBtn
                  text="新建"
                  colorClass="btn-primary"
                  icon={faPlus}
                  onBtnClick={createFile}
                />
              </div>
            </div>
            <div className='col'>
              <div className='d-grid gap-2'>
                <ButtonBtn
                  text="导入"
                  colorClass="btn-success"
                  icon={faFileImport}
                  onBtnClick={importFiles}
                />
              </div>
            </div>
          </div>
        </div>
        <div className='col-8 right-panel'>
          {
            !activedFileId &&
            <div className='start-page'>
              选择或者创建新的 MarkDown 文档
            </div>
          }
          {
            activedFileId &&
            <div className='edit-page'>
              <TabList
                files={openedFiles}
                activeId={activedFileId}
                unSaveId={unSavedFileIds}
                onTabClick={tabClick}
                onTabClose={tabClose}
              />
              <SimpleMDE
                value={activedFile && activedFile.body}
                onChange={(value) => { contentChange(activedFile.id, value) }}
                options={{
                  autofocus: !fileListArr.find(file => file.isnew)
                }}
              />
              {activedFile.isSynced &&
                <span className='sync-status'>已同步，上次同步{timestampToString(activedFile.updateAt)}</span>
              }
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
