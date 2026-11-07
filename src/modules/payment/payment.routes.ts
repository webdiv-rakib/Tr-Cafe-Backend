import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { paymentController } from "./payment.controller";

const router = Router();

router.post('/initiate', auth(Role.CUSTOMER), paymentController.initiatePayment);

export const paymentRoutes = router