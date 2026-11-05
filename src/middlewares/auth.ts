import httpStatus from 'http-status';
import { NextFunction, Request, Response } from "express"
import { Role } from "../../generated/prisma/enums"
import { catchAsync } from "../utils/catchAsync"
import { jwtUtils } from "../utils/jwt"
import config from "../config"
import { sendResposne } from "../utils/sendResponse"
import { prisma } from "../lib/prisma"
import { JwtPayload } from "jsonwebtoken"

declare global {
    namespace Express {
        interface Request {
            user?: {
                email: string,
                name: string,
                id: string,
                role: Role
            }
        }
    }
}
export const auth = (...requiredRoles: Role[]) => {
    return catchAsync(
        async (req: Request, res: Response, next: NextFunction) => {
            const token = req.cookies.accessToken ? req.cookies.accessToken
                :
                req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization?.split(" ")[1]
                    :
                    req.headers.authorization
            if (!token) {
                throw new Error("You are not logged in. Please log in to access this resource")
            }
            const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);
            if (!verifiedToken.success) {
                throw new Error(verifiedToken.error)
            };
            const { id, name, email, role } = verifiedToken.data as JwtPayload;
            if (requiredRoles.length && !requiredRoles.includes(role)) {
                return sendResposne(res, {
                    success: false,
                    statusCode: httpStatus.FORBIDDEN,
                    message: "Forbidden,you dont have permission",
                    data: null
                })
            };
            const user = await prisma.user.findUnique({
                where: {
                    id,
                    email,
                    name,
                    role
                }
            });
            if (!user) {
                throw new Error("User not found. Please log in again.")
            };
            // if (user.status === "BANNED") {
            //     throw new Error("Your account has been banned.plase contact support")
            // };
            req.user = {
                email,
                name,
                id,
                role
            };
            next();
        }
    )
}