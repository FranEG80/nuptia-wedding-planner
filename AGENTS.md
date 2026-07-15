# Repository Guidelines

## Project Structure & Module Organization

This is a private Next.js 16 App Router project. Application routes and layouts live in `app/`; the root shell is `app/layout.tsx`, the home route is `app/page.tsx`, and global styles are in `app/globals.css`. Static assets belong in `public/`. Project configuration is kept at the repository root: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, and `pnpm-workspace.yaml`. Local agent skills live in `.agents/skills/`.

## Build, Test, and Development Commands

Use pnpm for dependency management; `pnpm-lock.yaml` is the lockfile.

- `pnpm dev`: start the Next.js development server.
- `pnpm build`: create a production build.
- `pnpm test`: run the invitation/domain unit tests.
- `pnpm test:d1`: run the local D1 atomicity integration test after migration and seed.
- `pnpm start`: run the built production app.
- `pnpm lint`: run ESLint with Next.js core web vitals and TypeScript rules.

## Coding Style & Naming Conventions

Write TypeScript and React using strict types from `tsconfig.json`. Prefer App Router conventions, server components by default, and client components only when browser APIs, state, or event handlers require them. Use the `@/*` path alias for root imports when it improves readability. Keep components and files focused; use PascalCase for React components and camelCase for functions and variables. Styling uses Tailwind CSS v4 via `app/globals.css`.

## Testing Guidelines

Tests use Node's test runner through `tsx`. Unit tests live in `tests/`; D1 integration tests live in `tests/d1/` and expect the local database to be migrated and seeded. Prefer names such as `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines

The current history only contains the initial Create Next App commit, so no custom convention is established. Use short, imperative commit messages such as `Add Base UI dialog`. Pull requests should include a concise summary, linked issue when relevant, screenshots for UI changes, and notes about lint/build results.

## Agent-Specific Instructions

<!-- intent-skills:start -->
Before substantial work:
- Skill check: run `pnpm dlx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

<!-- BEGIN:nextjs-agent-rules -->
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
