import httpStatus from 'http-status';
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import { Role } from '../../../generated/prisma/enums';

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

const getPaymentByOrderId = catchAsync(
    async (req, res, next) => {
        const { orderId } = req.params;
        const userId = req.user?.id as string;
        const role = req.user?.role as Role;

        const result = await paymentService.getPaymentByOrderId(orderId as string, userId, role);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Payment details retrieved successfully',
            data: result,
        });
    }
);

const getRevenueSummary = catchAsync(
    async (req, res, next) => {
        const result = await paymentService.getRevenueSummary();

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Revenue analytics retrieved successfully',
            data: result,
        });
    }
);

export const paymentController = {
    initiatePayment,
    updatePaymentStatus,
    getPaymentByOrderId,
    getRevenueSummary
}