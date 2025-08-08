import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  className?: string;
}

export function ChatBot({ className }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hi! I'm BIM Manager Tsoi, your expert BIM consultant. I'm here to help you navigate BIM concepts, workflows, and best practices. How can I assist you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Dynamic safe-zone offset to avoid overlapping critical UI
  const [bottomOffset, setBottomOffset] = useState<number>(24);

  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const base = vw < 640 ? 20 : 24;
      const reserved = 96; // approximate footprint of the widget
      const areaTop = vh - base - reserved;

      const selectors = [
        '[data-safe-zone]',
        '[data-fixed-bottom]',
        'footer',
        '.fixed',
        '.sticky',
        'nav[aria-label*="pagination" i]',
        'div[class*="bottom-0"]',
        'div[class*="bottom-2"]',
        'div[class*="bottom-4"]',
        'div[class*="bottom-6"]',
        'div[class*="bottom-8"]',
        'button[data-next]',
        'a[data-next]',
      ].join(',');

      const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors));
      let increase = 0;
      for (const el of nodes) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        if (rect.top > vh - 160 && rect.left < vw && rect.right > vw - 220) {
          const overlapY = (areaTop + reserved) - rect.top;
          if (overlapY > 0) {
            increase = Math.max(increase, overlapY + 16);
          }
        }
      }
      setBottomOffset(base + increase);
    };

    const ro = new ResizeObserver(() => compute());
    ro.observe(document.body);

    window.addEventListener('resize', compute);
    window.addEventListener('scroll', compute, true);
    compute();
    const interval = setInterval(compute, 600);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', compute, true);
      clearInterval(interval);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://acla-agent-runner.fly.dev/prompt/uuid/BIM Consultation Chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": "Bearer sk-3b_8o8TQqdkE9j6PIpOhTKBTGm152H91E7EI2juDqHU",
        },
        body: JSON.stringify({
          agent_uuid: "df6fc674-7e44-49bd-9829-d6554e069c9e",
          variables: {
            user_input: input,
          },
          session_id: "bimxplan-session-" + Date.now(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again later.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={cn("fixed right-4 sm:right-6 z-50 pointer-events-none", className)}
      style={{ bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))` }}
    >
      {!isOpen && (
        <Button
          aria-label="Open BIM Manager Tsoi chatbot"
          onClick={() => setIsOpen(true)}
          size="lg"
          className="pointer-events-auto rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
        >
          <img
            src="/lovable-uploads/92905722-5a2b-4049-a247-98ef8dd82753.png"
            alt="BIM Manager Tsoi chatbot icon"
            className="h-8 w-8 rounded-full object-cover"
            loading="lazy"
          />
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 sm:w-96 h-[480px] sm:h-[500px] shadow-2xl pointer-events-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center space-x-2">
              <img
                src="/lovable-uploads/92905722-5a2b-4049-a247-98ef8dd82753.png"
                alt="BIM Manager Tsoi avatar"
                className="h-8 w-8 rounded-full object-cover"
                loading="lazy"
              />
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
                      message.isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about BIM workflows, standards..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
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
  );
}