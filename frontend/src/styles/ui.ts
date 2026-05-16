export const ui = {
  /* ─────────────────────────────
     TYPOGRAPHY SYSTEM
  ───────────────────────────── */

  text: {
    base: "text-foreground",
    sm: "text-sm text-foreground",
    xs: "text-xs text-foreground",
    muted: "text-xs text-muted-foreground",
  },

  heading: {
    h1: "text-foreground",
    h2: "text-foreground",
    h3: "text-foreground",
  },

  label: "text-sm font-medium text-foreground",

  title: "font-bold text-base uppercase tracking-wide text-foreground",

  sectionTitle:
    "text-xs font-bold uppercase tracking-wide text-foreground",

  helperText: "text-xs text-muted-foreground",

  errorText: "text-xs text-destructive",

  /* ─────────────────────────────
     FORM ELEMENTS
  ───────────────────────────── */

  input:
    "h-10 w-full rounded-md border-2 border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring",

  textarea:
    "w-full rounded-md border-2 border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring",

  selectTrigger:
    "w-64 h-11 border-2 border-border bg-card text-foreground text-sm font-medium",

  /* ─────────────────────────────
     LAYOUT / SURFACES
  ───────────────────────────── */

  card: "rounded-lg border border-border bg-card p-6",

  section:
    "rounded-lg border border-border bg-card p-6 space-y-4",

  divider: "border-t border-border",

  /* ─────────────────────────────
     BUTTONS
  ───────────────────────────── */

  buttonPrimary:
    "bg-primary text-primary-foreground hover:opacity-90 font-medium",

  buttonOutline:
    "border border-border bg-card text-foreground hover:bg-muted",

  buttonDanger:
    "border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground",

  /* ─────────────────────────────
     BADGES / TAGS
  ───────────────────────────── */

  badge: {
    default:
      "border border-border bg-card text-foreground text-xs font-medium",
    active:
      "bg-primary text-primary-foreground text-xs font-medium",
    muted:
      "bg-muted text-muted-foreground border border-border text-xs",
  },
};