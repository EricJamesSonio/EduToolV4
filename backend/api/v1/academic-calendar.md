{
  "info": {
    "name": "EduTool - Academic Calendar Module",
    "_postman_id": "academic-calendar-module-edutool",
    "description": "Academic Calendar endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Academic Calendar",
      "item": [
        {
          "name": "Create Calendar Event",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/academic-calendar", "host": ["{{baseUrl}}"], "path": ["academic-calendar"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"schoolYearId\": \"\",\n  \"title\": \"\",\n  \"type\": \"holiday\",\n  \"startDate\": \"\",\n  \"endDate\": \"\",\n  \"description\": \"\"\n}"
            }
          }
        },
        {
          "name": "Get All Calendar Events",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/academic-calendar?schoolYearId=",
              "host": ["{{baseUrl}}"],
              "path": ["academic-calendar"],
              "query": [{ "key": "schoolYearId", "value": "" }]
            }
          }
        },
        {
          "name": "Update Calendar Event",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/academic-calendar/:id", "host": ["{{baseUrl}}"], "path": ["academic-calendar", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"\",\n  \"type\": \"holiday\",\n  \"startDate\": \"\",\n  \"endDate\": \"\",\n  \"description\": \"\"\n}"
            }
          }
        },
        {
          "name": "Delete Calendar Event",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/academic-calendar/:id", "host": ["{{baseUrl}}"], "path": ["academic-calendar", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        }
      ]
    }
  ]
}