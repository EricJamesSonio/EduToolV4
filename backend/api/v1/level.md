{
  "info": {
    "name": "EduTool - Level Module",
    "_postman_id": "level-module-edutool",
    "description": "Level endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Level",
      "item": [
        {
          "name": "Get Level Defaults",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/levels/defaults", "host": ["{{baseUrl}}"], "path": ["levels", "defaults"] }
          }
        },
        {
          "name": "Update Level Defaults",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/levels/defaults", "host": ["{{baseUrl}}"], "path": ["levels", "defaults"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"levels\": [\n    {\n      \"programId\": \"\",\n      \"name\": \"\"\n    }\n  ]\n}"
            }
          }
        },
        {
          "name": "Get Levels by School Year",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/levels?schoolYearId=",
              "host": ["{{baseUrl}}"],
              "path": ["levels"],
              "query": [{ "key": "schoolYearId", "value": "" }]
            }
          }
        },
        {
          "name": "Update Level",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/levels/:id", "host": ["{{baseUrl}}"], "path": ["levels", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\"\n}" }
          }
        }
      ]
    }
  ]
}