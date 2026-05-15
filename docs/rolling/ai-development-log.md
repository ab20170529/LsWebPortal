# LsERPPortal AI Development Log

这个文件是团队 AI 的滚动经验库。每次完成耗时、跨模块、排障型、或会影响后续协作路径的工作，都要追加一条短记录，让下一位同事或 AI 不必重新摸索。

## When To Append

- 任务花了明显调查时间。
- 确认了真实入口、包边界、路由协议、登录/system gate 规则或验证陷阱。
- 修复跨越多个模块。
- 从 `LsAITool` 迁移能力时确认了可复用路径或不能复用的坑。
- 发现了以后 AI 很可能重复犯的误判。

## Entry Template

```markdown
## YYYY-MM-DD - Task name

- Entry points:
- Lesson:
- Files changed:
- Validation:
- Next handoff:
```

## 2026-05-13 - Frontend mainline moved to LsERPPortal and LumClaw

- Entry points: `AGENTS.md`, `.codex/skills/lserp-portal-platform/SKILL.md`, `.codex/skills/lserp-portal-evolution/SKILL.md`
- Lesson: `LsAITool` is no longer the maintained frontend mainline. New Portal-facing work belongs in `LsERPPortal`; `LsAITool` is only a migration source or historical reference.
- Files changed: project skills and this rolling log.
- Validation: skill metadata validation should be run after skill edits with `quick_validate.py`.
- Next handoff: start Portal work from `docs/handover/README.md`, then confirm the real runtime entrypoint before editing.

## 2026-05-15 - Login tenant options and business DB selection preserve platform database

- Entry points: `apps/portal/src/features/auth/services/auth-service.ts`, `apps/portal/src/features/auth/services/tenant-options.ts`, `apps/portal/src/features/auth/hooks/use-login-form-controller.ts`, `apps/portal/src/features/auth/components/tenant-selector.tsx`, backend `PlatformTenantService.listLoginTenants()`, backend `/api/auth/login/identity`, backend `/api/auth/business-dbs`.
- Lesson: Java auth already returns `__platform__` as the default platform database option before real tenant rows. Portal must not filter it out. Only `tenantCode=__platform__` or `tenantType=PLATFORM_DB` is the platform pseudo-option; other non-`__platform__` rows, including rows whose `tenantType` is `PLATFORM`, must still be submitted as tenant logins because backend `AuthService.hasRealTenantCode()` only keys on the tenant code.
- Lesson: functional alignment with LumClaw means matching the login state machine, not copying the page style. Platform database selection must call `/api/auth/login/identity` without a real tenant code, then navigate to Portal's `/systems` page. Portal business DB selection is the left-side section inside `/systems`, not a separate intermediate page; `/systems` fetches `/api/auth/business-dbs` for non-company sessions unless the backend returns `businessDbRequired=false`.
- Files changed: login tenant option normalization, identity-login API call, login submit tenant-code handling, login redirect back to `/systems`, removal of the standalone business DB page route, tenant selector labels, auth contract docs, handover docs, repo-local skill references, and this rolling log.
- Validation: `Invoke-RestMethod http://127.0.0.1:9001/api/auth/tenants` returned `__platform__`, `ls002_ai`, and `ls001_test`; `pnpm exec tsx -` helper check labels them as `平台库`, `AI平台（租户库）`, `远望测试库（租户库）`; `pnpm build` passed. Full `pnpm typecheck` is still blocked by existing `portal-sso-page.tsx` and BI page errors outside this task.
- Next handoff: if this regresses again, inspect `loginWithIdentity()`, `fetchTenantOptions()`, `tenant-options.ts`, `use-login-form-controller.ts`, and `system-access-page-view.tsx` before touching login UI layout; preserve the Portal `/systems` combined business-library/system-selection page while aligning only the backend-driven behavior with LumClaw.

## 2026-05-15 - Platform default library auth keeps master datasource

- Entry points: Portal `/designer`, `packages/platform/http/src/index.ts`, backend `lserp-server/src/main/java/com/lserp/server/security/JwtAuthenticationFilter.java`, `CompanyDynamicDataSourceService.ensureBusinessDataSource()`.
- Lesson: A Portal platform-default login can issue a company-stage token with `tenantCode=__platform__`, `companyKey=master`, and `datasourceCode=master`. Backend auth must treat that as the signed platform/default datasource, not as a real tenant business database lookup under `__platform__`; otherwise many designer APIs surface the misleading `Authentication is required.` wrapper after the filter rejects `当前租户没有该业务库，或业务库已停用。`.
- Files changed: backend JWT datasource resolution and a focused filter test.
- Validation: `./mvnw.cmd -pl lserp-server -Dtest=JwtAuthenticationFilterTests test`; `./mvnw.cmd -pl lserp-server test`.
- Next handoff: for Portal-wide 401s after a successful platform-default login, check `LserpPlatServer/logs/tools-java-api.log` for `jwt_filter rejected` before debugging individual designer endpoints.

## 2026-05-15 - System gate keeps business selection concise and actionable

- Entry points: `apps/portal/src/pages/system-access-page-view.tsx`, `apps/portal/src/styles/system-gate.css`.
- Lesson: Portal `/systems` is an operator page. Keep the left business-library area focused on current state and selectable libraries; avoid explanation blocks, raw server address noise, or duplicated warnings unless they unblock an action.
- Lesson: the top-right user area must expose real account actions. At minimum, the user dropdown should support returning to system selection and signing out through `clearAuthSession()`, `signOut()`, and `navigate('/')`.
- Files changed: system gate left-panel copy, business-library card content, user dropdown menu, sign-out action, and system-gate styles.
- Validation: `pnpm build` passed. Full `pnpm typecheck` is still blocked by existing `portal-sso-page.tsx` and BI page errors outside this task.
- Next handoff: when adjusting `/systems`, preserve the combined business-library/system-selection workflow and keep the topbar user controls functional rather than decorative.

## 2026-05-15 - Simple process designer iframe must use Portal proxy

- Entry points: Portal `/designer`, `apps/portal/public/simple-process-designer/assets/index-CGa-TtJU.js`, historical source `LserpPlat/LsAITool/subapps/simple-process-designer/src/lib/api-config.ts`.
- Lesson: The embedded Vue simple-process-designer bundle can carry a build-time `VITE_API_BASE_URL` such as `http://127.0.0.1:8080`; when hosted under Portal this bypasses the Vite proxy and browser requests fail with `ERR_CONNECTION_REFUSED` or CORS symptoms. Portal-hosted child bundles should use same-origin API URLs so `/api/...` is served through `localhost:9001`.
- Files changed: patched the Portal-hosted simple-process-designer built asset currently served by the iframe, and added a source guard in `LsAITool/subapps/simple-process-designer/src/lib/api-config.ts` so production builds ignore loopback API base URLs.
- Validation: `npm run typecheck` and `VITE_API_BASE_URL= VITE_API_SAME_ORIGIN=true npm run build` passed in the child app; `rg "127\.0\.0\.1:8080|localhost:8080" apps/portal/public/simple-process-designer` returned no matches; unauthenticated `curl http://127.0.0.1:9001/api/process-designer/options/roles` reached backend and returned the expected standard 401 instead of connection refusal.
- Next handoff: when rebuilding this child app from `LsAITool`, ensure the production asset is built with same-origin API settings, such as no explicit `VITE_API_BASE_URL` or `VITE_API_SAME_ORIGIN=true`, before copying it into Portal public assets.
