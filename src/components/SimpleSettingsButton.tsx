import React from 'react'
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

interface SimpleSettingsButtonProps {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function SimpleSettingsButton({ 
  variant = "ghost", 
  size = "sm", 
  className,
  showText = false 
}: SimpleSettingsButtonProps) {
  const handleClick = () => {
    // Use the global window function if available
    const windowAny = window as typeof window & {
      openSettings?: () => void
    }
    
    if (windowAny.openSettings) {
      windowAny.openSettings()
    } else {
      console.log('Settings not available yet')
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      title="Application Settings"
    >
      <Settings className="h-4 w-4" />
      {showText && <span className="ml-2">Settings</span>}
    </Button>
  )
}