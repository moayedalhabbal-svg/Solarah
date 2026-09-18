# Resend Email Setup Guide

> Solarah uses [Resend](https://resend.com) to send transactional emails. The free tier gives you **3,000 emails/month** — more than enough for getting started.

---

## Step 1 — Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Click **Get Started** and sign up with your email or GitHub account
3. Verify your email address

## Step 2 — Create an API Key

1. In the Resend dashboard, go to **API Keys** in the left sidebar
2. Click **Create API Key**
3. Give it a name: `solarah-production`
4. Set permissions to **Full access**
5. Click **Add**
6. **Copy the API key** — it starts with `re_` and is only shown once!

## Step 3 — Add the Key as a Supabase Secret

```bash
supabase secrets set RESEND_API_KEY=re_your-actual-key-here
```

Then redeploy the email function:
```bash
supabase functions deploy send-email
```

## What About the "From" Address?

By default, emails are sent from `onboarding@resend.dev`. This is Resend's shared sender and works immediately — no setup needed.

When you get a custom domain (like `solarah.com`), you can verify it in Resend and update the `FROM_EMAIL` in the edge function to send from `noreply@solarah.com`.

## Email Types

| Type | When It's Sent | To |
|---|---|---|
| `waitlist_welcome` | User joins the waitlist | The user |
| `booking_confirmation` | Consultation is booked | The user |
| `booking_engineer_notify` | Consultation is booked | The engineer |
| `report_saved` | User saves their first report | The user |

All emails use Solarah brand colors and a clean, professional design.

## Testing

After deploying, test with:
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

Check your inbox (and spam folder on the first email).
