import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { userService } from './user.service';

const createUser = async (req: Request, res: Response) => {
    try {
        const result = await userService.createUser(req.body);

        res.status(httpStatus.CREATED).json({
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'User Registered Successfully',
            data: result,
        });
    } catch (error: any) {
        res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            statusCode: httpStatus.BAD_REQUEST,
            message: error.message || 'Something went wrong',
        });
    }
};

export const userController = {
    createUser,
};