import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { paymentController } from "./payment.controller";

const router = Router();

// SSLCommerz Check Out URL
router.post('/sslcommerz/init', auth(Role.CUSTOMER), paymentController.initSSLCommerzPayment);
router.post('/sslcommerz/success', paymentController.sslCommerzSuccess);
router.post('/sslcommerz/fail', paymentController.handleSSLCommerzFailOrCancel);
router.post('/sslcommerz/cancel', paymentController.handleSSLCommerzFailOrCancel);

// Stripe Check Out URL
router.post('/stripe/checkout', auth(Role.CUSTOMER), paymentController.createStripeCheckoutSession);
// Admin financial reporting
router.get('/revenue', auth(Role.ADMIN), paymentController.getRevenueSummary);

router.post('/initiate', auth(Role.CUSTOMER), paymentController.initiatePayment);
router.get('/order/:orderId', auth(Role.ADMIN, Role.CUSTOMER, Role.RIDER, Role.STAFF), paymentController.getPaymentByOrderId);
router.patch('/:id/status', auth(Role.ADMIN, Role.RIDER, Role.STAFF), paymentController.updatePaymentStatus);

export const paymentRoutes = router