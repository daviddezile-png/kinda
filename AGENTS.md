<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Building Kinda

Requirements live in `elimu-yangu-specs/`. Those specs assume Next 14 / NextAuth
v5 / a `src/` layout — this repo does not use that stack. **Before following any
spec code, read `SPEC-DEVIATIONS.md`** for the authoritative how-to mapping
(app-at-root, async `params`, NextAuth v4, ESM `next.config.ts`).
