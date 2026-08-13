# AGENTS.md

## Developer Commands

- **Dev Server**: `npm run dev` (or `bun dev`)
- **Build**: `npm run build`
- **Lint**: `npm run lint` (`next lint`, deprecated in Next 16 — prints a deprecation warning; exits 0 on warnings, 1 on errors)
- **Typecheck**: `npx tsc --noEmit`
- **Verification**: Run `npm run lint` then `npx tsc --noEmit` to verify code quality.

## Architecture & Structure

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript.
- **Routes (`app/`)**: Next.js App Router structure.
  - `/` (Home), `/catalogo`, `/categoria/[slug]`, `/producto/[slug]`, `/checkout`, `/cuenta`, `/shop`
  - `/admin/*` (Dashboard, Pedidos, Productos, Categorías, Inventario, Clientes, Analytics, Promociones, Configuración)
- **Source (`src/`)**: Imports use the `@/*` alias (resolves to `./src/*`).
  - `src/components/ui/`: Base UI primitives (shadcn/ui + Radix UI).
  - `src/components/shop/`: E-commerce components (Header, ProductCard, CartDrawer, SearchOverlay).
  - `src/components/admin/`: Admin sidebar and dashboard elements.
  - `src/data/`: Static mock datasets (`catalog.ts`, `admin.ts`).
  - `src/store/`: Global client state via React Context (`shop.tsx` for cart, wishlist, cart drawer state).
  - `src/lib/`: Utilities and helpers (`utils.ts`, `format.ts`).

## Styling & Design System

- **Tailwind CSS v4**: Imported in `app/globals.css` with `@import "tailwindcss";` and `@tailwindcss/postcss`.
- **Aesthetic**: Minimalist high-fashion editorial look with strict zero-radius corners (`--radius: 0px`) and OKLCH color scale (`--cream`, `--ink`, `--stone`).
- **Custom Utilities (`app/globals.css`)**:
  - Typography: `display`, `display-xl`, `display-lg`, `display-md` (Bricolage Grotesque) and `label-xs`, `label-sm` (uppercase micro-caps).
  - Effects & Surfaces: `edge`, `grain`, `link-underline`, `hover-lift`, `no-scrollbar`.
  - Animations: `animate-rise`, `animate-reveal`, `animate-marquee`.

## Conventions & Quirks

- `components.json` lists `src/styles.css`, but the active CSS file is `app/globals.css`.
- Path aliases: Use `@/components/...`, `@/data/...`, `@/lib/...`, `@/store/...`.
- Static mock data in `src/data/catalog.ts` powers product listings and categories.
- Verification relies on `npm run lint` and `npx tsc --noEmit` (no automated unit testing suite is configured).
- `bunfig.toml` enforces a 24h supply-chain guard (`minimumReleaseAge = 86400`): `bun install` blocks any package published under a day ago. Add to `minimumReleaseAgeExcludes` only with user confirmation.
