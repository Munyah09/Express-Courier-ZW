# Deployment Guide

## Local Development

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   - `cd frontend && npm install`
   - `cd backend && npm install`
3. Start local services:
   - `docker compose up --build`
4. Start the backend:
   - `cd backend && npm run dev`
5. Start the frontend:
   - `cd frontend && npm run dev`

## Docker Deployment

- `docker compose up --build` to launch backend, frontend, PostgreSQL, and MinIO.
- Use `.env` for environment settings.
- For production, replace `MINIO_*` and database credentials with secure values.

## Netlify

- The frontend can be published to Netlify using `netlify.toml`.
- Set build command: `npm run build`
- Publish directory: `frontend/dist`
- Add environment variables for API base URL and analytics.

## Supabase

- Use Supabase for managed PostgreSQL and auth if desired.
- Migrate `database/schema.sql` into Supabase SQL editor.
- Connect backend to Supabase by updating `DATABASE_URL`.

## Backup Strategy

- Schedule PostgreSQL dumps with automated snapshots.
- Back up MinIO storage regularly to an offsite S3-compatible bucket.
- Store environment secrets in a secrets manager.

## Monitoring Strategy

- Add application logs to a central log aggregator.
- Monitor backend health endpoint at `/health`.
- Track API latency, error rates, queue length, and database connections.
- Use alerting for failed deliveries, OTP failures, and dispatch delays.
