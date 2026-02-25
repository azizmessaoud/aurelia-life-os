# AXIOM + AURELIA System Setup Guide

## Prerequisites
- Node.js 20+ installed
- Ollama installed and running
- Supabase account (free tier)
- Notion API key (optional but recommended)

## Setup Instructions

### 1. Clone and Install
```bash
cd axiom-aurelia-system
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- **SUPABASE_URL** and **SUPABASE_ANON_KEY**: From Supabase dashboard → Settings → API
- **NOTION_API_KEY**: From https://www.notion.so/my-integrations
- **NOTION_DATABASE_ID**: From your Notion database URL
- **GEMINI_API_KEY** (optional): For AURELIA agents

### 3. Setup Supabase Database
1. Go to Supabase dashboard → SQL Editor
2. Copy/paste the entire `supabase/schema.sql` file
3. Run the SQL script
4. Verify tables created in Table Editor

### 4. Install Ollama Models
```bash
# Embedding model (required)
ollama pull nomic-embed-text

# Agent models (choose based on your RAM)
ollama pull mistral:7b-instruct-q4_K_M      # DEXTER (finance)
ollama pull llama3.1:8b-instruct-q4_K_M     # MENTOR (study)
ollama pull qwen2.5-coder:7b-instruct-q4_K_M # ARCHITECT (career)
```

**Memory requirements:**
- Each 7B Q4_K_M model needs ~4.5GB RAM
- Total for all 3 agents: ~14GB RAM
- If limited on RAM, use smaller models or swap models as needed

### 5. Test Ollama Connection
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Test embedding generation
curl http://localhost:11434/api/embeddings -d '{
  "model": "nomic-embed-text",
  "prompt": "This is a test"
}'
```

### 6. Start Development Server
```bash
npm run dev
```

Visit http://localhost:5173

### 7. Sync Notion (Optional)
```bash
npm run notion:sync
```

## System Components

### AXIOM (Input → Decision)
- **Input**: User questions via web interface
- **RAG**: Searches Notion chunks + past decisions
- **Agents**: DEXTER (finance), MENTOR (study), ARCHITECT (career)
- **Output**: Recommendations with confidence scores

### AURELIA (Learning → Health)
- **5D Tracking**: Emotion, Mind, Body, Soul, Hormones
- **Pattern Detection**: Energy times, decision quality, stress triggers
- **Task Generation**: 3 daily tasks (learn, build, money)
- **Feedback Loop**: User ratings improve confidence over time

## Troubleshooting

### "Ollama API error"
- Make sure Ollama is running: `ollama serve`
- Check models are installed: `ollama list`

### "Failed to connect to Supabase"
- Verify SUPABASE_URL and SUPABASE_ANON_KEY in `.env`
- Check database tables exist in Supabase dashboard

### "Notion API error"
- Verify NOTION_API_KEY is correct
- Make sure your Notion integration has access to the database
- Share your database with the integration

### Models too slow?
- Use smaller quantized models (Q2_K instead of Q4_K_M)
- Run one agent at a time
- Consider cloud-hosted LLMs (OpenAI, Anthropic)

## Next Steps

1. **Add Authentication**: Implement Supabase Auth
2. **Notion Auto-Sync**: Setup cron job for daily syncs
3. **Avatar Interface**: Add TalkingHead.js with GLB models
4. **Pattern Detection**: Implement AURELIA learning algorithms
5. **Mobile App**: Build React Native version

## Architecture Reference

See `AXIOM_AURELIA_BUILD_PROMPT.md` for complete technical documentation.

## Support

For issues or questions:
- Check Remix docs: https://remix.run/docs
- Check Supabase docs: https://supabase.com/docs
- Check Ollama docs: https://github.com/ollama/ollama
