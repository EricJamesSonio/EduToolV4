=========================
NOTIFICATION MODULE
Base: /notifications
=========================
1. GET Notifications

GET /notifications?unreadOnly=true|false

Roles: authenticated users

Query Params:
{
"unreadOnly": boolean (optional)
}

Response:
[
{
"id": "uuid",
"type": "string",
"payload": object,
"isRead": boolean,
"createdAt": "date"
}
]

Notes:

unreadOnly=true → returns only unread notifications
payload is dynamic → frontend must handle per type
Use for notification dropdown / inbox UI
2. DISMISS Notification

DELETE /notifications/:id

Roles: authenticated users

Response:
204 No Content

Errors:

404 → not found
403 → not owner

Notes:

User can ONLY delete their own notifications
Remove immediately from UI after success
No response body (optimistic UI recommended)
INTERNAL (FYI - NOT FOR FRONTEND)
Create Notification
Used by backend only
Bulk Notifications
Used for system-wide pushes
Archive Old Notifications
Auto cleanup (older than 90 days)

NOTIFICATIONS
Poll or use websocket (if available)
Always support:
unread filter
dismiss action
Payload is dynamic → render based on type