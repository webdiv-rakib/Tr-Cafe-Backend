import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { userService } from './user.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResposne } from '../../utils/sendResponse';
import { jwtUtils } from '../../utils/jwt';
import config from '../../config';


const createUser = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        const payload = req.body;
        const result = await userService.createUser(payload);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'User Registered Successfully',
            data: result
        });
    }
);

const getUserProfile = catchAsync(
    async (req, res, next) => {
        const { accessToken } = req.cookies;
        const verifyToken = jwtUtils.verifyToken(accessToken, config.jwt_access_secret);
        if (typeof verifyToken === "string") {
            throw new Error(verifyToken)
        };
        const decodedData = verifyToken.data as { id: string };
        const profile = await userService.getUserProfile(decodedData.id);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User profile retrived successfully",
            data: { profile }
        })
    }
);

export const userController = {
    createUser,
    getUserProfile
};