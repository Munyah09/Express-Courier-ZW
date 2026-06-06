# Supabase Integration Guide

This folder contains guidance for connecting the Starverse Express platform to Supabase services.

## Recommended architecture
- PostgreSQL: Supabase managed database as the primary relational datastore.
- Auth: Supabase Auth can be used for user identity, with custom claims for RBAC.
- Storage: Supabase Storage or MinIO compatible S3 storage for photos, signatures, and documents.
- Edge functions: can be used for webhook handling, notification dispatch, and OTP workflows.

## Notes
- The current repository uses a local PostgreSQL instance and a Node.js backend.
- To transition to Supabase:
  - Point `DATABASE_URL` to the Supabase Postgres connection string.
  - Use Supabase Auth tokens or custom JWT integration.
  - Keep object storage compatible by using S3 APIs.
  - Maintain local schema in `database/schema.sql` for migrations.

## Recommended deployment
1. Create a Supabase project.
2. Push database schema using Supabase SQL editor or migration tooling.
3. Configure environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.
4. Reuse backend API layer with Supabase as the storage and auth backend.
