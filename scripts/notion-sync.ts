// Notion sync script - Run daily to keep RAG context fresh
// Usage: npm run notion:sync

import { config } from 'dotenv';
config();

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!;
const CHUNK_SIZE = 500; // Characters per chunk

interface NotionPage {
  id: string;
  properties: any;
  url: string;
}

// Notion API helper
async function fetchNotionPages() {
  const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Notion API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results as NotionPage[];
}

// Get page content
async function fetchPageContent(pageId: string): Promise<string> {
  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch page content: ${response.statusText}`);
  }

  const data = await response.json();
  const blocks = data.results;

  let content = '';
  for (const block of blocks) {
    if (block.type === 'paragraph' && block.paragraph?.rich_text) {
      content += block.paragraph.rich_text.map((t: any) => t.plain_text).join('') + '\n';
    } else if (block.type === 'heading_1' && block.heading_1?.rich_text) {
      content += '\n' + block.heading_1.rich_text.map((t: any) => t.plain_text).join('') + '\n';
    } else if (block.type === 'heading_2' && block.heading_2?.rich_text) {
      content += '\n' + block.heading_2.rich_text.map((t: any) => t.plain_text).join('') + '\n';
    } else if (block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text) {
      content += '• ' + block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('') + '\n';
    }
  }

  return content.trim();
}

// Chunk text into smaller pieces
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      
      if (breakPoint > start) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  return chunks.filter(chunk => chunk.length > 50); // Skip very short chunks
}

// Main sync function
async function syncNotion() {
  console.log('🔄 Starting Notion sync...');

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.error('❌ Missing Notion credentials in .env file');
    process.exit(1);
  }

  try {
    const pages = await fetchNotionPages();
    console.log(`📄 Found ${pages.length} pages`);

    for (const page of pages) {
      const pageId = page.id.replace(/-/g, '');
      const title = page.properties?.Name?.title?.[0]?.plain_text || 'Untitled';

      console.log(`\n📖 Processing: ${title}`);
      
      const content = await fetchPageContent(page.id);
      
      if (!content) {
        console.log('  ⏭️ Skipping empty page');
        continue;
      }

      const chunks = chunkText(content, CHUNK_SIZE);
      console.log(`  ✂️ Created ${chunks.length} chunks`);

      // TODO: Generate embeddings and store in Supabase
      // For now, just log
      console.log(`  ✅ Would store ${chunks.length} chunks (embeddings not yet implemented)`);
    }

    console.log('\n✅ Notion sync complete!');
  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run sync
syncNotion();
