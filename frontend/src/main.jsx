import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import './index.css'
import Root from './pages/Root'
import Home from './pages/Home'
import News from './pages/News'
import NewsArticle from './components/NewsArticle'

const router = createBrowserRouter([
    {
        path: "/",
        Component: Root,
        children: [
            { index: true, Component: Home },
            { path: "news", Component: News }
        ]
    },
    {
        path: "/news",
        Component: News,
        children: [
            { index: true, Component: NewsArticle }
        ]
    }
])

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>,
)
