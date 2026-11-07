import httpStatus from 'http-status';
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { orderService } from "./order.service";

const createOrder = catchAsync(
    async (req, res, next) => {
        const id = req.user?.id as string;
        const payload = req.body
        const result = await orderService.createOrder(id, payload);
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'Order placed successfully',
            data: result,
        });
    }
);

export const orderController = {
    createOrder
}