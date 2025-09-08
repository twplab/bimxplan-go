import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, MessageCircleOff, RotateCw } from "lucide-react"
import { useChatBotControl } from './SafeChatBot'

export function ChatBotControl() {
  const { enabled, enableChatBot, disableChatBot, toggleChatBot } = useChatBotControl()

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            ChatBot Control
          </CardTitle>
          <Badge variant={enabled ? "default" : "secondary"}>
            {enabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <CardDescription>
          Control the BIM Manager Tsoi ChatBot visibility and functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={enableChatBot}
            disabled={enabled}
            variant={enabled ? "secondary" : "default"}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Enable
          </Button>
          <Button
            onClick={disableChatBot}
            disabled={!enabled}
            variant={!enabled ? "secondary" : "outline"}
            className="flex-1"
          >
            <MessageCircleOff className="h-4 w-4 mr-2" />
            Disable
          </Button>
        </div>
        
        <Button
          onClick={toggleChatBot}
          variant="outline"
          className="w-full"
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Toggle ChatBot
        </Button>

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Status:</strong> {enabled ? "ChatBot will appear after 2 seconds on most pages" : "ChatBot is hidden"}</p>
          <p><strong>Restricted Pages:</strong> Auth pages and BEP form (for stability)</p>
          <p><strong>Error Handling:</strong> Safe loading with error boundaries</p>
        </div>
      </CardContent>
    </Card>
  )
}