# Changelog

<!-- Newest entries at the top. -->

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
