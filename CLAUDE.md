# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GQ4** — Personal income tracker app. Loads providers (clients) and monthly billing per provider, with totals in ARS and USD at the exchange rate on entry date. Supports filtering by provider/year, collapsible month sections, privacy mode, and a stacked bar chart by provider.

## Stack

- **Framework**: Next.js 16 (App Router) — uses `proxy.ts` (NOT `middleware.ts`, renamed in Next.js 16)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (PostgreSQL) via `@supabase/ssr`
- **Language**: TypeScript
- **Charts**: recharts (stacked bar chart)
- **Deployment**: Hostinger (Node.js)

## Role

Act as a senior fullstack developer with strong UI/UX design sensibility. All UI work follows a **mobile-first** approach targeting iPhone 13 (375px) as the primary viewport, scaling up to notebook/desktop.

## Design Principles

- **Mobile-first**: iPhone 13 (375px) primary. Breakpoints: `md` 768px → `lg` 1024px.
- **Touch-friendly**: Minimum tap target 44x44px.
- **Privacy mode**: Global toggle (`usePrivacyMode` hook) hides all monetary values via `mask()`.
- **Color palette**: Indigo primary (`oklch(0.51 0.22 264)`), off-white background, white cards with subtle shadow.
- **No clutter**: Dashboard is read-only. Edit/delete lives elsewhere, not on the home view.

## Data Model (Supabase)

```sql
providers         -- id, name, created_at
income_entries    -- id, provider_id, amount_ars, usd_rate, amount_usd (generated), date (YYYY-MM), notes, created_at
```

- `amount_usd` is a **generated stored column**: `amount_ars / usd_rate`
- `date` is stored as `YYYY-MM` text string

## Project Structure

```
app/
  layout.tsx              # Root layout: PrivacyProvider + TopBar + BottomNav
  page.tsx                # Redirects to /dashboard
  dashboard/page.tsx      # Main view: totals, stacked chart, collapsible months (read-only)
  providers/page.tsx      # CRUD providers
  income/new/page.tsx     # New income entry form
  login/page.tsx          # Auth page
proxy.ts                  # Auth middleware (Next.js 16 convention, exports `proxy` function)
components/
  layout/
    TopBar.tsx            # Sticky header: logo + desktop nav + privacy toggle + logout
    BottomNav.tsx         # Mobile bottom nav with blur backdrop (hidden on /login)
  income/
    MonthlyChart.tsx      # Stacked bar chart by provider (recharts)
    EditIncomeSheet.tsx   # Sheet form for editing income entries (not used on dashboard)
  ui/                     # shadcn/ui primitives
hooks/
  usePrivacyMode.tsx      # Context: isPrivate, toggle, mask(value)
lib/
  supabase/
    client.ts             # createBrowserClient
    server.ts             # createServerClient (for server components)
  utils/
    currency.ts           # formatARS(), formatUSD(), calcUSD()
    date.ts               # formatMonthYear(), currentYearMonth(), monthOptions()
types/index.ts            # Provider, IncomeEntry, MonthlyTotal, ProviderTotal
```

## Key Patterns

- **Dashboard filters**: client-side filtering by `filterYear` and `filterProvider` over all entries fetched once.
- **Collapsible months**: `Set<string>` state; most recent month auto-opens on first load via `useRef` guard.
- **Chart data**: keyed by `provider_id` per month for recharts stacked bars. `chartProviders` = only providers active in current filter.
- **Chart colors**: 8-color palette in `COLORS` array in `MonthlyChart.tsx`, cycles with `i % COLORS.length`.
- **Privacy**: wrap any monetary display with `mask(formatARS(value))` or `mask(formatUSD(value))`.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
```

## Supabase

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

RLS enabled on both tables. Auth via `supabase.auth.signInWithPassword`.

## Currency Format

- ARS: `$1.250.000` (Intl es-AR, no decimals)
- USD: `U$D 1.250,00`
