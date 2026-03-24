{
  "info": {
    "name": "EduTool - Semester Module",
    "_postman_id": "semester-module-edutool",
    "description": "Semester endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Semester",
      "item": [
        {
          "name": "Create Semester",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/semester-settings", "host": ["{{baseUrl}}"], "path": ["semester-settings"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"schoolYearId\": \"\",\n  \"name\": \"\",\n  \"startDate\": \"\",\n  \"endDate\": \"\",\n  \"terms\": [\n    {\n      \"name\": \"\",\n      \"orderIndex\": 1,\n      \"startDate\": \"\",\n      \"endDate\": \"\"\n    }\n  ]\n}"
            }
          }
        },
        {
          "name": "Get All Semesters",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/semester-settings", "host": ["{{baseUrl}}"], "path": ["semester-settings"] }
          }
        },
        {
          "name": "Update Semester",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/semester-settings/:id", "host": ["{{baseUrl}}"], "path": ["semester-settings", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"\",\n  \"startDate\": \"\",\n  \"endDate\": \"\",\n  \"terms\": []\n}"
            }
          }
        },
        {
          "name": "Delete Semester",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/semester-settings/:id", "host": ["{{baseUrl}}"], "path": ["semester-settings", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        }
      ]
    }
  ]
}