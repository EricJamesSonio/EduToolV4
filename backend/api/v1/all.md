
// ===== File: academic-calendar.md =====
{
  "info": {
    "name": "EduTool - Academic Calendar Module",
    "_postman_id": "academic-calendar-module-edutool",
    "description": "Academic Calendar endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Academic Calendar",
      "item": [
        {
          "name": "Create Calendar Event",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/academic-calendar", "host": ["{{baseUrl}}"], "path": ["academic-calendar"] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"schoolYearId\": \"\",\n  \"title\": \"\",\n  \"type\": \"holiday\",\n  \"startDate\": \"\",\n  \"endDate\": \"\",\n  \"description\": \"\"\n}"
            }
          }
        },
        {
          "name": "Get All Calendar Events",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/academic-calendar?schoolYearId=",
              "host": ["{{baseUrl}}"],
              "path": ["academic-calendar"],
              "query": [{ "key": "schoolYearId", "value": "" }]
            }
          }
        },
        {
          "name": "Update Calendar Event",
          "request": {
            "method": "PATCH",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/academic-calendar/:id", "host": ["{{baseUrl}}"], "path": ["academic-calendar", ":id"], "variable": [{ "key": "id", "value": "" }] },
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"\",\n  \"type\": \"holiday\",\n  \"startDate\": \"\",\n  \"endDate\": \"\",\n  \"description\": \"\"\n}"
            }
          }
        },
        {
          "name": "Delete Calendar Event",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/academic-calendar/:id", "host": ["{{baseUrl}}"], "path": ["academic-calendar", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        }
      ]
    }
  ]
}

// ===== File: ..\audit-log.md =====
{
  "info": {
    "name": "EduTool - Audit Log Module",
    "_postman_id": "audit-log-module-edutool",
    "description": "Audit Log endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Audit Log",
      "item": [
        {
          "name": "Get Audit Log",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/audit-log?from=&to=&action=&entityType=&entityId=&actorId=",
              "host": ["{{baseUrl}}"],
              "path": ["audit-log"],
              "query": [
                { "key": "from", "value": "" },
                { "key": "to", "value": "" },
                { "key": "action", "value": "" },
                { "key": "entityType", "value": "" },
                { "key": "entityId", "value": "" },
                { "key": "actorId", "value": "" }
              ]
            }
          }
        },
        {
          "name": "Get Activity Log",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/activity-log?classId=&from=&to=",
              "host": ["{{baseUrl}}"],
              "path": ["activity-log"],
              "query": [
                { "key": "classId", "value": "" },
                { "key": "from", "value": "" },
                { "key": "to", "value": "" }
              ]
            }
          }
        }
      ]
    }
  ]
}

// ===== File: ..\auth.md =====
{
  "info": {
    "name": "EduTool - Auth Module",
    "_postman_id": "auth-module-edutool",
    "description": "Auth endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "url": { "raw": "{{baseUrl}}/auth/login", "host": ["{{baseUrl}}"], "path": ["auth", "login"] },
            "body": { "mode": "raw", "raw": "{\n  \"email\": \"\",\n  \"password\": \"\"\n}" }
          }
        },
        {
          "name": "Refresh Token",
          "request": {
            "method": "POST",
            "header": [
              { "key": "Authorization", "value": "Bearer {{token}}" },
              { "key": "Content-Type", "value": "application/json" }
            ],
            "url": { "raw": "{{baseUrl}}/auth/refresh", "host": ["{{baseUrl}}"], "path": ["auth", "refresh"] },
            "body": { "mode": "raw", "raw": "{\n  \"refreshToken\": \"\"\n}" }
          }
        },
        {
          "name": "Logout",
          "request": {
            "method": "POST",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/auth/logout", "host": ["{{baseUrl}}"], "path": ["auth", "logout"] }
          }
        },
        {
          "name": "Get Me",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/auth/me", "host": ["{{baseUrl}}"], "path": ["auth", "me"] }
          }
        }
      ]
    }
  ]
}

// ===== File: ..\educator.md =====
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

// ===== File: ..\grading-scale.md =====
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

// ===== File: ..\level.md =====
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

