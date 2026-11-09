# 🍔 TR Cafe Backend API

A robust, production-ready backend built for **TR Cafe**, a fast-food restaurant and in-house delivery service tailored for the Daffodil International University (DIU) area. Built using modern backend architecture with **Node.js, Express, TypeScript, Prisma ORM, and PostgreSQL**, featuring secure multi-role access control, multiple payment gateways (Stripe & SSLCommerz), Cash on Delivery (COD), rider assignment, and real-time inventory controls.

---

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js (Modular MVC architecture)
- **Language:** TypeScript
- **Database & ORM:** PostgreSQL & Prisma ORM
- **Authentication:** JWT (JSON Web Tokens) with HttpOnly cookies & role-based middleware
- **Payments:** Stripe (Hosted Checkout + Webhooks) & SSLCommerz (bKash, Nagad, Cards)
- **Deployment:** Vercel (Serverless functions)

---

## ✨ Key Features

### 1. User Authentication & Role-Based Access Control (RBAC)
- **Roles:** `CUSTOMER`, `RIDER`, `STAFF`, `ADMIN`
- **User Status Management:** Accounts can be `ACTIVE`, `INACTIVE`, `BANNED`, or `UNBAN` by administrators.
- Secure registration, login, token refresh, and password management.

### 2. Menu & Inventory Management
- Categories and Menu Items CRUD operations.
- **Chef Specials:** Toggle special items on/off instantly (`PATCH /api/menu-items/:id/toggle-special`) for exclusive campus menus.
- **Stock Control:** Real-time item availability toggle (`PATCH /api/menu-items/:id/availability`) for kitchen staff when items go out of stock.

### 3. Order Processing & DIU Delivery System
- Automatic calculation of item subtotals plus a fixed DIU area delivery fee (20 BDT).
- Status workflow: `PENDING` $\rightarrow$ `PREPARING` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED` / `CANCELLED`.
- Admin and staff can assign delivery riders (`PATCH /api/order/:id/assign-rider`).
- Riders can update assigned order statuses directly upon delivery.

### 4. Comprehensive Payment Gateways
- **Stripe:** Hosted Checkout session creation with webhook verification (`express.raw()`) for automatic payment status updates (`PAID`).
- **SSLCommerz (Sandbox):** Local Bangladeshi mobile banking (bKash, Nagad, Rocket) and card gateway with validation, success, fail, and cancel callbacks.
- **Cash on Delivery (COD):** Customers can place orders with COD; designated riders can collect cash and update the payment status to `PAID` upon delivery.
- **Admin Analytics:** Revenue summaries and transaction filtering (`GET /api/payment/revenue` and `GET /api/payment`).

---

## 🛠️ Project Structure

```text
tr-cafe-backend/
├── src/
│   ├── config/          # Environment configuration & constants
│   ├── middlewares/     # Authentication, role checking, & global error handling
│   ├── modules/
│   │   ├── auth/        # Login, token refresh
│   │   ├── user/        # User profiles, role updates, ban/unban management
│   │   ├── category/    # Category management
│   │   ├── menuItem/    # Menu items, specials, availability toggles
│   │   ├── order/       # Order placement, status transitions, rider assignment
│   │   └── payment/     # Stripe webhooks, SSLCommerz init/callbacks, COD
│   ├── utils/           # Catch async, response formatters
│   ├── app.ts           # Express app setup & middleware wiring
│   └── server.ts        # Server entry point & Vercel serverless export
├── prisma/              # Prisma schema and migrations
├── dist/                # Compiled output
├── vercel.json          # Vercel deployment configuration
└── package.json
```

---

## ⚙️ Getting Started Locally

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/your-username/tr-cafe-backend.git
cd tr-cafe-backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and populate it with your credentials:

```env
PORT=5000
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/tr_cafe_db?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET="your_jwt_access_secret"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="your_jwt_refresh_secret"
JWT_REFRESH_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# SSLCommerz Sandbox
SSL_STORE_ID="your_ssl_store_id"
SSL_STORE_PASS="your_ssl_store_pass"
SSL_PAYMENT_API="https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
SSL_VALIDATION_API="https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"

# URLs
APP_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000/api"
```

### 3. Run Prisma Migrations & Generate Client
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the Development Server
```bash
npm run dev
```