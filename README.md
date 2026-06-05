# Opening Day

Instagram-like social feed frontend built with Next.js + TypeScript.

Local login and backend are included inside the same Next.js app using `/api` route handlers.

## Run

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

Default API base URL:

```text
/api/posts
```

Override if needed with:

```bash
NEXT_PUBLIC_API_BASE_URL=/api/posts
```

## Demo Login

- Username: `puujee`
- Password: `demo123`

Other seeded users also work with the same password:

`anu`, `saraa`, `temka`, `naraa`, `bold`, `zoloo`, `mendee`, `odko`

## Local Data

When you run `npm run dev`, Next.js serves both:

- frontend UI
- local backend API

Persistent local data is stored in:

```text
.data/social-db.json
```
