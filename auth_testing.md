# Auth testing playbook

Step 1: MongoDB
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
```
Verify bcrypt hash starts with `$2b$`, unique index on users.email, index on login_attempts.identifier.

Step 2: API
```
API=https://swachhsetu-demo.preview.emergentagent.com
curl -c cookies.txt -X POST $API/api/auth/login -H "Content-Type: application/json" -d '{"email":"dhruv.poki123@gmail.com","password":"SwachhAdmin@2026"}'
curl -b cookies.txt $API/api/auth/me
```
Login returns the user and sets access_token + refresh_token cookies; /me returns the same user.

Role checks: citizen gets 403 on /api/dashboard, /api/hotspots, /api/escalate, /api/complaints/:id/status|override|simulate-breach.
Unauthenticated POST /api/complaints → 401.
