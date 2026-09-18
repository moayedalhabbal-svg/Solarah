# Solarah Backend Setup Guide

> **For beginners:** This guide walks you through every step of setting up the Solarah backend. No prior experience needed — just follow each step in order.

---

## Step 1 — Create Your Supabase Account & Project

1. Go to [supabase.com](https://supabase.com) and click **Start your project**
2. Sign up with your GitHub account (or email)
3. Once logged in, click **New Project**
4. Fill in these details:
   - **Organization:** Your personal org (created automatically)
   - **Project name:** `solarah`
   - **Database password:** Choose a strong password (16+ characters, mix of letters/numbers/symbols). **Save this password somewhere safe** — you'll need it if you ever want to connect directly to the database. You can use a password manager or write it down securely.
   - **Region:** Select **EU Central (Frankfurt)** — `eu-central-1`. This is the closest region to Cairo and covers the Middle East well.
5. Click **Create new project** and wait ~2 minutes for it to provision

## Step 2 — Get Your API Keys

Once your project is ready:

1. In the left sidebar, click **Project Settings** (the gear icon at the bottom)
2. Click **API** in the settings menu
3. You'll see two important values:
   - **Project URL** — looks like `https://abcdefghij.supabase.co`
   - **anon public key** — a long string starting with `eyJ...`
4. **Copy both of these** — you'll need them in the next step

> **What are these?**
> - The **Project URL** is the address of your backend server
> - The **anon key** is a public key that lets your frontend talk to Supabase. It's safe to include in your frontend code because Row Level Security (RLS) controls what data each user can actually access.

## Step 3 — Create Your `.env` File

1. In the project root folder (`solarah 2/`), you'll find a file called `.env.example`
2. **Copy it** and rename the copy to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and replace the placeholder values with your real keys:
   ```
   VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...your-actual-anon-key
   ```
4. **Never commit `.env` to Git** — it's already in `.gitignore`, so it won't be pushed to GitHub

## Step 4 — Set Up the Database

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from the project
4. Copy the **entire contents** and paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
6. You should see "Success. No rows returned" — that means all tables were created

### What Each Table Does

| Table | Purpose |
|---|---|
| **`profiles`** | Stores user profile data (name, country, role). Automatically created when someone signs up. Extends the built-in Supabase Auth user. |
| **`waitlist`** | People who signed up for early access. Stores their name, email, and country. |
| **`reports`** | Saved solar system designs. Each report belongs to one user and stores all the calculator results (system size, cost, savings, etc). |
| **`engineers`** | The marketplace listing of Solarah's partner engineers. Their name, specialties, rating, and whether they're active. |
| **`engineer_profiles`** | Extended engineer data — languages, regions, bio, Calendly link, verification status. |
| **`engineer_slots`** | Available time slots for each engineer. Each slot has a date, time, and whether it's been booked. |
| **`bookings`** | Consultation appointments. Links a user to an engineer at a specific date/time. Has a unique booking reference (like `SLR-ABC123`). |
| **`affiliate_clicks`** | Tracks when users click "Buy" on recommended products. Used for commission tracking. |

## Step 5 — Understand Row Level Security (RLS)

**What is RLS?**

Row Level Security is Supabase's way of controlling *which rows* each user can see or modify in the database. Without it, anyone with your anon key could read or write any data in any table.

**Why does it matter for Solarah?**

- **User A should not see User B's solar reports** — RLS ensures each user can only access their own reports
- **No one should be able to delete engineers from the marketplace** — RLS ensures only admins can modify the engineers table
- **Anyone should be able to join the waitlist** — RLS allows public inserts to the waitlist table
- **The API key in your frontend is public** — RLS is the security layer that makes this safe

**How does it work?**

Each table has "policies" — rules written in SQL that check conditions before allowing an operation. For example:
```sql
-- This policy says: a user can only SELECT rows where the user_id column matches their own ID
create policy "Users can view own reports"
  on reports for select
  using (auth.uid() = user_id);
```

When a user makes a request, Supabase checks:
1. Is the user authenticated? (`auth.uid()` returns their ID, or `null` if anonymous)
2. Does the row match the policy condition?
3. If yes → allow. If no → deny (the row is invisible to them)

**Bottom line:** RLS means your frontend API key is safe to expose publicly, because the database itself enforces who can see what.

---

## ✅ Setup Complete!

Your Supabase project is now ready. Next steps:
- **Phase B2:** Deploy the Claude API proxy (see `DEPLOY_EDGE_FUNCTION.md`)
- **Phase B3:** Set up email notifications (see `RESEND_SETUP.md`)
