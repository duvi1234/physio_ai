import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/ErrorBoundary'

const root = createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
          <App />
          <Toaster position="top-right" />
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)
