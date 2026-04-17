import { Outlet, useLoaderData } from "react-router"
import Navbar from "../components/Navbar"
import { useEffect, useState } from "react"

export async function loader() {
    try {
        const resp = await fetch("/api/me", {
            credentials: "include",
        })

        if (!resp.ok) {
            return { user: null }
        }

        const data = await resp.json()

        return {
            user: data.user
        }
    } catch (err) {
        return { user: null }
    }
}

export default function Root(props) {
    const { user } = useLoaderData()

    return (
        <>
            <Navbar user={user}/>
            <main>
                <Outlet context={{user}}/>
            </main>
        </>
    )
}