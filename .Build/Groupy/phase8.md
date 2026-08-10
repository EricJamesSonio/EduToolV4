# Phase 8 — Frontend: Polls, Pickers, Meeting Button, Nav Wiring

## Goal

Finish rendering all message types, add the creation UI for each (poll, GIF, sticker, meeting), and mount the finished feature for both educator and student.

## Steps

1. **Poll message rendering** — replace the `[Poll]` placeholder from Phase 7 with a real `PollMessageCard.tsx`: question, options as tappable choices (shows current vote, allows changing it via the vote endpoint, disables interaction once effectively closed per the backend's closed-state logic), live-updating vote counts (subscribe to `groupy:poll:vote-updated`/`groupy:poll:closed` in `useGroupySocket.ts` alongside the existing four events). Educator-only: a "Close poll" button on their own polls.

2. **Poll creation** — `PollCreatorDialog.tsx`, educator-only trigger in `SendBox.tsx` (question + dynamic option list, 2+ required).

3. **GIF rendering + picker** — replace `[GIF]` placeholder with an actual `<img>`/rendered GIF. `GifPickerPopover.tsx`: search input calling the Phase 5 backend proxy, result grid, tap to send.

4. **Sticker rendering + picker** — replace `[Sticker]` placeholder with the actual sticker asset (resolve `sticker_id` against the manifest from Phase 5). `StickerPickerPopover.tsx`: grid of the bundled sticker set, tap to send.

5. **Meeting button** — `StartMeetingButton.tsx` in the chat header, educator-only, calls the Phase 6 `start-meeting` endpoint. System messages (`type: 'system'`) render as a distinct, centered announcement style (not a normal bubble) with a "Join" link/button using the payload shape decided in Phase 6.

6. **Page mounting**:
   - `frontend/src/app/educator/classes/[classId]/groupy/page.tsx` (or wherever fits alongside the existing per-class page structure — check `classes/[classId]/` for the established sub-route pattern) — renders `GroupyChatFeature` with educator role/permissions
   - `frontend/src/app/student/classes/[classId]/groupy/page.tsx` — same component, student role/permissions
   - Nav: add a "Groupy" or "Class Chat" entry point — likely inside the per-class navigation (tabs within a class, alongside things like Grades/Attendance/Lessons) rather than top-level sidebar, since this is scoped to a specific class. Check how the existing per-class sub-navigation is structured (e.g. within `classes/[classId]/` layout or page) before adding.

## Acceptance check

- Full loop works end to end for both an educator and a student account: send text, react, educator creates a poll, both vote/see live results, send a GIF, send a sticker, educator starts a meeting and a system message with a working Join link appears for everyone
- No admin or registrar nav entry exists anywhere for this feature — confirm by checking `AdminSidebar.tsx` was not touched in this entire 8-phase build

---

## AI Prompt

```
Context: EduTool frontend. GroupyChatFeature and its sub-components exist with
placeholder rendering for gif/sticker/poll (Phase 7). Backend for polls,
gif search, stickers, and meeting-start all exist (Phases 4-6).

Task:
1. Build PollMessageCard.tsx replacing the [Poll] placeholder: shows question,
   tappable options (highlighting the current user's vote if any), calls the
   vote endpoint on tap (allowing vote changes), disables interaction if the
   poll is effectively closed. Add a "Close poll" button visible only to the
   poll's creator. Extend useGroupySocket.ts to also subscribe to
   groupy:poll:vote-updated and groupy:poll:closed, updating the relevant
   poll's local state live.

2. Build PollCreatorDialog.tsx (question + dynamic add/remove option list,
   minimum 2 options) with its trigger added to SendBox.tsx, visible only when
   the current user is the class's educator.

3. Replace the [GIF] placeholder with real GIF rendering. Build
   GifPickerPopover.tsx: a search box calling the backend's gif-search proxy,
   a result grid, tap-to-send.

4. Replace the [Sticker] placeholder with the actual sticker image (resolve
   sticker_id against the Phase 5 manifest). Build StickerPickerPopover.tsx:
   grid of the bundled set, tap-to-send.

5. Build StartMeetingButton.tsx in the chat header, visible only to the
   class's educator, calling the start-meeting endpoint. Render 'system'-type
   messages with a distinct centered/announcement style (not a normal chat
   bubble) including a working Join link/button.

6. Mount the feature: add page files under both
   frontend/src/app/educator/classes/[classId]/groupy/ and
   frontend/src/app/student/classes/[classId]/groupy/ — check the existing
   sub-route structure under classes/[classId]/ first and follow its pattern.
   Add a nav entry point scoped to the per-class navigation (not the top-level
   sidebar) — investigate how existing per-class tabs/sub-nav (e.g. Grades,
   Attendance) are wired before adding this one.

Do not add anything to AdminSidebar.tsx or any admin-facing route — this
feature has zero admin/registrar surface, by design, for this entire build.

Show me your planned file structure and the per-class nav pattern you found
before writing code, then diffs.
```
