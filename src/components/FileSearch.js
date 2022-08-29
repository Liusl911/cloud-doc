import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons'
import PropTypes from "prop-types"

const FileSearch = ({ title, onFileSearch }) => {
    const [inputActive, setinputActive] = useState(false)
    const [value, setValue] = useState('')

    // 关闭搜索
    const closeinput = (e) => {
        e.preventDefault()
        setValue('')
        setinputActive(false)
    }

    // 定义input节点，并通过useRef记住，使之不在反复渲染中丢失
    let node = useRef(null)

    useEffect(() => {
        const handleInputEvent = (event) => {
            const { keyCode } = event
            if(keyCode === 13 && inputActive){
                onFileSearch(value)
            }else if(keyCode === 27 && inputActive){
                closeinput(event)
            }
        }
        document.addEventListener('keyup', handleInputEvent)
        return () => {
            document.removeEventListener('keyup', handleInputEvent)
        }
    })

    useEffect(() => {
        if(inputActive){
            node.current.focus()
        }
    }, [inputActive])

    return (
        <div className="alert alert-primary d-flex justify-content-around align-items-center">
            {
                !inputActive && 
                <>
                    <span>{title}</span>
                    <button type="button" className="icon-button" onClick={() => {setinputActive(true)}}>
                        <FontAwesomeIcon title="搜索" icon={faMagnifyingGlass} size="lg" />
                    </button>
                </>
            }
            {
                inputActive &&
                <>
                    <input ref={node} value={value} onChange={(e) => {setValue(e.target.value)}} />
                    <button type="button" className="icon-button" onClick={closeinput}>
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