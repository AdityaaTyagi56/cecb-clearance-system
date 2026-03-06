# CECB PARIVESH 3.0 — Environmental Clearance System

A full-stack clearance management portal for the Chhattisgarh Environment Conservation Board (CECB).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth v5 (credentials) |
| Database | PostgreSQL via Prisma 5 |
| Payments | Razorpay |
| File Storage | UploadThing |
| PDF/DOCX Export | pdfmake + docx |
| Hosting | Vercel |

---

## Roles

| Role | Access |
|------|--------|
| `PROPONENT` | Submit applications, upload docs, make payments |
| `SCRUTINY` | Review docs, raise deficiencies, start scrutiny |
| `MOM_TEAM` | Generate & lock Meeting-of-Members gist |
| `ADMIN` | Full access, manage sectors, templates, users |

---

## Prerequisites — What You Need to Set Up

### 1. Neon PostgreSQL (Free)
1. Go to **https://neon.tech** → Sign up → Create a new project
2. Copy the **pooled connection string** (looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)
3. Set it as `DATABASE_URL` in `.env.local` and in Vercel

### 2. UploadThing (Free 2 GB)
1. Go to **https://uploadthing.com** → Sign up → Create app
2. Dashboard → **API Keys** → Copy the **Token** (single base64 string)
3. Set it as `UPLOADTHING_TOKEN` in `.env.local` and in Vercel

### 3. Razorpay (Test Mode — No Approval Needed)
1. Go to **https://dashboard.razorpay.com** → Sign up
2. Settings → **API Keys** → Generate test keys
3. Copy `Key ID` and `Key Secret`
4. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` in both `.env.local` and Vercel

### 4. NextAuth Secret
Generate a secure random secret:
```bash
openssl rand -base64 32
```
Set as `NEXTAUTH_SECRET` in both `.env.local` and Vercel.

---

## Environment Variables

Copy `.env.example` → `.env.local` and fill in all values:

```env
DATABASE_URL="postgresql://..."          # Neon connection string
NEXTAUTH_SECRET="..."                    # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"     # Use production URL on Vercel

RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."   # Same as KEY_ID (safe to expose)

UPLOADTHING_TOKEN="eyJhb..."            # From UploadThing dashboard
```

### Add to Vercel
```bash
# Go to: https://vercel.com → [Your Project] → Settings → Environment Variables
# Add each variable above (use production URL for NEXTAUTH_URL)
NEXTAUTH_URL = https://your-project.vercel.app
```

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Then fill in real values in .env.local

# 3. Set up database (run migrations + seed admin user)
npm run db:migrate        # creates all tables
npm run db:seed           # creates admin + default data

# 4. Start dev server
npm run dev
```

Open **http://localhost:3000**

**Default Admin Login:**
- Email: `admin@cecb.gov.in`
- Password: `Admin@1234`

---

## Database Commands

```bash
npm run db:migrate    # Run migrations (dev)
npm run db:seed       # Seed admin user, MoM template, sector fees
npm run db:studio     # Open Prisma Studio (visual DB editor)
```

**For production (Vercel), after adding DATABASE_URL:**
```bash
npx prisma migrate deploy    # Apply migrations to production DB
npm run db:seed              # Seed initial data (run once)
```

---

## Deployment Checklist

- [ ] Neon DB created → `DATABASE_URL` set in Vercel
- [ ] `NEXTAUTH_SECRET` set in Vercel (generate with `openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` set to your Vercel production URL
- [ ] Razorpay keys set in Vercel
- [ ] UploadThing token set in Vercel
- [ ] `npx prisma migrate deploy` run against production DB
- [ ] `npm run db:seed` run once for initial data
- [ ] Redeploy on Vercel after adding env vars

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # /login, /register
│   ├── (dashboard)/      # All authenticated pages
│   │   ├── dashboard/
│   │   ├── applications/
│   │   │   ├── new/      # Submit application
│   │   │   ├── mine/     # Proponent's applications
│   │   │   └── [id]/     # Detail, documents, payment, audit, mom
│   │   └── admin/        # Admin panels
│   └── api/              # All REST endpoints
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   ├── razorpay.ts       # Razorpay lazy client
│   ├── uploadthing.ts    # UploadThing React helpers
│   └── audit.ts          # Audit log helper
└── middleware.ts          # Route protection
```

