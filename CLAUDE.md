# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**GQ4** — Personal finance tracker. Multi-user app to track income (ingresos) and expenses (egresos) with totals in ARS and USD. Unified dashboard shows net result. Each user sees only their own data via Supabase RLS.

## Stack

- **Framework**: Next.js 16 (App Router) — uses `proxy.ts` (NOT `middleware.ts`, renamed in Next.js 16)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Supabase (PostgreSQL) via `@supabase/ssr`
- **Language**: TypeScript
- **Charts**: recharts (`BarChart` stacked by provider, `ComposedChart` for dashboard)
- **Deployment**: Hostinger (Node.js plan)

## Role

Act as a senior fullstack developer with strong UI/UX design sensibility. All UI work follows a **mobile-first** approach targeting iPhone 13 (375px) as the primary viewport, scaling up to notebook/desktop.

## Design Principles

- **Mobile-first**: iPhone 13 (375px) primary. Breakpoints: `md` 768px → `lg` 1024px.
- **Touch-friendly**: Minimum tap target 44x44px.
- **Privacy mode**: Global toggle (`usePrivacyMode` hook) hides all monetary values via `mask()`.
- **Color palette**: Indigo primary (`oklch(0.51 0.22 264)`), off-white background, white cards with subtle shadow.
- **Dashboard read-only**: No edit/delete on dashboard. Detail pages handle mutations.

## Data Model (Supabase)

```sql
providers         -- id, name, user_id, created_at
income_entries    -- id, provider_id, amount_ars, usd_rate, amount_usd (generated), date (YYYY-MM), notes, user_id, created_at
expense_entries   -- id, category, is_fixed, description, amount_ars, date (YYYY-MM), user_id, created_at
```

- `amount_usd` is a **generated stored column**: `amount_ars / usd_rate`
- `date` is stored as `YYYY-MM` text string
- `user_id` links to `auth.users(id)` — RLS policies filter `USING (auth.uid() = user_id)`
- `category` on expenses: `'alquiler' | 'servicios' | 'suscripciones' | 'seguros' | 'otros'`
- `is_fixed` boolean on expenses: `true` = gasto fijo, `false` = variable

## Multi-user RLS

All 3 tables have `FOR ALL TO authenticated USING (auth.uid() = user_id)`.
Inserts **must** explicitly pass `user_id: user.id` (fetched via `supabase.auth.getUser()`).
New users created via Supabase Dashboard → Authentication → Users → Add user.

## Project Structure

```
app/
  layout.tsx              # Root layout: PrivacyProvider + TopBar + BottomNav
  page.tsx                # Redirects to /dashboard
  dashboard/page.tsx      # Unified summary: ingresos + egresos + neto + ComposedChart
  income/
    page.tsx              # Income detail: filters, stacked chart by provider, collapsible months
    new/page.tsx          # New income entry form → redirects to /income
  expenses/
    page.tsx              # Expense list: collapsible by month, delete inline, totals fijo/variable
    new/page.tsx          # New expense form (tipo fijo/variable, categoría, monto, período)
  providers/page.tsx      # CRUD providers (inline edit + delete, add with user_id)
  login/page.tsx          # Auth page
proxy.ts                  # Auth middleware (Next.js 16 convention, exports `proxy` function)
components/
  layout/
    TopBar.tsx            # Sticky header: logo + desktop nav (4 items) + privacy toggle + logout
    BottomNav.tsx         # Mobile bottom nav 4 items: Resumen|Ingresos|Egresos|Clientes
  income/
    MonthlyChart.tsx      # Stacked bar chart by provider (recharts BarChart)
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
types/index.ts            # Provider, IncomeEntry, ExpenseEntry, ExpenseCategory, MonthlyTotal, ProviderTotal
```

## Key Patterns

- **Collapsible months**: `Set<string>` state; most recent month auto-opens on first load via `useRef` guard.
- **Chart — income**: `MonthlyChart` stacked bars keyed by `provider_id`. `chartProviders` = only providers active in current filter.
- **Chart — dashboard**: `ComposedChart` with 2 `<Bar>` (ingresos indigo + egresos red) + `<Line>` (neto green).
- **Privacy**: wrap any monetary display with `mask(formatARS(value))` or `mask(formatUSD(value))`.
- **Inserts with user_id**: always `const { data: { user } } = await supabase.auth.getUser()` then pass `user_id: user.id`.
- **Expense categories**: `CATEGORY_LABELS` map in `expenses/page.tsx` for display names.

## Navigation (4 items)

```
/dashboard  → Resumen (BarChart2)
/income     → Ingresos (TrendingUp)
/expenses   → Egresos (TrendingDown)
/providers  → Clientes (Users)
```

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

RLS enabled on all 3 tables. Auth via `supabase.auth.signInWithPassword`.

## Currency Format

- ARS: `$1.250.000` (Intl es-AR, no decimals)
- USD: `U$D 1.250,00`
