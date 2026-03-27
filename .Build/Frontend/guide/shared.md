
================================================================================
  F. SHARED COMPONENT BEHAVIORS (quick reference)
================================================================================

  ConfirmDialog
    Props: title, message, confirmLabel, cancelLabel, onConfirm
    Always has "Cancel" and confirm action button
    Destructive actions: confirm button uses red/danger style

  DataTable (TanStack Table wrapper)
    Supports: sortable columns, pagination, row selection
    Empty state: EmptyState component ("No [items] found.")
    Loading state: LoadingSpinner overlay on table

  StatusBadge
    Colors by status:
      Active / Present / Submitted / Passed = green
      Pending / Draft / Upcoming = yellow/amber
      Blocked / Dropped / Absent / Failed = red
      Suspended / Late = orange
      Graduated / Ended / Archived = gray
      Transferred = blue-gray

  NotificationDropdown
    Triggered by bell icon in Topbar
    Panel: max-height scrollable list
    Each item: icon (type-based) | message text | relative timestamp (e.g. "2 hours ago")
    No mark-as-read (simple list per spec)
    "No notifications" empty state

  SearchInput
    Debounced (300ms) API call or client-side filter
    Clear button (×) when value present

  Pagination
    Displays: "Showing X–Y of Z results"
    Page size selector (10 / 25 / 50)
    Prev / Next + page number buttons

  Toast notifications
    Success (green), Error (red), Warning (amber), Info (blue)
    Auto-dismiss after 4 seconds
    Stacked at bottom-right

  PageHeader
    Title (h1)
    Breadcrumb (if applicable) — above title
    Actions slot (right side) — buttons rendered here