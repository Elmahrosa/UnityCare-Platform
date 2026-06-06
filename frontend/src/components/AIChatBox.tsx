import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "@/components/Markdown";
import { cn } from "@/lib/utils";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage, ToolInvocation } from "ai";

type ToolInvocationState = ToolInvocation["state"];

function isToolLoading(state: ToolInvocationState): boolean {
  return state === "partial-call" || state === "call";
}

function isToolError(state: ToolInvocationState): boolean {
  return state === "result" && !!(arguments[0] as any)?.error;
}

function isToolComplete(state: ToolInvocationState): boolean {
  return state === "result";
}

export interface ToolPartRendererProps {
  toolName: string;
  state: ToolInvocationState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
}

export type ToolPartRenderer = (props: ToolPartRendererProps) => ReactNode;

export interface AIChatBoxProps {
  api?: string;
  chatId: string;
  userId?: number;
  initialMessages: UIMessage[];
  onFinish?: (messages: UIMessage[]) => void;
  renderToolPart?: ToolPartRenderer;
  placeholder?: string;
  className?: string;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
}

function DefaultToolPartRenderer({ toolName, state, output, errorText }: ToolPartRendererProps) {
  if (isToolLoading(state)) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg my-2">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Running {toolName}...</span>
      </div>
    );
  }

  if (isToolError(state)) {
    return (
      <div className="p-3 bg-destructive/10 rounded-lg my-2 text-sm text-destructive">
        Error: {errorText || "Tool execution failed"}
      </div>
    );
  }

  if (isToolComplete(state) && output) {
    return (
      <div className="p-3 bg-muted rounded-lg my-2">
        <pre className="text-xs overflow-auto max-h-40">
          {JSON.stringify(output, null, 2)}
        </pre>
      </div>
    );
  }

  return null;
}

function MessageBubble({
  message,
  renderToolPart,
  isStreaming,
}: {
  message: UIMessage;
  renderToolPart: ToolPartRenderer;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "justify-end items-start" : "justify-start items-start"
      )}
    >
      {!isUser && (
        <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2.5",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        )}
      >
        {message.parts?.map((part: any, i: number) => {
          if (part.type === "text") {
            if (isStreaming && !part.text) {
              return (
                <div key={i} className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              );
            }
            return (
              <div key={i} className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown mode={isStreaming ? "streaming" : "static"} isAnimating={isStreaming}>
                  {part.text}
                </Markdown>
              </div>
            );
          }

          if (part.type === "tool-invocation") {
            const ti: ToolInvocation = part.toolInvocation;
            const toolName = "toolName" in ti ? ti.toolName : "unknown";
            const state = ti.state;

            const rendererProps: ToolPartRendererProps = {
              toolName,
              state,
              input: state === "call" || state === "result" ? (ti as any).args : undefined,
              output: state === "result" ? (ti as any).result : undefined,
              errorText: state === "result" ? (ti as any).error : undefined,
            };

            const customRender = renderToolPart(rendererProps);
            if (customRender !== null) {
              return <div key={i}>{customRender}</div>;
            }
            return <div key={i}><DefaultToolPartRenderer {...rendererProps} /></div>;
          }

          if (part.type === "reasoning") {
            return (
              <div key={i} className="text-xs text-muted-foreground italic border-l-2 pl-2 my-2">
                {part.text}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 justify-start items-start">
      <div className="size-8 shrink-0 mt-1 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="size-4 text-primary" />
      </div>
      <div className="bg-muted rounded-lg px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Thinking...</span>
        </div>
      </div>
    </div>
  );
}

export function AIChatBox({
  api = "/api/chat",
  chatId,
  userId,
  initialMessages,
  onFinish,
  renderToolPart = () => null,
  placeholder = "Type your message...",
  className,
  emptyStateMessage = "Start a conversation with AI",
  suggestedPrompts,
}: AIChatBoxProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, append, setMessages, status, error } = useChat({
    id: chatId,
    initialMessages,
    body: userId ? { userId } : undefined,
    onFinish: (message) => {
      onFinish?.(messages);
    },
  });

  useEffect(() => {
    setMessages(initialMessages);
  }, [chatId]);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement;
    if (viewport) {
      requestAnimationFrame(() => {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
      });
    }
  }, [messages, status]);

  const canSend = status === "ready";
  const isStreaming = status === "streaming";
  const lastMessage = messages[messages.length - 1];
  const isWaitingForContent =
    status === "submitted" ||
    (isStreaming && lastMessage?.role === "assistant" && !lastMessage?.parts?.length);

  const submitMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !canSend) return;

    append({ role: "user", content: trimmedInput });
    setInput("");
    textareaRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <div className={cn("flex flex-col flex-1 min-h-0", className)}>
      <div ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-3xl space-y-4 p-4">
            {messages.length === 0 && !isWaitingForContent ? (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-6 text-muted-foreground">
                <Sparkles className="size-12 opacity-20" />
                <p className="text-center max-w-md">{emptyStateMessage}</p>
                {suggestedPrompts && suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                    {suggestedPrompts.map((prompt, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setInput(prompt);
                          textareaRef.current?.focus();
                        }}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isLastAssistant =
                    index === messages.length - 1 && message.role === "assistant";
                  const hasContent = message.parts && message.parts.length > 0;

                  if (isLastAssistant && !hasContent) return null;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      renderToolPart={renderToolPart}
                      isStreaming={isStreaming && isLastAssistant && !!hasContent}
                    />
                  );
                })}

                {isWaitingForContent && <ThinkingIndicator />}
              </>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                Error: {error.message}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <form onSubmit={handleSubmit} className="border-t bg-background/50 p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={!canSend}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!canSend || !input.trim()}
              className="shrink-0 h-[44px] w-[44px]"
            >
              {status === "submitted" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AIChatBox;
