# Starverse Express Courier Platform

Enterprise-grade courier and logistics software for Zimbabwe and Africa.

## Overview

This repository contains:
- `frontend/` — React + TypeScript + Vite + Tailwind customer and operations portal
- `backend/` — Node.js + Express + TypeScript API with JWT authentication and modular logistics services
- `database/` — PostgreSQL schema, ERD, and deployment-ready DDL
- `docs/` — Software Requirements Specification, architecture, API design, and UI wireframes
- `docker-compose.yml` — local development stack for backend, frontend, PostgreSQL, and MinIO compatible storage
- `netlify.toml` — Netlify production deployment configuration

## Phases

1. System Architecture
2. Database Design
3. Backend Development
4. Frontend Development
5. Document Generation
6. Notifications
7. Tracking System
8. Franchise System
9. Deployment
10. Scaling Plan

## Quick start

1. Copy `.env.example` to `.env`
2. Start containers: `docker compose up --build`
3. Install dependencies:
   - `cd frontend && npm install`
   - `cd backend && npm install`
4. Start services:
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`

## Environment

The platform is designed to support:
- Mobile-first operations
- Landmark-based delivery
- Community pickup points
- WhatsApp, SMS, and email notifications
- Franchise expansion and royalty tracking
- Document generation with QR and barcode labels
- Chain-of-custody parcel audit trail
- OTP verification and digital signatures
