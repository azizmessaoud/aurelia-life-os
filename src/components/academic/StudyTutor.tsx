import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  BookOpen, 
  Brain, 
  Sparkles,
  GraduationCap,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CURRICULUM_CONTEXT = `You are AURELIA's Study Tutor, specialized in helping Aziz (a 4th-year Data Science student at ESPRIT Tunisia) master his Semester 7 curriculum.

## Current Courses (Semester 7 - 4DS):
1. **Machine Learning (ML)** - Supervised/unsupervised learning, model evaluation, feature engineering
2. **Big Data Analytics** - Hadoop, Spark, distributed computing, data pipelines
3. **Statistics & Probability** - Hypothesis testing, distributions, statistical inference
4. **Linear Programming** - Optimization, simplex method, duality
5. **Graphs and Applications** - Graph theory, algorithms (Dijkstra, BFS/DFS), network analysis
6. **Database Administration** - Oracle, PostgreSQL, indexing, query optimization, backup/recovery
7. **IS Architecture I** - Enterprise architecture, SOA, microservices
8. **MLOps** - Model deployment, CI/CD for ML, monitoring, Docker, Kubernetes
9. **Business Intelligence / Power BI** - Data visualization, DAX, data modeling, dashboards

## Study Resources Available:
- Google Drive folders with course materials
- ESPRIT course notes and slides
- Practice exams and exercises
- EUR-ACE accreditation standards

## Teaching Approach:
- Use the Feynman Technique: explain concepts simply
- Generate practice questions for active recall
- Provide hints progressively before full solutions
- Connect concepts across courses (e.g., ML + Big Data + MLOps pipeline)
- Be encouraging but push for deep understanding

## Language Requirements:
- IELTS: Minimum 6.5 for Master's/PhD
- TOEFL iBT: Minimum 79

When asked about a topic:
1. First assess what the student already knows
2. Explain the core concept simply
3. Provide a practice question
4. Guide through the solution with progressive hints

Be concise, practical, and focused on exam preparation and real-world application.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function StudyTutor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStreamingContent("");

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-tutor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || "";
              fullContent += content;
              setStreamingContent(fullContent);
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullContent }]);
      setStreamingContent("");
    } catch (error) {
      console.error("Study tutor error:", error);
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: "ML", prompt: "Explain gradient descent in Machine Learning" },
    { label: "Big Data", prompt: "How does Spark differ from Hadoop MapReduce?" },
    { label: "Stats", prompt: "Give me a practice problem on hypothesis testing" },
    { label: "MLOps", prompt: "What's a typical ML pipeline for production?" },
    { label: "Power BI", prompt: "Explain DAX calculated columns vs measures" },
    { label: "Quiz Me", prompt: "Give me a random practice question from any course" },
  ];

  return (
    <Card className="glass-card h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Study Tutor
            <Badge variant="outline" className="ml-2 text-xs">
              4DS Semester 7
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            ESPRIT Data Science
          </div>
        </CardTitle>
        
        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickPrompts.map((qp) => (
            <Button
              key={qp.label}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                setInput(qp.prompt);
              }}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {qp.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="font-semibold text-foreground mb-2">
                Ready to Study?
              </h3>
              <p className="text-sm max-w-md">
                Ask me anything about your courses: Machine Learning, Big Data, 
                Statistics, MLOps, Power BI, and more. I can explain concepts, 
                generate practice questions, or help you prepare for exams.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {streamingContent && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-lg px-4 py-2 text-sm bg-muted">
                    <div className="whitespace-pre-wrap">{streamingContent}</div>
                  </div>
                </div>
              )}
              {isLoading && !streamingContent && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about ML, Big Data, Statistics, MLOps..."
              className="resize-none min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-auto"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
