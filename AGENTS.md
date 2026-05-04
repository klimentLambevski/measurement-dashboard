# Repository Guidelines

## Project Structure & Module Organization

This is a Supabase-focused project. Root-level `package.json` and `package-lock.json` manage the Supabase CLI dependency. Supabase configuration lives in `supabase/config.toml`. Edge functions are organized under `supabase/functions/<function-name>/`; the current function is `supabase/functions/ingest-measurement/` with its entry point in `index.ts` and Deno config in `deno.json`.

Keep each edge function self-contained: place request handling, validation, and function-specific helpers inside its function directory unless shared code is introduced intentionally.

## Build, Test, and Development Commands

- `npm install`: install the local Supabase CLI dependency from `package-lock.json`.
- `npx supabase start`: start the local Supabase stack using `supabase/config.toml`.
- `npx supabase functions serve ingest-measurement`: serve the edge function locally.
- `curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ingest-measurement' --header 'Content-Type: application/json' --data '{"name":"Functions"}'`: smoke-test the current sample endpoint.
- `npx supabase stop`: stop local Supabase services.

There are no npm scripts yet; add them when commands become stable.

## Coding Style & Naming Conventions

Edge functions are TypeScript running on Deno. Use two-space indentation, semicolons only if the file adopts them consistently, and explicit response headers such as `Content-Type: application/json`. Name function directories with kebab-case, for example `ingest-measurement`. Use descriptive camelCase names for variables and functions.

Keep request parsing and response creation straightforward. Validate incoming JSON before using fields, and return clear HTTP status codes for invalid input or failures.

## Testing Guidelines

No automated test suite is present. For now, validate changes by running the function locally with `npx supabase functions serve <name>` and exercising success and error cases with `curl` or an API client.

When tests are added, prefer Deno tests colocated with the function, such as `supabase/functions/ingest-measurement/index.test.ts`, and document the exact test command in `package.json`.

## Commit & Pull Request Guidelines

This repository has no commit history, so no existing convention can be inferred. Use concise, imperative commit messages such as `Add measurement ingestion validation` or `Document local Supabase workflow`.

Pull requests should include a short description, local verification steps, linked issue or task context when available, and screenshots or request/response examples for API behavior changes. Note any required environment variables or Supabase configuration changes explicitly.

## Security & Configuration Tips

Do not commit real service keys, JWT signing keys, or `.env` files. Use local environment variables for secrets referenced by Supabase config. Treat example tokens in comments as local-development samples only.
