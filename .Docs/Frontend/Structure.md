next-frontend/
    public/
        images/
        icons/
        favicon.ico

    src/
        app/
            layout.tsx  # imports global css
            page.tsx
            login/
                page.tsx # uses apis to call endpoints, layout handles the structure
            dashboard/
                page.ts etc...

        components/
            buttons/
            inputs/
            layout/
    
        hooks/
            useAuth.ts
            useFetch.ts

        context/
            AuthContext.tsx

        apis/
            mainApi.ts  # main api helper like axios , uses api.config to call backend, helper api reuse
            authApi.ts
            adminApi.ts etc...

        utils/
            date.util.ts
            token.util.ts
            validation.util.ts

        types/
            auth.types.ts

        styles/
            globals.css
            tailwind.config.ts

        config/     # app level configuration
            api.config.ts # base url for nestjs backend

    env.local # environment variables for backend url, keys etc.

