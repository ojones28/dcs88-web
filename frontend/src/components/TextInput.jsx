import { useLayoutEffect, useRef, useState } from "react";

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

    useLayoutEffect(() => {
        if (mirrorRef.current && cursorRef.current && inputRef.current) {
            const selEnd = cursorPos ?? inputRef.current.selectionEnd ?? 0;

            mirrorRef.current.textContent = (value || "").slice(0, selEnd);

            const cs = getComputedStyle(inputRef.current);
            const paddingRight = parseFloat(cs.paddingRight || "0");

            const mirrorWidth = mirrorRef.current.getBoundingClientRect().width;
            const inputWidth = inputRef.current.clientWidth;
            const cursorWidth = cursorRef.current.getBoundingClientRect().width;
            
            const cursorLeft = mirrorWidth - inputRef.current.scrollLeft;
            const clampedLeft = Math.max(0, Math.min(cursorLeft, inputWidth - cursorWidth + paddingRight));

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
                        setValue(e.target.value);
                        setCursorPos(e.target.selectionEnd);
                    }}
                    onFocus={() => {
                        setFocused(true);
                        if (inputRef.current) setCursorPos(inputRef.current.selectionEnd);
                    }}
                    onBlur={() => setFocused(false)}
                    onSelect={(e) => {
                        setCursorPos(e.target.selectionEnd);
                    }}
                    onScroll={() => {
                        if (inputRef.current) setCursorPos(inputRef.current.selectionEnd);
                    }}/>
                <span ref={mirrorRef} className="text-input-mirror">{value || ""}</span>
                {focused && <span key={cursorPos} ref={cursorRef} className="fake-cursor">_</span>}
            </div>
        </>
    )
}