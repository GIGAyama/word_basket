import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// 自己ホストした Zen Maru Gothic。生成物なので直接編集しない
// （作り直すには node tools/fonts/build-fonts.mjs）。
// index.html から Google Fonts を読むのをやめた代わりがこれ。
import './fonts.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
