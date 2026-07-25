# ZeroOne Monorepo

This repository contains the ZeroOne frontend and backend apps in one npm-workspaces monorepo.

## Structure

```text
apps/
  web/  React website and landing page
  api/  Node.js REST API with Express, Sequelize, and MySQL
```

## Commands

Install all workspace dependencies from the repository root:

```bash
npm install
```

Run the website:

```bash
npm run dev:web
```

Build the website:

```bash
npm run build:web
```

Test the website:

```bash
npm run test:web
```

Run the API:

```bash
cp apps/api/.env.example apps/api/.env
npm run dev:api
```

The API expects a MySQL database configured through `apps/api/.env`.
The website contact form posts to the API at `REACT_APP_API_URL`, which defaults to `http://localhost:4000` in development.
Copy `apps/web/.env.example` to `apps/web/.env` to configure frontend variables such as `REACT_APP_CHAT_STORAGE_TTL_HOURS`, which defaults to `24`.

## Contact Form Email

The contact form sends email through Microsoft Graph from the API server. Prefer configuring these values from the admin dashboard at `/admin/mail-config`; they will be stored in the database. The same keys can also be set in `apps/api/.env` as fallback values:

```bash
MS_TENANT_ID=your-tenant-id
MS_CLIENT_ID=your-application-client-id
MS_CLIENT_SECRET=your-client-secret-value
MS_SENDER_EMAIL=info@zerooneitinc.com
MS_RECIPIENT_EMAIL=info@zerooneitinc.com
```

The Microsoft Entra app registration must have Microsoft Graph `Mail.Send` application permission with admin consent. The sender mailbox in `MS_SENDER_EMAIL` must exist in your Microsoft 365 tenant.
The Microsoft client secret value does not include its expiration date, so enter the expiration date manually in the admin Mail Config screen.

Create the auth users table and first superadmin:

```bash
npm run db:migrate -w apps/api
npm run db:seed:superadmin -w apps/api
```

User roles are numeric: `0` is superadmin and `1` is admin.
For local development, `SYNC_DB_ON_START=true` and `SEED_SUPERADMIN_ON_START=true` let `npm start` create/update tables and seed the superadmin automatically.

The website uses clean client-side URLs such as `/about-us` and `/admin/login`.
Your frontend host must rewrite unknown routes to `index.html` so page refreshes work.
