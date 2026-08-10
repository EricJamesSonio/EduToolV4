# Phase 5 — Backend: GIF Search Proxy + Sticker Manifest

## Goal

Server-side Giphy search proxy (API key never touches the client), a static sticker manifest, and extending the send-message endpoint from Phase 2 to accept `gif` and `sticker` message types.

## Steps

1. **Env**: add `GIPHY_API_KEY` to `backend/.env` and `.env.sample`, following the exact pattern of how `AGORA_APP_ID`/`AGORA_APP_CERT` or `OPENROUTER_API_KEY` are already registered in `configs/env.validation.ts` and read via `ConfigService`.

2. **Endpoint**: `GET /groupy/gif-search?q=<query>` — server calls the Giphy search API using the server-side key, returns a trimmed result set (id + preview URL + full URL per result — don't proxy Giphy's entire raw response). Membership isn't meaningful to check here (no `classId` in this search, it's just "give me GIF options to pick from") — auth-guarded (must be logged in) is sufficient, no class-membership check needed for search itself.

3. **Sticker manifest**: a static JSON file (e.g. `backend/src/modules/groupy/data/stickers.data.ts` or served as a static frontend asset — decide based on whichever is simpler given this codebase already has a `public/` static-serving convention; check how `public/badges/` or similar static asset folders are currently served before deciding backend vs. frontend-only). Each entry: `{ id, label, assetPath }`. No database table for this — it's a fixed, versioned-in-code list.

4. **Extend `POST /groupy/:classId/messages`** from Phase 2 to accept:
   - `{ type: 'gif', gifUrl: string }` — store in `GroupyMessage.gif_url`
   - `{ type: 'sticker', stickerId: string }` — store in `GroupyMessage.sticker_id`, validate `stickerId` exists in the manifest before accepting (reject unknown sticker ids with a clear error, don't silently store garbage)
     All existing membership-check and broadcast behavior from Phase 2 applies unchanged — this is additive to the same endpoint's DTO, not a new endpoint.

## Acceptance check

- GIF search returns results without ever exposing the API key in the response or in network-visible request params from the client
- Sending a message with an invalid `stickerId` is rejected, not silently accepted
- Existing text message sending from Phase 2 still works unchanged

---

## AI Prompt

```
Context: EduTool backend (NestJS). Groupy core messaging (Phase 2), reactions
(Phase 3), polls (Phase 4) exist. POST /groupy/:classId/messages currently
only accepts { type: 'text', body }.

Task:
1. Add GIPHY_API_KEY to backend/.env, .env.sample, and configs/env.validation.ts,
   matching the exact pattern already used for AGORA_APP_ID / OPENROUTER_API_KEY
   in those same files.

2. Add GET /groupy/gif-search?q=<query> — calls Giphy's search API server-side
   using the configured key, returns a trimmed array of { id, previewUrl, url }
   per result (do not forward Giphy's full raw response to the client). Guard
   with the standard AuthGuard only — no class-membership check needed here,
   this endpoint isn't scoped to a class.

3. Decide where the sticker manifest belongs: check how existing static assets
   like public/badges/ are served in this codebase, and either add a backend
   data file (backend/src/modules/groupy/data/stickers.data.ts, an array of
   { id, label, assetPath }) or a frontend-only static manifest — pick whichever
   matches this codebase's existing convention for static asset lists, and
   explain which you chose and why.

4. Extend the existing POST /groupy/:classId/messages DTO and handler (from
   Phase 2) to also accept { type: 'gif', gifUrl } and { type: 'sticker',
   stickerId }. For sticker messages, validate stickerId exists in the manifest
   before saving — reject with a clear error if not. Do not create new
   endpoints for these — extend the existing one. All membership-check and
   gateway-broadcast behavior from Phase 2 must keep working for these new
   types too.

Show me your manifest-location decision and reasoning first, then diffs.
```
