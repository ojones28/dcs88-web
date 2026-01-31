export default function TextInput(props) {
    let className = "text"
    if (props.color) {
        className += " " + props.color;
    }
    return (<input type="text" placeholder={props.placeholder} className={className}>{props.children}</input>)
}