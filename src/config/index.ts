import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    port: process.env.PORT,
    app_url: process.env.APP_URL,
    database_url: process.env.DATABASE_URL,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET!, // add these 4 line below
    jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
    jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
    env: process.env.NODE_ENV!,
    stripe_secret_key: process.env.STRIPE_SECRET_KEY!,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,
    ssl_store_id: process.env.SSL_STORE_ID!,
    ssl_store_pass: process.env.SSL_STORE_PASS!,
    ssl_payment_api: process.env.SSL_PAYMENT_API!,
    ssl_validation_api: process.env.SSL_VALIDATION_API!,
    backend_url: process.env.BACKEND_URL || 'http://localhost:5000/api',
}