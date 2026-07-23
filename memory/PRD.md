# Casa Connect — PRD

## Original problem statement
Enhance my Casa Connect real-estate website (previously built in Emergent, GitHub repo casa-connect-73). Make it unique with animations and everything. Add admin (who can list properties) and user (who can buy/inquire) roles. On sign in / new account there should be an Admin and User button — admin credentials go into admin, user credentials into user.

## Architecture
- **Backend**: FastAPI + Motor (async MongoDB), JWT auth (httpOnly cookie + Bearer fallback), bcrypt hashing.
- **Frontend**: React 19 + React Router 7, Framer Motion, Tailwind + shadcn, sonner for toasts, Outfit + Cormorant Garamond typography.
- **Design system**: "Warm Brutalism / Editorial" — palette #F7F5F0 / #2C3D30 primary / #C86A53 accent. Bento/asymmetric layouts, generous whitespace, grain overlays, marquee, staggered reveals.

## User personas
- **Buyer / Renter (user)**: browses collection, saves favorites, sends inquiries about listings, tracks own inquiries.
- **Owner / Agent (admin)**: publishes listings with images + amenities, edits/deletes, sees inquiries and admin stats.

## Core requirements (static)
1. Landing page with hero, featured, editorial section, testimonial, CTA, footer.
2. Listings page with sidebar filters (search, listing type, property type, beds, price range).
3. Property detail page with gallery, description, amenities, price card, inquiry form.
4. Auth page with animated Admin/User role toggle (Framer Motion `layoutId`).
5. Role-based ProtectedRoute (`/dashboard` for users, `/admin` for admins).
6. Admin dashboard: stats, listings CRUD table, inquiries list.
7. User dashboard: favorites + inquiries tabs.

## What's been implemented (2026-02)
- JWT-based custom auth (register/login/logout/me) with role selection.
- Admin & user seeded on first boot (`admin@casaconnect.com` / `Admin@123`; `user@casaconnect.com` / `User@123`).
- 10 seed properties across 10 cities (Malibu, SF, NY, Napa, Miami, Aspen, Portland, Santa Fe, Austin, Newport).
- Full properties CRUD (admin-gated).
- Favorites (per-user upsert) + inquiries (auth + anonymous).
- Admin `/api/admin/stats` (totals) + inquiries listing with property attach.
- Fully animated frontend (page transitions, card stagger, marquee, hero parallax reveal).
- 23/23 backend tests + full Playwright E2E passing.

## Prioritized backlog

### P1
- Property image upload (S3/object storage) instead of URL paste.
- Map view on listings page with clustering.
- Property comparison side-by-side (2-3 listings).
- Advanced sort (newest, price asc/desc).

### P2
- Payment / booking deposit flow via Stripe.
- Saved searches with email alerts.
- Agent profile pages.
- Reviews / ratings on listings.
- Real-time inquiry replies (chat).

## Test credentials
See `/app/memory/test_credentials.md`.
