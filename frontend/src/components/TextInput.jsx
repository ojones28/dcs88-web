import { useLayoutEffect, useRef, useState } from "react";

export default function TextInput(props) {
    const [value, setValue] = useState(props.value || "");
    const mirrorRef = useRef(null);
    const cursorRef = useRef(null);

    let className = "text-input"
    if (props.color) {
        className += " " + props.color;
    }

    useLayoutEffect(() => {
        if (mirrorRef.current && cursorRef.current) {
            const mirrorWidth = mirrorRef.current.getBoundingClientRect().width;
            cursorRef.current.style.left = `${mirrorWidth}px`;
        }
    }, [value]);

    return (
        <>
            <div className="text-input-wrapper">
                <input type="text" placeholder={props.placeholder} className={className} value={value} onChange={(e) => setValue(e.target.value)}></input>

                <span ref={mirrorRef} className="text-input-mirror">{value || props.placeholder || ""}</span>
                <span ref={cursorRef} className="fake-cursor">_</span>
            </div>
        </>
    )
}