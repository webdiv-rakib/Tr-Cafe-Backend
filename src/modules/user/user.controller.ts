import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { userService } from './user.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResposne } from '../../utils/sendResponse';
import { jwtUtils } from '../../utils/jwt';
import config from '../../config';
import { Role } from '../../../generated/prisma/enums';


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

const updateProfile = catchAsync(
    async (req, res, next) => {
        const id = req.user?.id as string;
        const payload = req.body;
        const result = await userService.updateProfile(id, payload);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "User profile updated successfully",
            data: result,
        });
    }
);

const changePassword = catchAsync(
    async (req, res, next) => {
        const id = req.user?.id as string;
        const payload = req.body;
        await userService.changePassword(id, payload)
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Password changed successfully',
            data: null,
        });
    }
);

const getAllUsers = catchAsync(
    async (req, res, next) => {
        const { role, searchTerm } = req.query as { role?: Role; searchTerm?: string };

        const result = await userService.getAllUsers({ role, searchTerm });

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Users retrieved successfully',
            data: result,
        });
    }
);

const updateUserRole = catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const { role } = req.body as { role: Role };
        const currentAdminId = req.user?.id as string;
        const result = await userService.updateUserRole(id as string, role, currentAdminId);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: `User role updated to ${role} successfully`,
            data: result,
        });
    }
)

export const userController = {
    createUser,
    getUserProfile,
    updateProfile,
    changePassword,
    getAllUsers,
    updateUserRole
};