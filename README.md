# Stock Manager

Stock Manager is a full-stack inventory and public catalog application built around small retail workflows. It combines a public browsing experience with a protected admin workspace for product management, stock updates, image uploads, and barcode-assisted inventory tasks.

The goal of the project is to show practical product engineering across the whole stack: REST API design, authentication with secure cookies, media uploads, MongoDB data modeling, and a React frontend that exposes clearly different public and admin experiences.

## Highlights

- Full-stack architecture with a React + Vite frontend and an Express + MongoDB backend
- JWT authentication stored in HTTP-only cookies
- Invitation-based admin onboarding instead of open public signup
- Product CRUD with Cloudinary image uploads
- Barcode workflows in the admin area:
  - dedicated scanner page to find a product by barcode
  - inline barcode scanner inside the product form to autofill the barcode field
- Public catalog with search, category filters, pagination, and product detail pages
- Public rating flow with one review per email and product
- Ongoing implementation notes tracked in `docs/DEVLOG.md`

## What This Project Demonstrates

- Designing and documenting a REST API used by a separate frontend application
- Modeling relational data in MongoDB with direct references and virtual relationships
- Protecting admin functionality while keeping the public catalog open
- Handling multipart uploads, third-party media storage, and cleanup on failed writes
- Building different UX layers for visitors and authenticated users

## Architecture

### Frontend (`web/`)

- React 19
- Vite 8
- Tailwind CSS 4
- React Router
- React Hook Form
- Axios for API communication
- `react-zxing` for browser barcode scanning

The frontend uses Vite's development proxy so `/api` requests are forwarded to `http://localhost:3000` during local development.

### Backend (`api/`)

- Express 5
- MongoDB with Mongoose
- JWT with `jsonwebtoken`
- HTTP-only cookie session flow with `cookie-parser`
- Multer + Cloudinary for image uploads
- Centralized middleware for auth, request sanitizing, ObjectId validation, and error handling

### Data Model

- `User`: admin identity, profile data, password hashing, upload quota counters
- `Product`: catalog item, stock, categories, barcode, images, owner reference
- `Review`: public rating tied to a product and reviewer email
- `Invitation`: time-limited token used for admin registration

## Product Flows

### Visitor flow

1. Open the landing page and browse featured content.
2. Navigate to the catalog and filter by category or search by name.
3. Open a product detail page with gallery, description, and review summary.
4. Submit a public rating with email + 1-5 stars.

Visitor-facing screens do not expose exact stock quantities. Authenticated users can see the real stock count.

### Admin flow

1. Sign in through the login page and restore the session through `GET /api/me`.
2. Use invitation-based registration for new admins through token generation and the register flow.
3. Create, edit, search, and delete products from the admin area.
4. Upload up to 3 product images per request and manage barcode-linked products.
5. Scan a barcode from the dedicated scanner page to quickly open a product context.
6. Scan a barcode directly inside the product form to fill the barcode field.
7. Update profile data and change the account password from the admin profile page.

Note: invitation token creation is available through the authenticated API. There is no dedicated invitation management screen in the current frontend.

## Repository Structure

```text
stock-manager/
|-- api/
|   |-- bin/
|   |-- config/
|   |-- controllers/
|   |-- data/
|   |-- middlewares/
|   |-- models/
|   |-- app.js
|   |-- server.js
|   `-- package.json
|-- docs/
|   `-- DEVLOG.md
|-- web/
|   |-- src/
|   |-- public/
|   `-- package.json
`-- README.md
```

## API Overview

All backend routes are mounted under `/api`.

### Health and catalog helpers

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Health check |
| `GET` | `/api/categories` | Public | Returns the predefined product categories |

### Authentication and profile

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/login` | Public | Sign in and set the auth cookie |
| `POST` | `/api/register` | Public with invitation token | Register a new admin |
| `POST` | `/api/logout` | Authenticated | Clear the auth cookie |
| `GET` | `/api/me` | Authenticated | Return the current admin profile |
| `PATCH` | `/api/me` | Authenticated | Update profile fields and optionally change password |
| `POST` | `/api/invitations` | Authenticated | Generate an invitation token |

### Products

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Public | List products with filtering, search, and pagination |
| `GET` | `/api/products/:id` | Public | Product detail |
| `GET` | `/api/products/barcode/:barcode` | Authenticated | Find a product by barcode |
| `POST` | `/api/products` | Authenticated | Create a product with multipart form data |
| `PATCH` | `/api/products/:id` | Authenticated | Update a product with multipart form data |
| `DELETE` | `/api/products/:id` | Authenticated | Delete a product |

`GET /api/products` supports these query params:

- `category`
- `search`
- `page`
- `limit`

Paginated responses follow this shape:

```json
{
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 47,
    "totalPages": 4
  },
  "data": []
}
```

### Reviews

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/products/:id/reviews` | Public | List reviews for a product |
| `POST` | `/api/products/:id/reviews` | Public | Create a review with `email` and `rating` |

