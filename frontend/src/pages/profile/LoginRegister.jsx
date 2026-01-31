import Button from "../../components/Button";
import TextInput from "../../components/TextInput";

export default function LoginRegister(props) {
    return (
        <div className="login-register">
            <TextInput placeholder="USERNAME" />
            <TextInput placeholder="PASSWORD" />
            <Button>{props.mode == "login" ? "LOGIN" : "REGISTER"}</Button>
        </div>
    )
}