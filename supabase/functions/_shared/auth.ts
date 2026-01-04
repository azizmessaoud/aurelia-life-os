import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthResult {
  user: { id: string; email?: string } | null;
  error: string | null;
}

/**
 * Validates the authorization header and returns the authenticated user.
 * Returns an error message if authentication fails.
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return { user: null, error: "Missing authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  
  if (!token || token === authHeader) {
    return { user: null, error: "Invalid authorization header format" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: "Server configuration error" };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: "Invalid or expired token" };
  }

  return { user: { id: user.id, email: user.email }, error: null };
}

/**
 * Creates an unauthorized response with proper CORS headers
 */
export function unauthorizedResponse(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}

/**
 * Input validation utilities
 */
export function validateString(value: unknown, maxLength: number = 10000): string | null {
  if (typeof value !== "string") return null;
  if (value.length > maxLength) return null;
  return value.trim();
}

export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function sanitizeForIlike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
