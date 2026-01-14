# Knowledge Base Implementation Guide

Complete RAG (Retrieval-Augmented Generation) system for CEO Sidekick.

## Overview

This implementation provides:
- ✅ Document upload (TXT, MD files)
- ✅ Text chunking with semantic boundaries
- ✅ OpenAI embeddings (text-embedding-3-small)
- ✅ pgvector storage in Neon PostgreSQL
- ✅ Vector similarity search
- ✅ RAG integration with Knowledge Base agent
- ✅ Full CRUD UI for document management

## Setup Steps

### 1. Install Dependencies

```bash
npm install openai @google-cloud/storage
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# OpenAI for embeddings
OPENAI_API_KEY=sk-proj-xxxxx

# Google Cloud Storage (for document storage)
GOOGLE_CLOUD_PROJECT=your-project-id
GCS_BUCKET_NAME=ceosidekick-documents

# Option A: Use Application Default Credentials (recommended for GCP)
# Run: gcloud auth application-default login

# Option B: Use service account JSON (for Render/Vercel)
GCS_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"..."}'
```

### 3. Enable pgvector in Neon

1. Go to your Neon project dashboard
2. Open **SQL Editor**
3. Run the migration script:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to document_chunks
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Add new columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS original_name varchar(255),
ADD COLUMN IF NOT EXISTS storage_key varchar(500),
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS processed_at timestamp;
```

### 4. Set Up Google Cloud Storage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new bucket: `ceosidekick-documents`
3. Create a service account with Storage Admin role
4. Download the JSON key and add to `GCS_CREDENTIALS`

**Bucket Settings:**
- Location: Choose region closest to your users
- Storage class: Standard
- Access control: Fine-grained (for signed URLs)

### 5. Copy Files to Your Project

```
src/
├── db/
│   └── schema.ts           # Replace existing (adds vector column)
├── lib/
│   ├── embeddings.ts       # OpenAI embedding utilities
│   ├── chunking.ts         # Text chunking
│   ├── storage.ts          # GCS utilities
│   ├── vector-search.ts    # pgvector search
│   └── document-processor.ts  # Processing pipeline
├── agents/
│   ├── types.ts            # Updated with RAG types
│   └── knowledge-base.ts   # Updated agent config
└── app/
    ├── api/
    │   ├── chat/
    │   │   └── route.ts    # Updated with RAG integration
    │   └── documents/
    │       ├── route.ts        # List, upload, delete
    │       ├── [id]/
    │       │   └── route.ts    # Get, reprocess, delete
    │       └── search/
    │           └── route.ts    # Vector search
    └── (dashboard)/
        └── knowledge-base/
            └── page.tsx    # Updated UI
```

### 6. Update Your `schema.ts`

The key addition is the pgvector custom type:

```typescript
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    const cleaned = value.replace(/^\[/, "").replace(/\]$/, "");
    return cleaned.split(",").map(Number);
  },
});
```

And the `embedding` column in `documentChunks`:

```typescript
embedding: vector("embedding"),
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Knowledge Base Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UPLOAD                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│  │  User    │───▶│  GCS     │───▶│  Chunk   │───▶│  OpenAI  │   │
│  │  Upload  │    │  Storage │    │  Text    │    │  Embed   │   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘   │
│                                                        │         │
│                                                        ▼         │
│                                              ┌──────────┐        │
│                                              │ pgvector │        │
│                                              │ Storage  │        │
│                                              └──────────┘        │
│                                                        │         │
│  QUERY                                                 │         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐         │         │
│  │  User    │───▶│  OpenAI  │───▶│  Vector  │◀────────┘         │
│  │  Query   │    │  Embed   │    │  Search  │                   │
│  └──────────┘    └──────────┘    └──────────┘                   │
│                                        │                         │
│                                        ▼                         │
│                              ┌──────────────────┐                │
│                              │  Claude + RAG    │                │
│                              │  (Knowledge Agent)│                │
│                              └──────────────────┘                │
│                                        │                         │
│                                        ▼                         │
│                              ┌──────────────────┐                │
│                              │  Response with   │                │
│                              │  Citations       │                │
│                              └──────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Documents API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | GET | List user's documents |
| `/api/documents` | POST | Upload document (multipart/form-data) |
| `/api/documents?id=xxx` | DELETE | Delete document |
| `/api/documents/[id]` | GET | Get document details + chunks |
| `/api/documents/[id]` | POST | Reprocess failed document |
| `/api/documents/[id]` | DELETE | Delete document |
| `/api/documents/search` | POST | Vector similarity search |

