nest-backend
    src/
        modules/
            auth/
                auth.controller.ts
                auth.service.ts
                auth.repository.ts
                dto/
                    auth.dto.ts
                entity/
                    auth.entity.ts

        commons/
            filters/
                http-exception.filter.ts
                all-exception.filter.ts
            pipes/
                validation.pipe.ts
                parse-int.pipe.ts
            decorators/
                current-user.decorator.ts
                roles.decorator.ts
            guards/
                auth.guard.ts
                roles.guard.ts
            utils/
                hash.util.ts
                token.util.ts
                date.util.ts
            interceptors/
                logging.interceptors.ts
                response.interceptors.ts

        core/
            logger/ 
                logger.ts
                logger.module.ts
            database/ # singleton prisma instead of importing prisma everywhere
                database.module.ts
                database.provider.ts

            events/     
                event.module.ts     # services are not tightly coupled and makes some process work on background,. such as sending emails etc.
                event.service.ts
            middleware/
                request-id.middleware.ts # provides unique id per logs, use winston

        configs/
            app.config.ts
            jwt.config.ts
            db.config.ts

        main.ts



