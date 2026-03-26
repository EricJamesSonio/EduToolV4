🔐 AUTH API

Base: /auth

1. Login

POST /login

Request
{
  email: string;
  password: string;
}
Response
{
  accessToken: string;
  refreshToken: string;
}
2. Refresh Token

POST /refresh

🔒 requires auth

Request
{
  refreshToken: string;
}
Response
{
  accessToken: string;
  refreshToken: string;
}
3. Logout

POST /logout

Response
// 204 No Content
4. Get Current User

GET /me

Response
{
  id: string;
  orgId: string | null;
  role: string;
  email: string;
  status: string;

  fullName: string | null;
  metadata: Record<string, any> | null;

  createdAt: string;
}