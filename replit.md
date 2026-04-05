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
- Transaction management (add/delete income & expenses)
- Reports screen with monthly navigation, category breakdown, net balance
- Settings screen for category management
- Supports Bosnian language UI (KM currency)

#### Key Files
- `context/FinanceContext.tsx` — main app state (transactions, categories, totals)
- `app/(tabs)/index.tsx` — dashboard
- `app/(tabs)/transactions.tsx` — transaction list with filters
- `app/(tabs)/reports.tsx` — analytics and reports
- `app/(tabs)/settings.tsx` — category management
- `components/TransactionCard.tsx` — individual transaction row
- `components/AddTransactionModal.tsx` — add transaction form
- `components/MiniBarChart.tsx` — 6-month trend bar chart
- `components/DonutChart.tsx` — category breakdown chart
- `constants/colors.ts` — design tokens (navy blue primary, green income, red expense)
