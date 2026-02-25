# AXIOM + AURELIA System

**Personal AI Operating System with 3D Avatar Interface**

Built by Aziz Messaoud - February 2026

## Quick Start

### Prerequisites
- Node.js 20+
- Ollama (for local LLMs)
- Supabase account

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
cp .env.example .env
# Edit .env with your keys

# 3. Install Ollama models
ollama pull nomic-embed-text
ollama pull mistral:7b-instruct-q4_K_M
ollama pull llama3.1:8b-instruct-q4_K_M

# 4. Setup Supabase database
# Run SQL in supabase/schema.sql

# 5. Start dev server
npm run dev
```

## Architecture

- **AXIOM**: Input pipeline + 3D avatar interface
- **AURELIA**: 5D health scoring + pattern learning
- **Shared**: Supabase database with pgvector RAG

## Features

✅ Notion-connected AI second brain  
✅ 3D talking avatar (TalkingHead.js)  
✅ Multi-agent council (DEXTER, MENTOR, ARCHITECT)  
✅ 5D health tracking (emotion/mind/body/soul/hormones)  
✅ RAG pipeline with pgvector  
✅ Pattern learning & confidence scoring  
✅ Daily task generation (3 tasks: learn/build/money)  

## Tech Stack

- **Frontend**: Remix 3 + React + TailwindCSS
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Vector DB**: pgvector (RAG embeddings)
- **LLMs**: Ollama (local, $0 cost)
- **Avatar**: TalkingHead.js + Avaturn GLB models

## Project Structure

```
axiom-aurelia-system/
├── app/                 # Remix app
│   ├── routes/          # Pages & API routes
│   ├── components/      # React components
│   └── lib/             # Core logic
├── public/              # Static assets (GLB models)
├── supabase/            # Database schema
└── scripts/             # Cron jobs (Notion sync, health compute)
```

## License

MIT - Built for portfolio & personal use
