## 2026-03-07

- `feat: scaffold express api server`
- Added the initial Express API structure with `app.js`, `server.js`, MongoDB connection config, and the main `/api` router.
- Configured development middleware for logging, JSON parsing, cookies, and CORS, plus basic `GET /api/health` and `GET /api/categories` endpoints with a router-level 404 fallback.

## 2026-03-09

- `feat: add user model with auth-ready schema rules`
- Added the initial `User` Mongoose model with required fields, email normalization, password strength validation, timestamps, and JSON serialization rules that hide private data.
- Included a pre-save hook to hash passwords with bcrypt, an instance method to compare passwords during login, and a virtual relation for owned products.
