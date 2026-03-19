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

## 2026-03-14

- `feat: add day 6 auth endpoints and invitation flow`
- Added invitation-based register, profile endpoints (`me`, `updateProfile`), and protected invitation creation with the new `Invitation` model.
- Updated API routes to protect auth/product operations with middleware and added Postman collections for day 6 and day 7 practice flows.

- `fix: resolve register invitation cleanup and products controller issues`
- Fixed invitation deletion after successful register by deleting through the model, and corrected products controller issues (syntax error in barcode update and pagination limit clamp).
- Wired `validateObjectId` import in routes so product routes can load correctly without runtime errors.

## 2026-03-17

- `feat: add cloudinary storage config for uploads`
- Added a reusable Cloudinary configuration module that reads credentials from environment variables and exposes a Multer storage adapter.
- Kept the upload folder and accepted image formats centralized so the next upload middleware can plug into the same config without duplicating setup.

- `feat: add multer upload middleware for Cloudinary`
- Added the shared upload middleware that plugs Multer into the Cloudinary storage config so routes can accept product images with a single reusable import.
- Kept the remaining pending controller and middleware cleanup changes together in the same save-point commit.

- `feat: wire upload middleware into product routes`
- Updated the product create and update routes to accept up to three `images` files through the shared upload middleware.
- Fixed the missing `upload` import in the router so the new route setup can load without a runtime reference error.

- `feat: add reviews endpoints and final Postman collection`
- Added the public nested review routes plus the review controller so visitors can create and list product reviews without authentication, keeping the product existence check in both handlers.
- Updated the products controller to persist uploaded image URLs from Cloudinary and added a complete Postman collection for the day 8 and 9 backend flow.

## 2026-03-19

- `feat: scaffold react frontend with vite`
- Added a new `web/` app created with Vite and React, including the base entry point, lint configuration, and frontend package scripts.
- Kept the initial app intentionally minimal with the default `App` component so the day 10 routing exercises can build on a clean starting point.

- `feat: add tailwind v4 setup to the web app`
- Updated the Vite config to use the React SWC plugin together with the official Tailwind Vite plugin, and added the missing frontend dependency so the config can load correctly.
- Replaced the base stylesheet with the Tailwind import and switched the sample app content to utility classes to confirm the setup is working.

- `feat: prepare frontend routing skeleton`
- Added `react-router-dom`, wrapped the frontend entry point with `BrowserRouter`, and created the initial public/admin page components that will back the catalog flow.
- Added shared `Navbar` and `Footer` layout components as the base navigation shell, while keeping `App.jsx` minimal until the route tree is wired in a later step.

- `feat: add public layout wrapper`
- Added `PublicLayout` to render the shared `Navbar` and `Footer` around an `Outlet`, so public pages can reuse the same page shell through React Router nesting.
- Kept the layout structure minimal with a flexible main area that lets page content fill the viewport between the header and footer.

- `feat: wire the frontend route tree`
- Replaced the placeholder `App` component with the main React Router setup, grouping the public pages under `PublicLayout` and leaving the admin pages as standalone routes for now.
- Added a catch-all redirect to `/` so unknown frontend routes fall back to the home page instead of rendering an empty screen.

- `feat: add frontend auth context and api services`
- Added the Vite `/api` proxy, installed Axios, and created frontend service modules for auth, products, categories, and reviews with a shared cookie-aware request setup.
- Added `AuthProvider` plus `useAuth()` so the app can check the active session on startup and expose login, register, and logout actions through React context.
