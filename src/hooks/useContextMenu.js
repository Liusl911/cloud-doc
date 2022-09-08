import { useEffect, useRef } from "react";

// node.js modules
const remote = window.require('@electron/remote');
const { Menu, MenuItem } = remote;

const useContextMenu = (itemMenuArr, targetSelector, deps) => {
    let targetElement = useRef(null)
    useEffect(() => {
        const menu = new Menu()
        itemMenuArr.forEach(item => {
            menu.append(new MenuItem(item))
        });
        const handleContextMenu = (e) => {
            if (document.querySelector(targetSelector).contains(e.target)) {
                targetElement.current = e.target
                menu.popup({ window: remote.getCurrentWindow() })
            }
        }
        window.addEventListener('contextmenu', handleContextMenu)
        return (() => {
            window.removeEventListener('contextmenu', handleContextMenu)
        })
    }, deps)
    return targetElement
}

export default useContextMenu