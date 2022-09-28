import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { faMarkdown } from '@fortawesome/free-brands-svg-icons';
import PropTypes from "prop-types";
import useKeyPress from "../hooks/useKeyPress";
import useContextMenu from "../hooks/useContextMenu";
import { getParentNode } from "../utils/helper";

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState('')
    const [isCreate, setIsCreate] = useState(false)
    const [isSameTitle, setIsSameTitle] = useState(false)
    let node = useRef(null)
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    const closeEdit = (file) => {
        setEditStatus(false)
        setValue('')
        if (file.isnew) {
            onFileDelete(file.id)
        }
    }

    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        const filesTitles = files.map(file => {
            if (editItem && file.id !== editItem.id) {
                return file.title
            }
        })
        if (filesTitles.includes(value)) {
            setIsSameTitle(true)
        } else {
            setIsSameTitle(false)
        }
        if (enterPressed && editStatus && value.trim() !== '' && !isSameTitle) {
            onSaveEdit(editItem.id, value, editItem.isnew)
            setEditStatus(false)
            setValue('')
        }
        if (escPressed && editStatus) {
            closeEdit(editItem)
        }
    })

    useEffect(() => {
        const newFile = files.find(file => file.isnew)
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
            setIsCreate(true)
        } else {
            setIsCreate(false)
        }
    }, [files])

    useEffect(() => {
        if (editStatus !== false) {
            node.current.focus()
        }
    }, [editStatus])

    const clickElement = useContextMenu([{
        label: '打开',
        click: () => {
            const parentElement = getParentNode(clickElement.current, 'file-item')
            if (parentElement) {
                onFileClick(parentElement.dataset.id)
            }
        }
    }, {
        label: '重命名',
        click: () => {
            const parentElement = getParentNode(clickElement.current, 'file-item')
            if (parentElement) {
                const id = parentElement.dataset.id
                const title = parentElement.dataset.title
                setEditStatus(id);
                setValue(title);
                const newFile = files.find(file => file.isnew)
                if (newFile) onFileDelete(newFile.id)
            }
        }
    }, {
        label: '删除',
        click: () => {
            const parentElement = getParentNode(clickElement.current, 'file-item')
            if (parentElement) {
                onFileDelete(parentElement.dataset.id)
            }
        }
    }], '.file-list', [files])

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li
                        className="list-group-item row g-0 bg-light d-flex align-item-center file-item"
                        key={file.id}
                        data-id={file.id}
                        data-title={file.title}
                        data-file={file}
                        onClick={() => { onFileClick(file.id) }}
                    >
                        {(file.id !== editStatus && !file.isnew) &&
                            <>
                                <span className="col-2">
                                    <FontAwesomeIcon icon={faMarkdown} size="lg" />
                                </span>
                                <span className="col-8">{file.title}</span>
                                {/* <button type="button" className="icon-button col-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditStatus(file.id);
                                        setValue(file.title);
                                        const newFile = files.find(file => file.isnew)
                                        if (newFile) onFileDelete(newFile.id)
                                    }}
                                >
                                    <FontAwesomeIcon title="编辑" icon={faEdit} size="lg" />
                                </button>
                                <button type="button" className="icon-button col-1" onClick={(e) => { e.stopPropagation(); onFileDelete(file.id) }}>
                                    <FontAwesomeIcon title="删除" icon={faTrash} size="lg" />
                                </button> */}
                            </>
                        }
                        {((file.id === editStatus && !isCreate) || (file.id === editStatus && isCreate)) &&
                            <>
                                <div className="d-flex justify-content-between align-items-center">
                                    <input
                                        ref={node}
                                        value={value}
                                        style={{ width: "300px" }}
                                        placeholder="请输入文件名称"
                                        onChange={(e) => { setValue(e.target.value) }}
                                        onClick={(e) => { e.stopPropagation(); }}
                                    />
                                    <button type="button" className="icon-button" onClick={(e) => { e.stopPropagation(); closeEdit(file) }}>
                                        <FontAwesomeIcon title="关闭" icon={faXmark} size="lg" />
                                    </button>
                                </div>
                                {isSameTitle &&
                                    <span style={{ color: "red", fontSize: "12px" }}>文件名重复</span>
                                }
                            </>
                        }
                    </li>
                ))
            }
        </ul>
    )
}

FileList.propType = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onSaveEdit: PropTypes.func,
    onFileDelete: PropTypes.func
}

export default FileList