import httpStatus from 'http-status';
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { authService } from './auth.service';
import config from '../../config';

const isProduction = config.env === 'production';

const loginUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.body;
        const { accessToken, refreshToken } = await authService.loginUser(payload);
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60, // 1 hour
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User Logged in Successfully",
            data: { accessToken, refreshToken }
        })
    }
);

export const authController = {
    loginUser
}