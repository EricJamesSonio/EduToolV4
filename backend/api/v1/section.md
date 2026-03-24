{
  "info": {
    "name": "EduTool - Section Module",
    "_postman_id": "section-module-edutool",
    "description": "Section endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Section",
      "item": [
        {
          "name": "Create Section",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/sections", "host": ["{{baseUrl}}"], "path": ["sections"] },
            "body": { "mode": "raw", "raw": "{\n  \"levelId\": \"\",\n  \"name\": \"\",\n  \"capacity\": 30\n}" }
          }
        },
        {
          "name": "Get All Sections",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/sections?levelId=",
              "host": ["{{baseUrl}}"],
              "path": ["sections"],
              "query": [{ "key": "levelId", "value": "" }]
            }
          }
        },
        {
          "name": "Update Section",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/sections/:id", "host": ["{{baseUrl}}"], "path": ["sections", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\",\n  \"capacity\": 30\n}" }
          }
        },
        {
          "name": "Delete Section",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/sections/:id", "host": ["{{baseUrl}}"], "path": ["sections", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        }
      ]
    }
  ]
}