# iConnect BLR — Buy, Sell & Repair Phones in Bengaluru

Bengaluru's trusted destination for 32-point certified pre-owned iPhones, Android smartphones, and laptops, instant cash buyback, and same-day express repairs across RT Nagar, Yeshwanthpur, and Ganganagar.

## Commands

- `npm run dev`: Start the full-stack development server (port 3000)
- `npm run build`: Build the client and server bundles (`dist/`)
- `npm run start`: Run the production server (`node dist/index.js`)
- `npm run db:migrate`: Apply database migrations

## Admin Workspace (`/admin`)

The `/admin` workspace manages:
- **Products & Inventory**: Add, edit, feature, or remove devices with pricing, condition grades, warranty, specs, and gallery images.
- **Sell & Repair Leads**: View and update status on customer sell quotes and repair bookings.
- **Customer Accounts**: View registered customer accounts and manage admin privileges.

To grant admin privileges to a registered user account in MySQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`: MySQL connection string (optional — falls back to local JSON persistence if omitted)
- `JWT_SECRET`: Secret key used for session signing
- `APP_URL`: Canonical public URL for SEO sitemaps and OpenGraph metadata

