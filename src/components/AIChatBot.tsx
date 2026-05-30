"use client";

import { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { motion, useDragControls } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AIChatBot() {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
    });

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
          <span>ShopFlow Assistant</span>
          <span className="text-xs text-muted-foreground">Local AI</span>
        </div>

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
                {message.content}
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
          <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
