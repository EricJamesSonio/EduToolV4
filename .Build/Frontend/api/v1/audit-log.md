🧾 AUDIT LOG API
1. Admin Audit Logs

GET /audit-log

🔒 admin only

Query
{
  from?: string;      // ISO date
  to?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}
Response
Array<{
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}>
2. Activity Logs (Class-level)

GET /activity-log

🔒 educator, admin

Query
{
  classId?: string;
  from?: string;
  to?: string;
}
Response
Array<{
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}>