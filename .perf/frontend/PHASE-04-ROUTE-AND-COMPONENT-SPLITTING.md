# Phase 04 — Route and Component Splitting

**Priority:** Medium–High based on measured route bundle size  
**Risk:** Medium  
**Goal:** Load heavy, optional feature UI only when users need it.

## Audit targets

The frontend contains many role-specific routes and feature areas. The agent should identify heavy modules from actual import graphs and bundle reports, not by folder size alone.

Potential categories to inspect include:
- Charts and analytics visualizations.
- Rich text editors, assessment builders, grading tools, and complex data tables.
- Import/export or spreadsheet processing.
- Enrollment setup wizards and large admin workflows.
- Media, presentation, and meeting interfaces.
- Dialogs or panels that are rarely opened.

These are investigation categories, not confirmed optimization targets.

## Rules

- Prefer route-level code splitting where route boundaries naturally isolate a feature.
- Use `next/dynamic` for genuinely heavy components that are not needed for the initial view.
- Keep loading fallbacks meaningful and sized to avoid layout shifts.
- Do not lazy-load small shared controls or essential above-the-fold content without evidence.
- Check whether a component is already split by Next.js before adding another boundary.
- Preserve accessibility, keyboard behavior, focus management, error states, and deep links.

## Validation

- Production build passes.
- Compare route chunks before/after where tooling permits.
- Open affected routes directly and through client-side navigation.
- Test loading, error, empty, and populated states.
- Confirm dialogs/panels still open and interactive behavior remains intact.

## Exit criteria

The initial route avoids loading a verified heavy optional feature, with no broken route or interaction.
