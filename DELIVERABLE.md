# Chatstack Boilerplate Hardening — Summary

## Highlights
- Rebuilt `@chatstack/generator` so outputs land in the workspace roots, honour package paths, and emit controller/service/repository/frontend scaffolds that comply with `AGENTS.md` guardrails.
- Aligned the authentication + messaging backend with the OpenAPI contract: validated DTOs, structured responses (`UserPublic`, `TokenResponse`, `PageMessage`), JWT-based sender resolution, and consistent exception payloads.
- Upgraded the BFF proxy and Next.js frontend so registration, login, guarded navigation, and chat message creation/search all work end-to-end with the stored access token.
- Consolidated Java build wiring (OpenAPI task inside `app/backend/build.gradle.kts`), added a shared password encoder, and refreshed the UI package typings/exports for workspace consumers.

## Generator Usage
1. Ensure you are on Node ≥ 20 (`nvm use` respecting `.nvmrc`).
2. Run `pnpm --filter @chatstack/generator plop domain` and follow prompts.
   - Backend output: entity + repository + service + controller + Flyway migration scaffold.
   - Frontend output: list/detail/new routes with `_schema` metadata wired for `@chatstack/ui`.
3. Optional non-interactive smoke test:
   ```bash
   node -e "const np=require('node_modules/.pnpm/node-plop@0.32.2_@types+node@24.5.2/node_modules/node-plop/src/index.js').default; (async () => { const plop = await np('./packages/generator/plopfile.cjs'); const g = plop.getGenerator('domain'); await g.runActions({ name: 'Sample', package: 'com.example.app.sample', fields: 'title:string' }); })();"
   ```
   *(Remove generated files afterwards if you run the sample.)*

## Backend Notes
- `com.example.app.user` now exposes spec-aligned DTOs; register returns `201` with `UserPublic`, login returns `TokenResponse`, and JWT payloads embed `senderId` for chat usage.
- `MessageController` builds `PageResponse<MessageResponse>` objects, enforces sender/token consistency, and relies on `MessageService` commands so the service layer stays DTO-free.
- Global exception handling normalises errors (`error`/`message`) and reuses `ResponseStatusException` status codes.
- `SecurityConfig` exposes a shared `PasswordEncoder`, while `AuthService` performs duplicate-email checks and consistent sender-id derivation.

## Frontend Notes
- `app/frontend/lib/auth.ts` centralises token decode/persistence; `AuthNav`, `Guard`, and `useSession` keep navigation stateful and enforce redirects.
- Login/Register screens use `@chatstack/ui` form components and surface backend messages; successful login persists the JWT and redirects to the requested page.
- The messages view adds channel filters, SWR-backed pagination/search, an inline composer that auto-refreshes results, and a detail screen at `/messages/[id]`.
- The bridge proxy now filters forbidden headers and propagates JSON content-types, preventing subtle 400s from upstream.

## Validation
- `pnpm --filter @chatstack/ui build`
- `pnpm exec tsc --pretty false --noEmit -p app/frontend/tsconfig.json`
- `./gradlew :app:backend:test`

## Next Steps
- Hook the session utilities into other routes (e.g., dashboard) and expand SWR caches if real-time updates are needed.
- Add API contract tests (Spring MockMvc + Next e2e) to lock down the new auth/chat flows before wider team onboarding.
