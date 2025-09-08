import React, { Suspense, lazy, useState, useEffect } from 'react'
import { ChatBotErrorBoundary } from './ChatBotErrorBoundary'
import { useLocation } from 'react-router-dom'

// Lazy load the ChatBot component
const ChatBot = lazy(() => 
  import('./ChatBot').then(module => ({ default: module.ChatBot }))
)

interface SafeChatBotProps {
  enabled?: boolean
  className?: string
}

export function SafeChatBot({ enabled = true, className }: SafeChatBotProps) {
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const location = useLocation()

  // Don't load ChatBot on certain pages to avoid conflicts
  const restrictedPaths = ['/auth', '/bep-form']
  const isRestrictedPath = restrictedPaths.some(path => location.pathname.startsWith(path))

  // Priority loading - faster on landing page, slower on complex pages
  const isLandingPage = location.pathname === '/'
  const isDashboard = location.pathname === '/dashboard'
  
  // Initialize ChatBot with different delays based on page complexity
  useEffect(() => {
    if (!enabled || isRestrictedPath) return

    let delay = 2000 // Default 2 seconds
    
    if (isLandingPage) {
      delay = 1000 // Faster on landing page (1 second)
    } else if (isDashboard) {
      delay = 1500 // Medium delay on dashboard (1.5 seconds)
    }

    console.log(`[SafeChatBot] Loading in ${delay}ms on ${location.pathname}`)

    const timer = setTimeout(() => {
      console.log(`[SafeChatBot] Ready on ${location.pathname}`)
      setIsReady(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [enabled, isRestrictedPath, isLandingPage, isDashboard, location.pathname])

  // Reset error state when navigating to different pages
  useEffect(() => {
    setHasError(false)
  }, [location.pathname])

  // Don't render anything on restricted paths or if disabled
  if (!enabled || isRestrictedPath || hasError) {
    return null
  }

  // Show preview on landing page while loading
  if (!isReady && isLandingPage) {
    return <ChatBotPreview />
  }

  // Don't render if not ready and not on landing page
  if (!isReady) {
    return null
  }

  const fallbackUI = (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Minimal fallback - could show a simple button or nothing */}
    </div>
  )

  const LoadingSpinner = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )

  // Show a preview indicator while ChatBot is initializing (only on landing page)
  const ChatBotPreview = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-14 h-14 bg-primary/20 border-2 border-primary/50 rounded-full flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 bg-primary/40 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-primary rounded-full"></div>
        </div>
      </div>
    </div>
  )

  return (
    <ChatBotErrorBoundary 
      fallback={fallbackUI}
    >
      <Suspense fallback={<LoadingSpinner />}>
        <ChatBot className={className} />
      </Suspense>
    </ChatBotErrorBoundary>
  )
}

// Hook to control ChatBot from anywhere in the app
export const useChatBotControl = () => {
  const [enabled, setEnabled] = useState(() => {
    // Check localStorage for user preference
    try {
      const stored = localStorage.getItem('chatbot-enabled')
      return stored !== null ? JSON.parse(stored) : true
    } catch {
      return true
    }
  })

  const enableChatBot = () => {
    setEnabled(true)
    try {
      localStorage.setItem('chatbot-enabled', 'true')
      // Dispatch custom event for immediate updates
      window.dispatchEvent(new CustomEvent('chatbot-settings-changed'))
    } catch (error) {
      console.warn('Could not save ChatBot preference:', error)
    }
  }

  const disableChatBot = () => {
    setEnabled(false)
    try {
      localStorage.setItem('chatbot-enabled', 'false')
      // Dispatch custom event for immediate updates
      window.dispatchEvent(new CustomEvent('chatbot-settings-changed'))
    } catch (error) {
      console.warn('Could not save ChatBot preference:', error)
    }
  }

  const toggleChatBot = () => {
    if (enabled) {
      disableChatBot()
    } else {
      enableChatBot()
    }
  }

  return {
    enabled,
    enableChatBot,
    disableChatBot,
    toggleChatBot
  }
}