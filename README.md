# Food Delivery Backend

Backend API for the Food Delivery application. Built with Node.js, Express, TypeScript, MongoDB/Mongoose, Auth0, Cloudinary, and Stripe.

## Features

- User authentication and profile management with Auth0
- Restaurant creation, updates, image uploads, and search
- Restaurant menu and order management
- Stripe Checkout payment sessions and webhook processing
- Order status updates
- Request validation and protected API routes

## Requirements

- Node.js and npm
- MongoDB database
- Auth0 application/API configuration
- Cloudinary account
- Stripe account
- Stripe CLI (for local webhook forwarding during development)

## Setup

1. Clone the repository and enter the project directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root. Add the following variables and fill in your own values:

   ```env
   MONGODB_CONNECTION_STRING=
   CLOUDINARY_CLOUD_NAME=
   CLOUDINARY_API_KEY=
   CLOUDINARY_API_SECRET=
   AUTH0_AUDIENCE=
   AUTH0_ISSUER_BASE_URL=
   STRIPE_API_KEY=
   STRIPE_WEBHOOK_SECRET=
   FRONTEND_URL=
   ```

   Keep real credentials private. Do not commit the `.env` file.

## Running locally

Start the development server and Stripe webhook listener:

```bash
npm run dev
```

The API listens on port `7000`. The development script starts Nodemon and runs the Stripe CLI listener, forwarding webhook events to:

```
http://localhost:7000/api/order/checkout/webhook
```

The Stripe CLI must be installed and authenticated for webhook forwarding to work. Use the webhook signing secret provided by the Stripe CLI for the local `STRIPE_WEBHOOK_SECRET` value.

## Build and production start

Compile the TypeScript source:

```bash
npx tsc
```

Then start the compiled server:

```bash
npm start
```

The production start script runs `dist/index.js`. Ensure dependencies are installed and the TypeScript build has completed before starting.

## API endpoints

All paths below are relative to the API origin (for local development, `http://localhost:7000`).

| Method | Endpoint | Purpose | Authentication |
| --- | --- | --- | --- |
| GET | `/health` | Health check | No |
| GET | `/api/my/user` | Get the current user's profile | Auth0 |
| POST | `/api/my/user` | Create the current user's profile | Auth0 |
| PUT | `/api/my/user` | Update the current user's profile | Auth0 |
| GET | `/api/my/restaurant` | Get the current user's restaurant | Auth0 |
| POST | `/api/my/restaurant` | Create a restaurant | Auth0 |
| PUT | `/api/my/restaurant` | Update a restaurant | Auth0 |
| GET | `/api/my/restaurant/order` | Get orders for the current restaurant | Auth0 |
| PATCH | `/api/my/restaurant/order/:orderId/status` | Update an order's status | Auth0 |
| GET | `/api/restaurant/:restaurantId` | Get a restaurant by ID | No |
| GET | `/api/restaurant/search/:city` | Search restaurants in a city | No |
| GET | `/api/order` | Get the current user's orders | Auth0 |
| POST | `/api/order/checkout/create-checkout-session` | Create a Stripe Checkout session | Auth0 |
| POST | `/api/order/checkout/webhook` | Receive Stripe webhook events | Stripe signature |

Protected endpoints require a valid Auth0 access token. Restaurant creation and update accept multipart form data with the image field named `imageFile`.

## Order statuses

The API accepts these order statuses:

- `placed`
- `paid`
- `inProgress`
- `outForDelivery`
- `delivered`

## Notes

- Checkout line-item prices are taken from the restaurant's menu data on the server; client-submitted item prices are not used.
- Stripe webhook requests require the raw request body for signature verification. The server configures this route before JSON body parsing.
- The `/health` endpoint indicates that the HTTP server responds; it does not verify database connectivity.
- Never publish API keys, database connection strings, Auth0 secrets, or Stripe webhook signing secrets.
