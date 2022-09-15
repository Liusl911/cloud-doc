import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'
import PropTypes from "prop-types"
import useKeyPress from "../hooks/useKeyPress";
import useIpcRenderer from "../hooks/useIpcRenderer";

const FileSearch = ({ title, onFileSearch }) => {
    const [inputActive, setinputActive] = useState(false)
    const [value, setValue] = useState('')
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    // 关闭搜索
    const closeinput = () => {
        setValue('')
        setinputActive(false)
        onFileSearch('')
    }

    // 定义input节点，并通过useRef记住，使之不在反复渲染中丢失
    let node = useRef(null)

    useEffect(() => {
        if (enterPressed && inputActive) {
            onFileSearch(value)
        }
        if (escPressed && inputActive) {
            closeinput()
        }
        // const handleInputEvent = (event) => {
        //     const { keyCode } = event
        //     if(keyCode === 13 && inputActive){
        //         onFileSearch(value)
        //     }else if(keyCode === 27 && inputActive){
        //         closeinput(event)
        //     }
        // }
        // document.addEventListener('keyup', handleInputEvent)
        // return () => {
        //     document.removeEventListener('keyup', handleInputEvent)
        // }
    })

    useEffect(() => {
        if (inputActive) {
            node.current.focus()
        }
    }, [inputActive])

    useIpcRenderer({
        'search-file': () => { setinputActive(true) }
    })

    return (
        <div className="search-con alert alert-primary mb-0 d-flex justify-content-between align-items-center">
            {
                !inputActive &&
                <>
                    <span>{title}</span>
                    <button type="button" className="icon-button" onClick={() => { setinputActive(true) }}>
                        <FontAwesomeIcon title="搜索" icon={faMagnifyingGlass} size="lg" />
                    </button>
                </>
            }
            {
                inputActive &&
                <>
                    <input ref={node} value={value} onChange={(e) => { setValue(e.target.value) }} />
                    <button type="button" className="icon-button" onClick={() => { closeinput() }}>
                        <FontAwesomeIcon title="关闭" icon={faXmark} size="lg" />
                    </button>
                </>
            }
        </div>
    )
}

FileSearch.propTypes = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func.isRequired
}
FileSearch.defaultProps = {
    title: '我的云文档'
}

export default FileSearch