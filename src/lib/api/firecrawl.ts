import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = unknown> = {
  success: boolean;
  error?: string;
  data?: T;
};

type ScrapeOptions = {
  formats?: (
    | 'markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot' | 'branding' | 'summary'
    | { type: 'json'; schema?: object; prompt?: string }
  )[];
  onlyMainContent?: boolean;
  waitFor?: number;
  location?: { country?: string; languages?: string[] };
};

export const firecrawlApi = {
  // Scrape a single URL
  async scrape(url: string, options?: ScrapeOptions): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Sync from Blackboard
  async syncBlackboard(
    blackboardUrl: string, 
    syncType: 'full' | 'schedule' | 'assignments' | 'materials' = 'full',
    courseUrls?: string[]
  ): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('blackboard-sync', {
      body: { blackboardUrl, syncType, courseUrls },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
