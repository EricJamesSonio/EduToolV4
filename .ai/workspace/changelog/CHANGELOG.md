# Changelog

<!-- Newest entries at the top. -->

## 2026-08-27

### Added

- Organization schedule settings as tab on Organization page: global 07:00-17:00/30 (durations 15,20,25,30,45,60), preview slots, strict blocking on update if any ClassSchedule out-of-bounds/misaligned, ClassSchedulePicker now drives grid from config (TICK-ORG-001).

### Tickets

- TICK-ORG-001 — Organization schedule time-range settings (global) — merged (merge 4d0d8f51, commit 3b1996c0)
- TICK-PLATFORM-001 — Fix missing React Query invalidations — ready-for-review (4ce84a30)

### Commits

- 3b1996c0 feat(org): add global schedule time-range settings as Organization tab
- 4d0d8f51 merge(agent): TICK-ORG-001 org schedule settings

## 2026-08-26

### Fixed

- Frontend mojibake normalization: corrected UTF-8 double-encoded glyphs (— U+2014, – U+2013, … U+2026, → U+2192, − U+2212, ─ U+2500) across 5 files (SolutionSection, ResourcesSection, ProgramLevelsSection, SchoolProfileCard, SeederCard) — 30 hits, 0 remaining `â` (TICK-INFRA-002).

### Tickets

- TICK-INFRA-002 — Fix frontend mojibake (em dash, en dash, ellipsis, arrow) — completed (merge 00dfabe0 + fdad3e40)

### Commits

- fdad3e40 fix(frontend): normalize mojibake glyphs to correct UTF-8 (5 files, 30 insertions, 30 deletions)
- 00dfabe0 merge(agent): TICK-INFRA-002 fix frontend mojibake

## YYYY-MM-DD

### Added

-

### Fixed

-

### Changed

-

### Tickets

-

### Commits

-