// ===== File: ..\notification.md =====
{
  "info": {
    "name": "EduTool - Notification Module",
    "_postman_id": "notification-module-edutool",
    "description": "Notification endpoints for EduTool backend",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Notification",
      "item": [
        {
          "name": "Get Notifications",
          "request": {
            "method": "GET",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": {
              "raw": "{{baseUrl}}/notifications?unreadOnly=false",
              "host": ["{{baseUrl}}"],
              "path": ["notifications"],
              "query": [{ "key": "unreadOnly", "value": "false" }]
            }
          }
        },
        {
          "name": "Dismiss Notification",
          "request": {
            "method": "DELETE",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }],
            "url": { "raw": "{{baseUrl}}/notifications/:id", "host": ["{{baseUrl}}"], "path": ["notifications", ":id"], "variable": [{ "key": "id", "value": "" }] }
          }
        }
      ]
    }
  ]
}

// ===== File: ..\org.md =====
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

// ===== File: ..\rubric.md =====
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

// ===== File: ..\school-year.md =====
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

// ===== File: ..\section.md =====
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

// ===== File: ..\semester.md =====
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

// ===== File: ..\student.md =====
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

// ===== File: ..\subject.md =====
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

// ===== File: ..\platform.md =====
{
"info": {
"name": "EduTool - Platform Module",
"_postman_id": "platform-module-edutool",
"description": "Platform owner endpoints for managing admins",
"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
},
"item": [
{
"name": "Platform",
"item": [
{
"name": "Platform Login",
"request": {
"method": "POST",
"header": [
{ "key": "Content-Type", "value": "application/json" }
],
"url": {
"raw": "{{baseUrl}}/platform/login",
"host": ["{{baseUrl}}"],
"path": ["platform", "login"]
},
"body": {
"mode": "raw",
"raw": "{\n  "password": ""\n}"
}
}
},
{
"name": "Create Admin",
"request": {
"method": "POST",
"header": [
{ "key": "Authorization", "value": "Bearer {{token}}" },
{ "key": "Content-Type", "value": "application/json" }
],
"url": {
"raw": "{{baseUrl}}/platform/admins",
"host": ["{{baseUrl}}"],
"path": ["platform", "admins"]
},
"body": {
"mode": "raw",
"raw": "{\n  "email": "[admin@example.com](mailto:admin@example.com)"\n}"
}
}
},
{
"name": "Get Admins (Paginated)",
"request": {
"method": "GET",
"header": [
{ "key": "Authorization", "value": "Bearer {{token}}" }
],
"url": {
"raw": "{{baseUrl}}/platform/admins?page=1&limit=20&search=",
"host": ["{{baseUrl}}"],
"path": ["platform", "admins"],
"query": [
{ "key": "page", "value": "1" },
{ "key": "limit", "value": "20" },
{ "key": "search", "value": "" }
]
}
}
},
{
"name": "Get Single Admin",
"request": {
"method": "GET",
"header": [
{ "key": "Authorization", "value": "Bearer {{token}}" }
],
"url": {
"raw": "{{baseUrl}}/platform/admins/{{adminId}}",
"host": ["{{baseUrl}}"],
"path": ["platform", "admins", "{{adminId}}"]
}
}
},
{
"name": "Block Admin",
"request": {
"method": "PATCH",
"header": [
{ "key": "Authorization", "value": "Bearer {{token}}" }
],
"url": {
"raw": "{{baseUrl}}/platform/admins/{{adminId}}/block",
"host": ["{{baseUrl}}"],
"path": ["platform", "admins", "{{adminId}}", "block"]
}
}
},
{
"name": "Unblock Admin",
"request": {
"method": "PATCH",
"header": [
{ "key": "Authorization", "value": "Bearer {{token}}" }
],
"url": {
"raw": "{{baseUrl}}/platform/admins/{{adminId}}/unblock",
"host": ["{{baseUrl}}"],
"path": ["platform", "admins", "{{adminId}}", "unblock"]
}
}
},
{
"name": "Reset Admin Password",
"request": {
"method": "POST",
"header": [
{ "key": "Authorization", "value": "Bearer {{token}}" }
],
"url": {
"raw": "{{baseUrl}}/platform/admins/{{adminId}}/reset-password",
"host": ["{{baseUrl}}"],
"path": ["platform", "admins", "{{adminId}}", "reset-password"]
}
}
}
]
}
]
}
