"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, useDragControls } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROUTE_LINE_PATTERN = /^\s*Route:\s*(\/[^\s]+)\s*$/gim;
const ROUTE_PATTERN =
  /\/[A-Za-z0-9][A-Za-z0-9/_-]*(?:\?[A-Za-z0-9=&%._-]+)?/g;

const linkifyRoutes = (content: string) => {
  return content
    .split("```")
    .map((block, blockIndex) => {
      if (blockIndex % 2 === 1) {
        return block;
      }

      return block
        .split("`")
        .map((segment, segmentIndex) => {
          if (segmentIndex % 2 === 1) {
            return segment;
          }

          return segment.replace(ROUTE_PATTERN, (match, offset) => {
            const prevChar = segment[offset - 1];
            if (
              prevChar === "(" ||
              prevChar === "[" ||
              prevChar === "/" ||
              prevChar === ":"
            ) {
              return match;
            }
            return `[${match}](${match})`;
          });
        })
        .join("`");
    })
    .join("```");
};

const parseAssistantContent = (content: string) => {
  const routeLineMatch = content.match(ROUTE_LINE_PATTERN);
  const routeLine = routeLineMatch ? routeLineMatch[0] : "";
  const routeMatch = routeLine.match(ROUTE_PATTERN);
  const route = routeMatch ? routeMatch[0] : null;
  const cleaned = content.replace(ROUTE_LINE_PATTERN, "").trim();

  return {
    route,
    markdown: linkifyRoutes(cleaned),
  };
};

export function AIChatBot() {
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [panelSize, setPanelSize] = useState<
    { width: number; height: number } | null
  >(null);
  const [collapsedHeight, setCollapsedHeight] = useState(56);
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/chat",
    });

  const syncPanelSize = () => {
    if (!panelRef.current) {
      return;
    }
    const { width, height } = panelRef.current.getBoundingClientRect();
    setPanelSize({ width, height });
  };

  const handleToggleCollapse = () => {
    if (!isCollapsed) {
      syncPanelSize();
      if (headerRef.current) {
        setCollapsedHeight(headerRef.current.getBoundingClientRect().height);
      }
    }
    setIsCollapsed((prev) => !prev);
  };

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  return (
    <div ref={constraintsRef} className="fixed inset-0 z-50 pointer-events-none">
      <motion.div
        ref={panelRef}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        className={`pointer-events-auto absolute bottom-6 right-6 flex w-80 min-w-[16rem] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl ${
          isCollapsed ? "min-h-0 resize-none" : "min-h-[16rem] resize"
        }`}
        style={
          isCollapsed
            ? {
                height: `${collapsedHeight}px`,
                width: panelSize ? `${panelSize.width}px` : undefined,
              }
            : panelSize
              ? {
                  height: `${panelSize.height}px`,
                  width: `${panelSize.width}px`,
                }
              : undefined
        }
        onPointerUp={() => {
          if (!isCollapsed) {
            syncPanelSize();
          }
        }}
      >
        <div
          ref={headerRef}
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
            onClick={handleToggleCollapse}
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
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm"
            >
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Ask about orders, inventory, returns, or shipping rules.
                </p>
              )}
              {messages.map((message) => {
                const assistantContent =
                  message.role === "assistant"
                    ? parseAssistantContent(message.content)
                    : null;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 leading-relaxed ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {message.role === "assistant" && assistantContent ? (
                        <div className="space-y-3">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h2 className="text-base font-semibold text-foreground">
                                  {children}
                                </h2>
                              ),
                              h2: ({ children }) => (
                                <h3 className="text-sm font-semibold text-foreground">
                                  {children}
                                </h3>
                              ),
                              h3: ({ children }) => (
                                <h4 className="text-sm font-semibold text-foreground">
                                  {children}
                                </h4>
                              ),
                              p: ({ children }) => (
                                <p className="text-sm leading-relaxed text-foreground">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="ml-4 list-disc space-y-1 text-sm">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="ml-4 list-decimal space-y-1 text-sm">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="leading-relaxed">{children}</li>
                              ),
                              a: ({ href, children }) => {
                                if (!href) {
                                  return <span>{children}</span>;
                                }
                                if (href.startsWith("/")) {
                                  return (
                                    <Link
                                      href={href}
                                      className="font-medium text-sky-600 underline underline-offset-2 hover:text-sky-500"
                                    >
                                      {children}
                                    </Link>
                                  );
                                }
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-sky-600 underline underline-offset-2 hover:text-sky-500"
                                  >
                                    {children}
                                  </a>
                                );
                              },
                              code: ({ className, children }) => (
                                <code
                                  className={
                                    className
                                      ? "text-xs leading-relaxed"
                                      : "rounded bg-muted px-1 py-0.5 text-xs"
                                  }
                                >
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className="overflow-x-auto rounded-lg bg-muted/70 p-3 text-xs">
                                  {children}
                                </pre>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-foreground">
                                  {children}
                                </strong>
                              ),
                            }}
                          >
                            {assistantContent.markdown}
                          </ReactMarkdown>
                          {assistantContent.route && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>Want me to open it?</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(assistantContent.route!)
                                }
                              >
                                Yes, take me there
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-muted px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70"
                        style={{ animationDelay: "120ms" }}
                      />
                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/70"
                        style={{ animationDelay: "240ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
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
