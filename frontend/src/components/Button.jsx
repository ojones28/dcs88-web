import { NavLink } from "react-router";

export default function Button(props) {
    let className = "button"
    if (props.color) {
        className += " " + props.color;
    }
    return (
        props.href
        ? <NavLink className={className} to={props.href} end>{props.children}</NavLink>
        : <button className={className} onClick={props.onClick}>{props.children}</button>
    )
}