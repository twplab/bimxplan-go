import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, X, Send, User, Bot } from "lucide-react"
import { useLocation } from 'react-router-dom'
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

// Component to render message content with markdown support
function MessageContent({ text }: { text: string }) {
  // Simple markdown parsing for basic formatting
  const formatText = (input: string) => {
    let formatted = input
    
    // Bold text **text** or __text__
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>')
    
    // Italic text *text* or _text_
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>')
    
    // Code blocks ```code```
    formatted = formatted.replace(/```(.*?)```/gs, '<pre className="bg-gray-100 p-2 rounded my-2 text-xs overflow-x-auto"><code>$1</code></pre>')
    
    // Inline code `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code className="bg-gray-100 px-1 rounded text-xs">$1</code>')
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>')
    
    // Numbered lists
    formatted = formatted.replace(/^\d+\.\s/gm, '<br>• ')
    
    // Bullet points
    formatted = formatted.replace(/^[\-\*]\s/gm, '<br>• ')
    
    return formatted
  }

  return (
    <div 
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: formatText(text) }}
    />
  )
}

// Full functional ChatBot with dragging and API integration
export function SimpleChatBot() {
  const [isVisible, setIsVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const location = useLocation()

  // Draggable functionality
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasUserPosition, setHasUserPosition] = useState(false)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, moved: false })

  // Inactivity timer
  const inactivityTimerRef = useRef<number | null>(null)
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }
  }, [])

  // Don't show on auth pages only - allow on dashboard, projects, landing page
  const restrictedPaths = ['/auth']
  const isRestricted = restrictedPaths.some(path => location.pathname.startsWith(path))
  
  // Debug logging
  console.log(`[ChatBot] Path: ${location.pathname}, Restricted: ${isRestricted}, Enabled: ${isEnabled}`)

  const resetToDefaultPosition = useCallback(() => {
    clearInactivityTimer()
    setHasUserPosition(false)
    try { 
      sessionStorage.removeItem('chatbot-position') 
    } catch {
      // Ignore storage errors
    }
  }, [clearInactivityTimer])

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer()
    inactivityTimerRef.current = window.setTimeout(() => {
      if (!isOpen) {
        resetToDefaultPosition()
      }
    }, 2000)
  }, [isOpen, clearInactivityTimer, resetToDefaultPosition])

  // Check if ChatBot is enabled from settings
  useEffect(() => {
    const checkEnabled = () => {
      try {
        const saved = localStorage.getItem('chatbot-enabled')
        const enabled = saved !== null ? JSON.parse(saved) : true
        console.log(`[ChatBot] Settings check - enabled: ${enabled}, current state: ${isEnabled}`)
        
        // Only update if the value actually changed
        if (enabled !== isEnabled) {
          setIsEnabled(enabled)
          console.log(`[ChatBot] State updated to: ${enabled}`)
        }
        
        // Force enable by default if not set
        if (saved === null) {
          localStorage.setItem('chatbot-enabled', JSON.stringify(true))
        }
      } catch {
        setIsEnabled(true)
        localStorage.setItem('chatbot-enabled', JSON.stringify(true))
      }
    }
    
    checkEnabled()
    
    // Listen for storage changes (when settings are updated from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatbot-enabled') {
        console.log('[ChatBot] Storage event received')
        checkEnabled()
      }
    }
    
    // Listen for custom events from the same window (for immediate updates)
    const handleCustomStorageChange = () => {
      console.log('[ChatBot] Custom storage event received')
      checkEnabled()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('chatbot-settings-changed', handleCustomStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('chatbot-settings-changed', handleCustomStorageChange)
    }
  }, [isEnabled])

  useEffect(() => {
    if (isRestricted || !isEnabled) {
      console.log(`[ChatBot] Hiding - restricted: ${isRestricted}, enabled: ${isEnabled}`)
      setIsVisible(false)
      setIsOpen(false)
      return
    }

    // If chatbot was just enabled, show immediately without delay
    if (isEnabled) {
      console.log(`[ChatBot] Showing immediately - enabled: ${isEnabled}`)
      setIsVisible(true)
      return
    }

    // Simple timeout to show the button on initial load
    const timer = setTimeout(() => {
      console.log(`[ChatBot] Showing after delay`)
      setIsVisible(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [location.pathname, isRestricted, isEnabled])

  // Immediate effect for enabled state changes
  useEffect(() => {
    console.log(`[ChatBot] Enabled state changed to: ${isEnabled}`)
    if (!isEnabled && !isRestricted) {
      // Hide immediately when disabled
      setIsVisible(false)
      setIsOpen(false)
    } else if (isEnabled && !isRestricted) {
      // Show immediately when enabled
      setIsVisible(true)
    }
  }, [isEnabled, isRestricted])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        text: "Hi! I'm BIM Manager Tsoi, your expert BIM consultant. I'm here to help you navigate BIM concepts, workflows, and best practices. How can I assist you today?",
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, messages.length])

  // Restore position from session storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('chatbot-position')
      if (saved) {
        const p = JSON.parse(saved)
        if (typeof p?.x === 'number' && typeof p?.y === 'number') {
          setPosition(p)
          setHasUserPosition(true)
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch("https://agent.kith.build/prompt/131a6e97-bf6f-4b23-8886-961e4a1c1c55", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-3b_8o8TQqdkE9j6PIpOhTKBTGm152H91E7EI2juDqHU",
        },
        body: JSON.stringify({
          agent_uuid: "df6fc674-7e44-49bd-9829-d6554e069c9e",
          variables: {
            user_input: inputValue,
          },
          session_id: "bimxplan-session-" + Date.now(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.error || "Failed to get response")
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble connecting right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Dragging helpers
  const getBounds = () => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const rect = containerRef.current?.getBoundingClientRect()
    const w = rect?.width ?? 56
    const h = rect?.height ?? 56
    const margin = vw < 640 ? 12 : 16
    return { minX: margin, minY: margin, maxX: vw - w - margin, maxY: vh - h - margin, w, h }
  }

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max)

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return
    clearInactivityTimer()
    const rect = containerRef.current.getBoundingClientRect()
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      moved: false,
    }

    const onMove = (ev: PointerEvent) => {
      const bounds = getBounds()
      let x = ev.clientX - dragRef.current.offsetX
      let y = ev.clientY - dragRef.current.offsetY
      x = clamp(x, bounds.minX, bounds.maxX)
      y = clamp(y, bounds.minY, bounds.maxY)
      dragRef.current.moved = true
      setHasUserPosition(true)
      setPosition({ x, y })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      setPosition(prev => {
        const newPos = { x: prev.x, y: prev.y }
        try { 
          sessionStorage.setItem('chatbot-position', JSON.stringify(newPos)) 
        } catch {
          // Ignore storage errors
        }
        return newPos
      })
      startInactivityTimer()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, { once: true })
    e.preventDefault()
  }

  const openChat = () => {
    resetToDefaultPosition()
    setIsOpen(true)
  }

  // Keep widget inside viewport on resize
  useEffect(() => {
    if (!hasUserPosition) return
    const onResize = () => {
      const bounds = getBounds()
      setPosition(p => ({
        x: clamp(p.x, bounds.minX, bounds.maxX),
        y: clamp(p.y, bounds.minY, bounds.maxY),
      }))
    }
    window.addEventListener('resize', onResize)
    onResize()
    return () => window.removeEventListener('resize', onResize)
  }, [hasUserPosition])

  // Auto-return to default after 2s of inactivity
  useEffect(() => {
    if (isOpen) {
      clearInactivityTimer()
      return
    }
    if (hasUserPosition) {
      startInactivityTimer()
    }
    return () => {
      clearInactivityTimer()
    }
  }, [isOpen, hasUserPosition, startInactivityTimer, clearInactivityTimer])

  if (!isVisible || isRestricted || !isEnabled) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed z-50 pointer-events-none touch-none select-none transition-all duration-300 ease-out",
        !hasUserPosition && "right-4 sm:right-6 bottom-4 sm:bottom-6"
      )}
      style={
        hasUserPosition
          ? { left: position.x, top: position.y }
          : undefined
      }
    >
      {!isOpen && (
        <Button
          aria-label="Open chat"
          title="BIM Manager Tsoi – Chat"
          onClick={openChat}
          onPointerDown={handlePointerDown}
          variant="ghost"
          size="icon"
          className="pointer-events-auto rounded-full h-14 w-14 sm:h-16 sm:w-16 p-0 overflow-hidden bg-transparent hover:bg-transparent shadow-[0_6px_16px_rgba(0,0,0,0.18)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.24)]"
        >
          <img
            src="/lovable-uploads/b412b245-ab6f-4b93-b00b-363116ccd576.png?v=1"
            alt="BIM Manager Tsoi – Chat"
            className="h-full w-full object-cover object-center block"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/lovable-uploads/39105823-4207-45ad-b096-398f33e2a00f.png?v=2'
            }}
          />
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 sm:w-96 h-[480px] sm:h-[500px] shadow-2xl pointer-events-auto">
          <CardHeader 
            onPointerDown={handlePointerDown} 
            onDoubleClick={() => setIsOpen(false)} 
            className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-primary-foreground rounded-t-lg cursor-move"
          >
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-background ring-1 ring-border overflow-hidden">
                <img
                  src="/lovable-uploads/c46bcbd0-d86e-45fe-8da4-778681c85f31.png?v=2"
                  alt="BIM Manager Tsoi avatar"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/lovable-uploads/39105823-4207-45ad-b096-398f33e2a00f.png?v=2'
                  }}
                />
              </div>
              <div>
                <h3 className="font-semibold">BIM Manager Tsoi</h3>
                <p className="text-xs opacity-90">Expert BIM Consultant</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-0 flex flex-col h-[400px]">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.sender === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.sender === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <MessageContent text={message.text} />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about BIM workflows, standards..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}