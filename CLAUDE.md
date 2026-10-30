# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Vite 8 + React 19 + TypeScript 5.9 (strict) + Tailwind CSS v4 + shadcn/ui. Started from the Create React App template and migrated. Screens: the hero collection (ported from a saved HTML page) and a per-hero counters page (`src/components/HeroPage.tsx`, data from `src/data/hero-counters.json` via `src/lib/heroCounters.ts`). Routing is `react-router` with `HashRouter` (`src/index.tsx`; routes `/` (static roster without player state, `HeroList.tsx`, the landing page), `/my-heroes` (the player's collection) and `/hero/:id` are declared; unknown paths redirect to `/`; hero links pass `state.from` so Back returns to the originating list in `HeroCollection.tsx`, which owns all state so filters survive navigation); pure logic lives in `src/lib/` (`heroFilters`, `profileImport`, `i18n`, `heroes`) and the 81-hero dataset in `src/data/heroes.json`. There is no global state or API layer. The upload panel (`UploadPanel.tsx`, `profileImport`, `readJsonFile`) is currently unwired from `HeroCollection` on purpose; the pieces are kept for later. Tests render components inside `renderWithRouter` (`src/test-utils/`). The UI defaults to English.

The app entry is `index.html` in the repo root (Vite convention), which loads `/src/index.tsx`. Static assets in `public/` are served from `/`.

## Commands

- `npm run dev` (alias `npm start`) — dev server on port 3010 (set in `vite.config.ts`; Vite silently falls back to the next free port if it is taken, so check the printed URL)
- `npm run build` — `tsc --noEmit` followed by `vite build`, output in `build/`
- `npm run preview` — serve the production build
- `npx tsc --noEmit` — type check only
- `npm run lint` — ESLint (flat config in `eslint.config.js`: `typescript-eslint` recommended, `react-hooks`, `react-refresh`; `build/` is ignored)
- `npm test` — Vitest in watch mode
- `npx vitest run` — single non-interactive run (use this in CI/scripts; `npm test` will hang)
- Single test file: `npx vitest run src/App.test.tsx`
- Single test by name: `npx vitest run -t "test name"`

## Notes

- Build, dev server and test config all live in `vite.config.ts` (Vitest reads it; `test` block sets `jsdom` and `globals: true`, so `test`/`expect` need no imports). Output dir is `build/`, not Vite's default `dist/`.
- `tsconfig.json` loads the `vite/client` and `vitest/globals` types; `src/vite-env.d.ts` covers asset imports (`.svg`, CSS).
- Styling is Tailwind CSS v4 via the `@tailwindcss/vite` plugin (in `vite.config.ts`). Config is CSS-first: `src/index.css` is just `@import "tailwindcss";` and any theme customisation goes in an `@theme` block there — there is no `tailwind.config.js`. Prefer utility classes in JSX over adding new `.css` files.
- UI components are shadcn/ui (`radix-nova` style, Radix primitives, Lucide icons, Geist font), configured in `components.json`. `src/components/ui/` is generated code that we own: add components with `npx shadcn@latest add <name>` and edit them freely. Class merging uses `cn()` from `src/lib/utils.ts`, which re-exports the `cn` package (shadcn's own replacement for `clsx` + `tailwind-merge`; it is intentional, don't remove it). Theme tokens (`--primary`, `--background`, dark mode, etc.) live in `src/index.css`.
- Imports use the `@/` alias for `src/` (configured in both `tsconfig.json` `paths` and `vite.config.ts` `resolve.alias`; Vitest picks it up from the Vite config).
- ESLint turns off `react-refresh/only-export-components` for `src/components/ui/**` because generated components export variant helpers next to the component.
- Test setup is `src/setupTests.ts` (`@testing-library/jest-dom/vitest`).
- `@types/node` is kept at `^24`: Vitest 5 declares a peer range of `^22 || >=24`, so an older pin causes `ERESOLVE` on install.
- `@testing-library/user-event` is still on v13 (older API than v14: no `userEvent.setup()`, calls are synchronous).
- `package.json` has `"type": "module"`, so config files at the repo root are ESM.
