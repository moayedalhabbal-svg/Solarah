# Solarah ☀️

> Your solar system, designed for you. A global renewable energy advisory platform — PV system calculator, AI-generated reports, engineer marketplace, and product affiliate links.

## What's inside

- **Calculator** — 4-step flow that sizes a complete PV system (panels, inverter, battery) from a user's location, consumption, and budget
- **AI report analysis** — calls the Claude API to generate a personalised written analysis for every system
- **PDF export** — branded, downloadable report generated in-browser with jsPDF
- **Engineer marketplace** — browse certified engineers, book virtual consultations (calendar + time slots)
- **Product affiliate system** — recommended panels/inverters/batteries with outbound purchase links and click tracking
- **Waitlist** — email capture for pre-launch growth
- **Auth + Dashboard** — Supabase-powered accounts, saved reports, booking history

## Tech stack

- React 18 + Vite
- React Router
- Supabase (auth + Postgres database)
- jsPDF (in-browser PDF generation)
- Claude API (AI report analysis)
- Tabler Icons

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase (free tier is enough to start)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **SQL Editor** → paste the contents of `supabase/schema.sql` → Run
   This creates all tables: `waitlist`, `reports`, `engineers`, `engineer_slots`, `bookings`, `affiliate_clicks`
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and paste in your Supabase URL and key:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Visit `http://localhost:5173`

### 5. Build for production

```bash
npm run build
```

Output goes to `dist/` — deploy that folder to **Vercel**, **Netlify**, or any static host.

## Project structure

```
solarah/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
├── supabase/
│   └── schema.sql          ← run this in Supabase SQL editor
└── src/
    ├── main.jsx            ← app entry point
    ├── App.jsx             ← router + auth state
    ├── styles/
    │   └── global.css      ← brand colors, base styles
    ├── lib/
    │   ├── supabase.js     ← all database functions
    │   ├── calculator.js   ← solar sizing math engine
    │   └── pdf.js          ← PDF report generator
    ├── components/
    │   └── Navbar.jsx
    └── pages/
        ├── Landing.jsx     ← homepage
        ├── Calculator.jsx  ← the core product
        ├── Engineers.jsx   ← booking marketplace
        ├── Products.jsx    ← affiliate product grid
        ├── Auth.jsx        ← login / signup
        ├── Waitlist.jsx    ← pre-launch email capture
        └── Dashboard.jsx   ← logged-in user hub
```

## Brand

- **Navy** `#0B1F3A` — primary background
- **Amber** `#F5A623` — accent, CTAs, highlights
- Font: **Inter**

## Next steps after deployment

1. **Add real engineer slots** — the `engineer_slots` table needs to be populated (manually or via a small admin script) so bookings have real availability
2. **Connect real affiliate links** — update `src/lib/calculator.js` → `getProducts()` with your actual supplier partnership URLs
3. **Add email notifications** — use Supabase Edge Functions + Resend/SendGrid to email booking confirmations and waitlist welcomes
4. **Custom domain** — point your domain at your Vercel/Netlify deployment
5. **Analytics** — add Plausible or Google Analytics to track conversion from calculator → report → booking

## Notes on the AI report feature

The Claude API call in `Calculator.jsx` currently calls `api.anthropic.com` directly from the browser. For production, **move this to a backend route or Supabase Edge Function** so your API key isn't exposed client-side. The current setup works for demos but needs this fix before public launch.

---

Built with Claude · For Solarah — solarah.com
