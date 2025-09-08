import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { 
  MessageCircle, 
  Palette, 
  Bell, 
  Shield, 
  Database, 
  Info,
  RotateCw,
  Check,
  X
} from "lucide-react"
import { useChatBotControl } from '../SafeChatBot'
import { useTheme } from "@/components/ThemeProvider"
import { useToast } from "@/hooks/use-toast"

export function GeneralSettings() {
  const { enabled: chatBotEnabled, enableChatBot, disableChatBot } = useChatBotControl()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      return localStorage.getItem('notifications-enabled') !== 'false'
    } catch {
      return true
    }
  })

  const handleChatBotToggle = (enabled: boolean) => {
    if (enabled) {
      enableChatBot()
      toast({
        title: "ChatBot Enabled",
        description: "BIM Manager Tsoi will appear on supported pages.",
      })
    } else {
      disableChatBot()
      toast({
        title: "ChatBot Disabled",
        description: "BIM Manager Tsoi has been hidden.",
      })
    }
    
    // Dispatch custom event for immediate updates in the same window
    window.dispatchEvent(new CustomEvent('chatbot-settings-changed'))
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme} theme.`,
    })
  }

  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled)
    try {
      localStorage.setItem('notifications-enabled', enabled.toString())
    } catch (error) {
      console.warn('Could not save notification preference:', error)
    }
    toast({
      title: enabled ? "Notifications Enabled" : "Notifications Disabled",
      description: enabled ? "You'll receive app notifications." : "App notifications are disabled.",
    })
  }

  const clearAllData = () => {
    try {
      // Clear all temporary projects
      const keys = Object.keys(localStorage).filter(key => key.startsWith('temp_project_'))
      keys.forEach(key => localStorage.removeItem(key))
      
      // Clear other app data but keep user preferences
      sessionStorage.removeItem('chatbot-position')
      
      toast({
        title: "Temporary Data Cleared",
        description: "All temporary projects and session data have been cleared.",
      })
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Could not clear some data. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* ChatBot Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>BIM Manager Tsoi ChatBot</CardTitle>
            <Badge variant={chatBotEnabled ? "default" : "secondary"}>
              {chatBotEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <CardDescription>
            Configure the AI-powered BIM consultant that helps with workflows and best practices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Enable ChatBot</Label>
              <div className="text-sm text-muted-foreground">
                Show BIM Manager Tsoi on supported pages
              </div>
            </div>
            <Switch
              checked={chatBotEnabled}
              onCheckedChange={handleChatBotToggle}
            />
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Availability:</strong> Landing page (1s), Dashboard (1.5s), Project pages (2s)</p>
            <p><strong>Restricted:</strong> Auth pages and BEP forms (for stability)</p>
            <p><strong>Features:</strong> Draggable positioning, expert BIM guidance, session memory</p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>
            Customize the visual appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Theme</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Control when and how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">App Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications for project updates and system messages
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Database & Storage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Data & Storage</CardTitle>
          </div>
          <CardDescription>
            Manage your local data and temporary projects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Clear Temporary Data</Label>
              <div className="text-sm text-muted-foreground">
                Remove all temporary projects and cached session data
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={clearAllData}>
              <RotateCw className="h-4 w-4 mr-2" />
              Clear Data
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label className="text-base font-medium">Database Status</Label>
            <div className="text-sm text-muted-foreground">
              <p>Temporary projects are stored locally until database setup is complete.</p>
              <p className="flex items-center gap-2 mt-1">
                <Info className="h-4 w-4" />
                See DATABASE_FIX.md for permanent storage setup
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacy & Security</CardTitle>
          </div>
          <CardDescription>
            Information about data handling and security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            All project data is stored locally until you choose to save permanently
          </p>
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            ChatBot conversations are not permanently stored
          </p>
          <p className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            User preferences are saved in browser local storage
          </p>
          <p className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            Database access requires proper RLS policy configuration
          </p>
        </CardContent>
      </Card>
    </div>
  )
}