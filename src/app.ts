import cookieParser from "cookie-parser";
import express, { Application, Request, Response } from "express";
import cors from "cors"
import config from "./config";
import httpStatus from "http-status"
import { userRoutes } from "./modules/user/user.routes";

const app: Application = express();
// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: config.app_url,
    credentials: true
}))

// Server Response For Root Routes
app.get('/', (req: Request, res: Response) => {
    res.status(httpStatus.OK).json({
        success: true,
        statusCode: httpStatus.OK,
        message: "TR-Cafe API Server is running smoothly 🚀",
        data: {
            service: "TR-Cafe-Backend",
            version: "0.0.1",
            environment: process.env.NODE_ENV || "development",
            uptime: `${process.uptime().toFixed(2)}s`,
            timestamp: new Date().toISOString(),
        },
    });
});

app.use('/api/auth', userRoutes);

export default app;