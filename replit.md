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

### Poslovne Financije (Mobile App)
- **Slug**: financije-app
- **Type**: Expo (React Native)
- **Path**: `artifacts/financije-app/`
- **Preview**: `/` (root)
- **Data storage**: AsyncStorage (local persistence, no backend)

#### Features
- Dashboard with balance card, income/expense summary, monthly trend bar chart
- Transaction management (add/delete income & expenses) with payment method tracking (bank/cash)
- Reports: monthly navigation + custom date-range with quick shortcuts; income/expenses/profit/loss; payment method filter; category breakdown charts
- Settings: language switcher, currency picker (22 currencies), category management (add/delete)
- Full i18n: English (default), Bosnian, Croatian, Serbian, German, French
- Default currency: KM/BAM; 22 currencies supported

#### i18n System
- `i18n/translations.ts` — all string keys for 6 languages (`LangCode`, `LANGUAGES`, `TRANSLATIONS`)
- `context/I18nContext.tsx` — `I18nProvider`, `useI18n()` → `{ t, tf, language, locale, setLanguage, languages }`
- Language stored in AsyncStorage key `@pf_language`; locale string used with `Intl` APIs
- `tf(key, ...args)` supports `%s` substitution for dynamic strings

#### Key Files
- `context/FinanceContext.tsx` — main app state (transactions, categories, currency; default categories in English)
- `context/I18nContext.tsx` — i18n context with language persistence
- `i18n/translations.ts` — all translations for 6 languages
- `app/_layout.tsx` — root layout; wraps with `I18nProvider` → `FinanceProvider`
- `app/(tabs)/index.tsx` — dashboard
- `app/(tabs)/transactions.tsx` — transaction list with filters
- `app/(tabs)/reports.tsx` — analytics and reports (monthly + date-range modes)
- `app/(tabs)/settings.tsx` — language, currency, and category management
- `components/TransactionCard.tsx` — individual transaction row with payment badge
- `components/AddTransactionModal.tsx` — add transaction form
- `components/MiniBarChart.tsx` — 6-month trend bar chart
- `components/DonutChart.tsx` — category breakdown chart
- `constants/colors.ts` — design tokens (navy blue primary, green income, red expense)
