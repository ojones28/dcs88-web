import { NavLink } from "react-router";

export default function Button(props) {
    let className = "button noselect"
    if (props.color) {
        className += " " + props.color;
    }
    return (
        props.href
        ? <NavLink draggable="false" className={className} to={props.href} end>{props.children}</NavLink>
        : <button draggable="false" className={className} onClick={props.onClick}>{props.children}</button>
    )
}