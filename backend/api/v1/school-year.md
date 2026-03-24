{
  "info": {
    "name": "EduTool - School Year Module",
    "_postman_id": "school-year-module-edutool",
    "description": "School Year endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "School Year",
      "item": [
        {
          "name": "Create School Year",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/school-years", "host": ["{{baseUrl}}"], "path": ["school-years"] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\"\n}" }
          }
        },
        {
          "name": "Get All School Years",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/school-years", "host": ["{{baseUrl}}"], "path": ["school-years"] }
          }
        },
        {
          "name": "Activate School Year",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/school-years/:id/activate", "host": ["{{baseUrl}}"], "path": ["school-years", ":id", "activate"], "variable": [{ "key": "id", "value": "" }] }
          }
        },
        {
          "name": "End School Year",
          "request": {
            "method": "PATCH",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/school-years/:id/end", "host": ["{{baseUrl}}"], "path": ["school-years", ":id", "end"], "variable": [{ "key": "id", "value": "" }] }
          }
        },
        {
          "name": "Update School Year",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/school-years/:id", "host": ["{{baseUrl}}"], "path": ["school-years", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\"\n}" }
          }
        }
      ]
    }
  ]
}