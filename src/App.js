import React, { useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import defaultFiles from './utils/defaultFiles';
import ButtonBtn from './components/ButtonBtn';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons';
import TabList from './components/TabList';
import SimpleMDE from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import { v4 as uuidv4 } from 'uuid';


function App() {
  const [files, setFiles] = useState(defaultFiles)
  const [openedFileIds, setOpenedFileIds] = useState([])
  const [unSavedFileIds, setUnSavedFileIds] = useState([])
  const [activedFileId, setActivedFileId] = useState('')
  const [searchFiles, setSearchFiles] = useState([])
  const [keyWords, setKeyWords] = useState('')

  const openedFiles = openedFileIds.map(openId => {
    return files.find(file => file.id === openId)
  })
  const activedFile = files.find(file => file.id === activedFileId)

  const fileClick = (fileId) => {
    // 选择文件
    setActivedFileId(fileId)
    // open列表如果不存在，则添加到open列表
    if (!openedFileIds.includes(fileId)) {
      setOpenedFileIds([...openedFileIds, fileId])
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
    // 更新内容
    const newFiles = files.map(file => {
      if (file.id === fileId) {
        file.body = value
      }
      return file
    })
    setFiles(newFiles)
    // 添加未保存状态
    if (!unSavedFileIds.includes(fileId)) {
      setUnSavedFileIds([...unSavedFileIds, fileId])
    }
  }
  const updateFileName = (fileId, value) => {
    // 更新标题
    const newFiles = files.map(file => {
      if (file.id === fileId) {
        file.title = value
        file.isnew = false
      }
      return file
    })
    setFiles(newFiles)
  }
  const deleteFile = (fileId) => {
    // 删除文件
    const newFiles = files.filter(file => file.id !== fileId)
    setFiles(newFiles)
    // 关闭已open的文件
    if (openedFileIds.includes(fileId)) {
      tabClose(fileId)
    }
  }
  const fileSearch = (keyWords) => {
    const newFiles = files.filter(file => file.title.includes(keyWords))
    setSearchFiles(newFiles)
    setKeyWords(keyWords)
  }
  const fileListArr = (searchFiles.length > 0 || (keyWords.length > 0 && searchFiles.length === 0)) ? searchFiles : files

  const createFile = () => {
    const newFiles = files.filter(file => !file.isnew)
    setFiles([
      ...newFiles,
      {
        id: uuidv4(),
        title: '',
        body: '## 请输入 MarkDown 内容',
        createdAt: new Date().getTime(),
        isnew: true
      }
    ])
  }

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
                  onBtnClick={() => { }}
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
