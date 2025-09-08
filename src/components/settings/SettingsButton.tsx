import React from 'react'
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { useSettings } from '@/hooks/useSettings'

interface SettingsButtonProps {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function SettingsButton({ 
  variant = "ghost", 
  size = "sm", 
  className,
  showText = false 
}: SettingsButtonProps) {
  const { openSettings } = useSettings()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={openSettings}
      className={className}
      title="Application Settings"
    >
      <Settings className="h-4 w-4" />
      {showText && <span className="ml-2">Settings</span>}
    </Button>
  )
}