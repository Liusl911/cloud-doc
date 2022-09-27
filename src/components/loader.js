import React from "react";
import './loader.scss'

const Loader = ({ text = '处理中' }) => (
    <div className="loading-component text-center">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{text}</span>
        </div>
        <h5 className="text-primary">{text}</h5>
    </div>
)

export default Loader