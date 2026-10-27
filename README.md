# Wall Murals AI

Wall Murals AI creates interactive mural experiences with artificial intelligence
and augmented reality. Visitors scan a QR code near an artwork and open the
experience directly in their browser—no app installation required.

The experience can place digital content over a mural, allowing visitors to
record videos or take photos and share the result online. The web application
also includes authenticated tools for managing artworks and viewing metrics.

Visit the live website at [wallmurals.ai](https://www.wallmurals.ai/).

## Features

- Browser-based augmented-reality experiences for murals
- Artwork and AR content management through a protected dashboard
- Account, subscription-plan, and usage-metrics pages
- MongoDB persistence
- Redis-backed sessions outside development
- EJS server-rendered views with Express

## Requirements

- Node.js and npm
- MongoDB
- Redis for non-development environments

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root. At minimum, configure the
   database, session, and CSRF secrets:

   ```dotenv
   NODE_ENV=development
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/wallmurals
   SESSION_KEY=replace-with-a-long-random-secret
   CSRF=replace-with-a-32-character-secret
   ```

   The application also reads site metadata, email, Cloudflare, usage-limit,
   and authentication settings from environment variables. Keep credentials
   out of source control; `.env` is ignored by Git.

3. Start the development server:

   ```bash
   npm run dev
   ```

   The server listens on `http://localhost:3000` by default. Set `PORT` to
   use another port.

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the production server |
| `npm run dev` | Start the server with Nodemon |
| `npm run build` | Build and minify frontend assets with Gulp |

## Application routes

- `/` — Public website
- `/ar` — Augmented-reality experiences
- `/users` — Authentication and user account flows
- `/dashboard` — Artwork management and account administration
- `/metrics` — Public metrics/contact endpoints used by the application

AR experiences can be opened by route, artwork ID, or location. See
[`routes/ar.js`](./routes/ar.js) for the available endpoint shapes.

## Project structure

```text
app.js          Express application and middleware
bin/www         HTTP server entry point
controllers/    Request handlers
db.js           MongoDB connection
helpers/        Shared integrations and utilities
models/         MongoDB models
public/         Static assets and uploaded media
routes/         Express route definitions
views/          EJS templates
```

## Production notes

Set `NODE_ENV` to a value other than `development` in deployed environments.
The application then uses Redis for session storage and enables HTML
minification and response compression. Configure the Redis password with
`REDIS_PASS` and ensure the Redis service is reachable at the configured
deployment hostname.

Uploaded media and temporary files are intentionally excluded from Git. Back
up or persist `public/uploads/` and configure the required environment
variables through the deployment platform's secret manager.
