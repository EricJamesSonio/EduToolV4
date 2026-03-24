{
  "info": {
    "name": "EduTool - Subject Module",
    "_postman_id": "subject-module-edutool",
    "description": "Subject endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Subject",
      "item": [
        {
          "name": "Create Subject",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/subjects", "host": ["{{baseUrl}}"], "path": ["subjects"] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\",\n  \"levelId\": \"\",\n  \"educatorId\": \"\"\n}" }
          }
        },
        {
          "name": "Get All Subjects",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/subjects?levelId=&educatorId=&search=",
              "host": ["{{baseUrl}}"],
              "path": ["subjects"],
              "query": [
                { "key": "levelId", "value": "" },
                { "key": "educatorId", "value": "" },
                { "key": "search", "value": "" }
              ]
            }
          }
        },
        {
          "name": "Update Subject",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/subjects/:id", "host": ["{{baseUrl}}"], "path": ["subjects", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\",\n  \"levelId\": \"\",\n  \"educatorId\": \"\"\n}" }
          }
        },
        {
          "name": "Lock Subject",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/subjects/:id/lock", "host": ["{{baseUrl}}"], "path": ["subjects", ":id", "lock"], "variable": [{ "key": "id", "value": "" }] }
          }
        },
        {
          "name": "Unlock Subject",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/subjects/:id/unlock", "host": ["{{baseUrl}}"], "path": ["subjects", ":id", "unlock"], "variable": [{ "key": "id", "value": "" }] }
          }
        }
      ]
    }
  ]
}