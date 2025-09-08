import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ChatBotErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ChatBot Error Boundary caught an error:', error, errorInfo)
    
    // Log to external service if needed
    // You can add error reporting here
  }

  public render() {
    if (this.state.hasError) {
      // Render fallback UI or nothing to prevent breaking the app
      return this.props.fallback || null
    }

    return this.props.children
  }

  // Method to reset the error boundary
  public resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }
}

// Hook version for functional components
export const useChatBotErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('ChatBot Error:', error)
    setError(error)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, resetError }
}