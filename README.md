# DharshanaMart

A simple full-stack dress shopping application built with React, Node.js, Express, and MySQL.

## Project structure

```text
backend/
	server.js       Express API, JWT auth, database queries
	.env.example    MySQL and JWT configuration template
	package.json    Backend dependencies and scripts
database/
	schema.sql      MySQL tables and relationships
frontend/
	src/            React application and styles
	index.html      Vite entry point
	package.json    Frontend dependencies and scripts
legacy/           Original static prototype files, kept for reference
README.md
```

## Requirements

- Node.js 18 or newer
- MySQL 8 or newer

## Database setup

1. Start MySQL.
2. Run `database/schema.sql` in MySQL Workbench or the MySQL CLI.
3. Copy `backend/.env.example` to `backend/.env`.
4. Set `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and a private `JWT_SECRET` in `backend/.env`.

To create an admin, register a normal account first, then run:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

## Run locally

In one terminal:

```powershell
cd backend
npm install
npm run dev
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The API runs on `http://localhost:5000` by default. Set `VITE_API_URL` in `frontend/.env` if the API uses another URL.

## Included functionality

- Buyer and seller registration with unique-email validation
- Bcrypt password hashing and JWT sessions
- Dress search, cart, wishlist, checkout, and seller-owned dress management
- Admin overview with user/dress/order data and dress deletion
- MySQL tables for users, dresses, cart items, wishlist items, orders, and order items

The active application is only under `frontend/`, `backend/`, and `database/`. The old static HTML prototype has been moved to `legacy/` so it does not compete with the React entry point.

## Deployment

The repository includes `render.yaml` for deploying the API and frontend on Render.

1. Create a free MySQL database with Aiven, Railway, or another provider that supplies host, port, database, username, and password values.
2. Run `database/schema.sql` against that cloud database.
3. Create a Render Blueprint from this repository. Render will create `dharshanamart-api` and `dharshanamart-web`.
4. Set the API service variables from `backend/.env.example`, using the cloud database values and a new random `JWT_SECRET`.
5. Set `CLIENT_URL` on the API to the deployed frontend URL.
6. Set `VITE_API_URL` on the frontend to the deployed API URL followed by `/api`, then redeploy the frontend.

Never commit `.env`, database passwords, JWT secrets, `node_modules`, or `frontend/dist`.