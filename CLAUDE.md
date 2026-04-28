# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# First-time setup
npm run setup          # install deps + prisma generate + prisma migrate dev

# Development
npm run dev            # Next.js dev server with Turbopack (http://localhost:3000)
npm run dev:daemon     # Same, writes logs to logs.txt in background

# Build / lint
npm run build
npm run lint

# Tests
npm test               # Run all tests (Vitest)
npm test -- src/lib/__tests__/file-system.test.ts  # Run a single test file

# Database
npm run db:reset       # Reset and re-migrate SQLite database
npx prisma studio      # Browse the database
```

## Architecture

### Overview
UIGen is a chat-driven React component generator. Users describe a component in natural language; Claude generates and iterates on the files; a live preview renders them instantly — all without touching the real filesystem.

### Core data flow
1. **Chat** (`src/app/api/chat/route.ts`) — POST endpoint wrapping Vercel AI SDK's `streamText`. Receives serialized `VirtualFileSystem` state from the client, passes it to two Claude tools (`str_replace_editor`, `file_manager`), and streams tool call events back to the browser. On finish, persists messages + file state to the `Project` record in SQLite (authenticated users only).

2. **VirtualFileSystem** (`src/lib/file-system.ts`) — An in-memory tree of `FileNode` objects, fully serializable to/from plain JSON. All file mutations happen here; nothing is ever written to disk. Provides text-editor-style operations (`viewFile`, `replaceInFile`, `insertInFile`) used by the AI tools.

3. **AI tools** (`src/lib/tools/`) — Two Vercel AI SDK tool definitions:
   - `str_replace_editor` — file create/view/str_replace/insert operations on `VirtualFileSystem`
   - `file_manager` — rename/delete operations on `VirtualFileSystem`

4. **JSX transformer** (`src/lib/transform/jsx-transformer.ts`) — Runs entirely in the browser. Transpiles JSX/TSX via `@babel/standalone`, builds an ES Module import map with blob URLs for each file, resolves third-party packages through `esm.sh`, and injects everything into an `<iframe srcdoc>`. The preview hot-reloads whenever `refreshTrigger` increments.

5. **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`) — React context that owns the live `VirtualFileSystem` instance and exposes `handleToolCall`, which the chat stream invokes to apply AI edits to the VFS and trigger a re-render.

6. **ChatContext** (`src/lib/contexts/chat-context.tsx`) — Wraps Vercel AI SDK's `useChat`, serializes current VFS state into each request body, and dispatches tool calls to `FileSystemContext.handleToolCall`.

### Auth
JWT sessions stored in an `httpOnly` cookie (`auth-token`), managed in `src/lib/auth.ts` (server-only). `JWT_SECRET` defaults to a dev-only value; set it in `.env` for production. Anonymous users can generate components but cannot persist projects. `src/middleware.ts` protects relevant routes.

### Provider fallback
`src/lib/provider.ts` exports `getLanguageModel()`. If `ANTHROPIC_API_KEY` is absent, a `MockLanguageModel` is returned, which produces scripted multi-step responses (Counter / Card / Form depending on prompt keywords). The real model is `claude-haiku-4-5`.

### Database
SQLite via Prisma, schema at `prisma/schema.prisma`. The `Project` model stores `messages` and `data` (VFS snapshot) as JSON strings. The generated client lives in `src/generated/prisma/`.

### Testing
Vitest + jsdom + Testing Library. Tests live alongside source in `__tests__/` subdirectories. The test environment requires no environment variables — the mock provider handles AI calls automatically.