{
  "info": {
    "name": "EduTool - Rubric Module",
    "_postman_id": "rubric-module-edutool",
    "description": "Rubric endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Rubric",
      "item": [
        {
          "name": "Get Default Rubric",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/rubrics/default", "host": ["{{baseUrl}}"], "path": ["rubrics", "default"] }
          }
        },
        {
          "name": "Update Default Rubric",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/rubrics/default", "host": ["{{baseUrl}}"], "path": ["rubrics", "default"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"\",\n  \"categories\": [\n    {\n      \"name\": \"\",\n      \"type\": \"assessment_linked\",\n      \"weight\": 100,\n      \"assessmentTypes\": [\"quiz\"]\n    }\n  ]\n}"
            }
          }
        },
        {
          "name": "Create Rubric (Educator)",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/rubrics", "host": ["{{baseUrl}}"], "path": ["rubrics"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"\",\n  \"categories\": [\n    {\n      \"name\": \"\",\n      \"type\": \"assessment_linked\",\n      \"weight\": 100,\n      \"assessmentTypes\": [\"quiz\"]\n    }\n  ]\n}"
            }
          }
        },
        {
          "name": "Get My Rubrics (Educator)",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/rubrics", "host": ["{{baseUrl}}"], "path": ["rubrics"] }
          }
        },
        {
          "name": "Update Rubric (Educator)",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/rubrics/:id", "host": ["{{baseUrl}}"], "path": ["rubrics", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\",\n  \"categories\": []\n}" }
          }
        }
      ]
    }
  ]
}