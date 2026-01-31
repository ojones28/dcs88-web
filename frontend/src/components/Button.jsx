export default function Button(props) {
    let className = "button"
    if (props.color) {
        className += " " + props.color;
    }
    return (
        props.href
        ? <a className={className} href={props.href}>{props.children}</a>
        : <button className={className} onClick={props.onClick}>{props.children}</button>
    )
}