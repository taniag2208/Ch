# Charlie 🤖 — Agente comercial de IA para Tita Media

Charlie es un agente de IA para el equipo comercial de **Tita Media** (agencia colombiana de crecimiento digital). Vigila el pipeline de HubSpot, avisa cuando un lead se enfría, redacta correos de seguimiento y publica el pulso diario del negocio en Google Chat — siempre con su propia voz (cálida, informal, y explícitamente un bot).

```
HubSpot  →  Charlie (Claude)  →  Google Chat (informes + alertas)
                              →  Gmail (correos de seguimiento)
                              →  Postgres (LeadSnapshot, CharlieLog, CharlieConfig)
```

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **NextAuth v5** con Google, restringido al dominio `@titamedia.com`
- **Prisma + PostgreSQL** (Supabase)
- **Anthropic SDK** (`claude-sonnet-4-6`)
- **GitHub Actions** para los 3 flujos automatizados (gratis, sin n8n/Make/Zapier)

## Secciones de la app

1. **Dashboard** (`/dashboard`) — resumen del pipeline por etapa y dueño, leads fríos, actividad reciente de Charlie.
2. **Leads** (`/leads`) — tabla desde `LeadSnapshot` con filtros, semáforo de color y botón para re-sincronizar desde HubSpot.
3. **Cliente 360** (`/leads/[id]`) — ficha del lead con timeline de HubSpot, resumen y recomendación de Charlie, contactos y notas.
4. **Configuración** (`/config`) — umbrales de inactividad por etapa, límite diario de correos, lista de exclusión, horarios y on/off de cada flujo.
5. **Historial** (`/history`) — todos los registros de `CharlieLog` (informe/alerta/email), con filtros y vista previa del contenido.

## La voz de Charlie

Toda la personalidad de Charlie vive en `lib/charlie/persona.ts` — única fuente de verdad. Charlie se presenta siempre como IA, habla en primera persona, es cálido pero útil y firma como **Charlie 🤖**.

## Flujos automatizados (GitHub Actions)

| Flujo | Script | Horario (cron UTC) |
|-------|--------|--------------------|
| Informe diario → Google Chat | `scripts/flow1-daily-report.ts` | `0 13 * * 1-5` (8am CO) |
| Alertas de seguimiento → Google Chat | `scripts/flow2-alerts.ts` | `0 13,16,19,21 * * 1-5` |
| Correos de follow-up → Gmail | `scripts/flow3-followup-emails.ts` | `0 14 * * 1-5` (9am CO) |

Cada flujo revisa en `CharlieConfig` si está activo, respeta la lista de exclusión y el límite diario de correos, maneja errores con gracia y registra todo en `CharlieLog`.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completa las variables
npm run db:push              # crea las tablas en Postgres
npm run dev
```

### Variables de entorno

Ver `.env.example`. Necesitas: `DATABASE_URL` / `DIRECT_URL` (Supabase), `AUTH_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `HUBSPOT_TOKEN`, `GOOGLE_CHAT_WEBHOOK_URL`, credenciales de Gmail y `ANTHROPIC_API_KEY`.

Para GitHub Actions, carga esas mismas variables como **Secrets** del repositorio.

## Integraciones (llamadas directas, sin MCP)

- `lib/integrations/hubspot.ts` — deals, actividades, notas.
- `lib/integrations/googlechat.ts` — webhook entrante.
- `lib/integrations/gmail.ts` — envío vía Gmail API con refresh token.
