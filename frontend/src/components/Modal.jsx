import { useState } from "react"

export default function Modal(props) {
    return (<>{props.open && (
        <div className="modal-backdrop">
            <div className="modal">
                {props.children}
            </div>
        </div>
    )}
    </>)
}