### Upload Example

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("shared", "false"); // true to share with org

const res = await fetch("/api/documents", {
  method: "POST",
  body: formData,
});
```

### Search Example

```typescript
const res = await fetch("/api/documents/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    query: "What is our PTO policy?",
    limit: 5,
    threshold: 0.7,
  }),
});

const { results, context, count } = await res.json();
```

---

## Data Security

### OpenAI Embeddings
- Text is sent to OpenAI API for embedding only
- OpenAI does NOT store or train on API data
- Vectors are meaningless without original text
- All vectors stored in YOUR database

### Google Cloud Storage
- Documents stored in private bucket
- Access via signed URLs (time-limited)
- Service account has minimal permissions
- Consider enabling Customer-Managed Encryption Keys (CMEK)

### Database
- Vectors stored in Neon PostgreSQL
- User isolation via `userId` field
- Org sharing via `organizationId`
- All queries filtered by access permissions

---

## Chunking Strategy

The system uses semantic chunking:

1. **Target size**: ~500 tokens per chunk
2. **Overlap**: 50 tokens between chunks
3. **Break points**: Paragraphs > Sentences > Words
4. **Markdown-aware**: Splits on headers for .md files

Tuning options in `chunking.ts`:

```typescript
const DEFAULT_OPTIONS = {
  chunkSize: 500,      // Target tokens per chunk
  chunkOverlap: 50,    // Overlap between chunks
  minChunkSize: 100,   // Minimum chunk size
};
```

---

## Adding PDF/DOCX Support

To add support for PDF and DOCX files:

### 1. Install packages

```bash
npm install pdf-parse mammoth
```

### 2. Update `document-processor.ts`

```typescript
export async function extractText(buffer: Buffer, mimeType: string) {
  if (mimeType === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // ... existing code
}
```

### 3. Update supported types

```typescript
export function getSupportedMimeTypes() {
  return [
    "text/plain",
    "text/markdown",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
}
```

---

## Troubleshooting

### "pgvector extension not found"
- Run `CREATE EXTENSION IF NOT EXISTS vector;` in Neon SQL Editor
- Verify with: `SELECT * FROM pg_extension WHERE extname = 'vector';`

### "Embedding dimension mismatch"
- Ensure index uses 1536 dimensions (text-embedding-3-small)
- Recreate index if needed

### "GCS permission denied"
- Check service account has Storage Admin role
- Verify bucket name in env vars
- Test with `gcloud storage ls gs://your-bucket`

### "No search results"
- Lower threshold (default 0.7, try 0.5)
- Check documents have status "ready"
- Verify chunks have embeddings: `SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL;`

---

## Cost Estimates

### OpenAI Embeddings
- Model: text-embedding-3-small
- Cost: ~$0.02 per 1M tokens
- 100 documents × 5KB each = ~125K tokens = ~$0.003

### Google Cloud Storage
- Storage: $0.02/GB/month
- Operations: $0.004/10K operations
- 100MB of docs = ~$0.002/month

### Neon PostgreSQL
- Free tier: 0.5GB storage, 192 compute hours
- Pro: $19/month for more storage/compute

---

## Next Steps

1. ✅ TXT/MD upload and processing
2. ⬜ Add PDF support
3. ⬜ Add DOCX support
4. ⬜ Implement background job queue (BullMQ)
5. ⬜ Add document preview
6. ⬜ Implement document versioning
7. ⬜ Add usage tracking for embeddings
