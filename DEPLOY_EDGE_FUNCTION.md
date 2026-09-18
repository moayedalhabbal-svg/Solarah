# Deploy Edge Functions — Step by Step

> This guide explains how to deploy the Solarah Edge Functions (Claude proxy and email sender) to your Supabase project.

---

## Step 1 — Install the Supabase CLI

```bash
npm install -g supabase
```

Verify it installed:
```bash
supabase --version
```

You should see something like `1.x.x`.

## Step 2 — Log In

```bash
supabase login
```

This opens your browser. Log in with the same account you used on supabase.com. It will generate an access token automatically.

## Step 3 — Link Your Project

Find your **project reference ID** — go to your Supabase dashboard → Project Settings → General → look for "Reference ID" (a short string like `abcdefghij`).

```bash
supabase link --project-ref your-project-ref
```

Replace `your-project-ref` with your actual reference ID. It will ask for your database password (the one you saved during project creation).

## Step 4 — Set Your Secrets

The Edge Functions need API keys that are stored as **secrets** on Supabase's servers. They are NEVER sent to the browser.

### Claude API Key (required for AI features)
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

Get your key from [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key.

### Resend API Key (required for email notifications)
```bash
supabase secrets set RESEND_API_KEY=re_your-actual-key-here
```

Get your key from [resend.com](https://resend.com) → API Keys → Create API Key. (See `RESEND_SETUP.md` for full setup.)

## Step 5 — Deploy the Functions

Deploy the Claude proxy:
```bash
supabase functions deploy claude-proxy
```

Deploy the email sender:
```bash
supabase functions deploy send-email
```

Each deployment takes ~30 seconds. You'll see "Function deployed successfully" when done.

## Step 6 — Test It

### Test the Claude proxy:
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/claude-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "model": "claude-sonnet-4-6",
    "max_tokens": 50,
    "messages": [{"role": "user", "content": "Say hello in one word"}]
  }'
```

You should get back a JSON response with the AI's reply.

### Test the email sender:
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{
    "type": "waitlist_welcome",
    "to": "your@email.com",
    "data": { "name": "Test User", "position": 42 }
  }'
```

Check your inbox — you should receive a welcome email.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `ANTHROPIC_API_KEY not configured` | Run `supabase secrets set ANTHROPIC_API_KEY=your-key` and redeploy |
| `CORS error in browser` | Make sure your origin URL is in the `ALLOWED_ORIGINS` array in the function |
| `Function not found (404)` | Make sure you deployed: `supabase functions deploy claude-proxy` |
| `401 Unauthorized` | Check that your `VITE_SUPABASE_ANON_KEY` in `.env` is correct |
| `supabase: command not found` | Run `npm install -g supabase` to install the CLI |

## Updating Functions

After making changes to the function code, just redeploy:
```bash
supabase functions deploy claude-proxy
supabase functions deploy send-email
```
