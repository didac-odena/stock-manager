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

- `feat: add review model and relational smoke test`
- Added the `Review` schema with integer rating validation, the `product` reference, and a compound unique index that blocks repeated reviews from the same email on the same product.
- Created a manual `test-models.js` script that seeds user/product/review data, checks direct and virtual populate, and confirms the duplicate review constraint.

## 2026-03-12

- `feat: add request sanitizing and API error middlewares`
- Added middleware files to strip protected fields from incoming bodies, normalize API error responses, and validate Mongo ObjectId route params before controllers run.
- Wired the global error handler into the Express app and updated the router 404 catch-all so missing routes flow through the shared error response layer.

- `feat: add faker-based seed script for demo data`
- Added a seed script under `api/bin/seed.js` that creates the first admin plus sample products and reviews using Faker so the catalog is easy to reset with realistic demo data.
- Registered the seed command in `api/package.json`, updated the lockfile for the new dependency, and kept the related API setup changes together in the same work block.

- `feat: add basic auth login and token middleware`
- Added a login controller that checks credentials against the user model, signs a JWT, and stores it in an HTTP-only cookie, plus a logout handler that clears the cookie.
- Added an authentication middleware that reads the cookie, validates the token, and exposes `req.userId` for protected routes.

- `fix: align auth routes and token secret config`
- Moved the auth controller into the `controllers` folder, fixed JWT signing and verification to use the `TOKEN_SECRET` environment variable, and kept the auth endpoints mounted as `/api/login` and `/api/logout`.
- Added a Postman collection for the day 5 auth exercises and documented the login debugging trail in `errores.md` so the issue is easy to recognise later.

- `docs: add daily task guides to the repository`
- Added the `tareas/` markdown files from day 1 to day 18 to git so the exercise notes are visible from GitHub together with the rest of the project documentation.
