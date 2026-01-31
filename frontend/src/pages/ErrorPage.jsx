import { useRouteError } from "react-router";
import Navbar from "../components/Navbar";

export default function ErrorPage() {
    const error = useRouteError();
    console.error(error);

    return (
        <>
            <div className="error-container">
                <h1>FUCK, something went wrong.</h1>
                <p>{error.statusText || error.message}</p>
            </div>
        </>
    )
}