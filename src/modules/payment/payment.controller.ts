import httpStatus from 'http-status';
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const initiatePayment = catchAsync(
    async (req, res, next) => {
        const userId = req.user?.id as string;
        const payload = req.body
        const result = await paymentService.initiatepayment(userId, payload);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.CREATED,
            message: 'Payment initialized successfully',
            data: result,
        });
    }
);

const updatePaymentStatus = catchAsync(
    async (req, res, next) => {
        const { id } = req.params;
        const payload = req.body
        const result = await paymentService.updatePaymentStatus(id as string, payload);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Payment status updated successfully',
            data: result,
        });
    }
);

export const paymentController = {
    initiatePayment,
    updatePaymentStatus
}