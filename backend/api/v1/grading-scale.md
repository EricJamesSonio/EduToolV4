{
  "info": {
    "name": "EduTool - Grading Scale Module",
    "_postman_id": "grading-scale-module-edutool",
    "description": "Grading Scale endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Grading Scale",
      "item": [
        {
          "name": "Create Grading Scale",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/grading-scales", "host": ["{{baseUrl}}"], "path": ["grading-scales"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"levelId\": \"\",\n  \"schoolYearId\": \"\",\n  \"name\": \"\",\n  \"ranges\": [\n    {\n      \"minPercent\": 0,\n      \"maxPercent\": 100,\n      \"gradeValue\": \"1.0\",\n      \"remark\": \"Passed\",\n      \"isPassing\": true\n    }\n  ]\n}"
            }
          }
        },
        {
          "name": "Get All Grading Scales",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/grading-scales?levelId=&schoolYearId=",
              "host": ["{{baseUrl}}"],
              "path": ["grading-scales"],
              "query": [
                { "key": "levelId", "value": "" },
                { "key": "schoolYearId", "value": "" }
              ]
            }
          }
        },
        {
          "name": "Update Grading Scale",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/grading-scales/:id", "host": ["{{baseUrl}}"], "path": ["grading-scales", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": { "mode": "raw", "raw": "{\n  \"name\": \"\",\n  \"ranges\": []\n}" }
          }
        }
      ]
    }
  ]
}