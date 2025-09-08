import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
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
  // Draggable positioning state
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasUserPosition, setHasUserPosition] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, moved: false });

  // Inactivity timer to auto-reset position
  const inactivityTimerRef = useRef<number | null>(null);
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // Reset to default bottom-right location and clear persisted position
  const resetToDefaultPosition = useCallback(() => {
    clearInactivityTimer();
    setHasUserPosition(false);
    try { sessionStorage.removeItem('chatbot-position'); } catch {
      // Ignore storage errors
    }
  }, [clearInactivityTimer]);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = window.setTimeout(() => {
      if (!isOpen) {
        resetToDefaultPosition();
      }
    }, 2000);
  }, [isOpen, clearInactivityTimer, resetToDefaultPosition]);

  // Restore last position from session storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('chatbot-position');
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p?.x === 'number' && typeof p?.y === 'number') {
          setPosition(p);
          setHasUserPosition(true);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Open chat and snap back to default location
  const openChat = () => {
    resetToDefaultPosition();
    setIsOpen(true);
  };


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
      const response = await fetch("https://agent.kith.build/prompt/131a6e97-bf6f-4b23-8886-961e4a1c1c55", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-3b_8o8TQqdkE9j6PIpOhTKBTGm152H91E7EI2juDqHU",
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

  // Dragging helpers and behavior
  const getBounds = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width ?? 56;
    const h = rect?.height ?? 56;
    const margin = vw < 640 ? 12 : 16; // minimal padding from edges
    return { minX: margin, minY: margin, maxX: vw - w - margin, maxY: vh - h - margin, w, h };
  };

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const avoidOverlaps = (x: number, y: number) => {
    const selectors = [
      '[data-safe-zone]',
      '[data-fixed-bottom]',
      'header',
      'footer',
      'nav',
      '[aria-label*="navigation" i]',
      'nav[aria-label*="pagination" i]',
      '.fixed',
      '.sticky',
      'button',
      'a',
      '[role="button"]',
      'input',
      'textarea',
      'select',
      '[data-interactive]',
      'div[class*="bottom-0"]',
      'div[class*="bottom-2"]',
      'div[class*="bottom-4"]',
      'div[class*="bottom-6"]',
      'div[class*="bottom-8"]',
      '[class*="btn"]',
      '[class*="button"]',
      '[class*="cta"]',
    ].join(',');
    const bounds = getBounds();
    let rect = { left: x, top: y, right: x + bounds.w, bottom: y + bounds.h };
    let pos = { x, y };
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selectors));
    let iterations = 0;
    const intersects = (r: DOMRect | {left:number;top:number;right:number;bottom:number}) =>
      !(rect.right < r.left || rect.left > r.right || rect.bottom < r.top || rect.top > r.bottom);

    while (iterations < 4) {
      let moved = false;
      for (const el of nodes) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (intersects(r)) {
          const moveLeft = rect.right - r.left + 12;
          const moveRight = r.right - rect.left + 12;
          const moveUp = rect.bottom - r.top + 12;
          const moveDown = r.bottom - rect.top + 12;

          const options = [
            { x: pos.x - moveLeft, y: pos.y, d: moveLeft },
            { x: pos.x + moveRight, y: pos.y, d: moveRight },
            { x: pos.x, y: pos.y - moveUp, d: moveUp },
            { x: pos.x, y: pos.y + moveDown, d: moveDown },
          ].map(o => ({
            x: clamp(o.x, bounds.minX, bounds.maxX),
            y: clamp(o.y, bounds.minY, bounds.maxY),
            d: o.d,
          }));

          options.sort((a, b) => a.d - b.d);
          const best = options[0];
          pos = { x: best.x, y: best.y };
          rect = { left: pos.x, top: pos.y, right: pos.x + bounds.w, bottom: pos.y + bounds.h };
          moved = true;
          break;
        }
      }
      if (!moved) break;
      iterations++;
    }
    return pos;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    clearInactivityTimer();
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      moved: false,
    };

    const onMove = (ev: PointerEvent) => {
      const bounds = getBounds();
      let x = ev.clientX - dragRef.current.offsetX;
      let y = ev.clientY - dragRef.current.offsetY;
      x = clamp(x, bounds.minX, bounds.maxX);
      y = clamp(y, bounds.minY, bounds.maxY);
      dragRef.current.moved = true;
      setHasUserPosition(true);
      setPosition({ x, y });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      setPosition(prev => {
        const next = avoidOverlaps(prev.x, prev.y);
        try { sessionStorage.setItem('chatbot-position', JSON.stringify(next)); } catch {
          // Ignore storage errors
        }
        return next;
      });
      startInactivityTimer();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
    e.preventDefault();
  };

  // Keep user-placed widget inside viewport on resize
  useEffect(() => {
    if (!hasUserPosition) return;
    const onResize = () => {
      const bounds = getBounds();
      setPosition(p => ({
        x: clamp(p.x, bounds.minX, bounds.maxX),
        y: clamp(p.y, bounds.minY, bounds.maxY),
      }));
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [hasUserPosition]);

  // Auto-return to default after 2s of inactivity when not open
  useEffect(() => {
    if (isOpen) {
      clearInactivityTimer();
      return;
    }
    if (hasUserPosition) {
      startInactivityTimer();
    }
    return () => {
      clearInactivityTimer();
    };
  }, [isOpen, hasUserPosition, startInactivityTimer, clearInactivityTimer]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const location = useLocation();
  const path = location.pathname || '';
  if (path.startsWith('/auth') || path.startsWith('/bim-execution-plan')) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn("fixed z-50 pointer-events-none touch-none select-none transition-all duration-300 ease-out", !hasUserPosition && "right-4 sm:right-6 bottom-4 sm:bottom-6", className)}
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
              (e.currentTarget as HTMLImageElement).src = '/lovable-uploads/39105823-4207-45ad-b096-398f33e2a00f.png?v=2';
            }}
          />
        </Button>
      )}

      {isOpen && (
        <Card className="w-80 sm:w-96 h-[480px] sm:h-[500px] shadow-2xl pointer-events-auto">
          <CardHeader onPointerDown={handlePointerDown} onDoubleClick={() => setIsOpen(false)} className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-background ring-1 ring-border overflow-hidden">
                <img
                  src="/lovable-uploads/c46bcbd0-d86e-45fe-8da4-778681c85f31.png?v=2"
                  alt="BIM Manager Tsoi avatar"
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/lovable-uploads/39105823-4207-45ad-b096-398f33e2a00f.png?v=2';
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