# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### MoFi (Mobile App)
- **Slug**: financije-app
- **Type**: Expo (React Native + Web PWA)
- **Path**: `artifacts/financije-app/`
- **Preview**: `/` (root)
- **Data storage**: AsyncStorage (local persistence, no backend)
- **GitHub**: https://github.com/NenadMacar/Money-Tracker-Biz
- **Expo URL**: `exp://f58330c9-ec08-4c76-8596-9e6514481bd7-00-kp6kcvqxyopa.expo.worf.replit.dev`

#### Features
- Dashboard: balance card, income/expense totals, 6-month trend chart, recent transactions
- Transaction management: add / edit / delete income & expenses with payment method (bank/cash), contact link, category, date, description
- Contacts database: clients (blue), customers (purple), suppliers (brown) — linkable to transactions
- Reports: monthly navigation + custom date-range with quick shortcuts; income/expenses/profit/loss; payment method filter; category breakdown donut charts; CSV export (web download)
- Settings: language switcher, currency picker (25 currencies), category management (add/delete), exit button
- Dark mode: automatically follows system setting (dark palette defined in constants/colors.ts)
- PWA installable: manifest.json + icons in public/; web.display: standalone in app.json
- i18n: English (default), Italian, Serbian, German, Russian, Spanish
- **AI Assistant**: floating blue "cpu" button (bottom-left); opens chat modal "MoFi AI"; powered by OpenAI `gpt-5-mini` via API server; understands natural language in all 6 languages; supports add_transaction action with confirmation card; voice input via Web Speech API on web

#### Design Tokens
- Primary: `#1e40af` (navy blue) / dark mode: `#3b82f6`
- Income: `#22c55e` (green), Expense: `#ef4444` (red)
- Background light: `#f8fafc`, dark: `#0f172a`
- `constants/colors.ts` has both `light` and `dark` palettes; `useColors()` auto-switches

#### i18n System
- `i18n/translations.ts` — all string keys for 6 languages (`LangCode`, `LANGUAGES`, `TRANSLATIONS`)
- `context/I18nContext.tsx` — `I18nProvider`, `useI18n()` → `{ t, tf, language, locale, setLanguage, languages }`
- Language stored in AsyncStorage key `@pf_language`; locale string used with `Intl` APIs
- `tf(key, ...args)` supports `%s` substitution for dynamic strings
- **DO NOT add `+html.tsx`** — causes blank white screen with expo-router ~6.0.17

#### Key Files
- `context/FinanceContext.tsx` — app state: transactions (add/update/delete/exportCSV), categories, currency (25 supported, default EUR)
- `context/ContactsContext.tsx` — contacts state (add/update/delete)
- `context/I18nContext.tsx` — i18n context with language persistence
- `i18n/translations.ts` — ~136 keys per language, 6 languages
- `app/_layout.tsx` — root layout; wraps `I18nProvider` → `FinanceProvider` → `ContactsProvider`
- `app/(tabs)/index.tsx` — dashboard
- `app/(tabs)/transactions.tsx` — transaction list with filters + edit support
- `app/(tabs)/reports.tsx` — analytics (monthly + date-range) + CSV export button
- `app/(tabs)/contacts.tsx` — contacts list and management
- `app/(tabs)/settings.tsx` — language, currency, categories, exit button
- `components/TransactionCard.tsx` — transaction row with edit (pencil) and delete (trash) buttons
- `components/AddTransactionModal.tsx` — add/edit transaction form (accepts `editingTransaction` prop)
- `components/AiAssistantModal.tsx` — AI chat modal with message history, transaction confirmation card, voice input (web)
- `components/MiniBarChart.tsx` — 6-month trend bar chart
- `components/DonutChart.tsx` — category breakdown chart
- `hooks/useColors.ts` — returns light or dark color palette based on system color scheme
- `constants/colors.ts` — design tokens with both `light` and `dark` palettes
- `public/manifest.json` — PWA manifest
