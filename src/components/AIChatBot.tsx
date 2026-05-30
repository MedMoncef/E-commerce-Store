"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, useDragControls } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AIChatBot() {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
    });

  const renderMessageContent = (content: string) => {
    const pattern =
      /https?:\/\/[^\s]+|\/[A-Za-z0-9][A-Za-z0-9/_-]*(?:\?[A-Za-z0-9=&%._-]+)?/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;

    for (const match of content.matchAll(pattern)) {
      const start = match.index ?? 0;
      const rawMatch = match[0];

      if (start > lastIndex) {
        parts.push(content.slice(lastIndex, start));
      }

      let url = rawMatch;
      let suffix = "";
      while (/[),.;:!?]$/.test(url)) {
        suffix = url.slice(-1) + suffix;
        url = url.slice(0, -1);
      }

      if (url.startsWith("http")) {
        parts.push(
          <a
            key={`${url}-${start}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sky-600 underline underline-offset-2 hover:text-sky-500"
          >
            {url}
          </a>
        );
      } else {
        parts.push(
          <Link
            key={`${url}-${start}`}
            href={url}
            className="font-medium text-sky-600 underline underline-offset-2 hover:text-sky-500"
          >
            {url}
          </Link>
        );
      }

      if (suffix) {
        parts.push(suffix);
      }

      lastIndex = start + rawMatch.length;
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts;
  };

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div ref={constraintsRef} className="fixed inset-0 z-50 pointer-events-none">
      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        className="pointer-events-auto absolute bottom-6 right-6 flex w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
      >
        <div
          className="flex items-center justify-between bg-muted/60 px-4 py-3 text-sm font-semibold text-foreground cursor-grab active:cursor-grabbing"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <div className="flex items-center gap-2">
            <span>ShopFlow Assistant</span>
            <span className="text-xs text-muted-foreground">Local AI</span>
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={isCollapsed ? "Expand chat" : "Collapse chat"}
            onClick={() => setIsCollapsed((prev) => !prev)}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {isCollapsed ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {!isCollapsed && (
          <>
            <div
              ref={scrollRef}
              className="max-h-80 space-y-3 overflow-y-auto px-4 py-3 text-sm"
            >
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ask about orders, inventory, returns, or shipping rules.
                </p>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 leading-relaxed ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.role === "assistant"
                      ? renderMessageContent(message.content)
                      : message.content}
                  </div>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-border bg-card px-3 py-3"
            >
              <Input
                name="message"
                placeholder="Ask the assistant..."
                value={input}
                onChange={handleInputChange}
                className="h-10"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
              >
                Send
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
