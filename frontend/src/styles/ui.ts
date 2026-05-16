export const ui = {
  /* ─────────────────────────────
     TYPOGRAPHY SYSTEM (NEW)
  ───────────────────────────── */

  text: {
    base: "text-base text-black",
    sm: "text-sm text-black",
    xs: "text-xs text-black",
    muted: "text-xs text-black/70",
  },

  heading: {
    h1: "text-2xl font-bold text-black",
    h2: "text-xl font-bold text-black",
    h3: "text-lg font-bold text-black",
  },

  label: "text-sm font-medium text-black",

  title: "font-bold text-base uppercase tracking-wide text-black",

  sectionTitle:
    "text-xs font-bold uppercase tracking-wide text-black",

  helperText: "text-xs text-black/70",

  errorText: "text-xs text-black",

  /* ─────────────────────────────
     FORM ELEMENTS
  ───────────────────────────── */

  input:
    "h-10 w-full rounded-md border-2 border-black bg-white px-3 text-sm text-black placeholder:text-neutral-400 focus:outline-none",

  textarea:
    "w-full rounded-md border-2 border-black bg-white px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none",

  selectTrigger:
    "w-64 h-11 border-2 border-black bg-white text-black text-base font-medium",

  /* ─────────────────────────────
     LAYOUT / SURFACES
  ───────────────────────────── */

  card: "rounded-lg border-2 border-black bg-white p-6",

  section:
    "rounded-lg border-2 border-black bg-white p-6 space-y-4",

  divider: "border-t-2 border-black",

  /* ─────────────────────────────
     BUTTONS
  ───────────────────────────── */

  buttonPrimary:
    "bg-black text-white hover:bg-black/90 font-medium",

  buttonOutline:
    "border-2 border-black bg-white text-black hover:bg-black hover:text-white",

  buttonDanger:
    "border-2 border-black text-black hover:bg-black hover:text-white",

  /* ─────────────────────────────
     BADGES / TAGS
  ───────────────────────────── */

  badge: {
    default: "border-2 border-black bg-white text-black text-xs font-medium",
    active: "bg-black text-white text-xs font-medium",
    muted: "bg-white text-black/70 border border-black/30 text-xs",
  },
}