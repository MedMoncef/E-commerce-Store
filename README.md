# Northwind Outfitters

Production-ready e-commerce storefront + admin dashboard built with Next.js App Router, Prisma, and NextAuth.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS
- Prisma ORM + MySQL (Laragon)
- NextAuth.js v5 (Credentials provider + Prisma adapter)
- shadcn/ui for admin UI
- zod for validation

## Local Setup (Laragon + MySQL)

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file:

```bash
copy .env.example .env
```

3. Start Laragon and make sure MySQL is running.

4. Create the database:

```sql
CREATE DATABASE ecommerce_db;
```

5. Run Prisma migrations:

```bash
npm run prisma:migrate
```

6. Generate Prisma client:

```bash
npm run prisma:generate
```

7. Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000

## Admin Access

1. Run migrations (this also seeds a default admin user):

```bash
npm run prisma:migrate
```

2. Sign in at `/admin/login` with:

- Username: `admin`
- Password: `admin123`

3. Use the Users screen in the admin dashboard to manage accounts and roles.

## Media Uploads

- Images are stored in `public/uploads` by default.
- Configure the paths with:
	- `MEDIA_UPLOAD_DIR`
	- `NEXT_PUBLIC_MEDIA_BASE_URL`

You can still use Prisma Studio if needed:

```bash
npm run prisma:studio
```

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run prisma:migrate` - run database migrations
- `npm run prisma:seed` - run Prisma seed script
- `npm run prisma:studio` - open Prisma Studio

## Notes

- Stock is only deducted when an order is confirmed from the admin dashboard.
- Guest checkout is supported. Logged-in users can view order history and favorites.
- Manage sizes, colors, and the media library in the admin dashboard.
