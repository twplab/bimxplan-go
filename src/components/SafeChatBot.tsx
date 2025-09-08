import React, { Suspense, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ChatBotErrorBoundary } from './ChatBotErrorBoundary'
import { ChatBot } from './ChatBot'

interface SafeChatBotProps {
  className?: string
}

export const SafeChatBot = ({ className }: SafeChatBotProps) => {
  const [enabled, setEnabled] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const location = useLocation()

  // Define if we're on landing page
  const isLandingPage = location.pathname === '/'

  // Paths where ChatBot should be disabled
  const restrictedPaths = ['/auth', '/terms', '/about', '/contact']
  const isRestrictedPath = restrictedPaths.includes(location.pathname)

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('chatbot-enabled')
        setEnabled(stored !== null ? JSON.parse(stored) : true)
      } catch {
        setEnabled(true)
      }
    }

    const handleCustomEvent = () => {
      handleStorageChange()
    }

    // Listen for both storage events and custom events
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('chatbot-settings-changed', handleCustomEvent)
    
    // Initialize
    handleStorageChange()

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('chatbot-settings-changed', handleCustomEvent)
    }
  }, [])

  // ChatBot readiness check with timeout
  useEffect(() => {
    if (!enabled || isRestrictedPath) {
      setIsReady(false)
      return
    }

    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100) // Small delay to ensure other components are ready

    return () => clearTimeout(timer)
  }, [enabled, isRestrictedPath])

  // Define components first before using them
  const ChatBotPreview = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-14 h-14 bg-primary/20 border-2 border-primary/50 rounded-full flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 bg-primary/40 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-primary rounded-full"></div>
        </div>
      </div>
    </div>
  )

  const LoadingSpinner = () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  )

  const fallbackUI = (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-14 h-14 bg-destructive rounded-full flex items-center justify-center shadow-lg opacity-50">
        <span className="text-white text-xs">!</span>
      </div>
    </div>
  )

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