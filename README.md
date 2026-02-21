# 🏅 Athlete Journal

A production-ready, mobile-first web app for young athletes to self-log training sessions, track progress, and reflect on growth.

Built with **Next.js 15 (App Router)** · **TypeScript** · **Supabase** · **Recharts** · Deployed on **Vercel**

---

## ✨ Features

| Page | What it does |
|------|-------------|
| `/` | Home: streak, weekly minutes, last 7 entries, Log Today CTA |
| `/log` | Fast 2-min form: sport, activity, minutes, effort, confidence, body feel, reflections |
| `/stats` | Weekly minutes chart (8 wks), sport breakdown (30 days), avg effort/confidence |
| `/summary/monthly` | Monthly totals, insights, game/practice counts, reflection fields |
| `/summary/yearly` | Annual summary with all-time bests, month browser |

**Security**: Full Supabase Row Level Security — users only ever see their own data.

---

## 🗂 File Structure

```
athlete-journal/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout + bottom nav
│   │   ├── page.tsx               # Home page
│   │   ├── globals.css            # Design system
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── log/
│   │   │   ├── page.tsx           # Server component
│   │   │   └── LogForm.tsx        # Client form
│   │   ├── stats/
│   │   │   ├── page.tsx           # Data fetching
│   │   │   └── StatsCharts.tsx    # Recharts client
│   │   └── summary/
│   │       ├── monthly/
│   │       │   ├── page.tsx
│   │       │   └── MonthlyReflectionForm.tsx
│   │       └── yearly/page.tsx
│   ├── components/
│   │   └── BottomNav.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   └── server.ts          # Server client
│   │   ├── actions.ts             # All server actions
│   │   ├── dates.ts               # Timezone-safe date utils
│   │   └── insights.ts            # Rule-based insight generator
│   ├── types/index.ts             # Shared TypeScript types
│   └── middleware.ts              # Auth protection
├── supabase/
│   ├── migration.sql              # All tables + RLS policies
│   └── seed.sql                   # Test data
├── public/
│   └── manifest.json              # PWA manifest
├── .env.local.example
├── vercel.json
└── README.md
```

---

## 🛠 Local Development Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd athlete-journal
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Note your **Project URL** and **anon public key** from Settings → API
3. Open the **SQL Editor** and run the full contents of `supabase/migration.sql`
4. (Optional) Run `supabase/seed.sql` to add test data — replace `USER_UUID` first

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Tip for mobile testing**: Run `npm run dev -- --hostname 0.0.0.0`, then open your phone's browser to `http://YOUR_LOCAL_IP:3000`.

---

## 🚀 Deploy to Vercel

### Option A: Vercel Dashboard (recommended)

1. Push your code to a GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
# Follow prompts, then add env vars:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

### Post-deploy: Configure Supabase Auth redirect

In Supabase Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

---

## 🗄 Database Schema

### `athlete_profile`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | auto |
| `user_id` | uuid | FK → auth.users, unique |
| `first_name` | text | |
| `birth_year` | int | nullable |
| `favorite_sport` | text | nullable |
| `created_at` | timestamptz | |

### `journal_entries`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK, indexed |
| `entry_date` | date | indexed, unique per user |
| `sport` | text | |
| `activity_type` | text | |
| `minutes` | int | 1–600 |
| `effort` | int | 1–5 |
| `confidence` | int | 1–5 |
| `body_feel` | text | Great/OK/Sore/Hurt |
| `win_today` | varchar(140) | |
| `lesson_today` | varchar(140) | |
| `tomorrow_focus` | varchar(140) | |
| `created_at` / `updated_at` | timestamptz | auto trigger |

### `monthly_reflections`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid | FK |
| `month` | text | YYYY-MM format, unique per user |
| `biggest_win_month` | text | |
| `improve_next_month` | text | |
| `created_at` / `updated_at` | timestamptz | |

---

## 🔒 Security

- **Row Level Security (RLS)** is enabled on all tables
- All policies enforce `auth.uid() = user_id` — no cross-user data access
- Server actions validate and sanitize all form inputs
- Middleware redirects unauthenticated users to `/auth/login`

---

## 🧠 Design Decisions

- **Streak calculation** uses the user's local date (via JS `Date`) consistently — the entry date is stored as-captured from the client form
- **Weekly minutes** counts Mon–Sun using local timezone offsets
- **Monthly insights** are fully rule-based — no external AI API calls, no latency
- **One entry per day** — the form upserts, so opening the same date always edits
- **Server Components** for all data fetching; **Client Components** only for interactive forms and charts

---

## 📱 PWA Notes

The app includes a `manifest.json` for add-to-home-screen on iOS/Android. For full offline PWA support, add a service worker (e.g., using `next-pwa` package).

---

## 🧪 Testing Seed Data

After creating an account via the app:
1. Copy your user UUID from Supabase → Authentication → Users
2. Replace `USER_UUID` in `supabase/seed.sql`
3. Run the SQL in Supabase SQL Editor

This creates 14 days of realistic journal entries + a monthly reflection.
