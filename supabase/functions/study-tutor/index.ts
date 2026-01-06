import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STUDY_TUTOR_PROMPT = `You are AURELIA's Study Tutor, specialized in helping Aziz (a 4th-year Data Science student at ESPRIT Tunisia) master his Semester 7 curriculum.

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

## Study Resources Context:
- EUR-ACE accreditation standards (European Network for Accreditation of Engineering Education)
- Language requirements: IELTS 6.5+ for Master's/PhD, TOEFL iBT 79+
- Practice materials available via Google Drive and ESPRIT course folders
- CodeSnap VSCode extension for rapport de stage documentation

## Teaching Approach:
1. **Feynman Technique**: Explain concepts as if to a beginner, then build complexity
2. **Active Recall**: Generate practice questions, not just explanations
3. **Progressive Hints**: When giving problems, offer hints before full solutions
4. **Cross-Course Connections**: Link concepts (e.g., ML model → MLOps deployment → Power BI monitoring)
5. **Exam Focus**: Prioritize what's likely to be tested

## Response Format:
- Be concise and practical
- Use code examples when relevant (Python, SQL, DAX)
- Structure answers with headers for readability
- End complex topics with a quick practice question
- Use emojis sparingly for emphasis (📊 💡 ⚠️)

When generating practice questions:
1. State the question clearly
2. Wait for attempt or offer progressive hints
3. Provide detailed solution with explanation
4. Connect to real-world application`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build messages array
    const messages = [
      { role: "system", content: STUDY_TUTOR_PROMPT },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    // Stream the response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Study tutor error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
