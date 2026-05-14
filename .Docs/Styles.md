main.scss is the base foundation file. It's the main entry point that imports and orchestrates all other SCSS files in the correct order:

Utils/Core - variables, functions, mixins, responsive
Reset/Base - reset and base styles
Typography - font definitions
Theme Tokens - colors, spacing, shadows
Layouts - grid, container, header, navbar, footer
Shared Components - buttons, cards, forms, modals, etc.
Pages - page-specific styles
Utility Classes - helper classes
The actual foundational definitions (variables, colors, fonts, base styles) live in the utils/ and themes/ folders, but main.scss is the central file that ties everything together and should be imported in your application.
