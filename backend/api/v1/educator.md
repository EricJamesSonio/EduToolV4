{
  "info": {
    "name": "EduTool - Educator Module",
    "_postman_id": "educator-module-edutool",
    "description": "Educator endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Educator",
      "item": [
        {
          "name": "Create Educator",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/educators", "host": ["{{baseUrl}}"], "path": ["educators"] },
            "body": { "mode": "raw", "raw": "{\n  \"fullName\": \"\",\n  \"email\": \"\"\n}" }
          }
        },
        {
          "name": "Get All Educators",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/educators?search=",
              "host": ["{{baseUrl}}"],
              "path": ["educators"],
              "query": [{ "key": "search", "value": "" }]
            }
          }
        },
        {
          "name": "Get Educator by ID",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/educators/:id", "host": ["{{baseUrl}}"], "path": ["educators", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        },
        {
          "name": "Update Educator",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/educators/:id", "host": ["{{baseUrl}}"], "path": ["educators", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"fullName\": \"\",\n  \"email\": \"\"\n}" }
          }
        },
        {
          "name": "Delete Educator",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/educators/:id", "host": ["{{baseUrl}}"], "path": ["educators", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        },
        {
          "name": "Reset Educator Password",
          "request": {
            "method": "POST",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/educators/:id/reset-password", "host": ["{{baseUrl}}"], "path": ["educators", ":id", "reset-password"], "variable": [{ "key": "id", "value": "" }] }
          }
        }
      ]
    }
  ]
}