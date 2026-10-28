const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.$queryRawUnsafe(
  "SELECT table_name, column_name, data_type FROM information_schema.columns " +
    "WHERE table_name IN ('SubjectCompletionOverride','StudentProgramEnrollment') " +
    "AND column_name IN ('source','is_regular','regular_marked_at','regular_marked_by') " +
    'ORDER BY table_name, column_name',
)
  .then((r) => {
    console.log(JSON.stringify(r, null, 1));
    return db.$disconnect();
  })
  .catch((e) => {
    console.error('VERIFY-FAILED: ' + e.message);
    process.exit(1);
  });
