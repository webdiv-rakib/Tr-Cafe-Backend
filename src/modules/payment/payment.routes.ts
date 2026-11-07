import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { paymentController } from "./payment.controller";

const router = Router();

router.post('/initiate', auth(Role.CUSTOMER), paymentController.initiatePayment);
router.get('/order/:orderId', auth(Role.ADMIN, Role.CUSTOMER, Role.RIDER, Role.STAFF), paymentController.getPaymentByOrderId);
router.patch('/:id/status', auth(Role.ADMIN, Role.RIDER, Role.STAFF), paymentController.updatePaymentStatus);

export const paymentRoutes = router