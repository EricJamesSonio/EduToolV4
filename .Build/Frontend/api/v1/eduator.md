👨‍🏫 EDUCATOR MODULE API
15. Create Educator

POST /educators

Body
{
  fullName: string;
  email: string;
}
Response ⚠️ IMPORTANT
{
  id: string;
  orgId: string;
  email: string;
  status: "active";
  fullName: string;
  educatorId: string;
  plainPassword: string; // SHOW THIS ON UI ONCE
  createdAt: string;
}

👉 frontend must:

display password once
allow copy
16. Get Educators

GET /educators?search=...

Response
{
  id: string;
  orgId: string;
  email: string;
  status: string;
  fullName: string;
  educatorId: string;
  createdAt: string;
}[]
17. Get Educator

GET /educators/:id

18. Update Educator

PATCH /educators/:id

19. Delete Educator

DELETE /educators/:id

20. Reset Password

POST /educators/:id/reset-password

Response
{
  id: string;
  plainPassword: string;
}