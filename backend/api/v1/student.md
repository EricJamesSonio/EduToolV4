{
  "info": {
    "name": "EduTool - Student Module",
    "_postman_id": "student-module-edutool",
    "description": "Student endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Student",
      "item": [
        {
          "name": "Create Student",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/students", "host": ["{{baseUrl}}"], "path": ["students"] },
            "body": { "mode": "raw", "raw": "{\n  \"fullName\": \"\",\n  \"email\": \"\",\n  \"studentId\": \"\",\n  \"levelId\": \"\",\n  \"sectionId\": \"\"\n}" }
          }
        },
        {
          "name": "Get All Students",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/students?search=&status=&levelId=&sectionId=",
              "host": ["{{baseUrl}}"],
              "path": ["students"],
              "query": [
                { "key": "search", "value": "" },
                { "key": "status", "value": "" },
                { "key": "levelId", "value": "" },
                { "key": "sectionId", "value": "" }
              ]
            }
          }
        },
        {
          "name": "Get Student by ID",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/students/:id", "host": ["{{baseUrl}}"], "path": ["students", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        },
        {
          "name": "Update Student",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/students/:id", "host": ["{{baseUrl}}"], "path": ["students", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"fullName\": \"\",\n  \"email\": \"\",\n  \"levelId\": \"\",\n  \"sectionId\": \"\"\n}" }
          }
        },
        {
          "name": "Update Student Status",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/students/:id/status", "host": ["{{baseUrl}}"], "path": ["students", ":id", "status"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"status\": \"active\",\n  \"reason\": \"\"\n}" }
          }
        },
        {
          "name": "Reset Student Password",
          "request": {
            "method": "POST",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/students/:id/reset-password", "host": ["{{baseUrl}}"], "path": ["students", ":id", "reset-password"], "variable": [{ "key": "id", "value": "" }] }
          }
        },
        {
          "name": "Get Credentials CSV",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/students/credentials-csv", "host": ["{{baseUrl}}"], "path": ["students", "credentials-csv"] }
          }
        },
        {
          "name": "Bulk Import Students (CSV)",
          "request": {
            "method": "POST",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/students/import", "host": ["{{baseUrl}}"], "path": ["students", "import"] },
            "body": {
              "mode": "formdata",
              "formdata": [{ "key": "file", "type": "file", "src": "" }]
            }
          }
        }
      ]
    }
  ]
}