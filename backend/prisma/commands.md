npx prisma migrate dev --name add_table
npx prisma generate
npx prisma db push
npx prisma migrate reset 

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'edutool'
  AND pid <> pg_backend_pid();

drop database edutool;


# Run the backend with node ts
npx ts-node-dev --respawn --transpile-only -r tsconfig-paths/register src/main.ts