import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initializeAppearance } from './components/AppearanceControls'
import './index.css'

initializeAppearance()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
