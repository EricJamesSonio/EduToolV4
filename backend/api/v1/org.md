{
  "info": {
    "name": "EduTool - Organization Module",
    "_postman_id": "organization-module-edutool",
    "description": "Organization endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Organization",
      "item": [
        {
          "name": "Create Organization",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/organization", "host": ["{{baseUrl}}"], "path": ["organization"] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\",\n  \"description\": \"\"\n}" }
          }
        },
        {
          "name": "Get Organization",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/organization", "host": ["{{baseUrl}}"], "path": ["organization"] }
          }
        },
        {
          "name": "Update Organization",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/organization", "host": ["{{baseUrl}}"], "path": ["organization"] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\",\n  \"description\": \"\"\n}" }
          }
        }
      ]
    }
  ]
}