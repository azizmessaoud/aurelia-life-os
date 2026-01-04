import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Trash2, Loader2, Network, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useChatMessages, useStreamingChat, useClearChat, GraphContext, ChatMessage } from "@/hooks/useChat";
import { useActiveProjects } from "@/hooks/useProjects";
import { useActiveOpportunities } from "@/hooks/useOpportunities";
import { useCurrentWeekCapacity } from "@/hooks/useWeeklyCapacity";
import { useTodaysDeepWorkMinutes, useDeepWorkSessions } from "@/hooks/useDeepWork";
import { AppLayout } from "@/components/layout/AppLayout";
import { HighlightedContent } from "@/components/chat/HighlightedContent";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

function MessageBubble({ 
  role, 
  content, 
  isStreaming,
  graphContext 
}: { 
  role: string; 
  content: string; 
  isStreaming?: boolean;
  graphContext?: GraphContext | null;
}) {
  const isUser = role === "user";

  return (
    <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 animate-fade-in",
        isUser 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-muted rounded-bl-md"
      )}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">AURELIA</span>
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {isUser ? content : <HighlightedContent content={content} graphContext={graphContext} />}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse" />
          )}
        </div>
      </div>
      {!isUser && graphContext && <GraphContextPanel graphContext={graphContext} />}
    </div>
  );
}

// Graph Context Panel Component
function GraphContextPanel({ graphContext }: { graphContext: GraphContext | null }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!graphContext || !graphContext.context) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="h-auto py-1 px-2 text-xs gap-1.5">
          <Network className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Graph Context</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {graphContext.entities_found} entities
          </Badge>
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-3 bg-muted/50 rounded-lg border text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
          {graphContext.context}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const suggestedPrompts = [
  "What should I focus on today?",
  "Which income stream is most ADHD-friendly?",
  "Help me set a realistic goal using reverse goal setting",
  "Am I overcommitted? Check my WIP limit",
  "What patterns do you see in my deep work data?",
  "I'm feeling overwhelmed. Help me reset.",
  "Review my weekly capacity - what's my ADHD tax?",
];

export default function ChatPage() {
  const { data: messages = [], isLoading: messagesLoading } = useChatMessages();
  const { data: projects = [] } = useActiveProjects();
  const { data: incomeStreams = [] } = useActiveOpportunities("income");
  const { data: weeklyCapacity } = useCurrentWeekCapacity();
  const { data: todayMinutes = 0 } = useTodaysDeepWorkMinutes();
  const { data: recentSessions = [] } = useDeepWorkSessions();
  const { sendMessage, isStreaming, streamingContent } = useStreamingChat();
  const clearChat = useClearChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput("");

    try {
      await sendMessage(message, {
        projects,
        incomeStreams,
        weeklyCapacity,
        todayMinutes,
        recentSessions: recentSessions.slice(0, 10),
      }, messages);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    if (confirm("Clear all chat history?")) {
      await clearChat.mutateAsync();
      toast.success("Chat cleared");
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary animate-pulse-soft" />
              Chat with AURELIA
            </h1>
            <p className="text-muted-foreground">
              Your ADHD-aware AI life coach
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleClear} disabled={messages.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>

        {/* Messages */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 h-full overflow-y-auto">
            {messages.length === 0 && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Hey! I'm AURELIA.</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  I'm your personal AI assistant designed for ADHD brains. I can help you plan your day, 
                  evaluate income opportunities, and keep you accountable.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                  {suggestedPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setInput(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.id} 
                    role={msg.role} 
                    content={msg.content} 
                    graphContext={msg.graph_context}
                  />
                ))}
                {isStreaming && streamingContent && (
                  <MessageBubble role="assistant" content={streamingContent} isStreaming />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AURELIA anything..."
              className="min-h-[60px] max-h-[120px] resize-none pr-12"
              disabled={isStreaming}
            />
            <Button
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Context indicator */}
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>📂 {projects.length} projects</span>
          <span>💰 {incomeStreams.length} streams</span>
          <span>⏱️ {todayMinutes}m today</span>
          {weeklyCapacity && (
            <span>📊 {weeklyCapacity.actual_hours}/{weeklyCapacity.planned_hours}h this week</span>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
