import React, { useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import ButtonBtn from './components/ButtonBtn';
import TabList from './components/TabList';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr } from './utils/helper';
import fileHelper from './utils/fileHelper';
import useIpcRenderer from './hooks/useIpcRenderer';

const { ipcRenderer } = window.require('electron')

// node.js modules
const { join, basename, extname, dirname } = window.require('path');
const remote = window.require('@electron/remote'); // remote的引入需下载依赖
const Store = window.require('electron-store');
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'Files Data' });
const saveFilesToStore = (files) => {
  // 不需要将files的所有字段存进去，比如body，isnew等等
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const { id, title, path, createdAt } = file
    result[id] = {
      id,
      title,
      path,
      createdAt
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
    const currentFile = files[fileId]
    if (!currentFile.isLoaded) {
      fileHelper.readFile(currentFile.path).then((value) => {
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
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }
  const deleteFile = (fileId) => {
    if (files[fileId].isnew) {
      // 删除文件
      const { [fileId]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[fileId].path).then(() => {
        // 删除文件
        const { [fileId]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        // 关闭opened文件
        tabClose(fileId)
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
  const saveContentFn = () => {
    fileHelper.writeFile(activedFile.path, activedFile.body).then(() => {
      setUnSavedFileIds(unSavedFileIds.filter(id => id !== activedFileId))
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
      console.log(result)
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

  // 菜单
  useIpcRenderer({
    'create-new-file': createFile,
    'import-file': importFiles,
    'save-edit-file': saveContentFn
  })

  return (
    <div className="App container-fluid px-0">
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
            <>
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
                  autofocus: true,
                  minHeight: "470px"
                }}
              />
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
