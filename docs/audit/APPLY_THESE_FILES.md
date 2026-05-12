# Where to place each file

Copy these files into the repo exactly as follows:

- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/controllers/authController.js`
- `backend/src/middleware/authMiddleware.js`
- `backend/src/models/User.js`
- `backend/src/routes/auth.js`
- `backend/src/routes/health.js`
- `backend/.env.example`
- `.env.example`
- `docker-compose.yml`
- `nginx.conf`
- `docs/audit/SELLING-PRICE-RECOMMENDATION.md`

## Important note

The uploaded patch file you gave me contains `app.js` at the zip root, but in the live repo the correct path should be:

`backend/src/app.js`

Do **not** leave it at repository root.
