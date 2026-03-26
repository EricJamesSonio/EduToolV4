next-frontend/
├── config files
│   ├── .env.local
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── components.json

├── public/                # static files (images, icons)

├── src/
│
│   ├── app/               # pages (routes)
│   │   ├── auth/          # login
│   │   ├── platform/      # platform owner (manage admins)
│   │   ├── admin/         # admin system (school setup)
│   │   ├── educator/      # teacher features
│   │   └── student/       # student features
│
│   ├── components/        # reusable UI
│   │   ├── ui/            # buttons, inputs, etc.
│   │   ├── layout/        # sidebar, header
│   │   ├── shared/        # tables, modals, loaders
│   │   ├── platform/      # platform components
│   │   ├── admin/         # admin components
│   │   ├── educator/      # educator components
│   │   └── student/       # student components
│
│   ├── hooks/             # custom React hooks (logic)
│   │   ├── auth + role
│   │   ├── platform/
│   │   ├── admin/
│   │   ├── educator/
│   │   └── student/
│
│   ├── api/               # API calls (Axios)
│   │   ├── auth
│   │   ├── platform
│   │   ├── admin
│   │   ├── educator
│   │   └── student
│
│   ├── store/             # Zustand state (auth, notifications, meetings)
│
│   ├── context/           # AuthContext
│
│   ├── types/             # TypeScript types
│
│   ├── utils/             # helpers (date, validation, JWT, CSV)
│
│   ├── config/            # API base URL
│
│   └── styles/            # global CSS