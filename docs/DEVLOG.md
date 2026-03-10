## 2026-03-07

- `feat: scaffold express api server`
- Added the initial Express API structure with `app.js`, `server.js`, MongoDB connection config, and the main `/api` router.
- Configured development middleware for logging, JSON parsing, cookies, and CORS, plus basic `GET /api/health` and `GET /api/categories` endpoints with a router-level 404 fallback.

## 2026-03-09

- `feat: add user model with auth-ready schema rules`
- Added the initial `User` Mongoose model with required fields, email normalization, password strength validation, timestamps, and JSON serialization rules that hide private data.
- Included a pre-save hook to hash passwords with bcrypt, an instance method to compare passwords during login, and a virtual relation for owned products.

- `fix: rename user model file and align manual test script`
- Renamed the user model file to `User.model.js` so ESM imports resolve correctly and fixed the avatar default typo in the schema.
- Updated the manual `test-user.js` script to use the project database name, keep the seeded user for duplicate-email checks, and handle the unique-index case more clearly.

## 2026-03-10

- `feat: add product model with owner relation and review virtual`
- Added the `Product` schema with core catalog fields, category validation, optional sparse unique barcode, and the `owner` reference to `User`.
- Included `toJSON` cleanup and the virtual populate that will expose related reviews from the `Review` collection.
