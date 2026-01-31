import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import './index.css'
import Root from './pages/Root'
import Home from './pages/Home'
import News from './pages/News'
import Profile from './pages/Profile'
import LoginRegister from './pages/profile/LoginRegister'

const router = createBrowserRouter([
    {
        path: "/",
        Component: Root,
        children: [
            { index: true, Component: Home },
            { path: "news", Component: News },
            { path: "profile", children: [
                { index: true, Component: Profile },
                { path: "login", Component: () => <LoginRegister mode="login" /> },
                { path: "register", Component: () => <LoginRegister mode="register" /> },
            ] },
        ]
    }
])

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