### Payload notes

- `POST /api/login`: `email`, `password`
- `POST /api/register`: `name`, `email`, `password`, `token`
- `PATCH /api/me`: profile fields such as `name` and `avatar`, or `currentPassword` + `newPassword` for password changes
- `POST /api/invitations`: no body, returns a generated invitation token
- `POST /api/products` and `PATCH /api/products/:id`: multipart form data with `name`, `description`, `price`, `stock`, repeated `categories`, optional `barcode`, and optional `images`
- `POST /api/products/:id/reviews`: `email`, `rating`

## Frontend Routes

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page with featured content |
| `/products` | Public catalog |
| `/products/:id` | Product detail and review form |
| `/login` | Admin login |
| `/register` | Admin registration with invitation token |

### Protected admin routes

| Route | Purpose |
| --- | --- |
| `/admin/products` | Product management list |
| `/admin/products/new` | Create product |
| `/admin/products/:id/edit` | Edit product |
| `/admin/profile` | Profile update and password change |
| `/admin/barcode` | Barcode scanner page |

## Local Setup

### Requirements

- Node.js 20+
- MongoDB
- A Cloudinary account if you want product image uploads to work

### Install dependencies

```bash
cd api
npm install

cd ../web
npm install
```

### Environment variables

Create `api/.env`.

Required for normal local development:

- `MONGODB_URI`: MongoDB connection string
- `TOKEN_SECRET`: JWT signing secret

Recommended, with local defaults in code:

- `PORT`: defaults to `3000`
- `CORS_ORIGIN`: defaults to `http://localhost:5173`

Required for image uploads:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Example:

```bash
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/stock-manager-dev
TOKEN_SECRET=replace-with-a-long-secret
CORS_ORIGIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=replace-me
CLOUDINARY_API_KEY=replace-me
CLOUDINARY_API_SECRET=replace-me
```

Important note: define `MONGODB_URI` explicitly before running the seed. The API runtime and seed script do not currently share the same fallback database name, so relying on defaults can point them at different local databases.

### Run locally

Start the API:

```bash
cd api
npm run dev
```

Start the frontend in a second terminal:

```bash
cd web
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000`
- Health check: `http://localhost:3000/api/health`

## Seed Data and Demo Access

Run the seed from `api/`:

```bash
npm run seed
```

Current seed behavior:

- clears `User`, `Product`, and `Review` data
- creates the initial admin account
- creates 200 demo products
- creates 400 demo reviews
- fetches a shared external image pool and falls back safely when that fetch is unavailable

Seed admin credentials:

- Email: `admin@retailcatalog.com`
- Password: `Admin123!`

Current behavior note: the seed script still prints an outdated password hint in its console output. The configured source of truth in the seed data is `Admin123!`.

## Available Scripts

### Backend (`api/package.json`)

- `npm run dev`: start the API with nodemon
- `npm start`: start the API with Node.js
- `npm run seed`: reset and reseed the database

### Frontend (`web/package.json`)

- `npm run dev`: start the Vite development server
- `npm run build`: create a production build
- `npm run preview`: preview the production build locally
- `npm run lint`: run ESLint

## Testing and QA

There is currently no automated test suite wired into the package scripts.

The repository does include manual verification assets:

- `api/test-user.js`
- `api/test-models.js`
- `api/data/postman-collection.json`
- `api/data/day-10-11-mini.postman_collection.json`

The Postman collections cover the main API flows and are the fastest way to smoke-test auth, products, reviews, and invitation flows.

## Deployment

Deployment documentation is intentionally left pending and will be completed after the production rollout.

This section will be expanded with:

- production URLs
- hosting setup
- environment variable mapping
- CORS and cookie notes for production
- deployment and verification steps

## Known Limitations and Notes

- Invitation tokens expire after 1 hour.
- Admins can create up to 20 invitation tokens per day.
- Product image uploads are limited to 3 images per user per day.
- Public users can browse and review products, but exact stock counts are only shown to authenticated users.
- Product image uploads depend on Cloudinary configuration.
- There is no dedicated frontend screen yet for invitation token management.
- Deployment instructions are not documented yet.
- The seed flow still contains small legacy inconsistencies:
  - an outdated console password message
  - a legacy fallback database name when `MONGODB_URI` is missing

## Development Log

The repository keeps a running technical log in `docs/DEVLOG.md`.

It is useful if you want a chronological view of the project's implementation, including features, bug fixes, and structural changes over time.
