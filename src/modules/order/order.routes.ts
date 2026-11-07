import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { orderController } from "./order.controller";

const router = Router()

// Public routes

// Protected routes
router.post('/', auth(Role.CUSTOMER), orderController.createOrder);
router.get('/my-orders', auth(Role.CUSTOMER), orderController.getMyOrders);


export const orderRoutes = router;