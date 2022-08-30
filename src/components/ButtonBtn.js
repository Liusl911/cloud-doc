import React from "react";
import PropTypes from "prop-types"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


const ButtonBtn = ({ text, colorClass, icon, onBtnClick }) => {
    return (
        <button
            type="button"
            className={`btn border-0 ${colorClass}`}
            onClick={onBtnClick}
        >
            <FontAwesomeIcon
                className="me-2"
                icon={icon} 
                size="lg" 
            />
            {text}
        </button>
    )
}

ButtonBtn.propTypes = {
    text: PropTypes.string,
    colorClass: PropTypes.string,
    icon: PropTypes.object.isRequired,
    onBtnClick: PropTypes.func
}

export default ButtonBtn;