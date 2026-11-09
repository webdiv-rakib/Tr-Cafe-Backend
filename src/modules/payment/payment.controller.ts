import httpStatus from 'http-status';
import { catchAsync } from "../../utils/catchAsync";
import { sendResposne } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import { Role } from '../../../generated/prisma/enums';
import { Request, Response } from 'express';
import config from '../../config';

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

const createStripeCheckoutSession = catchAsync(
    async (req, res, next) => {
        const userId = req.user?.id as string;
        const { orderId } = req.body;
        const result = await paymentService.createStripeCheckoutSession(userId, orderId as string)
        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'Stripe checkout session created successfully',
            data: result,
        });
    }
);

const handleStripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    try {
        const result = await paymentService.handleStripeWebhook(req.body, signature);
        res.status(httpStatus.OK).json(result);
    } catch (error: any) {
        console.error('Stripe webhook verification error:', error.message);
        res.status(httpStatus.BAD_REQUEST).send(`Webhook Error: ${error.message}`);
    }
};

const initSSLCommerzPayment = catchAsync(
    async (req, res, next) => {
        const userId = req.user?.id as string;
        const { orderId } = req.body;

        const result = await paymentService.initSSLCommerzPayment(userId, orderId);

        sendResposne(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'SSLCommerz checkout URL generated successfully',
            data: result,
        });
    }
);

const sslCommerzSuccess = catchAsync(
    async (req, res, next) => {
        const result = await paymentService.validateSSLCommerzSuccess(req.body);
        // Redirect to frontend success URL just like Stripe
        return res.redirect(
            `${config.app_url}/payment?success=true&orderId=${result.orderId}&tranId=${result.transactionId}`
        );
    }
);

const handleSSLCommerzFailOrCancel = catchAsync(
    async (req, res, next) => {
        const result = await paymentService.handleSSLCommerzFailOrCancel(req.body);

        return res.redirect(
            `${config.app_url}/payment?success=false&tranId=${result.transactionId}`
        );
    }
)

export const paymentController = {
    initiatePayment,
    updatePaymentStatus,
    getPaymentByOrderId,
    getRevenueSummary,
    createStripeCheckoutSession,
    handleStripeWebhook,
    initSSLCommerzPayment,
    sslCommerzSuccess,
    handleSSLCommerzFailOrCancel
}