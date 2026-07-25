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

## Docker VPS Deployment

The repository includes a Docker Compose production setup with:

- `web`: Nginx serving the built React app and proxying `/api` to the API service
- `api`: Node.js Express API
- `mysql`: MySQL 8.4 with a persistent Docker volume

On the VPS, point these DNS records to the server public IP:

```text
zerooneitinc.com      A      your-vps-ip
www.zerooneitinc.com  A      your-vps-ip
```

Create the production environment file from the sample:

```bash
cp .env.docker.example .env
```

Edit `.env` and replace every password/secret value. Use strong values for:

```bash
MYSQL_ROOT_PASSWORD=
MYSQL_PASSWORD=
JWT_SECRET=
ADMIN_PASSWORD=
```

Build and start the stack:

```bash
docker compose up -d --build
```

Check the running containers:

```bash
docker compose ps
docker compose logs -f api
```

The website will be served on:

```text
http://zerooneitinc.com
```

The browser calls the API through the same domain:

```text
http://zerooneitinc.com/api
```

For HTTPS, either enable a CDN/proxy such as Cloudflare in front of the VPS or add a certificate manager/reverse proxy on the server. The included Nginx config is domain-ready for `zerooneitinc.com` and `www.zerooneitinc.com` on port `80`.
