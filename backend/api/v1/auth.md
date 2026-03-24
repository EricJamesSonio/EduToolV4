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