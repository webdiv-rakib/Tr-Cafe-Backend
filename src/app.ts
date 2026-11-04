import cookieParser from "cookie-parser";
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors"
import config from "./config";
import { prisma } from "./lib/prisma";
import httpStatus from "http-status"
import bcrypt from "bcryptjs";

const app: Application = express();
// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: config.app_url,
    credentials: true
}))


app.get('/', async (req: Request, res: Response) => {
    const user = await prisma.user.findMany(); //add this line with clg
    console.log(user);
    res.send("TR-Cafe-Backend")
});

app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        if (!email || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                statusCode: httpStatus.BAD_REQUEST,
                message: "Email and password are required",
            });
        }

        // Check if user exists
        const isUserExist = await prisma.user.findUnique({
            where: { email },
        });

        if (isUserExist) {
            return res.status(httpStatus.CONFLICT).json({
                success: false,
                statusCode: httpStatus.CONFLICT,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));

        // Create user and select safe fields in a single query
        const createdUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'CUSTOMER', // Default to CUSTOMER to avoid privilege escalation
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(httpStatus.CREATED).json({
            success: true,
            statusCode: httpStatus.CREATED,
            message: "User Registered Successfully",
            data: { user: createdUser },
        });
    } catch (error) {
        next(error);
    }
});

export default app;