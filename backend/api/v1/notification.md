{
  "info": {
    "name": "EduTool - Notification Module",
    "_postman_id": "notification-module-edutool",
    "description": "Notification endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Notification",
      "item": [
        {
          "name": "Get Notifications",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/notifications?unreadOnly=false",
              "host": ["{{baseUrl}}"],
              "path": ["notifications"],
              "query": [{ "key": "unreadOnly", "value": "false" }]
            }
          }
        },
        {
          "name": "Dismiss Notification",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/notifications/:id", "host": ["{{baseUrl}}"], "path": ["notifications", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        }
      ]
    }
  ]
}