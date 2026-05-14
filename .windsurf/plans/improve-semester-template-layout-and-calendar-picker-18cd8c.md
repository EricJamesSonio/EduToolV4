# Improve Semester Template Layout and Calendar Picker

This plan addresses the button spacing issues in the Semester Template page and implements a CalendarPicker component to replace manual date inputs with a better UX that enforces school year date constraints.

## Issues Identified

1. **Button spacing**: The "Templates" and "Assignments" view toggle buttons in `SemesterTemplatePage.tsx` (lines 164-185) are too close together and lack proper styling (classes `view-toggle-btn`, `view-toggle-group`, `view-toggle-badge` have no SCSS definitions)

2. **Manual date input**: `TermDateRow.tsx` uses `<input type="date">` which provides poor UX and doesn't visually enforce school year date constraints

3. **SCSS organization**: Semester template styles are scattered across multiple files without a dedicated file for page-specific styles

## Implementation Plan

### 1. Create CalendarPicker Component
- **File**: `client/src/components/CalendarPicker/CalendarPicker.tsx`
- **Features**:
  - Renders a month grid with navigation
  - Disables dates outside [dateMin, dateMax] (school year boundaries)
  - Supports inline popover anchored to input field (not a separate modal)
  - Two modes: startDate and endDate selection
  - Uses the other field's value as a soft boundary hint
  - Reusable, standalone, no external dependencies
  - Uses project CSS variables for styling

### 2. Update TermDateRow Component
- **File**: `client/src/modules/admin/system/components/semester-template/TermDateRow.tsx`
- **Changes**:
  - Replace `<input type="date">` with CalendarPicker component
  - Pass school year dateMin/dateMax to CalendarPicker
  - Maintain existing onChange callback interface
  - Improve layout and spacing

### 3. Create Semester Template Page SCSS
- **File**: `client/src/styles/pages/admin/system/semester-template.scss`
- **Contents**:
  - View toggle button group styling with proper spacing
  - View toggle button states (active, hover, disabled)
  - Badge styling for button counts
  - Term date row layout improvements
  - Calendar picker specific styles (if needed beyond global)
  - Reuse global SCSS variables and mixins

### 4. Update Main SCSS Import
- **File**: `client/src/styles/main.scss`
- **Change**: Add import for new semester-template.scss file

### 5. Update SemesterTemplatePage
- **File**: `client/src/modules/admin/system/pages/SemesterTemplatePage.tsx`
- **Changes**: Ensure proper class names match new SCSS (no changes needed if classes remain the same)

## Technical Details

### CalendarPicker Props
```typescript
interface CalendarPickerProps {
  value: string; // yyyy-mm-dd
  onChange: (date: string) => void;
  dateMin?: string; // yyyy-mm-dd (school year start)
  dateMax?: string; // yyyy-mm-dd (school year end)
  disabled?: boolean;
  placeholder?: string;
}
```

### View Toggle Button Styling
- Use flexbox with proper gap ($spacing-3 or $spacing-4)
- Active state: primary color background, white text
- Inactive state: secondary background, primary text
- Badge: small pill with count, positioned top-right
- Responsive: stack on mobile, side-by-side on desktop

### SCSS Organization
- Global styles: buttons.scss, cards.scss, modals.scss
- Page-specific: semester-template.scss (new)
- Component-specific: CalendarPicker styles in component file or global components
