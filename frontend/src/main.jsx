import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, Navigate } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import './index.css'
import Root, { loader as rootLoader } from './pages/Root'
import Home from './pages/Home'
import News from './pages/News'
import Profile, { loader as profileLoader } from './pages/Profile'
import LoginRegister from './pages/profile/LoginRegister'
import ErrorPage from './pages/ErrorPage'
import Shop, { loader as shopLoader } from './pages/Shop'
import Cart, { loader as cartLoader } from './pages/shop/Cart'
import Storage, { loader as storageLoader } from './pages/Storage'

const router = createBrowserRouter([
    {
        path: "/",
        Component: Root,
        loader: rootLoader,
        ErrorBoundary: ErrorPage,
        children: [
            { index: true, Component: Home },
            { path: "info", children: [
                { index: true, element: <Navigate to="/" replace />},
                { path: "news", Component: News }
            ]},
            { path: "shop", children: [
                { index: true, Component: Shop, loader: shopLoader },
                { path: "cart", Component: Cart, loader: cartLoader }
            ]},
            { path: "arms", Component: Storage, loader: storageLoader },
            { path: "profile", children: [
                { index: true, Component: Profile, loader: profileLoader },
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
