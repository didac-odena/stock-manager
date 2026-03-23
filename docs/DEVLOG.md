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

- `docs: add mini postman collection for day 10 and 11 checks`
- Added a compact Postman collection under `api/data/` to validate frontend route availability (day 10) and auth/services API flow (day 11) with reusable local variables.
- Included a minimal request sequence for login, profile, products, reviews, and logout so the integration can be smoke-tested quickly.

- `fix: align frontend auth flow with backend routes`
- Reverted auth context structure to the day 11 single-file pattern (`auth.context.jsx`) and removed the extra context/hook split files that were not part of the exercise scope.
- Fixed `auth.service.js` endpoints to match backend routes (`/login`, `/register`, `/me`, `/logout`, `/invitations`) so the profile check and auth actions stop hitting non-existing `/auth/*` paths.
## 2026-03-20

- `feat: implement login and register forms with react-hook-form`
- Replaced the placeholder login and register pages with working forms connected to the auth context, including redirect-on-session behavior and API error feedback.
- Added field-level validation through `react-hook-form` and included the new dependency in frontend package manifests.

## 2026-03-20

- `feat: add homepage featured sections with reusable product/category cards`
- Built the public home page with hero, category shortcuts, and featured products loaded from existing services.
- Added reusable `CategoryCard` and `ProductCard` components plus a placeholder image fallback for products without photos.

## 2026-03-21

- `feat: implement public catalog page with URL-driven filters and pagination`
- Replaced the `CatalogPage` placeholder with real data loading from products/categories services, including category filters, search by name, loading states, and paginated grid rendering.
- Added a debounced search sync with `useSearchParams` and guarded the effect to avoid resetting pagination when the user moves between pages.

## 2026-03-21

- `docs: normalize "catálogo" wording in day guides`
- Updated day notes from `tareas/dia-11.md` to `tareas/dia-17.md` to keep wording/accent consistency across examples and checklist items.
- Adjusted the Tailwind utility example in `tareas/dia-18.md` from `flex-shrink-0` to `shrink-0` to align with the current utility style used in the project.

## 2026-03-21

- `chore: update workspace editor defaults`
- Added a 100-column ruler plus JS/TS wrap lengths in `stock-manager.code-workspace` to keep formatting behavior consistent while coding.
- Disabled `chatgpt.openOnStartup` in workspace settings to reduce editor noise on project startup.

## 2026-03-21

- `fix: load product detail and reviews in a single effect`
- Updated `ProductDetailPage` to fetch product and reviews together with `Promise.all`, then hydrate both states in one place.
- Removed the conditional hook pattern that called `useEffect` after an early `loading` return, preventing the hook-order runtime error.

## 2026-03-22

- `fix: protect admin area and unblock admin products effect lint error`
- Wrapped admin routes with `PrivateRoute` and a new `AdminLayout`, keeping product/profile pages inside a protected layout shell with sidebar navigation and logout.
- Replaced the admin profile placeholder with a working `react-hook-form` form tied to `useAuth` and `updateProfile`, including success and API error feedback.
- Updated the admin products data flow so the `useEffect` fetch no longer triggers the React hooks lint error on line 24 by moving the `loading` activation to user actions (pagination/delete refresh).

## 2026-03-22

- `fix: restore admin products list page and keep product form separated`
- Replaced the placeholder in `AdminProductsPage` with the full admin table flow (fetch, empty state, delete action, and pagination) so `/admin/products` renders real content again.
- Restored `AdminProductFormPage` as the dedicated create/edit form with React Hook Form + FormData, keeping day 17 behavior aligned with the exercise.

## 2026-03-22

- `feat: add admin barcode scanner flow`
- Added `react-zxing` to the web app and implemented `AdminBarcodePage` to scan barcodes, fetch products by code, show product details, and reset scanning state.
- Exposed `getProductByBarcode` in the products service, registered `/admin/barcode` in `App.jsx`, and added the "Escaner" link in the admin sidebar.

## 2026-03-23

- `feat: add reusable search input and admin products search`
- Added a reusable `SearchInput` component and reused it in both `CatalogPage` and `AdminProductsPage`, with debounced search requests and page reset when the query changes.
- Updated `ProductCard` and `ProductDetailPage` so authenticated users can see exact stock values while guest users keep simplified availability badges.
- Increased seed generation from 15 to 200 products to make local catalog testing more realistic for pagination and search flows.
