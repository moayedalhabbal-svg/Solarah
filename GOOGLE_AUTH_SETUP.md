# Google OAuth Setup Guide

> Let users sign in to Solarah with one click using their Google account. No password needed.

---

## Step 1 — Enable Google Provider in Supabase

1. Go to your Supabase dashboard
2. Click **Authentication** in the left sidebar
3. Click **Providers**
4. Find **Google** and toggle it **ON**
5. You'll see two fields that need values:
   - **Client ID** — from Google Cloud Console (next step)
   - **Client Secret** — from Google Cloud Console (next step)
6. Copy the **Redirect URL** shown — you'll need it for Google. It looks like:
   `https://your-project.supabase.co/auth/v1/callback`

## Step 2 — Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **OAuth consent screen**
   - Choose **External** user type
   - Fill in the required fields:
     - App name: `Solarah`
     - User support email: your email
     - Developer contact: your email
   - Click **Save and Continue** through the remaining steps
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `Solarah Web`
   - **Authorized redirect URIs**: paste the Redirect URL from Supabase:
     `https://your-project.supabase.co/auth/v1/callback`
   - Also add `http://localhost:5173` for local development
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

## Step 3 — Paste Into Supabase

1. Go back to **Supabase → Authentication → Providers → Google**
2. Paste the **Client ID** and **Client Secret**
3. Click **Save**

## Step 4 — Test It

1. Run `npm run dev` locally
2. Go to `http://localhost:5173/login`
3. Click **Continue with Google**
4. Sign in with your Google account
5. You should be redirected to `/dashboard`

## Notes

- Since you don't have a production domain yet, only `http://localhost:5173` will work for now
- When you get a domain, add it to the **Authorized redirect URIs** in Google Cloud Console
- Google OAuth is free — no API costs
