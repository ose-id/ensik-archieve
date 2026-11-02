# AGENTS.md

Guidance for AI agents and contributors working in this repo.

## Project

Ensik Archive: a private image gallery for the Ensik community.

- **Nuxt 4** (`app/` directory), **Vue 3.6 RC in Vapor mode**, Nitro server in `server/`.
- **UnoCSS** with `presetWind4`, config in `uno.config.ts`.
- **Vercel Blob** stores the images. There is no database.
- **Auth** (`nuxt-auth-utils`) has two levels. A site password gives view-only access. Discord OAuth with a guild role is required to upload, delete, download and open the dashboard.
- UI copy is in Indonesian. The visual language follows Pinterest: plain surfaces, 16px-radius tiles without shadows, pill buttons, outline icons that fill when active.

## Routes

- `/`: endless, shuffled masonry gallery (`OrganismImageGallery`).
- `/profile`: the signed-in user's own photos (Pinterest-style profile with sort tabs, a masonry grid, and download/delete on each tile). `/dashboard` redirects here with a 301 (`routeRules` in `nuxt.config.ts`).
- `/login`: site password.

The masonry pages share `useArchiveMasonry`, `useArchiveColumns`, `MoleculesMasonrySkeleton` and `OrganismImageViewer`.

## Commands

```bash
bun install
bun run dev
bun run lint        # eslint (antfu config + UnoCSS rules)
bun run lint:fix
bun run typecheck   # nuxt typecheck (vue-tsc)
bun run build
```

Run `lint`, `typecheck` and `build` before committing.

## Vue / Vapor rules

Every SFC is a Vapor component (`<script setup vapor>`, or `<template vapor>` when there is no script). Nuxt runs Vapor in interop mode.

- Register every Nuxt composable **before the first `await`** in setup, or it can lose the Nuxt context. Pattern: `const req = useFetch(...)`, set up everything else, then `await req` last.
- No `v-memo`, `$emit`, `$slots` or `$attrs` in templates. Use `defineEmits`/`useSlots()`/`useAttrs()`.
- Component template refs don't expose `$el`.
- Private, per-user data is fetched with `server: false`, and a skeleton is rendered until mounted. If the server and client render different `v-if` branches, Vapor hydration inserts nodes into the wrong element.
- `getCurrentInstance()` is `null` in Vapor, so avoid helpers that depend on it (for example VueUse `useMounted`). Use `onMounted` with a `shallowRef`.
- Prefer CSS `dark:` variants over `isDarkMode` when deciding what to render. The server can't know the color mode.

## UnoCSS rules

Follow the official docs at <https://unocss.dev>.

- **Wind4 has a built-in reset.** Don't add `border-solid`, `border-none`, `bg-transparent`/`p-0` on buttons, or `m-0`/`list-none` resets. The blocklist rejects some of these.
- **Class-only.** Attributify is disabled. Write every utility in `class`.
- **Variant groups** are enabled: `dark:(bg-neutral-900 text-white)`.
- **Theme tokens** come before arbitrary values. `text-[Npx]` is blocklisted, so use `text-2xs`, `text-xs` and so on. Breakpoints live in `shared/utils/breakpoints.ts` and are shared by UnoCSS and `useBreakpoints`.
- **Shortcuts** in `uno.config.ts` cover repeated patterns: `text-muted`, `text-strong`, `icon-btn`, `segmented*`, `nav-tab`/`nav-pill`/`nav-fab` (bottom nav), `rail-item`/`rail-item-active`/`rail-tooltip` (side rail), and `tile-dim`/`tile-action`/`pill-btn`/`pill-btn-neutral` (Pinterest-style tiles and buttons). Elements that use group variants still need a literal `group` class.
- Shortcuts are emitted before utilities. A `:hover`/`:active` rule inside a shortcut beats a plain utility on the same element, so don't combine a shortcut with an override of its pseudo-state colors.
- When two utilities of the same property sit on one element (for example a component's `rounded-md` plus a passed `rounded-xl`), the generated CSS order decides which wins, not the class order. Don't rely on it.
- **Icons:** mingcute through `presetIcons` (`i-mingcute:name`). Unknown names warn at build time. Size icons with `size-*`. Navigation uses an outline icon and switches to the `-fill` variant when the page is active. Class strings that only appear in `.ts` files need `// @unocss-include`.
- `content-visibility: auto` must be paired with `contain-intrinsic-size` (the content-box size), or off-screen items collapse.

## Data and API

- `server/utils/archive-image.ts` keeps an index of every archive blob, because Blob `list()` only orders by pathname. With Upstash Redis (`NUXT_REDIS_URL`/`NUXT_REDIS_TOKEN`, see `server/utils/kv.ts`) the index is shared and rebuilt from Blob every 10 minutes, and each instance caches it for 15s. Without Redis, each instance relists the store every 60s. Uploads and deletes update both copies.
- Rate limits (`assertRateLimit`, which is async) use an atomic Redis `MULTI` counter, and fall back to memory when Redis is missing or unreachable.
- Ownership is **only** the `users/<discordId>/` folder. Legacy root files (`<username>-img-….jpg`) belong to nobody until `bun run migrate:legacy-owners --map owners.json [--apply]` moves them. The command is a dry run by default, and the map is `{ "username": "discordId" }`.
- Resized images are cached in Blob under `variants/<hash of source path>/`. The cache key includes the source etag. Variants are excluded from the index and deleted with their source. `/api/media` answers 304s and cache hits from the index without downloading the original, and sets `X-Archive-Variant: hit|miss`.
- The viewer (`OrganismImageViewer`) syncs the open photo to `?foto=<id>`. Opening pushes a history entry, stepping replaces it, and the back button closes the viewer. It only reacts on its owner page, since KeepAlive keeps the gallery's viewer alive. On touch screens, swipe left/right steps, swipe down closes, pinch or double-tap zooms, and a drag pans while zoomed.
- Dialogs, the viewer and the account sheet use `useFocusTrap`.
- Pages use keyset cursors. With no `seed`, `/api/images` is chronological. With `seed` it returns a stable shuffle, and the gallery uses a new seed on every page load and loops endlessly. `/api/user-images` is chronological and supports `order`.
- Uploads store intrinsic dimensions in the pathname (`uuid-WxH-name.ext`). Legacy files have none and report their size after loading.

## Testing in a browser

There is no `.env` locally. To check the UI, copy the repo to a scratch folder, alias `@vercel/blob` to an in-memory mock with seeded images, and add a dev-only route that signs in a fake Discord user. Never commit those test files.
