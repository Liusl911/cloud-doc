import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faEdit, faXmark } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from "prop-types"

const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState('')
    let node = useRef(null)

    const closeEdit = (e) => {
        e.preventDefault()
        setEditStatus(false)
        setValue('')
    }

    useEffect(() => {
        const handleInputEvent = (event) => {
            const { keyCode } = event
            if(keyCode === 13 && editStatus){
                const editItem = files.find(file => file.id === editStatus)
                onSaveEdit(editItem.id, value)
                setEditStatus(false)
                setValue('')
            }else if(keyCode === 27 && editStatus){
                closeEdit(event)
            }
        }
        document.addEventListener('keyup', handleInputEvent)
        return () => {
            document.removeEventListener('keyup', handleInputEvent)
        }
    })

    useEffect(() => {
        if(editStatus !== false){
            node.current.focus()
        }
    }, [editStatus])

    return (
        <ul className="list-group list-group-flush">
            {
                files.map(file => (
                    <li
                        className="list-group-item row bg-light d-flex align-item-center" 
                        key={file.id}
                    >
                        {   (file.id !== editStatus) &&
                            <>
                                <span className="col-2" onClick={() => {onFileClick(file.id)}}>
                                    <FontAwesomeIcon icon={faMarkdown} size="lg" />
                                </span>
                                <span className="col-8">{file.title}</span>
                                <button type="button" className="icon-button col-1" onClick={() => {setEditStatus(file.id); setValue(file.title)}}>
                                    <FontAwesomeIcon title="编辑" icon={faEdit} size="lg" />
                                </button>
                                <button type="button" className="icon-button col-1" onClick={() => {onFileDelete(file.id)}}>
                                    <FontAwesomeIcon title="删除" icon={faTrash} size="lg" />
                                </button>
                            </>
                        }
                        {   (file.id === editStatus) &&
                            <div className="d-flex justify-content-around align-items-center">
                                <input ref={node} value={value} onChange={(e) => {setValue(e.target.value)}} />
                                <button type="button" className="icon-button" onClick={closeEdit}>
                                    <FontAwesomeIcon title="关闭" icon={faXmark} size="lg" />
                                </button>
                            </div>
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