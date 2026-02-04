import { useEffect, useRef, useState } from "react";

export default function TextInput(props) {
    const [value, setValue] = useState(props.value || "");
    const [focused, setFocused] = useState(false);
    const [ cursorPos, setCursorPos ] = useState(0);
    const inputRef = useRef(null);
    const mirrorRef = useRef(null);
    const cursorRef = useRef(null);

    let className = "text-input"
    if (props.color) {
        className += " " + props.color;
    }

    useEffect(() => {
        if (mirrorRef.current && cursorRef.current && inputRef.current) {
            mirrorRef.current.textContent = (value || "").slice(0, inputRef.current.selectionEnd);
            const mirrorWidth = mirrorRef.current.getBoundingClientRect().width;
            const inputWidth = inputRef.current.clientWidth;
            const cursorWidth = cursorRef.current.getBoundingClientRect().width;
            const visibleSpace = inputWidth - cursorWidth;
            console.log(`cursor: ${inputRef.current.selectionEnd}`)
            console.log(`scroll: ${inputRef.current.scrollLeft}`)
            const cursorLeft = mirrorWidth - inputRef.current.scrollLeft;
            const clampedLeft = Math.max(0, cursorLeft);
            console.log(`visibile: ${visibleSpace}, mirror: ${mirrorWidth}, left: ${cursorLeft}`)
            cursorRef.current.style.left = `${clampedLeft}px`;
        }
    }, [value, focused, cursorPos]);

    return (
        <>
            <div className="text-input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={props.placeholder}
                    className={className}
                    value={value}
                    onChange={(e) => {
                        console.log("onChange");
                        setValue(e.target.value);
                    }}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onSelect={(e) => {
                        console.log("onSelect");
                        setCursorPos(e.target.selectionEnd);
                    }}/>
                <span ref={mirrorRef} className="text-input-mirror">{value || ""}</span>
                {focused && <span ref={cursorRef} className="fake-cursor">_</span>}
            </div>
        </>
    )
}