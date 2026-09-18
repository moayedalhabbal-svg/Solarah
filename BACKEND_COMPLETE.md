# Solarah Backend — Complete ✅

All 8 phases are implemented and verified.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Calculator │  │ Sunora   │  │Dashboard │  │  Admin   │           │
│  │  (stream) │  │(chatbot) │  │(realtime)│  │(realtime)│           │
│  └────┬──────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │              │                │
│       ▼              ▼              ▼              ▼                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              supabase.js (client library)                    │    │
│  │  Auth · Database queries · Realtime subscriptions            │    │
│  │  Email triggers (fire-and-forget)                            │    │
│  └──────────────────────┬──────────────────────────────────────┘    │
└─────────────────────────┼──────────────────────────────────────────┘
                          │ HTTPS (anon key in Authorization header)
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE (Backend-as-a-Service)                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Supabase Auth                              │   │
│  │  Email/password · Google OAuth · Password reset               │   │
│  │  Auto-creates profile row on signup (trigger)                 │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  PostgreSQL Database                          │   │
│  │  profiles · waitlist · reports · engineers · engineer_profiles│   │
│  │  engineer_slots · bookings · affiliate_clicks                 │   │
│  │  + Row Level Security (hardened) + book_slot() RPC function   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  Supabase Realtime                            │   │
│  │  waitlist (INSERT) · bookings (*) · engineer_slots (UPDATE)   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────┐  ┌────────────────────────────────┐   │
│  │  Edge Function:         │  │  Edge Function:                │   │
│  │  claude-proxy           │  │  send-email                    │   │
│  │  Reads ANTHROPIC_API_KEY│  │  Reads RESEND_API_KEY          │   │
│  │  from server secrets    │  │  from server secrets           │   │
│  └───────────┬─────────────┘  └──────────────┬─────────────────┘   │
└──────────────┼───────────────────────────────┼─────────────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────┐         ┌──────────────────────────┐
│  Anthropic Claude API │         │  Resend Email API          │
│  api.anthropic.com    │         │  (onboarding@resend.dev)   │
└──────────────────────┘         └──────────────────────────┘
```

---

## Environment Variables

### Frontend `.env` file (safe to have in browser — protected by RLS)

| Variable | Where to get it | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API | `eyJhbGciOiJI...` |

### Supabase Secrets (server-side only — NEVER in browser)

| Secret | Where to get it | Set with |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...` |
| `RESEND_API_KEY` | resend.com → API Keys | `supabase secrets set RESEND_API_KEY=re_...` |

---

## Launch Checklist — From Clone to Live

### 1. Local setup
```bash
git clone <your-repo>
cd solarah-2
npm install
cp .env.example .env
# Edit .env with your Supabase URL and anon key
```

### 2. Supabase project
1. Go to supabase.com → Create project "solarah" in eu-central-1
2. Copy Project URL and anon key → paste into `.env`
3. SQL Editor → paste `supabase/schema.sql` → Run

### 3. Set yourself as admin
```sql
-- In Supabase SQL Editor, after signing up:
-- Find your user UUID in Authentication → Users
UPDATE profiles SET role = 'admin' WHERE id = 'your-auth-user-uuid';
```

### 4. Deploy Edge Functions
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key
supabase secrets set RESEND_API_KEY=re_your-key
supabase functions deploy claude-proxy
supabase functions deploy send-email
```

### 5. Optional: Google OAuth
- See `GOOGLE_AUTH_SETUP.md`

### 6. Run locally
```bash
npm run dev
# Open http://localhost:5173
```

### 7. Deploy frontend
```bash
npm run build
# Upload dist/ to Vercel, Netlify, or any static host
```

---

## Estimated Monthly Costs

| Resource | 100 users | 1,000 users | 10,000 users |
|---|---|---|---|
| **Supabase** (Database + Auth + Realtime) | Free tier | Free tier | ~$25/mo (Pro) |
| **Supabase Edge Functions** | Free (500K invocations) | Free | Free |
| **Anthropic Claude** (AI analysis + Sunora) | ~$2 (200 calls × $0.01) | ~$20 | ~$200 |
| **Resend** (transactional emails) | Free (3K/mo) | Free | ~$20/mo (5K+ emails) |
| **Hosting** (Vercel/Netlify) | Free | Free | Free |
| **Google OAuth** | Free | Free | Free |
| **TOTAL** | **~$2/mo** | **~$20/mo** | **~$245/mo** |

Notes:
- Supabase free tier: 500MB database, 50K monthly active users, 2GB bandwidth
- Claude costs assume ~$0.01 per request (claude-sonnet-4-6 with ~400 tokens in + 300 out)
- At 10K users, Supabase Pro ($25/mo) gives 8GB database, 100K MAU, unlimited bandwidth
- All costs are estimates and depend on actual usage patterns

---

## Verification Results

| Check | Result |
|---|---|
| `npm run build` | ✅ 0 errors |
| `grep -r "sk-ant" dist/` | ✅ No results (API key removed) |
| `grep -r "anthropic.com" dist/` | ✅ No results (all calls go through proxy) |
| `grep -r "VITE_ANTHROPIC" dist/` | ✅ No results |
| Realtime subscriptions cleaned up | ✅ All 5 (Waitlist, Dashboard, Engineers, Admin, App) |
| Admin page blocks non-admin | ✅ RequireAdmin guard redirects to `/` |
| Dashboard redirects unauthenticated | ✅ RequireAuth guard redirects to `/login` |
| System Design shows save banner | ✅ SaveBanner shown for unauthenticated users |

---

## Files Created / Modified

### New files (10)
| File | Purpose |
|---|---|
| `BACKEND_SETUP.md` | Beginner guide to setting up Supabase |
| `DEPLOY_EDGE_FUNCTION.md` | Guide to deploying Edge Functions |
| `RESEND_SETUP.md` | Guide to setting up Resend email |
| `GOOGLE_AUTH_SETUP.md` | Guide to setting up Google OAuth |
| `BACKEND_COMPLETE.md` | This document |
| `supabase/functions/claude-proxy/index.ts` | Secure Claude API proxy |
| `supabase/functions/claude-proxy/deno.json` | Deno config |
| `supabase/functions/send-email/index.ts` | Email notification service |
| `supabase/functions/send-email/deno.json` | Deno config |
| `src/pages/Admin.jsx` + `Admin.module.css` | Admin dashboard |

### Modified files (9)
| File | Changes |
|---|---|
| `.env.example` | Removed ANTHROPIC key, added note about secrets |
| `supabase/schema.sql` | Full rewrite: profiles, engineer_profiles, hardened RLS, triggers, realtime |
| `src/lib/supabase.js` | Email triggers, Google OAuth, password reset, profile queries, admin queries |
| `src/components/Sunora.jsx` | Switched to Edge Function proxy |
| `src/pages/Calculator.jsx` | Switched to Edge Function proxy |
| `src/pages/Auth.jsx` | Google OAuth, forgot password, email verification |
| `src/pages/Auth.module.css` | Google button, divider, success message styles |
| `src/pages/Waitlist.jsx` | Realtime counter subscription |
| `src/pages/Dashboard.jsx` | Realtime booking updates |
| `src/pages/Engineers.jsx` | Realtime slot availability |
| `src/App.jsx` | Auth loading spinner, RequireAuth/RequireAdmin guards, admin route |
