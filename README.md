# Charlie — Personal productivity assistant

Charlie is a full-stack Next.js 15 chat assistant that understands natural language requests in Spanish, parses them into structured intents (send an email, create a task, schedule a meeting, etc.) and executes them through an n8n webhook that connects to your real tools (Gmail, Google Calendar, Asana, CRM, ...).

```
You → Charlie (LLM intent parser) → n8n workflow → Gmail / Asana / Calendar / ...
```

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + custom shadcn/ui components
- **Supabase** — Postgres database + Google OAuth
- **Anthropic Claude / OpenAI / Ollama** — pluggable LLM backend
- **n8n** — workflow / action execution layer
- **Radix UI** primitives (`avatar`, `scroll-area`, `slot`)
- `lucide-react` icons, `date-fns`, `uuid`

## Project structure

```
app/
  api/
    auth/callback/route.ts   # Supabase OAuth callback
    chat/route.ts            # POST: user msg → LLM → persist + return intent
    execute-action/route.ts  # POST: intent → n8n webhook → log
  chat/
    layout.tsx               # Sidebar + main area, requires auth
    page.tsx                 # Renders <ChatArea />
  login/page.tsx             # Google login screen
  layout.tsx                 # Root layout + metadata
  page.tsx                   # Redirects to /chat or /login
  globals.css                # Tailwind + Charlie theme tokens
components/
  ui/                        # shadcn-style primitives
  chat/                      # Sidebar, ChatArea, ChatMessage, ChatInput, ActionConfirmation
lib/
  ai.ts                      # LLM abstraction + Charlie system prompt
  n8n.ts                     # Webhook helper
  supabase.ts                # Browser + server Supabase clients
  utils.ts                   # cn(), initials()
middleware.ts                # Auth guard for /chat and /api/*
supabase/schema.sql          # Tables + RLS policies
types/index.ts               # Shared TS types
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-only) |
| `ANTHROPIC_API_KEY` | Claude API key (default provider) |
| `OPENAI_API_KEY` | Optional — used when `LLM_PROVIDER=openai` |
| `OLLAMA_BASE_URL` | Optional — default `http://localhost:11434` |
| `N8N_WEBHOOK_URL` | Webhook the assistant POSTs intents to |
| `LLM_PROVIDER` | `anthropic` \| `openai` \| `ollama` |
| `NEXT_PUBLIC_APP_URL` | Base URL of the deployed app |

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, enable **Google** and add your OAuth client.
3. In **Authentication → URL Configuration**, add `http://localhost:3000/api/auth/callback` (and your prod URL) to the allowed redirect URLs.
4. Run the SQL in `supabase/schema.sql` against your database (SQL editor or `supabase db push`). This creates the `conversations`, `messages` and `actions_log` tables with RLS policies that scope every row to `auth.uid()`.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`, sign in with Google, and land on `/chat`.

## How it works

### Chat flow

1. The user types a message in `ChatInput`.
2. `ChatArea` POSTs `{ content, conversation_id }` to `/api/chat`.
3. `/api/chat` calls `askCharlie()` (in `lib/ai.ts`), which sends the user message + Charlie's system prompt to the configured LLM.
4. The LLM is instructed to **always** reply with a JSON object:
   ```json
   {
     "intent": "send_email",
     "parameters": { "recipient": "...", "subject": "...", "body": "..." },
     "message": "Listo, redacté el email...",
     "requires_action": true
   }
   ```
5. The user message and Charlie's response are persisted in `messages`. The UI renders Charlie's reply and, if `requires_action` is true, shows an `ActionConfirmation` card with the parsed parameters and a **Confirmar y ejecutar** button.

### Action execution

When the user confirms, `ChatArea` POSTs to `/api/execute-action`, which:

1. Creates a row in `actions_log` with status `executing`.
2. POSTs the structured payload to your `N8N_WEBHOOK_URL`.
3. Updates the log row and the originating message with the result.

Your n8n workflow receives:

```json
{
  "intent": "send_email",
  "parameters": { ... },
  "user_id": "uuid",
  "message_id": "uuid",
  "timestamp": "ISO-8601"
}
```

…and dispatches to Gmail / Calendar / Asana / etc.

### Supported intents

| Intent | Parameters |
| --- | --- |
| `send_email` | `recipient`, `subject`, `body`, `cc` |
| `create_task` | `title`, `description`, `assignee`, `project`, `due_date` |
| `create_reminder` | `message`, `date`, `time`, `recipient` |
| `create_calendar_event` | `title`, `date`, `time`, `duration`, `attendees`, `location` |
| `summarize_today` | — |
| `general_response` | — |

### Switching LLM providers

Set `LLM_PROVIDER` to `anthropic` (default), `openai`, or `ollama`. The OpenAI integration uses `response_format: { type: "json_object" }` and Ollama uses `format: "json"` to guarantee parsable output.

## Security

- All data tables use Supabase **Row Level Security** scoped to `auth.uid()`.
- The middleware protects `/chat`, `/api/chat`, and `/api/execute-action` — unauthenticated users are redirected to `/login`.
- The service-role key is only read on the server.

## Scripts

```bash
npm run dev     # start Next dev server
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint
```

## License

MIT
