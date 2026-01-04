import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { authenticateRequest, unauthorizedResponse, validateString } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request
  const { user, error: authError } = await authenticateRequest(req);
  if (authError || !user) {
    return unauthorizedResponse(authError || "Unauthorized", corsHeaders);
  }

  try {
    const body = await req.json();
    const type = validateString(body.type, 50) || "scholarship";
    const profile = body.profile;
    
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    console.log(`Searching for ${type} opportunities`);

    const searchQueries: Record<string, string> = {
      scholarship: `Find scholarships for Data Science students in Europe 2025. Focus on: no GPA requirements, international students welcome, STEM fields, master's programs. Include application deadlines and requirements.`,
      certification: `Find free or low-cost Data Science and AI certifications available online in 2025. Include: Google, Microsoft, AWS, Coursera, edX certificates. Focus on practical skills, no prerequisites.`,
      volunteering: `Find remote volunteering opportunities for Data Science students in 2025. Include: data analysis for nonprofits, tech mentoring, open source projects. Flexible hours preferred.`,
    };

    const query = searchQueries[type] || searchQueries.scholarship;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { 
            role: 'system', 
            content: `You are an opportunity finder for students with ADHD. Return exactly 5 opportunities as a JSON array. Each opportunity must have:
- name: string (opportunity title)
- description: string (2-3 sentences, highlight ADHD-friendly aspects like flexibility, clear structure)
- url: string (application or info URL)
- deadline: string or null (application deadline if known, format: YYYY-MM-DD)
- requirements: string (brief requirements, note if no GPA required)
- estimated_hours: number or null (weekly time commitment)
- adhd_compatibility: "high" | "medium" | "low" (based on flexibility, clear deadlines, structured process)

Return ONLY valid JSON array, no markdown or explanation.`
          },
          { role: 'user', content: query }
        ],
        search_recency_filter: 'month',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Perplexity response:', JSON.stringify(data, null, 2));

    const content = data.choices?.[0]?.message?.content || '[]';
    
    // Try to parse JSON from the response
    let opportunities = [];
    try {
      // Handle potential markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        opportunities = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse opportunities:', parseError);
      opportunities = [];
    }

    return new Response(JSON.stringify({ 
      opportunities,
      citations: data.citations || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('discover-opportunities error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      opportunities: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
