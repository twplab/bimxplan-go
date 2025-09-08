import React, { useState } from 'react'
import { SettingsModal } from './settings/SettingsModal'

// Simple, safe settings wrapper that won't break the app
export function SafeSettingsWrapper({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Create a simple context that components can use
  React.useEffect(() => {
    // Attach global settings opener to window for easy access
    const windowAny = window as typeof window & {
      openSettings?: () => void
    }
    
    windowAny.openSettings = () => setIsSettingsOpen(true)
    return () => {
      delete windowAny.openSettings
    }
  }, [])

  return (
    <>
      {children}
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
    </>
  )
}