# Carbon Culture — Backend

Express and MongoDB API for the Carbon Culture storefront and admin.

Provides products, collections, store settings, admin authentication (JWT) and image uploads (Cloudinary, or
local disk when Cloudinary is not configured).

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

On first start the API creates the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` and seeds the default
collections. Change the admin password from **Admin → Settings** after signing in.

`npm run seed:reset` wipes products, collections and settings and re-seeds the default collections. Admin accounts
are kept.

## Environment variables

| Variable | Notes |
| --- | --- |
| `PORT` | Defaults to 8080 |
| `NODE_ENV` | `production` in deployed environments |
| `JWT_SECRET` | Long random string. Required in production |
| `JWT_EXPIRES_IN` | Defaults to `7d` |
| `FRONTEND_ORIGIN` | Allowed storefront origins, comma-separated |
| `PUBLIC_BASE_URL` | Public URL of this API |
| `MONGODB_URI` | MongoDB connection string |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | First admin account, used only when no admin exists |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image storage. Use in production, as most hosts wipe local disk on redeploy |
| `CLOUDINARY_UPLOAD_FOLDER` | Defaults to `carbon-culture` |

## Deploying

Any Node host (Render, Railway, Fly). Start command `npm start`.
