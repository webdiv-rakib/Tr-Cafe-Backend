import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { userService } from './user.service';
import { catchAsync } from '../../utils/catchAsync';
import { sendResposne } from '../../utils/sendResponse';


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
)

export const userController = {
    createUser,
};