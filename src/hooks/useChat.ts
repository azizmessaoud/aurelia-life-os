import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useCallback } from "react";

export type GraphContext = {
  context: string | null;
  entities_found: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  graph_context?: GraphContext | null;
};

export function useChatMessages() {
  return useQuery({
    queryKey: ["chat_messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return data as ChatMessage[];
    },
  });
}

export function useSaveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: { 
      role: "user" | "assistant"; 
      content: string;
      graph_context?: GraphContext | null;
    }) => {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert(message)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat_messages"] });
    },
  });
}

export function useClearChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chat_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat_messages"] });
    },
  });
}

// Extract entities from conversation in the background
async function extractEntitiesFromConversation(userMessage: string, assistantMessage: string) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-entities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          user_message: userMessage,
          assistant_message: assistantMessage,
        }),
      }
    );

    if (!response.ok) {
      console.warn("Entity extraction failed:", response.status);
      return;
    }

    const result = await response.json();
    console.log("Entities extracted:", result);
  } catch (error) {
    console.warn("Entity extraction error:", error);
    // Don't throw - extraction is non-critical background task
  }
}

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [currentGraphContext, setCurrentGraphContext] = useState<GraphContext | null>(null);
  const saveMessage = useSaveMessage();
  const queryClient = useQueryClient();

  const sendMessage = useCallback(
    async (
      userMessage: string,
      context: {
        projects: any[];
        incomeStreams: any[];
        weeklyCapacity: any;
        todayMinutes: number;
        recentSessions?: any[];
      },
      conversationHistory?: ChatMessage[]
    ) => {
      setIsStreaming(true);
      setStreamingContent("");
      setCurrentGraphContext(null);

      // Save user message
      await saveMessage.mutateAsync({ role: "user", content: userMessage });

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aurelia-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              message: userMessage,
              context,
              conversationHistory: conversationHistory?.slice(-6),
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please wait a moment.");
          }
          if (response.status === 402) {
            throw new Error("AI credits exhausted. Please add more credits.");
          }
          throw new Error("Failed to get response from AURELIA");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let fullContent = "";
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              
              // Check for graph context metadata
              if (parsed.type === "graph_context") {
                setCurrentGraphContext({
                  context: parsed.context,
                  entities_found: parsed.entities_found,
                });
                continue;
              }
              
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                setStreamingContent(fullContent);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Save assistant message with graph context
        if (fullContent) {
          await saveMessage.mutateAsync({ 
            role: "assistant", 
            content: fullContent,
            graph_context: currentGraphContext,
          });
          
          // Trigger entity extraction in the background (non-blocking)
          extractEntitiesFromConversation(userMessage, fullContent);
          
          // Invalidate knowledge graph queries so UI updates if user navigates there
          queryClient.invalidateQueries({ queryKey: ["knowledge_entities"] });
          queryClient.invalidateQueries({ queryKey: ["knowledge_relationships"] });
        }

        setStreamingContent("");
        return fullContent;
      } catch (error) {
        console.error("Chat error:", error);
        throw error;
      } finally {
        setIsStreaming(false);
      }
    },
    [saveMessage, queryClient]
  );

  return {
    sendMessage,
    isStreaming,
    streamingContent,
  };
}
