import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { MotionConfig } from 'motion/react'
import { FeedbackProvider } from './components/Feedback'
import { ErrorBoundary } from './components/Erros'
import { AuthProvider } from './context/Auth'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <FeedbackProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </FeedbackProvider>
        </AuthProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
