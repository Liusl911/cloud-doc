import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import './TabList.scss'

const TabList = ({ files, activeId, unSaveId, onTabClick, onTabClose }) => {
    return (
        <ul className="nav nav-pills nav-fill tab-conponent">
            {
                files.map(file => {
                    const withUnSavedMark = unSaveId.includes(file.id)
                    const tabClassName = classNames({
                        "nav-link": true,
                        "active": file.id === activeId,
                        "with-unsaved": withUnSavedMark
                    })
                    return (
                        <li className="nav-item" key={file.id}>
                            <a 
                                href="#"
                                className={tabClassName} 
                                aria-current="page"
                                onClick={(e) => {e.preventDefault(); onTabClick(file.id)}}
                            >
                                {file.title}
                                <span className="ms-2 close-icon" onClick={(e) => {e.stopPropagation(); onTabClose(file.id)}}>
                                    <FontAwesomeIcon
                                        title="关闭" 
                                        icon={faXmark}
                                    />
                                </span>
                                {   withUnSavedMark &&
                                    <span className="ms-2 rounded-circle unsaved-item"></span>
                                }
                            </a>
                        </li>
                    )
                })
            }
        </ul>
        
    )
}

TabList.propTypes = {
    files: PropTypes.array,
    activeId: PropTypes.string,
    unSaveId: PropTypes.array,
    onTabClick: PropTypes.func,
    onTabClose: PropTypes.func
}
TabList.defaultProps = {
    unSaveId: []
}

export default TabList;