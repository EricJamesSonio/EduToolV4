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
