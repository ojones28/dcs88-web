import { useState } from "react"
import Button from "../../components/Button"
import TextInput from "../../components/TextInput"
import { useNavigate, useOutletContext, useRevalidator } from "react-router"

export default function LoginRegister(props) {
    const allowedSpecial = "_-/\\()+*"
    const allowedSetRegex = new RegExp(`^[a-z0-9${allowedSpecial.replace(/[-\\^]/g, "\\$&")}]+$`)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [usernameTouched, setUsernameTouched] = useState(false)
    const [passwordTouched, setPasswordTouched] = useState(false)
    const [submitError, setSubmitError] = useState(null)
    const revalidator = useRevalidator()
    const navigate = useNavigate()

    const usernameRules = [
        {
            key: "length",
            test: (u) => u.length >= 3 && u.length <= 16,
            message: "Must be between 3 and 16 characters."
        },
        {
            key: "chars",
            test: (u) => allowedSetRegex.test(u),
            message: `Only letters, numbers, and "${allowedSpecial}" are allowed. No spaces.`
        }
    ]

    const passwordRules = [
        {
            key: "length",
            test: (u) => u.length >= 8,
            message: "Must be 8 or more characters."
        },
        {
            key: "chars",
            test: (u) => allowedSetRegex.test(u),
            message: `Only letters, numbers, and "${allowedSpecial}" are allowed. No spaces.`
        }
    ]

    function validate(v, rules) {
        const value = (v || "").trim().toLowerCase()
        const failed = rules.filter(r => !r.test(value)).map(r => ({key: r.key, message: r.message}))
        return failed
    }

    function renderRuleStatus(touched, value, rules) {
        if (!touched) return null;
        const failed = validate(value, rules)
        if (failed.length <= 0) return null;
        return (
            <ul className="rules">
                {failed.map(rule => 
                    (<li className="rule" key={rule.key}>
                        <span>{rule.message}</span>
                    </li>)
                )}
            </ul>
        )
    }

    return (
        <form className="login-register" noValidate onSubmit={async (e) => {
            e.preventDefault()
            setSubmitError(null);

            const usernameFailed = validate(username, usernameRules)
            setUsernameTouched(true);
            const passwordFailed = validate(password, passwordRules)
            setPasswordTouched(true);


            if (usernameFailed.length > 0 || passwordFailed.length > 0) {
                return
            }

            try {
                const endpoint = props.mode == "login" ? "/api/login" : "/api/register"
                const resp = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({username: (username || "").trim().toLowerCase(), password})
                })
                const data = await resp.json()
                if (!resp.ok) {
                    setSubmitError(data.error || "Server error")
                    return
                }
                console.log(data.user)
                revalidator.revalidate()
                navigate("/profile")
            } catch (err) {
                console.error(err)
                setSubmitError("Network or server error")
            }
        }}>
            <TextInput
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim().toLowerCase())}
                onBlur={() => {
                    setUsernameTouched(true)
                }}
            />
            {renderRuleStatus(usernameTouched, username, usernameRules)}
            <TextInput
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value.trim().toLowerCase())}
                onBlur={() => {
                    setPasswordTouched(true)
                }}
            />
            {renderRuleStatus(passwordTouched, password, passwordRules)}
            {submitError && <div className="submit-error">{submitError}</div>}
            <Button>{props.mode == "login" ? "LOGIN" : "REGISTER"}</Button>
        </form>
    )
}