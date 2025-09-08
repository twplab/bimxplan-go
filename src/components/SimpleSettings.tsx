import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { MessageCircle, Palette, RotateCw } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { useToast } from "@/hooks/use-toast"

// Simple settings that won't break anything
export function SimpleSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatBotEnabled, setChatBotEnabled] = useState(true)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Load ChatBot preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chatbot-enabled')
      if (saved !== null) {
        setChatBotEnabled(JSON.parse(saved))
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  // Attach to window for global access
  React.useEffect(() => {
    const windowAny = window as typeof window & {
      openSettings?: () => void
      getChatBotEnabled?: () => boolean
    }
    
    windowAny.openSettings = () => setIsOpen(true)
    windowAny.getChatBotEnabled = () => chatBotEnabled
    
    return () => {
      delete windowAny.openSettings
      delete windowAny.getChatBotEnabled
    }
  }, [chatBotEnabled])

  const handleChatBotToggle = (enabled: boolean) => {
    setChatBotEnabled(enabled)
    try {
      localStorage.setItem('chatbot-enabled', JSON.stringify(enabled))
    } catch {
      // Ignore storage errors
    }
    
    toast({
      title: enabled ? "ChatBot Enabled" : "ChatBot Disabled",
      description: enabled 
        ? "ChatBot will now appear on supported pages."
        : "ChatBot has been hidden from all pages.",
    })
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme} theme.`,
    })
  }

  const clearData = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('temp_project_'))
      keys.forEach(key => localStorage.removeItem(key))
      sessionStorage.clear()
      
      toast({
        title: "Data Cleared",
        description: "Temporary data has been cleared.",
      })
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Could not clear data.",
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Basic application preferences and controls
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* ChatBot Control */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <CardTitle className="text-sm">ChatBot Assistant</CardTitle>
                <Badge variant={chatBotEnabled ? "default" : "secondary"}>
                  {chatBotEnabled ? "Active" : "Disabled"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>BIM Manager Tsoi AI Assistant</p>
                  <p className="text-xs">Get expert BIM guidance and support</p>
                </div>
                <Switch
                  checked={chatBotEnabled}
                  onCheckedChange={handleChatBotToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <CardTitle className="text-sm">Theme</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleThemeChange('light')}
                >
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleThemeChange('dark')}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleThemeChange('system')}
                >
                  System
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Data Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={clearData} className="w-full">
                <RotateCw className="h-4 w-4 mr-2" />
                Clear Temporary Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}